import { ethers } from 'hardhat'
import dotenv from 'dotenv'
dotenv.config()

async function main() {
  const contract = await ethers.getContractFactory('LearnToEarn')
  const token = await contract.deploy(
    process.env.CIT_COIN_ADDRESS as string,
    process.env.GNOSIS_OWNER as string,
  )
  await token.deployed()

  console.log('Token: ', token.address)
  await token.transferOwnership(process.env.GNOSIS_OWNER as string)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
