// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IRegistry.sol';
import "./Whitelistable.sol";

contract Faucet is Ownable, Whitelistable {
  /**
   * @dev The `Faucet` contract transfers Matic Coins to users who are enrolled to the classroom.
   * The whitelisted users are retrieved from the `Registry` contract which is defined in the abstract
   * contract `Whitelistable`.
   */

  address public maticToken;
  uint256 public offering = 1e18; // 1 MATIC
  bool public locked;  // helpful when we want to lock the faucet itself irrespective of the single address
  uint256 public lockDuration;  // lock duration in seconds
  //  address fundAddress;
  mapping(address => uint256) public lockTime;

  constructor(address _maticToken, IRegistry registry) Whitelistable registry {
    maticToken = _maticToken;
    //    fundAddress = _fundAddress;
    locked = false;
    lockDuration = 1 weeks;
  }

  modifier onlyUnlocked() {
    require(!locked, 'ERROR: Contract is locked, please wait until owner unlocks the faucet');
    _;
  }

  event RequestedTokens(address indexed _requestor, uint256 _amount);

  function setOffering(uint _offering) public onlyOwner {
    offering = _offering;
  }

  function updateMaticToken(address _maticToken) public onlyOwner {
    // if we want to update the matic token address
    maticToken = _maticToken;
  }

  function updateLockDuration(uint256 _duration) public onlyOwner {
    // the lock duration is in seconds.
    // 1 week = 604800 seconds
    // 1 day = 86400 seconds
    lockDuration = _duration;
  }

  function lock(bool _status) public onlyOwner {
    // locks or unlocks the faucet
    locked = _status;
  }

  function requestTokens(address payable _requestor) public payable {
    /**
      * @dev The `requestTokens` function transfers MATIC tokens to the user who is enrolled in the classroom.
      * The user can request tokens only after the lock duration is over.
      * The lock duration is set to 1 week by default.
      * The user can request tokens only if the faucet is not locked.
      * The faucet can be locked by the owner.
      * The faucet can be unlocked by the owner.
      **/
    require(!locked, 'ERROR: Faucet is currently locked, please try again later');
    require(
      block.timestamp > lockTime[msg.sender] + lockDuration,
      'ERROR: You have to wait until the lock time is over'
    );

    require(address(this).balance > offering, 'Not enough funds in the faucet. Please donate');
    require(maticToken.balanceOf(address(this)) >= offering, 'ERROR: Faucet out of funds');
    require(maticToken.transfer(msg.sender, offering), 'ERROR: Transfer failed');


    //if the balance of this contract is greater than the requested amount, send funds
    _requestor.transfer(amountAllowed);

    lockTime[msg.sender] = block.timestamp;
  }


  function fundFaucet() public payable {
    IERC20 maticToken = IERC20(maticToken);
    require(maticToken.transferFrom(msg.sender, address(this), msg.value), 'Transfer failed');
  }

  function getFaucetBalance() public view returns (uint) {
    IERC20 maticToken = IERC20(maticToken);
    return maticToken.balanceOf(address(this));
  }
}
