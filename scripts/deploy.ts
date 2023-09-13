import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import readline from 'readline';
import { Contract } from 'ethers';

dotenv.config();

interface ContractConfig {
  name: string;
  ownable: boolean;
  args: string[];
  postDeploy?: Function;
}

const contractConfigs: ContractConfig[] = [
  {
    name: 'CitCoin',
    ownable: true,
    args: [],
  },
  {
    name: 'CitNFT',
    ownable: true,
    args: [
      process.env.REGISTRY_ADDRESS as string,
      process.env.CJPY_ADDRESS as string,
    ],
  },
  {
    name: 'CJPY',
    ownable: false,
    args: [process.env.REGISTRY_ADDRESS as string],
  },
  {
    name: 'Faucet',
    ownable: true,
    args: [process.env.REGISTRY_ADDRESS as string, process.env.FUND_ADDRESS as string],
  },
  {
    name: 'LearnToEarn',
    ownable: true,
    args: [
      process.env.REGISTRY_ADDRESS as string,
      process.env.CJPY_ADDRESS as string,
      process.env.GNOSIS_OWNER as string,
    ],
  },
  {
    name: 'Registry',
    ownable: false,
    args: [],
    postDeploy: async (registry: Contract) => {
      await registry.bulkAddToWhitelist([
        process.env.GNOSIS_OWNER as string,
        '0x0000000000000000000000000000000000000000',
      ]);
    },
  },
];

async function main() {
  console.log(
    `Please select one of the contracts below:\n\n${contractConfigs
      .map((item, idx) => `${idx}. ${item.name}`)
      .join('\n')}`,
  );

  let prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  prompt.question(`\nSelect The Contract to deploy [Eg: 1]:\t`, async (index: string) => {
    console.log(index);
    // @ts-ignore
    let config: ContractConfig = contractConfigs[parseInt(index)];

    if (config === undefined) {
      console.log('No valid contracts selected !!\n');
      process.exit(1);
    }

    const contractFactory = await ethers.getContractFactory(config.name);
    console.log('Deploying Contract with the following configuration:');
    console.log(config);

    const contract = await contractFactory.deploy(...config.args);

    await contract.deployed();
    console.log('='.repeat(70));
    console.log('  Contract Address: ', contract.address);
    console.log('='.repeat(70));

    // transfer ownership of the contract if the contract is ownable
    if (config.ownable) {
      await contract.transferOwnership(process.env.GNOSIS_OWNER as string);
    }
    await config.postDeploy?.(contract);

    prompt.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
