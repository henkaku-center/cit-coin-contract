import { assert, expect } from 'chai';
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
    faucet = await faucetFactory.connect(owner).deploy(registry.address, server.address);
    await faucet.deployed();
    await registry.addToWhitelist(student.address);

    await owner.sendTransaction({
      to: faucet.address,
      value: ethers.utils.parseEther('20'),
    });
  });
  describe('Fund Management', () => {
    it('should receive funds', async () => {
      let balance = await ethers.provider.getBalance(faucet.address);
      // console.log('Current Balance: ', ethers.utils.formatEther(balance));
      expect(await owner.sendTransaction({
        to: faucet.address,
        value: ethers.utils.parseEther('20'),
      })).to.emit(faucet, 'ReceivedFunds');
      expect(await ethers.provider.getBalance(faucet.address)).to.equal(balance.add(ethers.utils.parseEther('20')));
    });

    it('should not receive funds below 1 matic', async () => {
      await expect(owner.sendTransaction({
        to: faucet.address,
        value: ethers.utils.parseEther('0.9'),
      })).to.be.revertedWith('ERROR: Please send more than 1 MATIC to the faucet.');
    });

    it('should be able to withdraw funds by owner', async () => {
      let faucetBalance = await ethers.provider.getBalance(faucet.address);
      let ownerBalance = await ethers.provider.getBalance(owner.address);
      await expect(faucet.connect(owner).withdrawFunds()).to.emit(faucet, 'FundsWithdrawn');
      expect(await ethers.provider.getBalance(faucet.address)).to.equal(0);
      // The approximate value is used because of the gas fees
      expect(await ethers.provider.getBalance(owner.address)).to.approximately(
        ownerBalance.add(faucetBalance), ethers.utils.parseEther('0.01'));
    });

    it('should not be able to withdraw funds if the faucet has no funds', async () => {
      await faucet.connect(owner).withdrawFunds();
      await expect(faucet.connect(owner).withdrawFunds()).to.be.revertedWith('ERROR: No funds to withdraw.');
    });

    it('should not be able to withdraw funds if not owner', async () => {
      let faucetBalance = await ethers.provider.getBalance(faucet.address);
      await expect(faucet.connect(student).withdrawFunds()).to.be.revertedWith('Ownable: caller is not the owner');
      // The balance should not change
      expect(await ethers.provider.getBalance(faucet.address)).to.equal(faucetBalance);
    });

  });

  describe('Sending Funds', () => {
    it('Fund Transfer Successful', async () => {
      const studentBalance = await ethers.provider.getBalance(student.address);
      await expect(faucet.connect(server).requestTokens(student.address)).to.emit(faucet, 'RequestedTokens');
      expect(await ethers.provider.getBalance(student.address)).to.equal(studentBalance.add(ethers.utils.parseEther('0.02')));

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
      const studentBalance = await ethers.provider.getBalance(student.address);
      await time.increase(60 * 60 * 24 * 2); // increase time by 2 days
      await expect(faucet.connect(server).requestTokens(student.address)).to.emit(faucet, 'RequestedTokens');
      expect(await ethers.provider.getBalance(student.address)).to.equal(studentBalance.add(ethers.utils.parseEther('0.02')));
    });

    it('updating the offer amount', async () => {
      const studentBalance = await ethers.provider.getBalance(student.address);
      await faucet.setOffering(ethers.utils.parseEther('5'));
      await expect(faucet.connect(server).requestTokens(student.address)).to.emit(faucet, 'RequestedTokens');
      expect(await ethers.provider.getBalance(student.address)).to.equal(studentBalance.add(ethers.utils.parseEther('5')));
    });

    it('No funds in the faucet', async () => {
      await faucet.connect(owner).withdrawFunds();
      await expect(faucet.connect(server).requestTokens(student.address))
        .to.be.revertedWith('ERROR: Not enough funds in the faucet.');
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