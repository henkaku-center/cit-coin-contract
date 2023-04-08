import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const registryFactory = await ethers.getContractFactory('Registry');
  const registry = await registryFactory.deploy();
  await registry.deployed();
  console.log('Registry Address: ', registry.address);
  await registry.bulkAddToWhitelist([
    process.env.GNOSIS_OWNER as string,
    "0x0000000000000000000000000000000000000000"
  ])
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
