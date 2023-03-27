import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

describe('LearnToEarn', () => {
  let owner: SignerWithAddress,
    student1: SignerWithAddress,
    student2: SignerWithAddress,
    otherPerson: SignerWithAddress,
    citCoin: Contract,
    quest: Contract;
  let rewardPoints = 1_000_000;

  beforeEach(async () => {
    [owner, student1, student2, otherPerson] = await ethers.getSigners();

    let _CIT = await ethers.getContractFactory('CitCoin');
    let _QUEST = await ethers.getContractFactory('LearnToEarn');

    citCoin = await _CIT.connect(owner).deploy();
    await citCoin.deployed();

    quest = await _QUEST.connect(owner).deploy(citCoin.address, owner.address);
    await quest.deployed();
    await quest.connect(owner).setRewardPoint(rewardPoints);

    // adding whitelisted users
    await citCoin.addWhitelistUsers([
      owner.address,
      student1.address,
      student2.address,
      quest.address,
    ]);

    await quest.addStudents([
      student1.address,
      student2.address,
    ])

    // Minting tokens for owner and/or fund address
    await citCoin.mint(owner.address, 1_000_000_000_000_000);

    // approve spend by quest contract from owner's wallet
    await citCoin.connect(owner).approve(quest.address, 5_000_000_000);

    // setting the first keyword
    await quest.connect(owner).setQuest(4, 0x8421);
  });

  describe('Set Keyword and check balance of the fund address', () => {
    it('Successful keyword setup by owner', async () => {
      await quest.connect(owner).setQuest(4, 0x8421);
    });

    it('Error setting Keyword by other', async () => {
      await expect(
        quest.connect(student1).setQuest(4, 0x8421),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('Checking Keyword', () => {

    it('4 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x8421);
      expect(await citCoin.connect(student1).balanceOf(student1.address)).to.be.equal(4 * rewardPoints);
    });

    it('3 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x8422);
      expect(await citCoin.connect(student1).balanceOf(student1.address)).to.be.equal(3 * rewardPoints);
    });


    it('2 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x2422);
      expect(await citCoin.connect(student1).balanceOf(student1.address)).to.be.equal(2 * rewardPoints);
    });


    it('1 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x2211);
      expect(await citCoin.connect(student1).balanceOf(student1.address)).to.be.equal(rewardPoints);
    });


    it('0 out of 4', async () => {
      await quest.connect(student1).answerQuest(0x1248);
      expect(await citCoin.connect(student1).balanceOf(student1.address)).to.be.equal(0);
    });

    it('Already Answered', async () => {
      await quest.connect(student1).answerQuest(0x8421);
      await expect(quest.connect(student1).answerQuest(0x8421)).to.be.revertedWith(
        'ERROR: ALREADY ANSWERED',
      );
    });

    it('Wrong Quest answer', async () => {
      quest.connect(student1).answerQuest(0x4218);
      expect(await citCoin.connect(student1).balanceOf(student1.address)).to.be.equal(0);
    });

    it('Answering to the new quest', async () => {
      await quest.connect(student1).answerQuest(0x8421);  // 4 points
      await quest.connect(owner).setQuest(5, 0x42142);
      await quest.connect(student1).answerQuest(0x42142); // 5 points
      await quest.connect(student2).answerQuest(0x42142); // 5 points
      expect(await citCoin.balanceOf(student1.address)).to.be.equal(9 * rewardPoints);  // 4 + 5 points
      expect(await citCoin.balanceOf(student2.address)).to.be.equal(5 * rewardPoints);  // 5 points
    });
    it('Trying to answer by an outsider', async () => {
      await expect(quest.connect(otherPerson).answerQuest(0x8421)).to.be.revertedWith(
        'INVALID: YOU MUST BE A STUDENT TO CONTINUE',
      );
    });
  });
});
