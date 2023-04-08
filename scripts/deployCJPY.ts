import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // const registryFactory = await ethers.getContractFactory('Registry');
  // const registry = await registryFactory.attach(process.env.REGISTRY_ADDRESS ?? '');

  const cJPY = await ethers.getContractFactory('CJPY');
  const token = await cJPY.deploy(process.env.REGISTRY_ADDRESS as string );
  await token.deployed();

  console.log('cJPY Address: ', token.address);


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
