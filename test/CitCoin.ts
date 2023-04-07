import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract, constants } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

describe('Cit Coin', () => {
  let owner: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    funds: SignerWithAddress,
    erc20: Contract;

  beforeEach(async () => {
    [owner, alice, bob, funds] = await ethers.getSigners();
    const ERC20 = await ethers.getContractFactory('CitCoin');
    erc20 = await ERC20.deploy();
    await erc20.deployed();
  });

  describe('Transfer', () => {
    it('Successful Transfer', async () => {
      await erc20.addWhitelistUsers([owner.address, alice.address, bob.address]);
      await erc20.mint(alice.address, parseUnits('100', 18));

      await expect(erc20.connect(alice).transfer(bob.address, 20)).to.changeTokenBalances(
        erc20,
        [alice, bob],
        [-20, 20],
      );
    });

    it('reverts if receiver is not allowed', async () => {
      await erc20.addWhitelistUsers([owner.address, alice.address]);
      await erc20.mint(alice.address, parseUnits('100', 18));

      await expect(erc20.connect(alice).transfer(bob.address, 20)).to.be.revertedWith(
        'INVALID: RECEIVER IS NOT ALLOWED',
      );
    });

    context('When Unlocked', () => {
      it('successfully transferred without allowed list', async () => {
        await erc20.unLock();
        await erc20.mint(alice.address, parseUnits('100', 18));

        await expect(erc20.connect(alice).transfer(bob.address, 20)).to.changeTokenBalances(
          erc20,
          [alice, bob],
          [-20, 20],
        );
      });
    });
  });

  describe('Add Whitelisted Users', () => {
    it('Successful Addition of single Whitelisted User', async () => {
      expect(await erc20.isAllowed(owner.address)).to.be.eq(false);
      await erc20.addWhitelistUser(owner.address);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(true);
    });

    it('Successful Addition of multiple Whitelisted Users', async () => {
      expect(await erc20.isAllowed(owner.address)).to.be.eq(false);
      await erc20.addWhitelistUsers([owner.address, alice.address, bob.address]);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(true);
      expect(await erc20.isAllowed(alice.address)).to.be.eq(true);
      expect(await erc20.isAllowed(bob.address)).to.be.eq(true);
    });

    it('User with no permissions', async () => {
      await expect(
        erc20.connect(alice).addWhitelistUsers([owner.address, alice.address, bob.address]),
      ).to.be.revertedWith('INVALID: ONLY ADMIN CAN EXECUTE');
    });

    it('Whitelisting Gatekeepers', async () => {
      await erc20.setGateKeeper(alice.address);
      await erc20.connect(alice).addWhitelistUsers([owner.address, alice.address, bob.address]);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(true);
    });

    it('Whitelisting Developers', async () => {
      await erc20.setDevAddress(bob.address);
      await erc20.connect(bob).addWhitelistUsers([owner.address, alice.address, bob.address]);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(true);
    });
  });

  describe('Removing Whitelisted Users', () => {
    it('successful removal of single whitelist user', async () => {
      expect(await erc20.isAllowed(owner.address)).to.be.eq(false);
      await erc20.addWhitelistUser(owner.address);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(true);

      await erc20.removeWhitelistUser(owner.address);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(false);
    });

    it('successful removal of multiple whitelist users', async () => {
      expect(await erc20.isAllowed(owner.address)).to.be.eq(false);
      await erc20.addWhitelistUsers([owner.address, alice.address, bob.address]);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(true);
      await erc20.removeWhitelistUsers([owner.address, alice.address, bob.address]);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(false);
      expect(await erc20.isAllowed(alice.address)).to.be.eq(false);
      expect(await erc20.isAllowed(bob.address)).to.be.eq(false);
    });

    it('Trying to remove whitelist by an unauthorized user (Should revert the process)', async () => {
      await expect(
        erc20.connect(alice).removeWhitelistUsers([owner.address, alice.address, bob.address]),
      ).to.be.revertedWith('INVALID: ONLY ADMIN CAN EXECUTE');
    });

    it('Trying to remove whitelist if the user is gatekeeper', async () => {
      await erc20.setGateKeeper(alice.address);
      await erc20.connect(alice).addWhitelistUsers([owner.address, alice.address, bob.address]);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(true);

      await erc20.connect(alice).removeWhitelistUsers([owner.address, alice.address, bob.address]);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(false);
    });

    it('Trying to remove whitelist if the user is developer', async () => {
      await erc20.setDevAddress(bob.address);
      await erc20.connect(bob).addWhitelistUsers([owner.address, alice.address, bob.address]);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(true);
      await erc20.connect(bob).removeWhitelistUsers([owner.address, alice.address, bob.address]);
      expect(await erc20.isAllowed(owner.address)).to.be.eq(false);
    });
  });

  describe('Burning Tokens', () => {
    beforeEach(async () => {
      /**
       * Before Burning tokens user should be whitelisted so all users created from the initial describe()
       * block needs to be whitelisted.
       * Owner mints the token which will then be burned.
       */
      await erc20.addWhitelistUsers([
        owner.address,
        alice.address,
        bob.address,
        constants.AddressZero,
      ]);
      await erc20.mint(alice.address, parseUnits('100', 18));
    });

    it('Successful Burn', async () => {
      await expect(erc20.burn(alice.address, 5000)).to.changeTokenBalances(erc20, [alice], [-5000]);
    });

    it('Trying to burn own token (Successful execution)', async () => {
      await expect(erc20.connect(alice).burn(alice.address, 20)).to.changeTokenBalances(
        erc20,
        [alice],
        [-20],
      );
    });

    it("Trying to burn somepne else's token (Reverts the execution)", async () => {
      await expect(erc20.connect(alice).burn(owner.address, 20)).to.be.revertedWith(
        'INVALID: NOT YOUR ASSET',
      );
    });
  });
});
