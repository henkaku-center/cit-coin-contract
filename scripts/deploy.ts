import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import readline from 'readline';
import { Contract } from 'ethers';

dotenv.config();

interface ContractOption {
  name: string;
  ownable: boolean;
  args: string[];
  postDeploy?: Function;
}

const contractConfig: ContractOption[] = [
  {
    name: 'CitCoin',
    ownable: true,
    args: [process.env.REGISTRY_ADDRESS as string, process.env.FUND_ADDRESS as string],
  },
  {
    name: 'CitNFT',
    ownable: true,
    args: [process.env.REGISTRY_ADDRESS as string, process.env.FUND_ADDRESS as string],
  },
  {
    name: 'CJPY',
    ownable: true,
    args: [process.env.REGISTRY_ADDRESS as string, process.env.FUND_ADDRESS as string],
  },
  {
    name: 'Faucet',
    ownable: true,
    args: [process.env.REGISTRY_ADDRESS as string, process.env.FUND_ADDRESS as string],
  },
  {
    name: 'LearnToEarn',
    ownable: true,
    args: [process.env.REGISTRY_ADDRESS as string, process.env.FUND_ADDRESS as string],
  },
  {
    name: 'Registry',
    ownable: true,
    args: [process.env.REGISTRY_ADDRESS as string, process.env.FUND_ADDRESS as string],
  },
];

async function main() {
  console.log(
    `Please select one of the contracts below:\n\n${Object.keys(contractConfig)
      .map((item, idx) => `${idx}. ${item}`)
      .join('\n')}`,
  );

  let prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  prompt.question(`\nEnter Contract Name [Eg: CitCoin}]:\t`, async (name: string) => {
    // @ts-ignore
    let contractSetting: ContractOption = contractConfig[name];
    if (contractSetting === undefined) {
      console.log('No valid contracts selected !!\n');
      process.exit(1);
    }

    const contractFactory = await ethers.getContractFactory(contractSetting.name);
    console.log('Deploying Contract with the following arguments:');

    contractSetting.args.forEach((item, idx) => {
      console.log(`- ${item}: ${process.env[item]}`);
    });

    const contract = await contractFactory.deploy(...contractSetting.args);

    await contract.deployed();

    // transfer ownership of the contract if the contract is ownable
    if (contractSetting.ownable) {
      await contract.transferOwnership(process.env.GNOSIS_OWNER as string);
    }

    console.log('Contract Address: ', contract.address);

    await contract.transferOwnership(process.env.GNOSIS_OWNER as string);

    prompt.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
