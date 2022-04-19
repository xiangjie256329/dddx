const { ethers } = require("hardhat");

async function main() {
    const Erc20Token = await ethers.getContractFactory("Token");
    let owner = "0xcf53F2b8e93E18A9B36A73d43A928a74a50A85B1"
    let receiver = "0x07e2aA78C573f7e3C15be6432B0e0911c95Deff6"
    // let token = await Erc20Token.deploy('USD Coin', 'USDC', 6, owner);
    // await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    let token = await Erc20Token.deploy('Bitcoin', 'BTC', 8, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Dai Stablecoin', 'DAI', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Magic Internet Money', 'MIM', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Frax', 'FRAX', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Curve DAO', 'CRV', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('yearn.finance', 'YFI', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Sushi', 'SUSHI', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Frax Share', 'FXS', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Spell Token', 'SPELL', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Synapse', 'SYN', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('TSHARE', 'TSHARE', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('TOMB', 'TOMB', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Keep3r', 'KP3R', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('SpookyToken', 'BOO', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Hector', 'HEC', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('AlpacaToken', 'ALPACA', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Geist.Finance Protocol Token', 'GEIST', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('SpiritSwap Token', 'SPIRIT', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Liquid Driver', 'LQDR', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Scream', 'SCREAM', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('PaintSwap Token', 'BRUSH', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Ethereum', 'ETH', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('IceToken', 'ICE', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('TrueUSD', 'TUSD', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('IronBank', 'IB', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Tarot', 'TAROT', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
    token = await Erc20Token.deploy('Hundred Finance', 'HND', 18, owner);
    await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
    console.log("token address:",token.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });