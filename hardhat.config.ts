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
    polygon: {
      url: 'https://rpc-mainnet.maticvigil.com/',
      accounts: [process.env.PRIVATE_KEY as string],
      // allowUnlimitedContractSize: true,
    },

    amoy: {
      url: 'https://rpc-amoy.polygon.technology/',
      accounts: [process.env.PRIVATE_KEY as string],
      // gasPrice: 1e5,
      // gas: 1e5
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
    customChains: [
      {
        network: 'amoy',
        chainId: 80002,
        urls: {
          apiURL: 'https://api-amoy.polygonscan.com/api',
          browserURL: 'https://amoy.polygonscan.com',
        },
      },
    ],
  },
};

export default config;
