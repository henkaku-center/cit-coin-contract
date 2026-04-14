import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
  const GNOSIS_OWNER = process.env.GNOSIS_OWNER;

  if (!REGISTRY_ADDRESS) throw new Error('REGISTRY_ADDRESS is not set');
  if (!GNOSIS_OWNER) throw new Error('GNOSIS_OWNER is not set');

  const registry = await ethers.getContractAt('Registry', REGISTRY_ADDRESS);
  const [signer] = await ethers.getSigners();
  const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();

  // 現状確認
  const signerHasRole = await registry.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
  const gnosisHasRole = await registry.hasRole(DEFAULT_ADMIN_ROLE, GNOSIS_OWNER);

  console.log(`Signer:       ${signer.address} -> admin: ${signerHasRole}`);
  console.log(`Gnosis Safe:  ${GNOSIS_OWNER} -> admin: ${gnosisHasRole}`);

  if (!signerHasRole) {
    throw new Error('Signer does not have DEFAULT_ADMIN_ROLE');
  }

  // Step 1: Gnosis Safe に admin 権限を付与
  if (!gnosisHasRole) {
    console.log('\nGranting DEFAULT_ADMIN_ROLE to Gnosis Safe...');
    const tx = await registry.grantRoleAdmin(GNOSIS_OWNER);
    await tx.wait();
    console.log('Done!');
  } else {
    console.log('\nGnosis Safe already has DEFAULT_ADMIN_ROLE, skipping grant.');
  }

  // Step 2: デプロイヤーの admin 権限を放棄
  // Gnosis Safe 側で操作可能なことを確認してから有効化すること
  // console.log('\nRenouncing DEFAULT_ADMIN_ROLE from signer...');
  // const tx2 = await registry.renounceRole(DEFAULT_ADMIN_ROLE, signer.address);
  // await tx2.wait();
  // console.log('Done!');

  // 最終確認
  const signerFinal = await registry.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
  const gnosisFinal = await registry.hasRole(DEFAULT_ADMIN_ROLE, GNOSIS_OWNER);

  console.log('\n=== Final State ===');
  console.log(`Signer:       ${signer.address} -> admin: ${signerFinal}`);
  console.log(`Gnosis Safe:  ${GNOSIS_OWNER} -> admin: ${gnosisFinal}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
