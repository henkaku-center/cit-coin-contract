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
    learnToEarn: Contract,
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

    learnToEarn = await learnToEarnFactory.deploy(registry.address, cJPY.address, owner.address);
    await learnToEarn.deployed();

    NFT = await nftFactory.deploy(registry.address, cJPY.address, learnToEarn.address);
    await NFT.deployed();

    await registry.bulkAddToWhitelist([
      ethers.constants.AddressZero,
      owner.address,
      john.address,
      jane.address,
      satoshi.address,
      otherUser.address,
    ]);

    await cJPY.mint(owner.address, parseUnits('100000', 18));
    await cJPY.mint(john.address, parseUnits('8000', 18));
    await cJPY.mint(jane.address, parseUnits('16000', 18));
    await cJPY.mint(satoshi.address, parseUnits('20000', 18));
    await cJPY.mint(otherUser.address, parseUnits('25000', 18));
    await registry.removeFromWhitelist(otherUser.address);
    //
    // await NFT.setPrice(parseUnits('10000', 18));

  });

  it('Should Revert transaction with less than 10000 cJPY', async () => {
    expect(0).to.eq(0);
      expect(await NFT.mintNFT(NFTUri, john.address).to.be.revertedWith('Insufficient Tokens'));
  });
});