import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const registry = await ethers.getContractFactory('Registry');
  const reg_token = await registry.deploy();
  await reg_token.deployed();
  const registry_address = reg_token.address
  console.log('Registry Address: ', registry_address);

  const cJPY = await ethers.getContractFactory('CJPY');
  const token = await cJPY.deploy(registry_address);
  await token.deployed();

  console.log('cJPY Address: ', token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
