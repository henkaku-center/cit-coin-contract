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
  networks: {
    optimism: {
      url: 'https://mainnet.optimism.io', // Optimism mainnet RPC URL
      accounts: [process.env.PRIVATE_KEY || ''],
    },
    optimismSepolia: {
      url: 'https://sepolia.optimism.io', // Optimism Sepolia testnet RPC URL
      accounts: [process.env.PRIVATE_KEY || ''],
      chainId: 11155420,
    },
  },
  etherscan: {
    apiKey: process.env.OPTIMISM_ETHERSCAN_API_KEY || '',
    customChains: [
      {
        chainId: 11155420,
        network: 'optimismSepolia',
        urls: {
          apiURL: 'https://api-sepolia-optimistic.etherscan.io/api',
          browserURL: 'https://sepolia-optimistic.etherscan.io',
        },
      },
    ],
  },
};

export default config;
