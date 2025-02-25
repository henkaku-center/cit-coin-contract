import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const CJPY_ADDRESS = process.env.CJPY_ADDRESS as string;
  const LEARN_TO_WARN_ADDRESS = process.env.LEARN_TO_WARN_ADDRESS as string;
  const FUND_ADDRESS = process.env.FUND_ADDRESS as string;
  const MINT_AMOUNT = ethers.utils.parseUnits("10000000", 18); // ミントするトークン量（例: 10,000,000）

  const cJpy = await ethers.getContractAt("CJPY", CJPY_ADDRESS);

  console.log(`Minting ${ethers.utils.formatUnits(MINT_AMOUNT, 18)} cJPY to ${FUND_ADDRESS}...`);
  const mintTx = await cJpy.mint(FUND_ADDRESS, MINT_AMOUNT);
  await mintTx.wait();
  console.log("Mint complete!");

  // `approve` を実行
  console.log(`Approving LearnToEarn contract to spend ${ethers.utils.formatUnits(MINT_AMOUNT, 18)} cJPY...`);
  const approveTx = await cJpy.approve(LEARN_TO_WARN_ADDRESS, MINT_AMOUNT);
  await approveTx.wait();
  console.log("Approve complete!");
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
