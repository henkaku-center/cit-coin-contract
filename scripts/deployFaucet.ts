import { ethers } from 'hardhat'
import dotenv from 'dotenv'
dotenv.config()

async function main() {
  const faucetFactory = await ethers.getContractFactory('Faucet')
  const faucet = await faucetFactory.deploy(
    process.env.REGISTRY_ADDRESS as string, // Please note the address of the registry and set it in .env file
    process.env.FUND_ADDRESS as string,   // Please note the address of the fund and set it in .env file
  )
  await faucet.deployed()

  console.log('Faucet Address: ', faucet.address)
  await faucet.transferOwnership(process.env.GNOSIS_OWNER as string)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
