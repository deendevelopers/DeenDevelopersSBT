require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require("hardhat-gas-reporter");

module.exports = {
  solidity: "0.8.10",
  gasReporter: {
    currency: 'ETH',
    enabled: (process.env.REPORT_GAS) ? true : false
  },
  networks: {
    ropsten: {
      url: `asdf${process.env.API_KEY}`,
      accounts: [process.env.PRI_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
