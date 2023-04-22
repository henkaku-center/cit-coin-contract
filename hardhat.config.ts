import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // defaultNetwork: (process.env.NETWORK as string) || 'polygon_mumbai',
  networks: {
    // polygon: {},
    // ganache: {
    //   url: 'http://127.0.0.1:7545',
    //   chainId: 1337,
    //   accounts: [process.env.PRIVATE_KEY as string],
    // },

    polygon: {
      url: 'https://rpc-mainnet.maticvigil.com/',
      accounts: [process.env.PRIVATE_KEY as string],
    },

    polygon_mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [process.env.PRIVATE_KEY as string],
      // gasPrice: 1e5,
      // gas: 1e5
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
};

export default config;
