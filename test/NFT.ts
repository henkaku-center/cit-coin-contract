import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract, constants } from 'ethers';
import { formatEther, parseUnits } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

describe('Cit NFT Tests', () => {
  let owner: SignerWithAddress,
    john: SignerWithAddress,
    jane: SignerWithAddress,
    satoshi: SignerWithAddress,
    otherUser: SignerWithAddress,

    registry: Contract,
    cJPY: Contract,
    NFT: Contract;

  let NFTUri = 'https://example.com/ipfs/token.png';


  beforeEach(async () => {
    [owner, john, jane, satoshi, otherUser] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory('Registry');
    const cJpyFactory = await ethers.getContractFactory('CJPY');
    const nftFactory = await ethers.getContractFactory('CitNFT');
    const learnToEarnFactory = await ethers.getContractFactory('LearnToEarn');

    registry = await RegistryFactory.deploy();
    await registry.deployed();

    cJPY = await cJpyFactory.deploy(registry.address);
    await cJPY.deployed();

    NFT = await nftFactory.deploy(registry.address, cJPY.address);
    await NFT.deployed();

    await registry.bulkAddToWhitelist([
      ethers.constants.AddressZero,
      owner.address,
      john.address,
      jane.address,
      satoshi.address,
      otherUser.address,
    ]);

    await cJPY.mint(john.address, parseUnits('8000', 18));
    await cJPY.mint(jane.address, parseUnits('16000', 18));
    await cJPY.mint(satoshi.address, parseUnits('20000', 18));
    await cJPY.mint(otherUser.address, parseUnits('25000', 18));
    await registry.removeFromWhitelist(otherUser.address);
    //
    await NFT.setPrice(parseUnits('10000', 18));

  });
  describe('Price changing for NFT', () => {
    it('The NFT Should have price of 10000 cJPY', async () => {
      expect(await NFT.price()).to.eq(parseUnits('10000', 18));
    });

    it('Changing the price of an NFT', async () => {
      await NFT.setPrice(parseUnits('20000', 18));
      expect(await NFT.price()).to.eq(parseUnits('20000', 18));
    });

    it('Revert the transaction when price is set below 1 cJPY', async () => {
      await expect(NFT.setPrice(parseUnits('1', 16))).to.be.revertedWith(
        'NFT_PRICE_ERROR: THE PRICE CANNOT BE LESS THAN 1e18');
    });

  });

  describe('Claiming NFT', () => {
    it('Should Revert transaction with less than 10000 cJPY', async () => {
      await expect(NFT.mintTo(NFTUri, john.address)).to.be.revertedWith('CJPY: INSUFFICIENT FUNDS TO PURCHASE NFT');
    });

    it('Should revert minting the locked contract', async () => {
      await NFT.lock(true);
      await expect(NFT.connect(jane).mint(NFTUri)).to.be.revertedWith('ERROR: CONTRACT LOCKED');
    });

    it('Should Successfully claim NFT', async () => {
      expect(await NFT.connect(satoshi).mint(NFTUri)).to.emit('CitNFT', 'BoughtNFT');
    });

    it('Contract owner should successfully claim NFT for student', async () => {
      expect(await NFT.mintTo(NFTUri, jane.address)).to.emit('CitNFT', 'BoughtNFT');
    });

    it('Contract should revert minting the token again', async () => {
      await NFT.connect(satoshi).mint(NFTUri);
      await expect(NFT.connect(satoshi).mint(NFTUri)).to.be.revertedWith('ERROR: USER ALREADY HOLDS THIS NFT');
    });
  });

  describe('Updating NFT', () => {
    it('Successfully Update an NFT URL', async () => {
      await NFT.connect(satoshi).mint(NFTUri);
      await NFT.update(1, `${NFTUri}1`);
      expect(await NFT.tokenURI(1)).to.eq(`${NFTUri}1`);
    });
  });

});