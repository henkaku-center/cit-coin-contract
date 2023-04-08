import { ethers } from 'hardhat'
import dotenv from 'dotenv'
dotenv.config()

async function main() {
  const contract = await ethers.getContractFactory('LearnToEarn')
  const token = await contract.deploy(
    process.env.REGISTRY_ADDRESS as string, // Please note the address of the registry when deploying cJPY and set it here
    process.env.CJPY_ADDRESS as string,
    process.env.GNOSIS_OWNER as string,
  )
  await token.deployed()

  const registryFactory = await ethers.getContractFactory('Registry')
  const registry = await registryFactory.attach(
      process.env.REGISTRY_ADDRESS ?? ''
  )
  // Necessary to operate a registry contract from learn to earn contract
  await registry.grantRoleAdmin(token.address)

  console.log('Token: ', token.address)
  await token.transferOwnership(process.env.GNOSIS_OWNER as string)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
