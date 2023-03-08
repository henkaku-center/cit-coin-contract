import { ethers } from 'hardhat'
import dotenv from 'dotenv'
dotenv.config()

async function main() {
  const contract = await ethers.getContractFactory('LearnToEarn')
  const token = await contract.deploy(
    '0x0E4587481c947f0aad33143e8b55E06f118036ac',
    '0x137ea0e26414eb73BB08e601E28072781962f810'
  )
  await token.deployed()

  console.log('Token: ', token.address)
  await token.transferOwnership(process.env.GNOSIS_OWNER as string)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
