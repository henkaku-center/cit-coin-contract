import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

describe('LearnToEarn', () => {
  let owner: SignerWithAddress,
    admin: SignerWithAddress,
    notAdmin: SignerWithAddress,
    student1: SignerWithAddress,
    student2: SignerWithAddress,
    otherPerson: SignerWithAddress,
    cJpy: Contract,
    quest: Contract;
  let rewardPoints = 1_000_000_000;

  beforeEach(async () => {
    [owner, admin, notAdmin, student1, student2, otherPerson] = await ethers.getSigners();

    const _REGISTRY = await ethers.getContractFactory('Registry');
    let _CJPY = await ethers.getContractFactory('CJPY');
    let _QUEST = await ethers.getContractFactory('LearnToEarn');

    const registry = await _REGISTRY.deploy();
    cJpy = await _CJPY.deploy(registry.address);
    await cJpy.deployed();

    quest = await _QUEST.deploy(registry.address, cJpy.address, owner.address);
    await quest.deployed();
    await quest.setRewardPoint(rewardPoints);

    // grant admin role of registry to quest address
    await registry.grantRoleAdmin(quest.address);

    // adding whitelisted users
    await registry.bulkAddToWhitelist([
      ethers.constants.AddressZero, // mint needs to be added because zero address is from and _beforeTokenTransfer is used to determine if from is included in whitelist.
      owner.address,
      student1.address,
      student2.address,
      quest.address,
      admin.address,
      notAdmin.address,
    ]);
    //
    //
    // await quest.addStudents([student1.address, student2.address]);

    // Minting tokens for owner and/or fund address
    await cJpy.mint(owner.address, 1_000_000_000_000_000);

    // approve spend by quest contract from owner's wallet
    await cJpy.approve(quest.address, 1_000_000_000_000_000);

    // setting the first keyword
    await quest.setQuest(4, 0x8421);

    // adding the admin
    await quest.setAdmin(admin.address);
  });

  describe('Set Keyword and check balance of the fund address', () => {
    it('Successful keyword setup by owner', async () => {
      await quest.setQuest(4, 0x8421);
    });

    it('Successful keyword setup by admin', async () => {
      expect(await quest.connect(admin).setQuest(4, 0x8421)).not.to.reverted;
    });

    it('Error setting Keyword by other', async () => {
      await expect(quest.connect(notAdmin).setQuest(4, 0x8421)).to.be.revertedWith(
        'INVALID: YOU MUST BE AN ADMIN TO CONTINUE',
      );
    });
  });

  describe('Checking Keyword', () => {
    it('4 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x8421);
      expect(await cJpy.connect(student1).balanceOf(student1.address)).to.be.equal(
        4 * rewardPoints,
      );
    });

    it('3 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x8422);
      expect(await cJpy.connect(student1).balanceOf(student1.address)).to.be.equal(
        3 * rewardPoints,
      );
    });

    it('2 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x2422);
      expect(await cJpy.connect(student1).balanceOf(student1.address)).to.be.equal(
        2 * rewardPoints,
      );
    });

    it('1 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x2211);
      expect(await cJpy.connect(student1).balanceOf(student1.address)).to.be.equal(rewardPoints);
    });

    it('0 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x1248);
      expect(await cJpy.connect(student1).balanceOf(student1.address)).to.be.equal(0);
    });

    it('Already Answered', async () => {
      await quest.connect(student1).answerQuest(0x8421);
      await expect(quest.connect(student1).answerQuest(0x8421)).to.be.revertedWith(
        'ERROR: ALREADY ANSWERED',
      );
    });

    it('Answering to the new quest', async () => {
      await quest.connect(student1).answerQuest(0x8421); // 4 points
      await quest.setQuest(5, 0x42142);
      await quest.connect(student1).answerQuest(0x42142); // 5 points
      await quest.connect(student2).answerQuest(0x42142); // 5 points
      expect(await cJpy.balanceOf(student1.address)).to.be.equal(9 * rewardPoints); // 4 + 5 points
      expect(await cJpy.balanceOf(student2.address)).to.be.equal(5 * rewardPoints); // 5 points
    });

    it('Trying to answer by an outsider', async () => {
      await expect(quest.connect(otherPerson).answerQuest(0x8421)).to.be.revertedWith(
        'INVALID: YOU MUST BE A STUDENT TO CONTINUE',
      );
    });
  });

  describe('Managing Students', () => {
    it('adding students', async () => {
      expect(await quest.isStudent(otherPerson.address)).to.be.false;
      await quest.addStudents([otherPerson.address]);
      expect(await quest.isStudent(otherPerson.address)).to.be.true;
    });

    it('adding students by admin', async () => {
      expect(await quest.connect(admin).isStudent(otherPerson.address)).to.be.false;
      await expect(quest.connect(notAdmin).addStudents([otherPerson.address])).to.be.revertedWith(
        'INVALID: YOU MUST BE AN ADMIN TO CONTINUE',
      );
      await quest.setAdmin(notAdmin.address);
      await expect(quest.connect(notAdmin).addStudents([otherPerson.address])).not.to.be.reverted;
      expect(await quest.isStudent(otherPerson.address)).to.be.true;
    });

    it('adding students by removed admin', async () => {
      expect(await quest.connect(admin).isStudent(student1.address)).to.be.true;
      await quest.removeAdmin(admin.address);
      await expect(quest.connect(admin).addStudents([otherPerson.address])).to.be.revertedWith(
        'INVALID: YOU MUST BE AN ADMIN TO CONTINUE',
      );
      // student is not removed
      expect(await quest.isStudent(student1.address)).to.be.true;
    });

    it('removing students', async () => {
      expect(await quest.isStudent(student1.address)).to.be.true;
      await quest.removeStudents([student1.address]);
      expect(await quest.isStudent(student1.address)).to.be.false;
    });

    it('Answering questions by removed student', async () => {
      expect(await quest.isStudent(student1.address)).to.be.true;
      await quest.removeStudents([student1.address]);
      expect(await quest.isStudent(student1.address)).to.be.false;
      await expect(quest.connect(student1).answerQuest(0x8421)).to.be.revertedWith(
        'INVALID: YOU MUST BE A STUDENT TO CONTINUE',
      );
    });
  });
});
