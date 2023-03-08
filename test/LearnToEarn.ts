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

  beforeEach(async () => {
    [owner, student1, student2, otherPerson] = await ethers.getSigners();

    let _CIT = await ethers.getContractFactory('CitCoin');
    let _QUEST = await ethers.getContractFactory('LearnToEarn');

    citCoin = await _CIT.connect(owner).deploy();
    await citCoin.deployed();

    quest = await _QUEST.connect(owner).deploy(citCoin.address, owner.address);
    await quest.deployed();

    // adding whitelisted users
    await citCoin.addWhitelistUsers([
      owner.address,
      student1.address,
      student2.address,
      quest.address,
    ]);

    // Minting tokens for owner and/or fund address
    await citCoin.connect(owner).mint(owner.address, 1_000_000_000_000_000);

    // approve spend by quest contract from owner's wallet
    await citCoin.connect(owner).approve(quest.address, 5_000_000_000);

    // setting the first keyword
    await quest.connect(owner).setKeyword('key1', Math.floor(new Date().valueOf() / 1000));
  });

  describe('Set Keyword and check balance of the fund address', () => {
    it('Successful keyword setup by owner', async () => {
      await quest.connect(owner).setKeyword('Test', new Date().valueOf());
    });

    it('Error setting Keyword by other', async () => {
      await expect(
        quest.connect(student1).setKeyword('Test', new Date().valueOf()),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Checking Cit Coin balance of the fund address', async () => {
      expect(await citCoin.connect(owner).balanceOf(owner.address)).to.changeTokenBalances(
        citCoin,
        [owner, owner],
        [-1_000_000_000_000_000, 1_000_000_000_000_000],
      );
    });
  });

  describe('Checking Keyword', () => {
    // it('Successful from the fund address', async () => {
    //   expect(await citCoin.connect(owner).transfer(student1.address, 1000)).to.changeTokenBalances(
    //     citCoin,
    //     [owner, student1],
    //     [-1000, 1000],
    //   );
    //   expect(
    //     await citCoin.connect(quest.signer).transferFrom(owner.address, student1.address, 1000),
    //   ).to.changeTokenBalances(citCoin, [owner, student1], [-1000, 1000]);
    // });

    it('Correct Quest answer', async () => {
      await quest.connect(student1).answerQuest('key1');
      expect(await citCoin.connect(student1).balanceOf(student1.address)).to.be.equal(5000_000);
    });

    it('Already Answered', async () => {
      await quest.connect(student1).answerQuest('key1');
      await expect(quest.connect(student1).answerQuest('key1')).to.be.revertedWith(
        'ALREADY ANSWERED',
      );
    });

    it('Wrong Quest answer', async () => {
      await expect(quest.connect(student1).answerQuest('wrong keyword')).to.be.revertedWith(
        'WRONG ANSWER',
      );
    });

    it('Answering to the new quest', async () => {
      await quest.connect(student1).answerQuest('key1');
      // setting new keyword (1000 is added since new Date() would return same time in seconds since epoch)
      await quest.connect(owner).setKeyword('key2', Math.floor(new Date().valueOf() / 1000) + 1000);
      await quest.connect(student1).answerQuest('key2');
      await quest.connect(student2).answerQuest('key2');
      expect(await citCoin.balanceOf(student1.address)).to.be.equal(10_000_000);
      expect(await citCoin.balanceOf(student2.address)).to.be.equal(5_000_000);
    });

    it('Trying to answer the old quest', async () => {
      await quest.connect(student1).answerQuest('key1');
      await quest.connect(student2).answerQuest('key1');
      await quest.connect(owner).setKeyword('key2', Math.floor(new Date().valueOf() / 1000) + 1000);
      await expect(quest.connect(student1).answerQuest('key1')).to.be.revertedWith('WRONG ANSWER');
      await expect(quest.connect(student2).answerQuest('key1')).to.be.revertedWith('WRONG ANSWER');
    });

    it('Trying to answer by an outsider', async () => {
      await expect(quest.connect(otherPerson).answerQuest('key1')).to.be.revertedWith(
        'INVALID: RECEIVER IS NOT ALLOWED',
      );
    });
  });
});
