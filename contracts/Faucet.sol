// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IRegistry.sol';
import "./Whitelistable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Faucet is Ownable, Whitelistable, ReentrancyGuard {
  /**
   * @dev The `Faucet` contract transfers Matic Coins to users who are enrolled
   * to the classroom. The whitelisted users are retrieved from the `Registry`
   * contract which is defined in the abstract contract `Whitelistable`.
   */

  address public operator;  // the operator address
  uint256 public offering = 2e16; // 0.02 MATIC

  bool public locked; // helpful when we want to lock the faucet itself
  uint256 public lockDuration;  // lock duration in seconds
  mapping(address => uint256) public lockTime;

  event RequestedTokens(address indexed _requestor, uint256 _amount);
  event FundReceived(address sender, uint256 amount);
  event FundsWithdrawn(address receiver, uint256 amount);

  constructor(IRegistry registry, address _operator) Whitelistable(registry) {
    locked = false;
    lockDuration = 1 weeks;
    operator = _operator;
  }

  modifier onlyUnlocked() {
    require(!locked, 'ERROR: Contract is locked, please wait until owner unlocks the faucet');
    _;
  }

  modifier onlyOperator() {
    require(
      msg.sender == operator ||
      msg.sender == owner(),
      'ERROR: Only operator or owner can call this function');
    _;
  }

  function deposit(uint256 amount) external payable {
    require(amount > 1e18, 'ERROR: Please send more than 1 MATIC to the faucet.');
    emit FundReceived(msg.sender, amount);
  }

  receive() external payable {
    // fallback function
    deposit(msg.value);
  }

  function setoperator(address payable _operator) public onlyOwner {
    // the operator address is the address of the operator which will send tokens to the users
    operator = _operator;
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

  function requestTokens(address payable _requestor) external onlyUnlocked onlyOperator nonReentrant {
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
    require(address(this).balance > offering, 'ERROR: Not enough funds in the faucet.');

    // we set the lock time before transferring the token as a non reentrancy guard
    lockTime[_requestor] = block.timestamp;
    _requestor.transfer(offering);
    emit RequestedTokens(_requestor, offering);
  }

  function withdrawFunds() public onlyOwner {
    // the owner can withdraw the funds from the faucet
    // note: the owner should be payable
    require(address(this).balance > 0, 'ERROR: No funds to withdraw.');
    payable(owner()).transfer(address(this).balance);
    emit FundsWithdrawn(owner(), address(this).balance);
  }
}
