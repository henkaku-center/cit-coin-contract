import { ethers } from 'hardhat'
import dotenv from 'dotenv'
dotenv.config()

async function main() {
  const contract = await ethers.getContractFactory('CitCoin')
  const token = await contract.deploy()
  await token.deployed()

  console.log('Token: ', token.address)
  await token.transferOwnership(process.env.GNOSIS_OWNER as string)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
