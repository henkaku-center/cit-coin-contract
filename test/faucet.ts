import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('Faucet', () => {
  let owner: SignerWithAddress,
    server: SignerWithAddress,
    student: SignerWithAddress,
    other_user: SignerWithAddress,
    faucet: Contract,
    registry: Contract;

  beforeEach(async () => {
    [owner, server, student, other_user] = await ethers.getSigners();

    // deploy registry contract so that we can check if the student is registered or not
    const registryFactory = await ethers.getContractFactory('Registry');
    registry = await registryFactory.deploy();
    await registry.deployed();

    // deploy the faucet contract.
    // set the registry address as well as the server address.
    const faucetFactory = await ethers.getContractFactory('Faucet');
    faucet = await faucetFactory.deploy(registry.address, server.address);
    await faucet.deployed();

    await registry.addToWhitelist(student.address);

    // await server.approve(faucet.address, 1);
  });
  describe('Sending Funds', () => {
    it('Fund Transfer Successful', async () => {
      await expect(faucet.connect(server).requestTokens(student.address)).to.emit(faucet, 'RequestedTokens');
    });

    it('Sending Funds twice within the locked time', async () => {
      await faucet.connect(server).requestTokens(student.address);
      await time.increase(60 * 60 * 24 * 6);  // increase time by 6 days
      await expect(faucet.connect(server).requestTokens(student.address))
        .to.be.revertedWith('INVALID: Already received matic coins, please wait until the lock duration is over.');
    });

    it('Updating the unlock time and requesting the funds', async () => {
      await faucet.updateLockDuration(60 * 60 * 24); // set lock duration to 1 day
      await faucet.connect(server).requestTokens(student.address);
      await time.increase(60 * 60 * 24 * 2); // increase time by 2 days
      await expect(faucet.connect(server).requestTokens(student.address)).to.emit(faucet, 'RequestedTokens');
    });

    it('Fund Transfer Unsuccessful to unregistered student', async () => {
      await expect(faucet.connect(server).requestTokens(other_user.address))
        .to.be.revertedWith('INVALID: Receiver is not a student or admin');
    });

    it('Locking the faucet', async () => {
      await faucet.lock(true);
      await expect(faucet.connect(server).requestTokens(student.address))
        .to.be.revertedWith('ERROR: Contract is locked, please wait until owner unlocks the faucet');
    });
  });
});