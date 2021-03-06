const { expect } = require("chai");
const { ethers } = require("hardhat");

function getCreate2Address(
  factoryAddress,
  [tokenA, tokenB],
  bytecode
) {
  const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
  const create2Inputs = [
    '0xff',
    factoryAddress,
    keccak256(solidityPack(['address', 'address'], [token0, token1])),
    keccak256(bytecode)
  ]
  const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
  return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`)
}

describe("core", function () {

  let token;
  let ust;
  let mim;
  let dai;
  let ve_underlying;
  let late_reward;
  let ve;
  let factory;
  let router;
  let pair;
  let pair2;
  let pair3;
  let owner;
  let gauge_factory;
  let gauge;
  let gauge2;
  let gauge3;
  let bribe;
  let bribe2;
  let bribe3;
  let minter;
  let ve_dist;
  let library;
  let staking;
  let owner2;
  let owner3;
  let unit = ethers.BigNumber.from("1000000000000000000");

  it("deploy base coins", async function () {
    [owner, owner2, owner3] = await ethers.getSigners(3);
    //1.先铸一些币
    token = await ethers.getContractFactory("Token");
    ust = await token.deploy('ust', 'ust', 6, owner.address);
    await ust.mint(owner.address, ethers.BigNumber.from("1000000000000000000"));
    await ust.mint(owner2.address, ethers.BigNumber.from("1000000000000000000"));
    await ust.mint(owner3.address, ethers.BigNumber.from("1000000000000000000"));
    mim = await token.deploy('MIM', 'MIM', 18, owner.address);
    await mim.mint(owner.address, ethers.BigNumber.from("1000000000000000000000000000000"));
    await mim.mint(owner2.address, ethers.BigNumber.from("1000000000000000000000000000000"));
    await mim.mint(owner3.address, ethers.BigNumber.from("1000000000000000000000000000000"));
    dai = await token.deploy('DAI', 'DAI', 18, owner.address);
    await dai.mint(owner.address, ethers.BigNumber.from("1000000000000000000000000000000"));
    await dai.mint(owner2.address, ethers.BigNumber.from("1000000000000000000000000000000"));
    await dai.mint(owner3.address, ethers.BigNumber.from("1000000000000000000000000000000"));
    ve_underlying = await token.deploy('VE', 'VE', 18, owner.address);
    await ve_underlying.mint(owner.address, ethers.BigNumber.from("20000000000000000000000000"));
    await ve_underlying.mint(owner2.address, ethers.BigNumber.from("10000000000000000000000000"));
    await ve_underlying.mint(owner3.address, ethers.BigNumber.from("10000000000000000000000000"));
    late_reward = await token.deploy('LR', 'LR', 18, owner.address);
    await late_reward.mint(owner.address, ethers.BigNumber.from("20000000000000000000000000"));
    //2.发行nft合约
    vecontract = await ethers.getContractFactory("contracts/ve.sol:ve");
    ve = await vecontract.deploy(ve_underlying.address);

    await ust.deployed();
    await mim.deployed();
  });

  it("create lock", async function () {
    //tokenId 1 创建4年锁仓
    await ve_underlying.approve(ve.address, ethers.BigNumber.from("500000000000000000"));//0.5
    await ve.create_lock(ethers.BigNumber.from("500000000000000000"), 4 * 365 * 86400);
    let balanceOfNft = await ve.balanceOfNFT(1);
    let lk = await ve.locked(1);
    console.log("balanceOfNft:",balanceOfNft/unit)
    console.log("lk:",lk.end);
    expect(await ve.balanceOfNFT(1)).to.above(ethers.BigNumber.from("495063075414519385"));
    expect(await ve_underlying.balanceOf(ve.address)).to.be.equal(ethers.BigNumber.from("500000000000000000"));
  });

  it("increase lock", async function () {
    //tokenId 1 增加锁仓数量
    await ve_underlying.approve(ve.address, ethers.BigNumber.from("500000000000000000"));
    await ve.increase_amount(1, ethers.BigNumber.from("500000000000000000"));
    await expect(ve.increase_unlock_time(1, 4 * 365 * 86400)).to.be.reverted;//上面已经锁了4年,不能再加了
    expect(await ve.balanceOfNFT(1)).to.above(ethers.BigNumber.from("995063075414519385"));
    expect(await ve_underlying.balanceOf(ve.address)).to.be.equal(ethers.BigNumber.from("1000000000000000000"));
  });

  it("ve views", async function () {
    const block = await ve.block_number();
    expect(await ve.balanceOfAtNFT(1, block)).to.equal(await ve.balanceOfNFT(1));
    expect(await ve.totalSupplyAt(block)).to.equal(await ve.totalSupply());

    expect(await ve.balanceOfNFT(1)).to.above(ethers.BigNumber.from("995063075414519385"));
    expect(await ve_underlying.balanceOf(ve.address)).to.be.equal(ethers.BigNumber.from("1000000000000000000"));
  });


  it("steal NFT", async function () {
    //锁仓的nft不可以转走
    await expect(ve.connect(owner2).transferFrom(owner.address, owner2.address, 1)).to.be.reverted
    await expect(ve.connect(owner2).approve(owner2.address, 1)).to.be.reverted
    await expect(ve.connect(owner2).merge(1, 2)).to.be.reverted
    let balanceOfOwner2 = await ve_underlying.balanceOf(owner2.address);
    let veBalanceOfOwner2 = await ve.balanceOf(owner2.address);
    console.log("balanceOfOwner2:",balanceOfOwner2/unit);
    console.log("veBalanceOfOwner2:",veBalanceOfOwner2/unit);//因为上面都失败了,所以owner2并没有ve
  });


  it("ve merge", async function () {
    //合并tokenId的锁仓
    await ve_underlying.approve(ve.address, ethers.BigNumber.from("1000000000000000000"));//1
    await ve.create_lock(ethers.BigNumber.from("1000000000000000000"), 4 * 365 * 86400);
    expect(await ve.balanceOfNFT(2)).to.above(ethers.BigNumber.from("995063075414519385"));
    expect(await ve_underlying.balanceOf(ve.address)).to.be.equal(ethers.BigNumber.from("2000000000000000000"));
    console.log("before merge",await ve.totalSupply());
    await ve.merge(2, 1);
    console.log("after merge",await ve.totalSupply());
    expect(await ve.balanceOfNFT(1)).to.above(ethers.BigNumber.from("1990063075414519385"));
    expect(await ve.balanceOfNFT(2)).to.equal(ethers.BigNumber.from("0"));
    expect((await ve.locked(2)).amount).to.equal(ethers.BigNumber.from("0"));
    expect(await ve.ownerOf(2)).to.equal('0x0000000000000000000000000000000000000000');
    await ve_underlying.approve(ve.address, ethers.BigNumber.from("1000000000000000000"));
    await ve.create_lock(ethers.BigNumber.from("1000000000000000000"), 4 * 365 * 86400);
    expect(await ve.balanceOfNFT(3)).to.above(ethers.BigNumber.from("995063075414519385"));//token3再锁4年
    expect(await ve_underlying.balanceOf(ve.address)).to.be.equal(ethers.BigNumber.from("3000000000000000000"));
    console.log(await ve.totalSupply());
    await ve.merge(3, 1); //再合一次
    console.log("merge again:",await ve.totalSupply());
    expect(await ve.balanceOfNFT(1)).to.above(ethers.BigNumber.from("1990063075414519385"));
    expect(await ve.balanceOfNFT(3)).to.equal(ethers.BigNumber.from("0"));
    expect((await ve.locked(3)).amount).to.equal(ethers.BigNumber.from("0"));
    expect(await ve.ownerOf(3)).to.equal('0x0000000000000000000000000000000000000000');
  });

  it("confirm ust deployment", async function () {
    expect(await ust.name()).to.equal("ust");
  });

  it("confirm mim deployment", async function () {
    expect(await mim.name()).to.equal("MIM");
  });

  it("deploy BaseV1Factory and test pair length", async function () {
    //部署BaseV1Factory合约
    const BaseV1Factory = await ethers.getContractFactory("BaseV1Factory");
    factory = await BaseV1Factory.deploy();
    await factory.deployed();

    expect(await factory.allPairsLength()).to.equal(0);
  });

  it("deploy BaseV1Router and test factory address", async function () {
    //部署Router
    const BaseV1Router = await ethers.getContractFactory("BaseV1Router01");
    router = await BaseV1Router.deploy(factory.address, owner.address);
    await router.deployed();

    expect(await router.factory()).to.equal(factory.address);
  });

  it("deploy pair via BaseV1Factory owner", async function () {
    //使用通过BaseV1Factory创建min的pair并添加流动性
    const ust_1 = ethers.BigNumber.from("1000000");
    const mim_1 = ethers.BigNumber.from("1000000000000000000");
    const dai_1 = ethers.BigNumber.from("1000000000000000000");
    await mim.approve(router.address, mim_1);
    await ust.approve(router.address, ust_1);
    await router.addLiquidity(mim.address, ust.address, true, mim_1, ust_1, 0, 0, owner.address, Date.now());//pair1 mim_ust_稳定池
    await mim.approve(router.address, mim_1);
    await ust.approve(router.address, ust_1);
    await router.addLiquidity(mim.address, ust.address, false, mim_1, ust_1, 0, 0, owner.address, Date.now());//pair2 mim_ust_不稳定池
    await mim.approve(router.address, mim_1);
    await dai.approve(router.address, dai_1);
    await router.addLiquidity(mim.address, dai.address, true, mim_1, dai_1, 0, 0, owner.address, Date.now());//pair3 mim_dai_稳定池
    expect(await factory.allPairsLength()).to.equal(3);
  });

  it("deploy pair via BaseV1Factory owner2", async function () {
    //使用owner2添加流动性
    const ust_1 = ethers.BigNumber.from("1000000");
    const mim_1 = ethers.BigNumber.from("1000000000000000000");
    const dai_1 = ethers.BigNumber.from("1000000000000000000");
    await mim.connect(owner2).approve(router.address, mim_1);
    await ust.connect(owner2).approve(router.address, ust_1);
    await router.connect(owner2).addLiquidity(mim.address, ust.address, true, mim_1, ust_1, 0, 0, owner.address, Date.now());
    await mim.connect(owner2).approve(router.address, mim_1);
    await ust.connect(owner2).approve(router.address, ust_1);
    await router.connect(owner2).addLiquidity(mim.address, ust.address, false, mim_1, ust_1, 0, 0, owner.address, Date.now());
    await mim.connect(owner2).approve(router.address, mim_1);
    await dai.connect(owner2).approve(router.address, dai_1);
    await router.connect(owner2).addLiquidity(mim.address, dai.address, true, mim_1, dai_1, 0, 0, owner.address, Date.now());
    expect(await factory.allPairsLength()).to.equal(3);
  });

  it("confirm pair for mim-ust", async function () {
    const create2address = await router.pairFor(mim.address, ust.address, true);
    const BaseV1Pair = await ethers.getContractFactory("BaseV1Pair");
    const address = await factory.getPair(mim.address, ust.address, true);
    const allpairs0 = await factory.allPairs(0);
    pair = await BaseV1Pair.attach(address);//lp1
    const address2 = await factory.getPair(mim.address, ust.address, false);
    pair2 = await BaseV1Pair.attach(address2);//lp2
    const address3 = await factory.getPair(mim.address, dai.address, true);
    pair3 = await BaseV1Pair.attach(address3);//lp3

    expect(pair.address).to.equal(create2address);
  });

  it("confirm tokens for mim-ust", async function () {
    [token0, token1] = await router.sortTokens(ust.address, mim.address);
    expect((await pair.token0()).toUpperCase()).to.equal(token0.toUpperCase());
    expect((await pair.token1()).toUpperCase()).to.equal(token1.toUpperCase());
  });

  it("mint & burn tokens for pair mim-ust", async function () {
    const ust_1 = ethers.BigNumber.from("1000000");
    const mim_1 = ethers.BigNumber.from("1000000000000000000");
    const before_balance = await ust.balanceOf(owner.address);
    await ust.transfer(pair.address, ust_1);
    await mim.transfer(pair.address, mim_1);
    await pair.mint(owner.address);//铸lp
    expect(await pair.getAmountOut(ust_1, ust.address)).to.equal(ethers.BigNumber.from("982117769725505988"));
    const output = await router.getAmountOut(ust_1, ust.address, mim.address);
    expect(await pair.getAmountOut(ust_1, ust.address)).to.equal(output.amount);
    expect(output.stable).to.equal(true);
    expect(await router.isPair(pair.address)).to.equal(true);
  });

  it("mint & burn tokens for pair mim-ust owner2", async function () {
    const ust_1 = ethers.BigNumber.from("1000000");
    const mim_1 = ethers.BigNumber.from("1000000000000000000");
    const before_balance = await ust.balanceOf(owner.address);
    await ust.connect(owner2).transfer(pair.address, ust_1);
    await mim.connect(owner2).transfer(pair.address, mim_1);
    await pair.connect(owner2).mint(owner2.address);//给owner2也铸一些lp
    expect(await pair.connect(owner2).getAmountOut(ust_1, ust.address)).to.equal(ethers.BigNumber.from("992220948146798746"));
  });

  it("BaseV1Router01 addLiquidity", async function () {
    const ust_1000 = ethers.BigNumber.from("100000000000");
    const mim_1000 = ethers.BigNumber.from("100000000000000000000000");
    const mim_100000000 = ethers.BigNumber.from("100000000000000000000000000");
    const dai_100000000 = ethers.BigNumber.from("100000000000000000000000000");
    const expected_2000 = ethers.BigNumber.from("2000000000000");
    await ust.approve(router.address, ust_1000);
    await mim.approve(router.address, mim_1000);
    const expected = await router.quoteAddLiquidity(mim.address, ust.address, true, mim_1000, ust_1000);//先模拟添加,看能得到多少lp
    await router.addLiquidity(mim.address, ust.address, true, mim_1000, ust_1000, expected.amountA, expected.amountB, owner.address, Date.now());
    await ust.approve(router.address, ust_1000);
    await mim.approve(router.address, mim_1000);
    await router.addLiquidity(mim.address, ust.address, false, mim_1000, ust_1000, mim_1000, ust_1000, owner.address, Date.now());
    await dai.approve(router.address, dai_100000000);
    await mim.approve(router.address, mim_100000000);
    await router.addLiquidity(mim.address, dai.address, true, mim_100000000, dai_100000000, 0, 0, owner.address, Date.now());
  });

  it("BaseV1Router01 removeLiquidity", async function () {
    const ust_1000 = ethers.BigNumber.from("100000000000");
    const mim_1000 = ethers.BigNumber.from("100000000000000000000000");
    const mim_100000000 = ethers.BigNumber.from("100000000000000000000000000");
    const dai_100000000 = ethers.BigNumber.from("100000000000000000000000000");
    const expected_2000 = ethers.BigNumber.from("2000000000000");
    await ust.approve(router.address, ust_1000);
    await mim.approve(router.address, mim_1000);
    const expected = await router.quoteAddLiquidity(mim.address, ust.address, true, mim_1000, ust_1000);
    const output = await router.quoteRemoveLiquidity(mim.address, ust.address, true, ust_1000);
  });

  it("BaseV1Router01 addLiquidity owner2", async function () {
    const ust_1000 = ethers.BigNumber.from("100000000000");
    const mim_1000 = ethers.BigNumber.from("100000000000000000000000");
    const mim_100000000 = ethers.BigNumber.from("100000000000000000000000000");
    const dai_100000000 = ethers.BigNumber.from("100000000000000000000000000");
    const expected_2000 = ethers.BigNumber.from("2000000000000");
    await ust.connect(owner2).approve(router.address, ust_1000);
    await mim.connect(owner2).approve(router.address, mim_1000);
    await router.connect(owner2).addLiquidity(mim.address, ust.address, true, mim_1000, ust_1000, mim_1000, ust_1000, owner.address, Date.now());
    await ust.connect(owner2).approve(router.address, ust_1000);
    await mim.connect(owner2).approve(router.address, mim_1000);
    await router.connect(owner2).addLiquidity(mim.address, ust.address, false, mim_1000, ust_1000, mim_1000, ust_1000, owner.address, Date.now());
    await dai.connect(owner2).approve(router.address, dai_100000000);
    await mim.connect(owner2).approve(router.address, mim_100000000);
    await router.connect(owner2).addLiquidity(mim.address, dai.address, true, mim_100000000, dai_100000000, 0, 0, owner.address, Date.now());
  });

  it("BaseV1Router01 pair1 getAmountsOut & swapExactTokensForTokens", async function () {
    const ust_1 = ethers.BigNumber.from("1000000");
    const route = {from:ust.address, to:mim.address, stable:true}

    expect((await router.getAmountsOut(ust_1, [route]))[1]).to.be.equal(await pair.getAmountOut(ust_1, ust.address));

    const before = await mim.balanceOf(owner.address);
    const expected_output_pair = await pair.getAmountOut(ust_1, ust.address);
    const expected_output = await router.getAmountsOut(ust_1, [route]);
    await ust.approve(router.address, ust_1);
    await router.swapExactTokensForTokens(ust_1, expected_output[1], [route], owner.address, Date.now());
    const fees = await pair.fees()
    expect(await ust.balanceOf(fees)).to.be.equal(100);
    const b = await ust.balanceOf(owner.address);
    console.log("owner ust balance:",b);
    await pair.claimFees();
    expect(await ust.balanceOf(owner.address)).to.be.above(b);
    console.log("after claim fees,owner ust balance:",await ust.balanceOf(owner.address));
  });

  it("BaseV1Router01 pair1 getAmountsOut & swapExactTokensForTokens owner2", async function () {
    const ust_1 = ethers.BigNumber.from("1000000");
    const route = {from:ust.address, to:mim.address, stable:true}

    expect((await router.getAmountsOut(ust_1, [route]))[1]).to.be.equal(await pair.getAmountOut(ust_1, ust.address));

    const before = await mim.balanceOf(owner2.address);
    const expected_output_pair = await pair.getAmountOut(ust_1, ust.address);
    const expected_output = await router.getAmountsOut(ust_1, [route]);
    await ust.connect(owner2).approve(router.address, ust_1);
    //console.log("fees",await ust.balanceOf(fees))
    await router.connect(owner2).swapExactTokensForTokens(ust_1, expected_output[1], [route], owner2.address, Date.now());
    const fees = await pair.fees()
    expect(await ust.balanceOf(fees)).to.be.equal(101);
    const b = await ust.balanceOf(owner.address);
    await pair.connect(owner2).claimFees();
    expect(await ust.balanceOf(owner.address)).to.be.equal(b);
  });

  it("BaseV1Router01 pair2 getAmountsOut & swapExactTokensForTokens", async function () {
    const ust_1 = ethers.BigNumber.from("1000000");
    const route = {from:ust.address, to:mim.address, stable:false}

    expect((await router.getAmountsOut(ust_1, [route]))[1]).to.be.equal(await pair2.getAmountOut(ust_1, ust.address));

    const before = await mim.balanceOf(owner.address);
    const expected_output_pair = await pair.getAmountOut(ust_1, ust.address);
    const expected_output = await router.getAmountsOut(ust_1, [route]);
    await ust.approve(router.address, ust_1);
    await router.swapExactTokensForTokens(ust_1, expected_output[1], [route], owner.address, Date.now());
  });

  it("BaseV1Router01 pair3 getAmountsOut & swapExactTokensForTokens", async function () {
    const mim_1000000 = ethers.BigNumber.from("1000000000000000000000000");
    const route = {from:mim.address, to:dai.address, stable:true}

    expect((await router.getAmountsOut(mim_1000000, [route]))[1]).to.be.equal(await pair3.getAmountOut(mim_1000000, mim.address));

    const before = await mim.balanceOf(owner.address);
    const expected_output_pair = await pair3.getAmountOut(mim_1000000, mim.address);
    const expected_output = await router.getAmountsOut(mim_1000000, [route]);
    await mim.approve(router.address, mim_1000000);
    await router.swapExactTokensForTokens(mim_1000000, expected_output[1], [route], owner.address, Date.now());
  });

  it("deploy BaseV1Minter", async function () {
    //部署BaseV1Minter
    const BaseV1GaugeFactory = await ethers.getContractFactory("BaseV1GaugeFactory");
    gauges_factory = await BaseV1GaugeFactory.deploy();
    await gauges_factory.deployed();
    const BaseV1BribeFactory = await ethers.getContractFactory("BaseV1BribeFactory");
    const bribe_factory = await BaseV1BribeFactory.deploy();
    await bribe_factory.deployed();
    const BaseV1Voter = await ethers.getContractFactory("BaseV1Voter");
    gauge_factory = await BaseV1Voter.deploy(ve.address, factory.address, gauges_factory.address, bribe_factory.address);
    await gauge_factory.deployed();

    await ve.setVoter(gauge_factory.address);

    expect(await gauge_factory.length()).to.equal(0);
  });

  it("deploy BaseV1Minter", async function () {
    //部署BaseV1Minter
    const VeDist = await ethers.getContractFactory("contracts/ve_dist.sol:ve_dist");
    ve_dist = await VeDist.deploy(ve.address);
    await ve_dist.deployed();

    const BaseV1Minter = await ethers.getContractFactory("BaseV1Minter");
    minter = await BaseV1Minter.deploy(gauge_factory.address, ve.address, ve_dist.address);
    await minter.deployed();
    await ve_dist.setDepositor(minter.address);
    await gauge_factory.initialize([ust.address, mim.address, dai.address, ve_underlying.address],minter.address);
  });

  it("deploy BaseV1Factory gauge", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");

    //voter根据pair创建奖池
    await ve_underlying.approve(gauge_factory.address, ethers.BigNumber.from("1500000000000000000000000"));
    await gauge_factory.createGauge(pair.address);
    await gauge_factory.createGauge(pair2.address);
    await gauge_factory.createGauge(pair3.address);
    expect(await gauge_factory.gauges(pair.address)).to.not.equal(0x0000000000000000000000000000000000000000);

    //部署流动挖矿合约
    sr = await ethers.getContractFactory("StakingRewards");
    staking = await sr.deploy(pair.address, ve_underlying.address);

    const gauge_address = await gauge_factory.gauges(pair.address);
    const bribe_address = await gauge_factory.bribes(gauge_address);

    const gauge_address2 = await gauge_factory.gauges(pair2.address);
    const bribe_address2 = await gauge_factory.bribes(gauge_address2);

    const gauge_address3 = await gauge_factory.gauges(pair3.address);
    const bribe_address3 = await gauge_factory.bribes(gauge_address3);

    const Gauge = await ethers.getContractFactory("Gauge");
    gauge = await Gauge.attach(gauge_address);
    gauge2 = await Gauge.attach(gauge_address2);
    gauge3 = await Gauge.attach(gauge_address3);

    const Bribe = await ethers.getContractFactory("Bribe");
    bribe = await Bribe.attach(bribe_address);
    bribe2 = await Bribe.attach(bribe_address2);
    bribe3 = await Bribe.attach(bribe_address3);

    await pair.approve(gauge.address, pair_1000);
    await pair.approve(staking.address, pair_1000);
    await pair2.approve(gauge2.address, pair_1000);
    await pair3.approve(gauge3.address, pair_1000);
    await gauge.deposit(pair_1000, 0);
    let balanceOfOwner1 = await gauge.balanceOf(owner.address);
    console.log("balanceOfOwner1:",balanceOfOwner1);
    console.log("token1 balanceOfNFT:",await ve.balanceOfNFT(1)/unit);
    let derivedBalance = await gauge.derivedBalance(owner.address)
    console.log("derivedBalance:",derivedBalance)
    //staking抵押lp
    await staking.stake(pair_1000);
    await gauge2.deposit(pair_1000, 0);
    await gauge3.deposit(pair_1000, 0);
    expect(await gauge.totalSupply()).to.equal(pair_1000);
    expect(await gauge.earned(ve.address, owner.address)).to.equal(0);
  });

  it("veNFT gauge manipulate", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");
    expect(await gauge.tokenIds(owner.address)).to.equal(0);
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);//存入pair,同时有nft锁仓
    expect(await gauge.tokenIds(owner.address)).to.equal(1);
    await pair.approve(gauge.address, pair_1000);
    await expect(gauge.deposit(pair_1000, 2)).to.be.reverted;
    expect(await gauge.tokenIds(owner.address)).to.equal(1);
    await expect(gauge.withdrawToken(0, 2)).to.be.reverted;
    expect(await gauge.tokenIds(owner.address)).to.equal(1);
    await gauge.withdrawToken(0, 1);
    expect(await gauge.tokenIds(owner.address)).to.equal(0);
  });


  it("deploy BaseV1Factory gauge owner2", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");
    const pair_3000 = ethers.BigNumber.from("3000000000");

    await pair.connect(owner2).approve(gauge.address, pair_1000);
    await pair.connect(owner2).approve(staking.address, pair_1000);
    await gauge.connect(owner2).deposit(pair_1000, 0);
    await staking.connect(owner2).stake(pair_1000);
    expect(await gauge.totalSupply()).to.equal(pair_3000);
    expect(await gauge.earned(ve.address, owner2.address)).to.equal(0);
  });

  it("withdraw gauge stake", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");
    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await gauge.connect(owner2).withdraw(await gauge.balanceOf(owner2.address));
    await staking.withdraw(await staking._balances(owner.address));
    await staking.connect(owner2).withdraw(await staking._balances(owner2.address));
    await gauge2.withdraw(await gauge2.balanceOf(owner.address));
    await gauge3.withdraw(await gauge3.balanceOf(owner.address));
    expect(await gauge.totalSupply()).to.equal(0);
    expect(await gauge2.totalSupply()).to.equal(0);
    expect(await gauge3.totalSupply()).to.equal(0);
  });

  it("add gauge & bribe rewards", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");

    await ve_underlying.approve(gauge.address, pair_1000);
    await ve_underlying.approve(bribe.address, pair_1000);
    await ve_underlying.approve(staking.address, pair_1000);

    await gauge.notifyRewardAmount(ve_underlying.address, pair_1000);
    await bribe.notifyRewardAmount(ve_underlying.address, pair_1000);//
    await staking.notifyRewardAmount(pair_1000);

    expect(await gauge.rewardRate(ve_underlying.address)).to.equal(ethers.BigNumber.from(1653));
    expect(await bribe.rewardRate(ve_underlying.address)).to.equal(ethers.BigNumber.from(1653));
    expect(await staking.rewardRate()).to.equal(ethers.BigNumber.from(1653));
  });

  it("exit & getReward gauge stake", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");
    const supply = await pair.balanceOf(owner.address);
    await pair.approve(gauge.address, supply);
    await gauge.deposit(supply, 1);//把所有的钱都存进去,并且放入tokenId 1
    await gauge.withdraw(await gauge.balanceOf(owner.address));//然后又全部取出来
    expect(await gauge.totalSupply()).to.equal(0);
    await pair.approve(gauge.address, supply);
    await gauge.deposit(pair_1000, 1);//再存入1000
    await pair.approve(staking.address, supply);
    await staking.stake(pair_1000);
  });

  it("gauge reset", async function () {
    await gauge_factory.reset(1);
  });

  it("gauge poke self", async function () {
    await gauge_factory.poke(1);
  });

  it("create lock 4", async function () {
    await ve_underlying.approve(ve.address, ethers.BigNumber.from("1000000000000000000"));
    await ve.create_lock(ethers.BigNumber.from("1000000000000000000"), 4 * 365 * 86400);
    expect(await ve.balanceOfNFT(1)).to.above(ethers.BigNumber.from("995063075414519385"));
    expect(await ve_underlying.balanceOf(ve.address)).to.be.equal(ethers.BigNumber.from("4000000000000000000"));
  });

  it("vote hacking", async function () {
    await gauge_factory.vote(1, [pair.address], [5000]);
    let usedWeights = await gauge_factory.usedWeights(1);//投票权重和balanceOfNFT的值是一样的
    console.log("usedWeights:",usedWeights);
    let balanceOfNFT = await ve.balanceOfNFT(1);
    console.log("balanceOfNFT:",balanceOfNFT);
    expect(await gauge_factory.usedWeights(1)).to.closeTo((await ve.balanceOfNFT(1)), 1000);
    expect(await bribe.balanceOf(1)).to.equal(await gauge_factory.votes(1, pair.address));
    await gauge_factory.reset(1);//取出投票
    expect(await gauge_factory.usedWeights(1)).to.below(await ve.balanceOfNFT(1));
    expect(await gauge_factory.usedWeights(1)).to.equal(0);
    expect(await bribe.balanceOf(1)).to.equal(await gauge_factory.votes(1, pair.address));
    expect(await bribe.balanceOf(1)).to.equal(0);
  });

  it("gauge poke hacking", async function () {
    expect(await gauge_factory.usedWeights(1)).to.equal(0);
    expect(await gauge_factory.votes(1, pair.address)).to.equal(0);//没有票就没投不了了
    await gauge_factory.poke(1);//即使按之前的权重也不行,之前的权重没了
    expect(await gauge_factory.usedWeights(1)).to.equal(0);
    expect(await gauge_factory.votes(1, pair.address)).to.equal(0);
  });

  it("gauge vote & bribe balanceOf", async function () {
    console.log("balance4:",await ve.balanceOfNFT(4));
    await gauge_factory.vote(1, [pair.address, pair2.address], [5000,5000]);
    await gauge_factory.vote(4, [pair.address, pair2.address], [500000,500000]);
    console.log("usedWeights1:",await gauge_factory.usedWeights(1));
    console.log("usedWeights4:",await gauge_factory.usedWeights(4));//因为上面两个的比例是一样的所以权重也一样
    expect(await gauge_factory.totalWeight()).to.not.equal(0);
    expect(await bribe.balanceOf(1)).to.not.equal(0);
  });

  it("gauge poke hacking", async function () {
    const weight_before = (await gauge_factory.usedWeights(1));
    const votes_before = (await gauge_factory.votes(1, pair.address));
    console.log("weight_before:",weight_before);
    console.log("weight_after:",await gauge_factory.usedWeights(1));
    console.log("balance_before:",await ve.balanceOfNFT(1));
    await gauge_factory.poke(1);
    console.log("votes_before:",votes_before);
    console.log("votes_after:",await gauge_factory.votes(1, pair.address))
    console.log("balance_after:",await ve.balanceOfNFT(1));
    expect(await gauge_factory.usedWeights(1)).to.be.below(weight_before);//小一点是因为又过了一个区块,剩余锁仓的权重变少了
    expect(await gauge_factory.votes(1, pair.address)).to.be.below(votes_before);
  });

  it("vote hacking break mint", async function () {
    await gauge_factory.vote(1, [pair.address], [5000]);

    expect(await gauge_factory.usedWeights(1)).to.closeTo((await ve.balanceOfNFT(1)), 1000);
    expect(await bribe.balanceOf(1)).to.equal(await gauge_factory.votes(1, pair.address));
  });

  it("gauge poke hacking", async function () {
    expect(await gauge_factory.usedWeights(1)).to.equal(await gauge_factory.votes(1, pair.address));
    await gauge_factory.poke(1);
    expect(await gauge_factory.usedWeights(1)).to.equal(await gauge_factory.votes(1, pair.address));
  });

  it("gauge distribute based on voting", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");
    await ve_underlying.approve(gauge_factory.address, pair_1000);
    await gauge_factory.notifyRewardAmount(pair_1000);//增加奖励
    await gauge_factory.updateAll();//
    await gauge_factory.distro();
  });

  it("bribe claim rewards", async function () {
    console.log("balance1:",await ve_underlying.balanceOf(owner.address))
    let reward = await bribe.getReward(1, [ve_underlying.address]);
    //console.log("reward:",reward);
    console.log("balance2:",await ve_underlying.balanceOf(owner.address))
    await network.provider.send("evm_increaseTime", [691200])
    await network.provider.send("evm_mine")
    reward = await bribe.getReward(1, [ve_underlying.address]);
    console.log("balance3:",await ve_underlying.balanceOf(owner.address))
  });

  it("BaseV1Router01 pair1 getAmountsOut & swapExactTokensForTokens", async function () {
    const ust_1 = ethers.BigNumber.from("1000000");
    const route = {from:ust.address, to:mim.address, stable:true}

    metadata = await pair.metadata()
    console.log("metadata:",metadata.dec0)
    const roots = await ethers.getContractFactory("roots");
    root = await roots.deploy(metadata.dec0, metadata.dec1, metadata.st, metadata.t0, metadata.t1);
    await root.deployed();

    const before = await mim.balanceOf(owner.address);
    const expected_output_pair = await pair.getAmountOut(ust_1, ust.address);
    const expected_output = await router.getAmountsOut(ust_1, [route]);
    await ust.approve(router.address, ust_1);
    await router.swapExactTokensForTokens(ust_1, expected_output[1], [route], owner.address, Date.now());
    const fees = await pair.fees()
    console.log("fees:",fees)
  });

  it("BaseV1Router01 pair2 getAmountsOut & swapExactTokensForTokens", async function () {
    const ust_1 = ethers.BigNumber.from("1000000");
    const route = {from:ust.address, to:mim.address, stable:false}

    const before = await mim.balanceOf(owner.address);
    const expected_output_pair = await pair.getAmountOut(ust_1, ust.address);
    const expected_output = await router.getAmountsOut(ust_1, [route]);
    await ust.approve(router.address, ust_1);
    await router.swapExactTokensForTokens(ust_1, expected_output[1], [route], owner.address, Date.now());
    const fees = await pair2.fees()
    console.log("pair2 fees:",fees)
  });

  it("BaseV1Router01 pair1 getAmountsOut & swapExactTokensForTokens", async function () {
    const mim_1 = ethers.BigNumber.from("1000000000000000000");
    const route = {from:mim.address, to:ust.address, stable:true}

    const before = await ust.balanceOf(owner.address);
    const expected_output_pair = await pair.getAmountOut(mim_1, mim.address);
    const expected_output = await router.getAmountsOut(mim_1, [route]);
    await mim.approve(router.address, mim_1);
    await router.swapExactTokensForTokens(mim_1, expected_output[1], [route], owner.address, Date.now());
    const fees = await pair.fees()//fees地址
  });

  it("BaseV1Router01 pair2 getAmountsOut & swapExactTokensForTokens", async function () {
    const mim_1 = ethers.BigNumber.from("1000000000000000000");
    const route = {from:mim.address, to:ust.address, stable:false}

    const before = await ust.balanceOf(owner.address);
    const expected_output = await router.getAmountsOut(mim_1, [route]);
    await mim.approve(router.address, mim_1);
    await router.swapExactTokensForTokens(mim_1, expected_output[1], [route], owner.address, Date.now());
  });

  it("BaseV1Router01 pair1>pair2 getAmountsOut & swapExactTokensForTokens", async function () {
    const mim_1 = ethers.BigNumber.from("1000000000000000000");
    const route = [{from:mim.address, to:ust.address, stable:false},{from:ust.address, to:mim.address, stable:true}]

    const before = (await mim.balanceOf(owner.address)).sub(mim_1);

    const expected_output = await router.getAmountsOut(mim_1, route);
    console.log(expected_output);
    await mim.approve(router.address, mim_1);
    await router.swapExactTokensForTokens(mim_1, expected_output[2], route, owner.address, Date.now());
    const after = await mim.balanceOf(owner.address);
    expect(after.sub(before)).to.equal(expected_output[2])
  });

  it("distribute and claim fees", async function () {

    await network.provider.send("evm_increaseTime", [691200])
    await network.provider.send("evm_mine")
    await bribe.getReward(1, [mim.address, ust.address]);

    await gauge_factory.distributeFees([gauge.address]);
  });

  it("staking rewards sense check", async function () {
    expect(await gauge.rewardRate(ve_underlying.address)).to.be.equal(await staking.rewardRate());
  });

  it("minter mint", async function () {
    console.log("before update:",await ve_dist.last_token_time());
    console.log("before update:",await ve_dist.timestamp());
    console.log("before update,ve_dist balance:",await ve_underlying.balanceOf(ve_dist.address));
    console.log("before update,ve_dist claimable:",await ve_dist.claimable(1));
    await minter.initialize([owner.address],[ethers.BigNumber.from("1000000000000000000")], ethers.BigNumber.from("1000000000000000000"));
    await minter.update_period();//每新每周奖励,发到ve_dist中
    await gauge_factory.updateGauge(gauge.address);//更新奖池可提现收益
    console.log("after update,ve_dist balance:",await ve_underlying.balanceOf(ve_dist.address));
    console.log("after update,ve_dist claimable:",await ve_dist.claimable(1));
    const claimable = await gauge_factory.claimable(gauge.address);
    await ve_underlying.approve(staking.address, claimable);
    await staking.notifyRewardAmount(claimable);
    await gauge_factory.distro();
    await network.provider.send("evm_increaseTime", [1800])
    await network.provider.send("evm_mine")
    expect(await gauge.rewardRate(ve_underlying.address)).to.be.equal(await staking.rewardRate());
  });

  it("gauge claim rewards", async function () {
    expect(owner.address).to.equal(await ve.ownerOf(1));
    expect(await ve.isApprovedOrOwner(owner.address, 1)).to.equal(true);
    let balance = await gauge.balanceOf(owner.address);
    console.log("balance:",balance);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await staking.withdraw(await staking._balances(owner.address));
    const pair_1000 = ethers.BigNumber.from("1000000000");
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 0);//存入1000的lp
    await staking.getReward();
    let before = await ve_underlying.balanceOf(owner.address)
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    console.log("start cal");
    let earned = await gauge.earned(ve_underlying.address, owner.address);
    console.log("earned:",earned/unit);
    earned = await gauge.earned(ve_underlying.address, owner.address);
    console.log("earned:",earned/unit);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    let after = await ve_underlying.balanceOf(owner.address)
    let received = after.sub(before);
    console.log("received:",received/unit);//实际得到的小于计算的earned
    expect(received).to.be.below(earned)

    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    before = after
    after = await ve_underlying.balanceOf(owner.address)
    received = after.sub(before);
    console.log("after deposit 1,received:",received/unit);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 0);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    before = after
    after = await ve_underlying.balanceOf(owner.address)
    received = after.sub(before);
    console.log("after deposit 0,received:",received/unit);

    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);

    before = after
    after = await ve_underlying.balanceOf(owner.address)
    received = after.sub(before);
    console.log("after deposit 1.1,received:",received/unit);

    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 0);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    before = after
    after = await ve_underlying.balanceOf(owner.address)
    received = after.sub(before);
    console.log("after deposit 0.1,received:",received/unit);

    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    before = after
    after = await ve_underlying.balanceOf(owner.address)
    received = after.sub(before);
    console.log("after deposit 1.2,received:",received/unit);

    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 0);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    before = after
    after = await ve_underlying.balanceOf(owner.address)
    received = after.sub(before);
    console.log("after deposit 0.2,received:",received/unit);

    await network.provider.send("evm_increaseTime", [604800])
    await network.provider.send("evm_mine")
    await gauge.getReward(owner.address, [ve_underlying.address]);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
  });

  it("gauge claim rewards (after expiry)", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 1);
    await gauge.getReward(owner.address, [ve_underlying.address]);
    await network.provider.send("evm_increaseTime", [604800])
    await network.provider.send("evm_mine")
    let before = await ve_underlying.balanceOf(owner.address)
    await gauge.getReward(owner.address, [ve_underlying.address]);
    after = await ve_underlying.balanceOf(owner.address)
    received = after.sub(before);
    console.log("after deposit 1.3,received:",received/unit);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
  });

  it("ve decay", async function () {
    await gauge_factory.claimBribes([bribe.address], [[dai.address]], 1);
    await gauge_factory.claimFees([bribe.address], [[dai.address]], 1);
    const supply = await ve.totalSupply();
    expect(supply).to.be.above(0);
    await network.provider.send("evm_increaseTime", [4*365*86400])
    await network.provider.send("evm_mine")
    expect(await ve.balanceOfNFT(1)).to.be.equal(0);
    expect(await ve.totalSupply()).to.be.equal(0);
    await gauge_factory.reset(1);
    console.log("balance:",await ve_underlying.balanceOf(owner.address));
    await ve.withdraw(1);
    console.log("after withdraw balance:",await ve_underlying.balanceOf(owner.address));
  });

  it("BaseV1Router01 addLiquidity owner3", async function () {
    const ust_1000 = ethers.BigNumber.from("1000000000000");
    const mim_1000 = ethers.BigNumber.from("1000000000000000000000000");
    const mim_100000000 = ethers.BigNumber.from("100000000000000000000000000");
    const dai_100000000 = ethers.BigNumber.from("100000000000000000000000000");
    const expected_2000 = ethers.BigNumber.from("2000000000000");
    await ust.connect(owner3).approve(router.address, ust_1000);
    await mim.connect(owner3).approve(router.address, mim_1000);
    await router.connect(owner3).addLiquidity(mim.address, ust.address, true, mim_1000, ust_1000, 0, 0, owner3.address, Date.now());
  });

  it("deploy BaseV1Factory gauge owner3", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");
    const pair_2000 = ethers.BigNumber.from("2000000000");

    await pair.connect(owner3).approve(gauge.address, pair_1000);
    await gauge.connect(owner3).deposit(pair_1000, 0);//owner3先存入1000lp
  });

  it("gauge claim rewards owner3", async function () {
    await gauge.connect(owner3).withdraw(await gauge.balanceOf(owner3.address));//再取出来
    const pair_1000 = ethers.BigNumber.from("1000000000");
    await pair.connect(owner3).approve(gauge.address, pair_1000);
    await gauge.connect(owner3).deposit(pair_1000, 0);//再存进去1000
    const before = await ve_underlying.balanceOf(owner3.address)
    console.log("before:",before/unit);
    await gauge.connect(owner3).withdraw(await gauge.balanceOf(owner3.address));//取出
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    await pair.connect(owner3).approve(gauge.address, pair_1000);
    await gauge.connect(owner3).deposit(pair_1000, 0);//存入
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    await gauge.batchRewardPerToken(ve_underlying.address, 200);
    const earned = await gauge.earned(ve_underlying.address, owner3.address);
    await gauge.connect(owner3).getReward(owner3.address, [ve_underlying.address]);
    await gauge.connect(owner3).withdraw(await gauge.balanceOf(owner3.address));
    await pair.connect(owner3).approve(gauge.address, pair_1000);
    await gauge.connect(owner3).deposit(pair_1000, 0);
    await gauge.connect(owner3).getReward(owner3.address, [ve_underlying.address]);
    await gauge.connect(owner3).withdraw(await gauge.balanceOf(owner3.address));
    await pair.connect(owner3).approve(gauge.address, pair_1000);
    await gauge.connect(owner3).deposit(pair_1000, 0);
    await gauge.connect(owner3).getReward(owner3.address, [ve_underlying.address]);
    await gauge.connect(owner3).getReward(owner3.address, [ve_underlying.address]);
    await gauge.connect(owner3).getReward(owner3.address, [ve_underlying.address]);
    await gauge.connect(owner3).getReward(owner3.address, [ve_underlying.address]);
    const after = await ve_underlying.balanceOf(owner3.address)
    const received = after.sub(before);
    console.log("received:",received/unit);
    await gauge.connect(owner3).withdraw(await gauge.balanceOf(owner.address));
    await pair.connect(owner3).approve(gauge.address, pair_1000);
    await gauge.connect(owner3).deposit(pair_1000, 0);
    await gauge.connect(owner3).getReward(owner3.address, [ve_underlying.address]);
  });

  it("minter mint", async function () {
    await network.provider.send("evm_increaseTime", [86400 * 7 * 2])
    await network.provider.send("evm_mine")
    await minter.update_period();//先更新一周奖励
    await gauge_factory.updateGauge(gauge.address);//奖池更新
    const claimable = await gauge_factory.claimable(gauge.address);
    console.log("claimable:",claimable/unit)
    await ve_underlying.approve(staking.address, claimable);
    await staking.notifyRewardAmount(claimable);
    await gauge_factory.updateFor([gauge.address]);
    await gauge_factory.distro();
    await gauge_factory.claimRewards([gauge.address], [[ve_underlying.address]]);
    expect(await gauge.rewardRate(ve_underlying.address)).to.be.equal(await staking.rewardRate());
    console.log("rewardPerTokenStored:",await gauge.rewardPerTokenStored(ve_underlying.address)/unit)
  });

  it("gauge claim rewards owner3 next cycle", async function () {
    await gauge.connect(owner3).withdraw(await gauge.balanceOf(owner3.address));
    const pair_1000 = ethers.BigNumber.from("1000000000");
    console.log(await gauge.rewardPerTokenStored(ve_underlying.address))
    await pair.connect(owner3).approve(gauge.address, pair_1000);
    await gauge.connect(owner3).deposit(pair_1000, 0);
    const before = await ve_underlying.balanceOf(owner3.address)
    const earned = await gauge.earned(ve_underlying.address, owner3.address);
    await gauge.connect(owner3).getReward(owner3.address, [ve_underlying.address]);
    const after = await ve_underlying.balanceOf(owner3.address)
    const received = after.sub(before);
    expect(received).to.be.above(0)
    console.log(await gauge.rewardPerTokenStored(ve_underlying.address))

    await gauge.connect(owner3).withdraw(await gauge.balanceOf(owner.address));
    await pair.connect(owner3).approve(gauge.address, pair_1000);
    await gauge.connect(owner3).deposit(pair_1000, 0);
    await gauge.connect(owner3).getReward(owner3.address, [ve_underlying.address]);
  });

  it("gauge claim rewards", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 0);
    await late_reward.approve(gauge.address, late_reward.balanceOf(owner.address));//新的奖励币
    await gauge.notifyRewardAmount(late_reward.address, late_reward.balanceOf(owner.address));

    await network.provider.send("evm_increaseTime", [604800])
    await network.provider.send("evm_mine")
    const reward1 = (await gauge.earned(late_reward.address, owner.address));
    const reward3 = (await gauge.earned(late_reward.address, owner3.address));
    console.log("reward1:",reward1/unit);
    console.log("reward3:",reward3/unit);
    expect(reward1.add(reward3)).to.closeTo(ethers.BigNumber.from("20000000000000000000000000"), 100000);
    await gauge.getReward(owner.address, [late_reward.address]);
    await gauge.connect(owner2).getReward(owner2.address, [late_reward.address]);
    console.log("before:",await late_reward.balanceOf(owner3.address));
    await gauge.connect(owner3).getReward(owner3.address, [late_reward.address]);
    console.log("after:",await late_reward.balanceOf(owner3.address));
    await gauge.withdraw(await gauge.balanceOf(owner.address));
  });

  it("gauge claim rewards", async function () {
    const pair_1000 = ethers.BigNumber.from("1000000000");
    await pair.approve(gauge.address, pair_1000);
    await gauge.deposit(pair_1000, 0);
    await ve_underlying.approve(gauge.address, ve_underlying.balanceOf(owner.address));
    await gauge.notifyRewardAmount(ve_underlying.address, ve_underlying.balanceOf(owner.address));

    await network.provider.send("evm_increaseTime", [604800])
    await network.provider.send("evm_mine")
    await gauge.getReward(owner.address, [ve_underlying.address]);
    await gauge.withdraw(await gauge.balanceOf(owner.address));
  });

});
