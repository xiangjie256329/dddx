async function main() {
  const Token = await ethers.getContractFactory("BaseV1");
  const Gauges = await ethers.getContractFactory("BaseV1GaugeFactory");
  const Bribes = await ethers.getContractFactory("BaseV1BribeFactory");
  const Core = await ethers.getContractFactory("BaseV1Factory");
  const Factory = await ethers.getContractFactory("BaseV1Router01");
  const Ve = await ethers.getContractFactory("contracts/ve.sol:ve");
  const Ve_dist = await ethers.getContractFactory("contracts/ve_dist.sol:ve_dist");
  const BaseV1Voter = await ethers.getContractFactory("BaseV1Voter");
  const BaseV1Minter = await ethers.getContractFactory("BaseV1Minter");

  const wftmAddr = "0xd8Beb25CAeb2E4c537857E015921e41afd7f2C7b"

  const token = await Token.deploy();
  console.log("BaseV1 address:",token.address)
  const gauges = await Gauges.deploy();
  console.log("BaseV1GaugeFactory address:",gauges.address)
  const bribes = await Bribes.deploy();
  console.log("BaseV1BribeFactory address:",bribes.address)
  const core = await Core.deploy();
  console.log("BaseV1Factory address:",core.address)
  const factory = await Factory.deploy(core.address, wftmAddr);
  console.log("BaseV1Router01 address:",factory.address)
  const ve = await Ve.deploy(token.address);
  console.log("contracts/ve.sol:ve address:",ve.address)
  const ve_dist = await Ve_dist.deploy(ve.address);
  console.log("contracts/ve_dist.sol:ve_dist address:",ve_dist.address)
  const voter = await BaseV1Voter.deploy(ve.address, core.address, gauges.address, bribes.address);
  console.log("BaseV1Voter address:",voter.address)
  const minter = await BaseV1Minter.deploy(voter.address, ve.address, ve_dist.address);
  console.log("BaseV1Minter address:",minter.address)

  await token.setMinter(minter.address);
  await ve.setVoter(voter.address);
  await ve_dist.setDepositor(minter.address);
  await voter.initialize([
    wftmAddr, //
    "0x04068da6c83afcfa0e13ba15a6696662335d5b75",//USD Coin (USDC) 6
    "0x321162Cd933E2Be498Cd2267a90534A804051b11",//Bitcoin (BTC) 8
    "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e",//Dai Stablecoin (DAI) 18
    "0x82f0b8b456c1a451378467398982d4834b6829c1",//Magic Internet Money (MIM) 18
    "0xdc301622e621166bd8e82f2ca0a26c13ad0be355",//Frax (FRAX) 18
    "0x1E4F97b9f9F913c46F1632781732927B9019C68b",//Curve DAO (CRV) 18
    "0x29b0Da86e484E1C0029B56e817912d778aC0EC69",//yearn.finance (YFI) 18
    "0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC",//Sushi (SUSHI) 18
    "0x7d016eec9c25232b01f23ef992d98ca97fc2af5a",//Frax Share (FXS) 18
    "0x468003b688943977e6130f4f68f23aad939a1040",//Spell Token (SPELL) 18
    "0xe55e19fb4f2d85af758950957714292dac1e25b2",//Synapse (SYN) 18
    "0x4cdf39285d7ca8eb3f090fda0c069ba5f4145b37",//TSHARE (TSHARE) 18
    "0x6c021ae822bea943b2e66552bde1d2696a53fbb7",//TOMB (TOMB) 18
    "0x2a5062d22adcfaafbd5c541d4da82e4b450d4212",//Keep3r (KP3R) 18
    "0x841fad6eae12c286d1fd18d1d525dffa75c7effe",//SpookyToken (BOO) 18
    "0x5C4FDfc5233f935f20D2aDbA572F770c2E377Ab0",//Hector (HEC) 9
    "0xad996a45fd2373ed0b10efa4a8ecb9de445a4302",//AlpacaToken (ALPACA) 18
    "0xd8321aa83fb0a4ecd6348d4577431310a6e0814d",//Geist.Finance Protocol Token (GEIST) 18
    "0x5cc61a78f164885776aa610fb0fe1257df78e59b",//SpiritSwap Token (SPIRIT) 18
    "0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9",//Liquid Driver (LQDR) 18
    "0xe0654C8e6fd4D733349ac7E09f6f23DA256bF475",//Scream (SCREAM) 18
    "0x85dec8c4b2680793661bca91a8f129607571863d",//PaintSwap Token (BRUSH) 18
    "0x74b23882a30290451A17c44f4F05243b6b58C76d",//Ethereum (ETH) 18
    "0xf16e81dce15b08f326220742020379b855b87df9",//IceToken (ICE) 18
    "0x9879abdea01a879644185341f7af7d8343556b7a",//TrueUSD (TUSD) 18
    "0x00a35FD824c717879BF370E70AC6868b95870Dfb",//IronBank (IB) 18
    "0xc5e2b037d30a390e62180970b3aa4e91868764cd",//Tarot (TAROT) 18
    "0x10010078a54396F62c96dF8532dc2B4847d47ED3"], //Hundred Finance (HND) 18
    minter.address);
  await minter.initialize([
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
      ethers.BigNumber.from("100000000000000000000000000"));//100000000

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
