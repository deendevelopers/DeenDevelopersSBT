require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require("hardhat-gas-reporter");
require('hardhat-watcher');
require('dotenv').config()

module.exports = {
  solidity: "0.8.10",
  gasReporter: {
    currency: 'ETH',
    enabled: (process.env.REPORT_GAS) ? true : false
  },
  networks: {
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.MUMBAI_ALCH_API_KEY}`,
      accounts: [`${process.env.ETH_ACC_PRIV_KEY}`]
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.RINKEBY_ALCH_API_KEY}`,
      accounts: [`${process.env.ETH_ACC_PRIV_KEY}`]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter: {
    enabled: true,
    token: "MATIC",
    currency: "USD",
    gasPrice: 80,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    // outputFile: "gas-report.txt",
    // noColors: true
  },
  watcher: {
    test: {
      tasks: [
        { command: 'test', params: { noCompile: true, testFiles: ['tests/DeenDevelopersSBT.test.js'] } },
      ],
      files: ['tests/DeenDevelopersSBT.test.js']
    },
  },
};
