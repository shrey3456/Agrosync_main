require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Hedera Testnet configuration
    testnet: {
      url: "https://testnet.hashio.io/api/v1/rpc",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 296,
      timeout: 600000, // 10 minutes
      gasPrice: 500000000000,
      // Add retry configuration
      retry: {
        retries: 5,
        delay: 2000
      },
      // Add HTTP headers
      httpHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    },
    // Local testing configuration
    hardhat: {
      chainId: 296,
      accounts: {
        count: 10,
        initialBalance: "10000000000000000000" // 10 HBAR in wei
      }
    }
  },
  // Add mocha settings for longer test timeouts
  mocha: {
    timeout: 600000 // 10 minutes
  }
};
