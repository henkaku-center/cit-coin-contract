import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
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

    await cJPY.connect(john).approve(NFT.address, parseUnits('8000', 18));
    await cJPY.connect(jane).approve(NFT.address, parseUnits('16000', 18));
    await cJPY.connect(satoshi).approve(NFT.address, parseUnits('20000', 18));
    await cJPY.connect(otherUser).approve(NFT.address, parseUnits('25000', 18));
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
        'NFT_PRICE_ERROR: THE PRICE CANNOT BE LESS THAN 1e18',
      );
    });
  });

  describe('Claiming NFT', () => {
    it('Should Revert transaction with less than 10000 cJPY', async () => {
      await expect(NFT.mintTo(NFTUri, john.address)).to.be.revertedWith(
        'CJPY: INSUFFICIENT FUNDS TO PURCHASE NFT',
      );
    });

    it('Trying to mint the token while contract is locked', async () => {
      await NFT.lock(true);
      await expect(NFT.connect(jane).mint(NFTUri)).to.be.revertedWith('ERROR: CONTRACT LOCKED');
      expect(await NFT.earnedToken(jane.address)).to.be.eq(0);
    });

    it('Should Successfully claim NFT', async () => {
      expect(await NFT.connect(satoshi).mint(NFTUri)).to.emit('CitNFT', 'BoughtNFT');
      expect(await NFT.earnedToken(satoshi.address)).to.be.eq(1);
    });

    it('Claiming NFT should make cJPY balance 0', async () => {
      await NFT.connect(satoshi).mint(NFTUri);
      expect(await cJPY.balanceOf(satoshi.address)).to.be.eq('0');
      expect(await cJPY.balanceOf(owner.address)).to.be.eq(parseUnits('20000', 18));
    });

    it('Trying to claim NFT with lower allowances than Earned cJPY', async () => {
      await cJPY.connect(satoshi).approve(NFT.address, parseUnits('19000', 18));
      await expect(NFT.connect(satoshi).mint(NFTUri)).to.be.revertedWith(
        'CJPY: INSUFFICIENT ALLOWANCE TO PURCHASE NFT',
      );
      expect(await cJPY.balanceOf(satoshi.address)).to.be.eq(parseUnits('20000', 18));
      expect(await cJPY.balanceOf(owner.address)).to.be.eq(parseUnits('0', 18));
    });

    it('Non-whitelisted users should not be able to claim tokens', async () => {
      await expect(NFT.connect(otherUser).mint(NFTUri)).to.be.revertedWith(
        'REGISTRY: USER NOT WHITELISTED',
      );
    });

    it('Contract owner should successfully claim NFT for student', async () => {
      expect(await NFT.mintTo(NFTUri, jane.address)).to.emit('CitNFT', 'BoughtNFT');
    });

    it('Contract should revert minting the token again', async () => {
      await NFT.connect(satoshi).mint(NFTUri);
      await expect(NFT.connect(satoshi).mint(NFTUri)).to.be.revertedWith(
        'ERROR: USER ALREADY HOLDS THIS NFT',
      );
    });
  });

  describe('Updating NFT', () => {
    it('Successfully Update an NFT URL', async () => {
      await NFT.connect(satoshi).mint(NFTUri);
      await NFT.update(1, `${NFTUri}1`);
      expect(await NFT.tokenURI(1)).to.eq(`${NFTUri}1`);
    });
    it('Trying to update the non-existent token', async () => {
      await expect(NFT.update(2, NFTUri)).to.be.revertedWith('ERC721Metadata: NONEXISTENT TOKEN.');
    });
  });

  describe('Transferring tokens', () => {
    it('Should revert with message forbidden', async () => {
      await NFT.connect(satoshi).mint(NFTUri);
      await expect(NFT.transferFrom(satoshi.address, jane.address, 1)).to.be.revertedWith(
        'forbidden',
      );
    });

    // it('Trying to transfer non-existent token', async () => {
    //   await expect(NFT.transferFrom(satoshi.address, jane.address, 1)).to.be.revertedWith(
    //     'ERC721Metadata: NONEXISTENT TOKEN.',
    //   );
    // });

    // it('Trying to transfer token to non-whitelisted address', async () => {
    //   await NFT.connect(satoshi).mint(NFTUri);
    //   await expect(NFT.transferFrom(satoshi.address, otherUser.address, 1)).to.be.revertedWith(
    //     'REGISTRY: USER NOT WHITELISTED',
    //   );
    // });

    // it('Trying to transfer token by other than owner', async () => {
    //   await NFT.connect(satoshi).mint(NFTUri);
    //   await expect(NFT.connect(satoshi).transferFrom(satoshi.address, jane.address, 1)).to.be.revertedWith(
    //     'Ownable: caller is not the owner',
    //   );
    // });
  });

  describe('Burning NFTs', () => {
    it('Successfully burn the token by the token owner', async () => {
      await NFT.connect(satoshi).mint(NFTUri);
      expect(await NFT.earnedToken(satoshi.address)).to.equal(1);
      await expect(NFT.connect(satoshi).burn(1)).not.to.be.reverted;
      expect(await NFT.earnedToken(satoshi.address)).to.equal(0);
    });

    it('Successfully burn the token by the contract owner', async () => {
      await NFT.connect(satoshi).mint(NFTUri);
      await expect(NFT.burn(1)).not.to.be.reverted;
    });

    it('revert the burning of an NFT if it is not approved user', async () => {
      await NFT.connect(satoshi).mint(NFTUri);
      await expect(NFT.connect(john).burn(1)).to.be.revertedWith('ERROR: BURNING_NOT_ALLOWED');
    });
  });
});
