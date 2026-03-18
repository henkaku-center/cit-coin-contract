import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const JOIN_ADDRESS = process.env.JOIN_ADDRESS;
  const LEARN_TO_WARN_ADDRESS = process.env.LEARN_TO_WARN_ADDRESS;
  const FUND_ADDRESS = process.env.FUND_ADDRESS;

  if (!JOIN_ADDRESS) throw new Error('JOIN_ADDRESS is not set');
  if (!LEARN_TO_WARN_ADDRESS) throw new Error('LEARN_TO_WARN_ADDRESS is not set');
  if (!FUND_ADDRESS) throw new Error('FUND_ADDRESS is not set');

  // スペック: 初期発行量 20,000,000 JOIN（200人受講想定）
  const MINT_AMOUNT = ethers.utils.parseUnits("20000000", 18);

  const join = await ethers.getContractAt("JOIN", JOIN_ADDRESS);

  console.log(`Minting ${ethers.utils.formatUnits(MINT_AMOUNT, 18)} JOIN to ${FUND_ADDRESS}...`);
  const mintTx = await join.mint(FUND_ADDRESS, MINT_AMOUNT);
  await mintTx.wait();
  console.log("Mint complete!");

  console.log(`Approving LearnToEarn contract to spend ${ethers.utils.formatUnits(MINT_AMOUNT, 18)} JOIN...`);
  const approveTx = await join.approve(LEARN_TO_WARN_ADDRESS, MINT_AMOUNT);
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
