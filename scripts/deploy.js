async function main() {
  const GasLimit = 10500000;
  const Token = await ethers.getContractFactory("BaseV1");
  const Gauges = await ethers.getContractFactory("BaseV1GaugeFactory");
  const Bribes = await ethers.getContractFactory("BaseV1BribeFactory");
  const Core = await ethers.getContractFactory("BaseV1Factory");
  const Factory = await ethers.getContractFactory("BaseV1Router01");
  const Ve = await ethers.getContractFactory("contracts/ve.sol:ve");
  const Ve_dist = await ethers.getContractFactory("contracts/ve_dist.sol:ve_dist");
  const BaseV1Voter = await ethers.getContractFactory("BaseV1Voter");
  const BaseV1Minter = await ethers.getContractFactory("BaseV1Minter");
  const dddx_library = await ethers.getContractFactory("dddx_library");

  const wftmAddr = "0xd8Beb25CAeb2E4c537857E015921e41afd7f2C7b"
  const token = await Token.deploy();
  console.log("BaseV1 address:",token.address)
  const gauges = await Gauges.deploy();
  console.log("BaseV1GaugeFactory address:",gauges.address)
  const bribes = await Bribes.deploy();
  console.log("BaseV1BribeFactory address:",bribes.address)
  const core = await Core.deploy();
  console.log("BaseV1Factory address:",core.address)
  const factory = await Factory.deploy(core.address, wftmAddr,{gasLimit:GasLimit});
  console.log("BaseV1Router01 address:",factory.address)
  const lib = await dddx_library.deploy(factory.address,{gasLimit:GasLimit})
  console.log("lib:",lib.address);
  const ve = await Ve.deploy(token.address,{gasLimit:GasLimit});
  console.log("contracts/ve.sol:ve address:",ve.address)
  const ve_dist = await Ve_dist.deploy(ve.address,{gasLimit:GasLimit});
  console.log("contracts/ve_dist.sol:ve_dist address:",ve_dist.address)
  const voter = await BaseV1Voter.deploy(ve.address, core.address, gauges.address, bribes.address,{gasLimit:GasLimit});
  console.log("BaseV1Voter address:",voter.address)
  const minter = await BaseV1Minter.deploy(voter.address, ve.address, ve_dist.address,{gasLimit:GasLimit});
  console.log("BaseV1Minter address:",minter.address)

  const setMinter = await token.setMinter(minter.address);
  console.log("setMinter:",setMinter.hash)
  const setVoter = await ve.setVoter(voter.address);
  console.log("setVoter:",setVoter.hash)
  const ve_distResult = await ve_dist.setDepositor(minter.address);
  console.log("ve_distResult:",ve_distResult.hash)
  const initResult = await voter.initialize([
    "0xd8Beb25CAeb2E4c537857E015921e41afd7f2C7b",
    "0x39021459f4E229F102B097Dc508a680400Af14EA",//USD Coin (USDC) 6
    "0xEd3d9618A850C87D3C22658469357130200e1bb8",//Bitcoin (BTC) 8
    "0xbe1057099d72DEA40b2ed2Ab16e6B567B36F74c4",//Dai Stablecoin (DAI) 18
    "0xa838762223280019Ffbce09c33e1244516e4D285",//Magic Internet Money (MIM) 18
    "0x49FeCF7ec4787039ff89Ec22cBC0B31efaeB00B5",//Frax (FRAX) 18
    "0x5eAC8924030EC8eac7Fa420BDB0A04079A118245",//Curve DAO (CRV) 18
    "0x1d1D7C7ADc244028c94eF9d43267026EBaDFD589",//yearn.finance (YFI) 18
    "0x81b1589E50DcC5e321B4e774C08100e904D58C9E",//Sushi (SUSHI) 18
    "0x16237b7cB4c9c26D5B9455D21FaB52Bb288cAad0",//Frax Share (FXS) 18
    "0x1269E1F8f9190ca17778cC4FF9Acf9B6a8B83eEF",//Spell Token (SPELL) 18
    "0xCaf5394258290268Cbd9047bb68c6165877bb887",//Synapse (SYN) 18
    "0x5118df881D8bd60A5B2434AA6413c160744CB541",//TSHARE (TSHARE) 18
    "0x150277847A359F2c865e4bcd321D634a4B19dd1b",//TOMB (TOMB) 18
    "0x2C23281e674B4907F09A91303aF25A3a7d17Af7c",//Keep3r (KP3R) 18
    "0xC3A263D2bdC6b3e24410bc1A38d91B31302F1c6d",//SpookyToken (BOO) 18
    "0x95115BeCe73A047B567104C473d78d0011cc3053",//Hector (HEC) 9
    "0x5b798F01518fD182A4Dc6CFFeC9BAeEbe2C342A3",//AlpacaToken (ALPACA) 18
    "0x8c2e337f4d4e1C1aff0E48101D773A4B2A3E5DA6",//Geist.Finance Protocol Token (GEIST) 18
    "0x09Aed1BB0C3635B16C7C1BD7b9D70b5A5D72834d",//SpiritSwap Token (SPIRIT) 18
    "0x4E1E9379ab18Af96045fC44478365e5C098AA2c2",//Liquid Driver (LQDR) 18
    "0x48e44B093D46aF9D26a843582BAC7771fC0b4C6A",//Scream (SCREAM) 18
    "0xE5D864b7297083A554d745Fa7175d15eEE5De5Ee",//PaintSwap Token (BRUSH) 18
    "0x0d9D9FA340AeB3c6e159d58Cea3195b26dA4C586",//Ethereum (ETH) 18
    "0x07A10226b1a7586C53a183C424f415DAcD4B4555",//IceToken (ICE) 18
    "0xD0474E681eFDaB2C7B6F156a331FD4801c6393E2",//TrueUSD (TUSD) 18
    "0x05aF9eE4e106A75ca948c59E45e93c72F2A83143",//IronBank (IB) 18
    "0x440B158Add4fb0d53Bc5218455984fCc051f2f44",//Tarot (TAROT) 18
    "0xd02c98EBdcDE6b62179b045C424c7Ba41a9dE9Ce"], //Hundred Finance (HND) 18
    minter.address);
  console.log("initResult:",initResult.hash);  
  const minterInitResult = await minter.initialize([
    "0xcf53F2b8e93E18A9B36A73d43A928a74a50A85B1",
    "0x07e2aA78C573f7e3C15be6432B0e0911c95Deff6",
    "0x58385B9DfBd691A3da4714548985532E6E4B8693",
    "0xa98bd624ad6d3803e957BBd037179B25F8f6d9F9",
    "0x5D552370B5c3Ab997053650ee4C245F8cfB963d1",
    "0x7E38C900A8C2384631fd37F0B7850b9a9DEd0b37",
    "0xF1Aec57C340685A8BD5D170fE3F2aa4612dC5ee1",
    "0x92cD21505ce5918971A5e3Fe3Eb6A5D8872904c6",
    "0x125D11c7f974a3629546Ce53800AF5742965BCC7",
    "0x6782d3286d5c91FE3b4F05B373aD0c470e40f0e7",
    "0x365dbF346217d412a95Df2d217e990114EA25aAf",
    "0x74fc865cf756897990ed9E26434dD0a4dA38fc7d",
    "0x5ee637d6E3b18bBB93c54048D9ECb0e1B545FEe6",
    "0xaD2c94f707f48959BA30aEe7683cEd0c12803EA6",
    "0xAC9c254C9FF8A8e84652638DAE8eAA45B00e911c",
    "0x22C057b044BFb78FD628E61c548E321309dC3Ede",
    "0x7BAbcB0e3b28FDc94c92d88BF8f0d9dfE19B15fB",
    "0xf32eDF1f1173Cb211Ec98b1C7F8E012f5037Ba6f",
    "0x0b2255F20CdC0AD19E1dd08e16037bd7594b4dE2",
    "0x52ef1d2dc61504e8A1Ade271e44FE6B3e5E4408c",
    "0xA8f528E9662f54D7c041C027C3183817A3cea57e",
    "0x0814987a361eccC59Ac27C12c04f663fBF3d1E2d",
    "0x5325ee9B5a038326B86715C5d665bA56b27c2925",
    "0xB272C355587AF0e3794A64daE7B55606fbc7051c",
    "0xb1ED58ab24F3d1350634E6A200DBBED3c54247b6"], 
    [
      ethers.BigNumber.from("800000000000000000000000"),
      ethers.BigNumber.from("2376588000000000000000000"),
      ethers.BigNumber.from("1331994000000000000000000"),
      ethers.BigNumber.from("1118072000000000000000000"),
      ethers.BigNumber.from("1070472000000000000000000"),
      ethers.BigNumber.from("1023840000000000000000000"),
      ethers.BigNumber.from("864361000000000000000000"),
      ethers.BigNumber.from("812928000000000000000000"),
      ethers.BigNumber.from("795726000000000000000000"),
      ethers.BigNumber.from("763362000000000000000000"),
      ethers.BigNumber.from("727329000000000000000000"),
      ethers.BigNumber.from("688233000000000000000000"),
      ethers.BigNumber.from("681101000000000000000000"),
      ethers.BigNumber.from("677507000000000000000000"),
      ethers.BigNumber.from("676304000000000000000000"),
      ethers.BigNumber.from("642992000000000000000000"),
      ethers.BigNumber.from("609195000000000000000000"),
      ethers.BigNumber.from("598412000000000000000000"),
      ethers.BigNumber.from("591573000000000000000000"),
      ethers.BigNumber.from("587431000000000000000000"),
      ethers.BigNumber.from("542785000000000000000000"),
      ethers.BigNumber.from("536754000000000000000000"),
      ethers.BigNumber.from("518240000000000000000000"),
      ethers.BigNumber.from("511920000000000000000000"),
      ethers.BigNumber.from("452870000000000000000000")],
      ethers.BigNumber.from("100000000000000000000000000"),{gasLimit:GasLimit});//100000000
      console.log("minter initResult:",minterInitResult.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
