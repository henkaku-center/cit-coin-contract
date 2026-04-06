import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

describe('JOIN Token', () => {
  let owner: SignerWithAddress,
    minter: SignerWithAddress,
    burner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    nonWhitelisted: SignerWithAddress,
    registry: Contract,
    join: Contract;

  const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE'));
  const BURNER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('BURNER_ROLE'));
  const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;

  beforeEach(async () => {
    [owner, minter, burner, user1, user2, nonWhitelisted] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory('Registry');
    const JoinFactory = await ethers.getContractFactory('JOIN');

    registry = await RegistryFactory.deploy();
    await registry.deployed();

    join = await JoinFactory.deploy(registry.address);
    await join.deployed();

    await registry.bulkAddToWhitelist([
      ethers.constants.AddressZero,
      owner.address,
      minter.address,
      burner.address,
      user1.address,
      user2.address,
    ]);

    await join.grantRole(MINTER_ROLE, minter.address);
    await join.grantRole(BURNER_ROLE, burner.address);
  });

  describe('Token metadata', () => {
    it('should have correct name', async () => {
      expect(await join.name()).to.equal('JOIN');
    });

    it('should have correct symbol', async () => {
      expect(await join.symbol()).to.equal('JOIN');
    });
  });

  describe('Minting', () => {
    it('should allow MINTER_ROLE holder to mint', async () => {
      await join.connect(minter).mint(user1.address, parseUnits('1000', 18));
      expect(await join.balanceOf(user1.address)).to.equal(parseUnits('1000', 18));
    });

    it('should allow owner (deployer) to mint', async () => {
      await join.mint(user1.address, parseUnits('500', 18));
      expect(await join.balanceOf(user1.address)).to.equal(parseUnits('500', 18));
    });

    it('should revert when non-MINTER_ROLE tries to mint', async () => {
      await expect(
        join.connect(user1).mint(user2.address, parseUnits('1000', 18)),
      ).to.be.reverted;
    });

    it('should revert when minting to non-whitelisted address', async () => {
      await expect(
        join.connect(minter).mint(nonWhitelisted.address, parseUnits('1000', 18)),
      ).to.be.reverted;
    });
  });

  describe('Burning', () => {
    beforeEach(async () => {
      await join.mint(owner.address, parseUnits('5000', 18));
      await join.mint(burner.address, parseUnits('5000', 18));
    });

    it('should allow BURNER_ROLE holder to burn their own tokens', async () => {
      await join.connect(burner).burn(parseUnits('2000', 18));
      expect(await join.balanceOf(burner.address)).to.equal(parseUnits('3000', 18));
    });

    it('should allow owner (deployer) to burn their own tokens', async () => {
      await join.burn(parseUnits('1000', 18));
      expect(await join.balanceOf(owner.address)).to.equal(parseUnits('4000', 18));
    });

    it('should revert when non-BURNER_ROLE tries to burn', async () => {
      await join.mint(user1.address, parseUnits('1000', 18));
      await expect(
        join.connect(user1).burn(parseUnits('500', 18)),
      ).to.be.reverted;
    });
  });

  describe('Transfers', () => {
    beforeEach(async () => {
      await join.mint(user1.address, parseUnits('5000', 18));
    });

    it('should allow transfer between whitelisted addresses', async () => {
      await join.connect(user1).transfer(user2.address, parseUnits('2000', 18));
      expect(await join.balanceOf(user1.address)).to.equal(parseUnits('3000', 18));
      expect(await join.balanceOf(user2.address)).to.equal(parseUnits('2000', 18));
    });

    it('should revert transfer to non-whitelisted address', async () => {
      await expect(
        join.connect(user1).transfer(nonWhitelisted.address, parseUnits('1000', 18)),
      ).to.be.revertedWithCustomError(join, 'NotWhitelisted');
    });

    it('should revert transfer from non-whitelisted address', async () => {
      await join.mint(user1.address, parseUnits('1000', 18));
      await registry.removeFromWhitelist(user1.address);
      await expect(
        join.connect(user1).transfer(user2.address, parseUnits('500', 18)),
      ).to.be.revertedWithCustomError(join, 'NotWhitelisted');
    });
  });

  describe('Role management', () => {
    it('should grant MINTER_ROLE to a new address', async () => {
      expect(await join.hasRole(MINTER_ROLE, user1.address)).to.be.false;
      await join.grantRole(MINTER_ROLE, user1.address);
      expect(await join.hasRole(MINTER_ROLE, user1.address)).to.be.true;
    });

    it('should revoke MINTER_ROLE from an address', async () => {
      expect(await join.hasRole(MINTER_ROLE, minter.address)).to.be.true;
      await join.revokeRole(MINTER_ROLE, minter.address);
      expect(await join.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });

    it('should grant BURNER_ROLE to a new address', async () => {
      expect(await join.hasRole(BURNER_ROLE, user1.address)).to.be.false;
      await join.grantRole(BURNER_ROLE, user1.address);
      expect(await join.hasRole(BURNER_ROLE, user1.address)).to.be.true;
    });

    it('should revoke BURNER_ROLE from an address', async () => {
      expect(await join.hasRole(BURNER_ROLE, burner.address)).to.be.true;
      await join.revokeRole(BURNER_ROLE, burner.address);
      expect(await join.hasRole(BURNER_ROLE, burner.address)).to.be.false;
    });

    it('should prevent minting after MINTER_ROLE is revoked', async () => {
      await join.revokeRole(MINTER_ROLE, minter.address);
      await expect(
        join.connect(minter).mint(user1.address, parseUnits('1000', 18)),
      ).to.be.reverted;
    });

    it('should prevent burning after BURNER_ROLE is revoked', async () => {
      await join.mint(burner.address, parseUnits('1000', 18));
      await join.revokeRole(BURNER_ROLE, burner.address);
      await expect(
        join.connect(burner).burn(parseUnits('500', 18)),
      ).to.be.reverted;
    });

    it('should not allow non-admin to grant roles', async () => {
      await expect(
        join.connect(user1).grantRole(MINTER_ROLE, user2.address),
      ).to.be.reverted;
    });

    it('deployer should have DEFAULT_ADMIN_ROLE', async () => {
      expect(await join.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });
});
