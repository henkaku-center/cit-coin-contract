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

  address payable public server;  // the server address
  uint256 public offering = 2e16; // 0.02 MATIC
  bool public locked;  // helpful when we want to lock the faucet itself irrespective of the single address
  uint256 public lockDuration;  // lock duration in seconds
  mapping(address => uint256) public lockTime;

  event RequestedTokens(address indexed _requestor, uint256 _amount);
  event FundReceived(address sender, uint256 amount);
  event FundsWithdrawn(address receiver, uint256 amount);

  constructor(IRegistry registry, address payable _server) Whitelistable(registry) {
    locked = false;
    lockDuration = 1 weeks;
    server = _server;
  }

  modifier onlyUnlocked() {
    require(!locked, 'ERROR: Contract is locked, please wait until owner unlocks the faucet');
    _;
  }

  modifier onlyServer() {
    require(
      msg.sender == server ||
      msg.sender == owner(),
      'ERROR: Only server or owner can call this function');
    _;
  }

  receive() external payable {
    // fallback function
    require(msg.value > 1e18, 'ERROR: Please send more than 1 MATIC to the faucet.');
    emit FundReceived(msg.sender, msg.value);
  }

  function setServer(address payable _server) public onlyOwner {
    // the server address is the address of the server which will send tokens to the users
    server = _server;
  }

  function setOffering(uint _offering) public onlyOwner {
    offering = _offering;
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

  function requestTokens(address payable _requestor) public payable onlyUnlocked onlyServer {
    /**
      * @dev The `requestTokens` function transfers MATIC tokens to the user who
      * is enrolled in the classroom.
      * The user can request tokens only after the lock duration is over.
      * The lock duration is set to 1 week by default.
      * The token can be requested only if the faucet has enough funds.
      * Addresses available in registry can get tokens from the faucet.
      **/
    require(registry.isWhitelisted(_requestor), 'INVALID: Receiver is not a student or admin');
    require(
      block.timestamp > lockTime[_requestor] + lockDuration,
      'INVALID: Already received matic coins, please wait until the lock duration is over.'
    );
    require(server.balance > offering, 'ERROR: Not enough funds in the faucet.');
    _requestor.transfer(offering);
    lockTime[_requestor] = block.timestamp;
    emit RequestedTokens(_requestor, offering);
  }

  function getFaucetBalance() public view returns (uint) {
    return server.balance;
  }

  function withdrawFunds() public onlyOwner {
    // the owner can withdraw the funds from the faucet
    // note: the owner should be payable
    require(address(this).balance > 0, 'ERROR: No funds to withdraw.');
    payable(owner()).transfer(address(this).balance);
    emit FundsWithdrawn(owner(), address(this).balance);
  }
}