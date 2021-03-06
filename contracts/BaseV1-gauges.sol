// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;
import "hardhat/console.sol";

library Math {
    function max(uint a, uint b) internal pure returns (uint) {
        return a >= b ? a : b;
    }
    function min(uint a, uint b) internal pure returns (uint) {
        return a < b ? a : b;
    }
}

interface erc20 {
    function totalSupply() external view returns (uint256);
    function transfer(address recipient, uint amount) external returns (bool);
    function balanceOf(address) external view returns (uint);
    function transferFrom(address sender, address recipient, uint amount) external returns (bool);
    function approve(address spender, uint value) external returns (bool);
}

interface ve {
    function token() external view returns (address);
    function balanceOfNFT(uint) external view returns (uint);
    function isApprovedOrOwner(address, uint) external view returns (bool);
    function ownerOf(uint) external view returns (address);
    //NEW_ADD  returns (bool);
    function transferFrom(address, address, uint) external returns (bool);
}

interface IBaseV1Factory {
    function isPair(address) external view returns (bool);
}

interface IBaseV1Core {
    function claimFees() external returns (uint, uint);
    function tokens() external returns (address, address);
}

interface IBribe {
    function notifyRewardAmount(address token, uint amount) external;
    function left(address token) external view returns (uint);
}

interface Voter {
    function attachTokenToGauge(uint _tokenId, address account) external;
    function detachTokenFromGauge(uint _tokenId, address account) external;
    function emitDeposit(uint _tokenId, address account, uint amount) external;
    function emitWithdraw(uint _tokenId, address account, uint amount) external;
    function distribute(address _gauge) external;
}

