require("@nomiclabs/hardhat-waffle");
require("@float-capital/solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
    },
    ftmtest: {
      url: "https://rpc.testnet.fantom.network/",
    },
    evmos_test: {
      accounts: ["c0b61d8d53447f54341461f33e67b2aa0d347b96c2f18f525d9b9a8d8b014a63"],
      chainId: 9000,
      gas: 3500000,
      gasPrice: "auto",
      url: "https://eth.bd.evmos.dev:8545",
    }
  },
};