// Gauges are used to incentivize pools, they emit reward tokens over 7 days for staked LP tokens 激励矿池,它们在 7 天内为质押的 LP 代币发放奖励代币
contract Gauge {

    address public immutable stake; // the LP token that needs to be staked for rewards,质押的lp地址
    address public immutable _ve; // the ve token used for gauges 奖励币地址
    address public immutable bribe; //贿赂
    address public immutable voter; //投票者

    uint public derivedSupply;//总存款金额
    mapping(address => uint) public derivedBalances;//存款金额,和实际有一些区别因为nft用户计算会多一些金额

    uint internal constant DURATION = 7 days; // rewards are released over 7 days 超过7天才有奖励
    uint internal constant PRECISION = 10 ** 18;

    // default snx staking contract implementation
    mapping(address => uint) public rewardRate; //token->rate
    mapping(address => uint) public periodFinish;//token->结束时间(当前时间+7天)
    mapping(address => uint) public lastUpdateTime;//最新更新时间
    mapping(address => uint) public rewardPerTokenStored;//每个token的奖励历史存储

    mapping(address => mapping(address => uint)) public lastEarn;//上一次赚取收入
    mapping(address => mapping(address => uint)) public userRewardPerTokenStored;//用户每个token的奖励历史存储

    mapping(address => uint) public tokenIds;//user->tokenId

    uint public totalSupply;//总存款
    mapping(address => uint) public balanceOf;//用户存款

    address[] public rewards;//奖励币种
    mapping(address => bool) public isReward;//判断是否是奖励币种

    /// @notice A checkpoint for marking balance
    struct Checkpoint {
        uint timestamp;
        uint balanceOf;
    }

    /// @notice A checkpoint for marking reward rate
    struct RewardPerTokenCheckpoint {
        uint timestamp;
        uint rewardPerToken;
    }

    /// @notice A checkpoint for marking supply
    struct SupplyCheckpoint {
        uint timestamp;
        uint supply;
    }

    /// @notice A record of balance checkpoints for each account, by index
    mapping (address => mapping (uint => Checkpoint)) public checkpoints;//每个账户的index检查点 user->checkpoint index->Checkpoint
    /// @notice The number of checkpoints for each account
    mapping (address => uint) public numCheckpoints;   //user->checkpoint index
    /// @notice A record of balance checkpoints for each token, by index
    mapping (uint => SupplyCheckpoint) public supplyCheckpoints;//checkpoint index->SupplyCheckpoint
    /// @notice The number of checkpoints
    uint public supplyNumCheckpoints;   //最新的checkpoint
    /// @notice A record of balance checkpoints for each token, by index
    mapping (address => mapping (uint => RewardPerTokenCheckpoint)) public rewardPerTokenCheckpoints;//token->checkpoint index->Checkpoint
    /// @notice The number of checkpoints for each token
    mapping (address => uint) public rewardPerTokenNumCheckpoints;//token->checkpoint index

    uint public fees0;//token0的总fee
    uint public fees1;//token0的总fee

    event Deposit(address indexed from, uint tokenId, uint amount);
    event Withdraw(address indexed from, uint tokenId, uint amount);
    event NotifyReward(address indexed from, address indexed reward, uint amount);
    event ClaimFees(address indexed from, uint claimed0, uint claimed1);
    event ClaimRewards(address indexed from, address indexed reward, uint amount);

    constructor(address _stake, address _bribe, address  __ve, address _voter) {
        stake = _stake;
        bribe = _bribe;
        _ve = __ve;
        voter = _voter;
    }

    // simple re-entrancy check
    uint internal _unlocked = 1;
    modifier lock() {
        require(_unlocked == 1, 'lock');
        _unlocked = 2;
        _;
        _unlocked = 1;
    }

    function claimFees() external lock returns (uint claimed0, uint claimed1) {
        return _claimFees();
    }

    function _claimFees() internal returns (uint claimed0, uint claimed1) {
        (claimed0, claimed1) = IBaseV1Core(stake).claimFees();
        if (claimed0 > 0 || claimed1 > 0) {
            uint _fees0 = fees0 + claimed0;
            uint _fees1 = fees1 + claimed1;
            (address _token0, address _token1) = IBaseV1Core(stake).tokens();
            if (_fees0 > IBribe(bribe).left(_token0) && _fees0 / DURATION > 0) {
                fees0 = 0;
                _safeApprove(_token0, bribe, _fees0);
                IBribe(bribe).notifyRewardAmount(_token0, _fees0);
            } else {
                fees0 = _fees0;
            }
            if (_fees1 > IBribe(bribe).left(_token1) && _fees1 / DURATION > 0) {
                fees1 = 0;
                _safeApprove(_token1, bribe, _fees1);
                IBribe(bribe).notifyRewardAmount(_token1, _fees1);
            } else {
                fees1 = _fees1;
            }

            emit ClaimFees(msg.sender, claimed0, claimed1);
        }
    }

    /**
    * @notice Determine the prior balance for an account as of a block number
    * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
    * @param account The address of the account to check
    * @param timestamp The timestamp to get the balance at
    * @return The balance the account had as of the given block
    */
    function getPriorBalanceIndex(address account, uint timestamp) public view returns (uint) {//获取离时间戳最近的检查点下标
        uint nCheckpoints = numCheckpoints[account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (checkpoints[account][nCheckpoints - 1].timestamp <= timestamp) {
            return (nCheckpoints - 1);
        }

        // Next check implicit zero balance
        if (checkpoints[account][0].timestamp > timestamp) {
            return 0;
        }

        uint lower = 0;
        uint upper = nCheckpoints - 1;
        while (upper > lower) {
            uint center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[account][center];
            if (cp.timestamp == timestamp) {
                return center;
            } else if (cp.timestamp < timestamp) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return lower;
    }

    function getPriorSupplyIndex(uint timestamp) public view returns (uint) {//根据时间戳获取最新的检查点下标
        uint nCheckpoints = supplyNumCheckpoints;
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (supplyCheckpoints[nCheckpoints - 1].timestamp <= timestamp) {
            return (nCheckpoints - 1);
        }

        // Next check implicit zero balance
        if (supplyCheckpoints[0].timestamp > timestamp) {
            return 0;
        }

        uint lower = 0;
        uint upper = nCheckpoints - 1;
        while (upper > lower) {
            uint center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            SupplyCheckpoint memory cp = supplyCheckpoints[center];
            if (cp.timestamp == timestamp) {
                return center;
            } else if (cp.timestamp < timestamp) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return lower;
    }

    function getPriorRewardPerToken(address token, uint timestamp) public view returns (uint, uint) { //根据token,时间戳获取最新的rewardPerToken和timestamp
        uint nCheckpoints = rewardPerTokenNumCheckpoints[token];
        if (nCheckpoints == 0) {
            return (0,0);
        }

        // First check most recent balance
        if (rewardPerTokenCheckpoints[token][nCheckpoints - 1].timestamp <= timestamp) {
            return (rewardPerTokenCheckpoints[token][nCheckpoints - 1].rewardPerToken, rewardPerTokenCheckpoints[token][nCheckpoints - 1].timestamp);
        }

        // Next check implicit zero balance
        if (rewardPerTokenCheckpoints[token][0].timestamp > timestamp) {
            return (0,0);
        }

        uint lower = 0;
        uint upper = nCheckpoints - 1;
        while (upper > lower) {
            uint center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            RewardPerTokenCheckpoint memory cp = rewardPerTokenCheckpoints[token][center];
            if (cp.timestamp == timestamp) {
                return (cp.rewardPerToken, cp.timestamp);
            } else if (cp.timestamp < timestamp) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return (rewardPerTokenCheckpoints[token][lower].rewardPerToken, rewardPerTokenCheckpoints[token][lower].timestamp);
    }

    function _writeCheckpoint(address account, uint balance) internal {//更新检查点账户金额
        uint _timestamp = block.timestamp;
        uint _nCheckPoints = numCheckpoints[account];

        if (_nCheckPoints > 0 && checkpoints[account][_nCheckPoints - 1].timestamp == _timestamp) {
            checkpoints[account][_nCheckPoints - 1].balanceOf = balance;
        } else {
            checkpoints[account][_nCheckPoints] = Checkpoint(_timestamp, balance);
            numCheckpoints[account] = _nCheckPoints + 1;
        }
    }

    function _writeRewardPerTokenCheckpoint(address token, uint reward, uint timestamp) internal {
        uint _nCheckPoints = rewardPerTokenNumCheckpoints[token];

        if (_nCheckPoints > 0 && rewardPerTokenCheckpoints[token][_nCheckPoints - 1].timestamp == timestamp) {
            rewardPerTokenCheckpoints[token][_nCheckPoints - 1].rewardPerToken = reward;
        } else {
            rewardPerTokenCheckpoints[token][_nCheckPoints] = RewardPerTokenCheckpoint(timestamp, reward);
            rewardPerTokenNumCheckpoints[token] = _nCheckPoints + 1;
        }
    }

    function _writeSupplyCheckpoint() internal {//更新检查点supply信息
        uint _nCheckPoints = supplyNumCheckpoints;
        uint _timestamp = block.timestamp;

        if (_nCheckPoints > 0 && supplyCheckpoints[_nCheckPoints - 1].timestamp == _timestamp) {
            supplyCheckpoints[_nCheckPoints - 1].supply = derivedSupply;
        } else {
            supplyCheckpoints[_nCheckPoints] = SupplyCheckpoint(_timestamp, derivedSupply);
            supplyNumCheckpoints = _nCheckPoints + 1;
        }
    }

    function rewardsListLength() external view returns (uint) {
        return rewards.length;
    }

    // returns the last time the reward was modified or periodFinish if the reward has ended
    function lastTimeRewardApplicable(address token) public view returns (uint) {
        return Math.min(block.timestamp, periodFinish[token]);
    }

    function getReward(address account, address[] memory tokens) external lock {
        require(msg.sender == account || msg.sender == voter, 'wrong account');//自己领自己的,或者voter来领
        _unlocked = 1;
        Voter(voter).distribute(address(this));//发送奖励
        _unlocked = 2;

        for (uint i = 0; i < tokens.length; i++) {
            (rewardPerTokenStored[tokens[i]], lastUpdateTime[tokens[i]]) = _updateRewardPerToken(tokens[i]);//存储RewardPerToken奖励

            uint _reward = earned(tokens[i], account);
            lastEarn[tokens[i]][account] = block.timestamp;
            userRewardPerTokenStored[tokens[i]][account] = rewardPerTokenStored[tokens[i]];
            if (_reward > 0) _safeTransfer(tokens[i], account, _reward);//转账

            emit ClaimRewards(msg.sender, tokens[i], _reward);
        }

        uint _derivedBalance = derivedBalances[account];
        derivedSupply -= _derivedBalance;
        _derivedBalance = derivedBalance(account);//这里相当于是重新计算更新一下,因为随着时间的变化,nft锁仓用户的权重会增加
        derivedBalances[account] = _derivedBalance;
        derivedSupply += _derivedBalance;

        _writeCheckpoint(account, derivedBalances[account]);
        _writeSupplyCheckpoint();
    }

    //NEW_ADD
    function withdrawReward(address account, address token) internal {
        _unlocked = 1;
        Voter(voter).distribute(address(this));
        _unlocked = 2;

        (rewardPerTokenStored[token], lastUpdateTime[token]) = _updateRewardPerToken(token);
        uint _reward = earned(token, account);
        lastEarn[token][account] = block.timestamp;
        userRewardPerTokenStored[token][account] = rewardPerTokenStored[token];
        if (_reward > 0) _safeTransfer(token, account, _reward);

        emit ClaimRewards(msg.sender, token, _reward);
    }
    //NEW_ADD

    function rewardPerToken(address token) public view returns (uint) {
        if (derivedSupply == 0) {
            return rewardPerTokenStored[token];
        }
        return rewardPerTokenStored[token] + ((lastTimeRewardApplicable(token) - Math.min(lastUpdateTime[token], periodFinish[token])) * rewardRate[token] * PRECISION / derivedSupply);
    }

    function derivedBalance(address account) public view returns (uint) {
        uint _tokenId = tokenIds[account];
        uint _balance = balanceOf[account];
        uint _derived = _balance * 40 / 100;
        uint _adjusted = 0;
        uint _supply = erc20(_ve).totalSupply();
        // console.log("_supply:",_supply);
        // console.log("totalSupply:",totalSupply);

        if (account == ve(_ve).ownerOf(_tokenId) && _supply > 0) {//如果是nft锁仓用户,可以根据权重多拿一些,只要这里计算的值比(_balance * 60 / 100)大就行
            _adjusted = ve(_ve).balanceOfNFT(_tokenId);
            _adjusted = (totalSupply * _adjusted / _supply) * 60 / 100;
            //console.log("_adjusted:",_adjusted);
        }
        return Math.min((_derived + _adjusted), _balance);
    }

    function batchRewardPerToken(address token, uint maxRuns) external {//根据检查点计算每个token有多少奖励,有可能有一些token较长时间没更新奖励了
        (rewardPerTokenStored[token], lastUpdateTime[token])  = _batchRewardPerToken(token, maxRuns);
    }

    function _batchRewardPerToken(address token, uint maxRuns) internal returns (uint, uint) {
        uint _startTimestamp = lastUpdateTime[token];
        uint reward = rewardPerTokenStored[token];

        if (supplyNumCheckpoints == 0) {
            return (reward, block.timestamp);//NEW_ADD return (reward, _startTimestamp);
        }

        if (rewardRate[token] == 0) {
            return (reward, block.timestamp);
        }

        uint _startIndex = getPriorSupplyIndex(_startTimestamp);
        uint _endIndex = Math.min(supplyNumCheckpoints-1, maxRuns);

        for (uint i = _startIndex; i < _endIndex; i++) {
            SupplyCheckpoint memory sp0 = supplyCheckpoints[i];
            if (sp0.supply > 0) {
                SupplyCheckpoint memory sp1 = supplyCheckpoints[i+1];
                (uint _reward, uint _endTime) = _calcRewardPerToken(token, sp1.timestamp, sp0.timestamp, sp0.supply, _startTimestamp);
                reward += _reward;
                _writeRewardPerTokenCheckpoint(token, reward, _endTime);
                _startTimestamp = _endTime;
            }
        }

        return (reward, _startTimestamp);
    }

    function _calcRewardPerToken(address token, uint timestamp1, uint timestamp0, uint supply, uint startTimestamp) internal view returns (uint, uint) {
        uint endTime = Math.max(timestamp1, startTimestamp);
        return (((Math.min(endTime, periodFinish[token]) - Math.min(Math.max(timestamp0, startTimestamp), periodFinish[token])) * rewardRate[token] * PRECISION / supply), endTime);
    }

    function _updateRewardPerToken(address token) internal returns (uint, uint) {//获取token最近更新时间到supply检查点的
        uint _startTimestamp = lastUpdateTime[token];
        uint reward = rewardPerTokenStored[token];//存储最新的rewardPerToken

        if (supplyNumCheckpoints == 0) {
            return (reward, block.timestamp);//NEW_ADD return (reward, _startTimestamp);
        }

        if (rewardRate[token] == 0) {
            return (reward, block.timestamp);
        }

        uint _startIndex = getPriorSupplyIndex(_startTimestamp);//拿到token最新的下标
        uint _endIndex = supplyNumCheckpoints-1;//总的checkpoint最新下标

        if (_endIndex - _startIndex > 1) {
            for (uint i = _startIndex; i < _endIndex; i++) {//NEW_ADD for (uint i = _startIndex; i < _endIndex-1; i++) {//进行累加
                SupplyCheckpoint memory sp0 = supplyCheckpoints[i];
                if (sp0.supply > 0) {
                    SupplyCheckpoint memory sp1 = supplyCheckpoints[i+1];
                    (uint _reward, uint _endTime) = _calcRewardPerToken(token, sp1.timestamp, sp0.timestamp, sp0.supply, _startTimestamp);
                    reward += _reward;
                    _writeRewardPerTokenCheckpoint(token, reward, _endTime);
                    _startTimestamp = _endTime;
                }
            }
        }

        SupplyCheckpoint memory sp = supplyCheckpoints[_endIndex];//拿到结尾的数据
        if (sp.supply > 0) {//再比较一次
            (uint _reward,) = _calcRewardPerToken(token, lastTimeRewardApplicable(token), Math.max(sp.timestamp, _startTimestamp), sp.supply, _startTimestamp);
            reward += _reward;
            _writeRewardPerTokenCheckpoint(token, reward, block.timestamp);
            _startTimestamp = block.timestamp;
        }

        return (reward, _startTimestamp);
    }

    // earned is an estimation, it won't be exact till the supply > rewardPerToken calculations have run
    function earned(address token, address account) public view returns (uint) {//计算赚到的收入
        uint _startTimestamp = Math.max(lastEarn[token][account], rewardPerTokenCheckpoints[token][0].timestamp);//先获取最大的时间戳
        if (numCheckpoints[account] == 0) {
            return 0;
        }

        uint _startIndex = getPriorBalanceIndex(account, _startTimestamp);//根据账户拿到最近的检查点数据
        uint _endIndex = numCheckpoints[account]-1;

        uint reward = 0;

        if (_endIndex - _startIndex > 1) {
            for (uint i = _startIndex; i < _endIndex; i++) {//NEW_ADD for (uint i = _startIndex; i < _endIndex-1; i++) {
                Checkpoint memory cp0 = checkpoints[account][i];
                Checkpoint memory cp1 = checkpoints[account][i+1];
                (uint _rewardPerTokenStored0,) = getPriorRewardPerToken(token, cp0.timestamp);
                (uint _rewardPerTokenStored1,) = getPriorRewardPerToken(token, cp1.timestamp);
                reward += cp0.balanceOf * (_rewardPerTokenStored1 - _rewardPerTokenStored0) / PRECISION;
            }
        }

        Checkpoint memory cp = checkpoints[account][_endIndex];
        (uint _rewardPerTokenStored,) = getPriorRewardPerToken(token, cp.timestamp);
        reward += cp.balanceOf * (rewardPerToken(token) - Math.max(_rewardPerTokenStored, userRewardPerTokenStored[token][account])) / PRECISION;

        // console.log("earned token:",token);
        // console.log("earned account:",account);
        // console.log("reward:",reward);
        return reward;
    }

    function depositAll(uint tokenId) external {
        deposit(erc20(stake).balanceOf(msg.sender), tokenId);
    }

    function deposit(uint amount, uint tokenId) public lock {//用户存款
        require(amount > 0, 'amount is zero');

        _safeTransferFrom(stake, msg.sender, address(this), amount);
        totalSupply += amount;
        balanceOf[msg.sender] += amount;

        if (tokenId > 0) {
            require(ve(_ve).ownerOf(tokenId) == msg.sender, '!owner');
            if (tokenIds[msg.sender] == 0) {//第一次操作
                tokenIds[msg.sender] = tokenId;
                Voter(voter).attachTokenToGauge(tokenId, msg.sender);//投票合约将tokenId和user绑定
            }
            require(tokenIds[msg.sender] == tokenId, 'Incorrect token ID');
        } else {
            tokenId = tokenIds[msg.sender];//获取tokenId
        }

        uint _derivedBalance = derivedBalances[msg.sender];//更新存款金额
        derivedSupply -= _derivedBalance;
        _derivedBalance = derivedBalance(msg.sender);
        derivedBalances[msg.sender] = _derivedBalance;
        derivedSupply += _derivedBalance;

        _writeCheckpoint(msg.sender, _derivedBalance);//更新检查点信息
        _writeSupplyCheckpoint();

        Voter(voter).emitDeposit(tokenId, msg.sender, amount);//voter发送存款事件
        emit Deposit(msg.sender, tokenId, amount);
    }

    function withdrawAll() external {
        withdraw(balanceOf[msg.sender]);
    }

    function withdraw(uint amount) public {
        uint tokenId = 0;
        if (amount == balanceOf[msg.sender]) {
            tokenId = tokenIds[msg.sender];
        }
        withdrawToken(amount, tokenId);
    }

    function withdrawToken(uint amount, uint tokenId) public lock {//提现顺便提取奖励
        //NEW_ADD
        address rewardToken = ve(_ve).token();
        if (isReward[rewardToken]){
            withdrawReward(msg.sender, rewardToken);
        }
        //NEW_ADD

        totalSupply -= amount;
        balanceOf[msg.sender] -= amount;
        _safeTransfer(stake, msg.sender, amount);

        if (tokenId > 0) {
            require(tokenId == tokenIds[msg.sender], 'Incorrect token ID');
            tokenIds[msg.sender] = 0;
            Voter(voter).detachTokenFromGauge(tokenId, msg.sender);//将tokenId和奖池解除绑定
        } else {
            tokenId = tokenIds[msg.sender];
        }

        uint _derivedBalance = derivedBalances[msg.sender];//存款金额更新
        derivedSupply -= _derivedBalance;
        _derivedBalance = derivedBalance(msg.sender);
        derivedBalances[msg.sender] = _derivedBalance;
        derivedSupply += _derivedBalance;

        _writeCheckpoint(msg.sender, derivedBalances[msg.sender]);//更新checkpoint
        _writeSupplyCheckpoint();

        Voter(voter).emitWithdraw(tokenId, msg.sender, amount);
        emit Withdraw(msg.sender, tokenId, amount);
    }

    function left(address token) external view returns (uint) {//token的结束时间*奖率,相当于计算还有多少token释放
        if (block.timestamp >= periodFinish[token]) return 0;
        uint _remaining = periodFinish[token] - block.timestamp;
        return _remaining * rewardRate[token];
    }

    function notifyRewardAmount(address token, uint amount) external lock {//开启挖矿
        require(token != stake, 'token == stake');
        require(amount > 0, 'amount is zero');
        if (rewardRate[token] == 0) _writeRewardPerTokenCheckpoint(token, 0, block.timestamp);//更新检查点
        (rewardPerTokenStored[token], lastUpdateTime[token]) = _updateRewardPerToken(token);//拿到每个token的奖励
        _claimFees();//获取贿赂奖励

        if (block.timestamp >= periodFinish[token]) {//已结束
            _safeTransferFrom(token, msg.sender, address(this), amount);//则可以转入,再开始
            rewardRate[token] = amount / DURATION;
        } else {
            uint _remaining = periodFinish[token] - block.timestamp;//未结束则更新rewardRate,相当于增加奖励
            uint _left = _remaining * rewardRate[token];
            require(amount > _left, 'The amount of reward is too small and should be greater than the amount not yet produced');
            _safeTransferFrom(token, msg.sender, address(this), amount);
            rewardRate[token] = (amount + _left) / DURATION;
        }
        require(rewardRate[token] > 0, 'rewardRate is zero');
        uint balance = erc20(token).balanceOf(address(this));
        require(rewardRate[token] <= balance / DURATION, "Provided reward too high");
        periodFinish[token] = block.timestamp + DURATION;//同时要延长,不管有没有结束,都要加7天
        if (!isReward[token]) {
            isReward[token] = true;
            rewards.push(token);
        }

        emit NotifyReward(msg.sender, token, amount);
    }

    function _safeTransfer(address token, address to, uint256 value) internal {
        require(token.code.length > 0, 'token err');
        (bool success, bytes memory data) =
        token.call(abi.encodeWithSelector(erc20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        require(token.code.length > 0, 'token err');
        (bool success, bytes memory data) =
        token.call(abi.encodeWithSelector(erc20.transferFrom.selector, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    }

    function _safeApprove(address token, address spender, uint256 value) internal {
        require(token.code.length > 0, 'token err');
        (bool success, bytes memory data) =
        token.call(abi.encodeWithSelector(erc20.approve.selector, spender, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: APPROVE_FAILED');
    }
}

contract BaseV1GaugeFactory {
    address public last_gauge;

    function createGauge(address _pool, address _bribe, address _ve) external returns (address) {
        last_gauge = address(new Gauge(_pool, _bribe, _ve, msg.sender));
        return last_gauge;
    }

    function createGaugeSingle(address _pool, address _bribe, address _ve, address _voter) external returns (address) {
        last_gauge = address(new Gauge(_pool, _bribe, _ve, _voter));
        return last_gauge;
    }
}
