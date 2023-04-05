// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './CitCoin.sol';
import "./Whitelistable.sol";
import "./cJPY.sol";

contract LearnToEarn is Ownable, Whitelistable {
  struct Quest {
    // We can store  32 answers with 4 options with uint128 answers
    /**
     * We can store 16 answers with 4 choices if we use uint128
     * Example: Q1 has first correct and Q2 has second correct answer, we can represent it as
     * Q1: A, Q2: B, Q3: B, Q4: C = 1000 0100 0100 0010 = 0x8442
     *
     * This method will be more useful when we implement multiple correct options on multiple choices
     * Eg: Q1: A,B = 1100 = 0xC represents the query has option A and option B as correct answers
     **/
    uint256 publishedDate;
    uint8 totalQuestions;
    uint128 answer;
  }

  struct Attributes {
    uint256 point;
    uint256 answeredAt;
  }

  Counters.Counter private _tokenIds;
  uint public rewardPoint = 1_000_000_000;
  address public fundAddress;
  address public dev; // address for developers to run block-chain on backend to configure
  CJPY public cJpy;
  Quest private weeklyQuest;
  mapping(address => bool) public admins;

  mapping(address => Attributes) public userAttributes;

  // Events
  event CheckedAnswer(address indexed _by, uint256 at);
  event ClaimedToken(address _by, uint256 _amount);

  constructor(IRegistry registry, CJPY _cJpy, address _fundAddress) Whitelistable(registry) {
    fundAddress = _fundAddress;
    cJpy = _cJpy;
  }

  modifier onlyAdmin() {
    require(
      msg.sender == owner() ||
        // msg.sender == admin ||
        admins[msg.sender] == true ||
        msg.sender == dev,
      'INVALID: YOU MUST BE AN ADMIN TO CONTINUE'
    );
    _;
  }

  modifier onlyStudent() {
    require(registry.isWhitelisted(msg.sender), 'INVALID: YOU MUST BE A STUDENT TO CONTINUE');
    _;
  }

  // set address of the admin account
  function setAdmin(address user) public onlyOwner {
    // admin = user;
    admins[user] = true;
  }

  function isAdmin(address user) public view returns (bool) {
    return admins[user];
  }

  function removeAdmin(address user) public onlyOwner {
    admins[user] = false;
  }

  // set address of the developer account
  function setDev(address _newDev) public onlyOwner {
    dev = _newDev;
  }

  // Set the address of the funding account
  function setFundAddress(address _fundAddress) public onlyOwner {
    fundAddress = _fundAddress;
  }

  function withdraw() public onlyOwner {
    uint256 _amount = cJpy.balanceOf(address(this));
    bool success = cJpy.transfer(fundAddress, _amount);
    require(success, 'ERROR: TXN FAILED');
  }

  function setRewardPoint(uint256 _rewardPoint) public onlyOwner {
    rewardPoint = _rewardPoint;
  }

  function setQuest(uint8 totalQuestions, uint128 answers) public onlyAdmin {
    // uint128 cannot store answers for more than 32 questions
    require(totalQuestions > 0 && totalQuestions < 32);
    weeklyQuest = Quest(block.timestamp, totalQuestions, answers);
  }

  function answerQuest(uint128 answer) public onlyStudent returns (uint256) {
    /**
     * Here we take XOR between the expected vs answered data
     * Example:
     * Expected (A) : 0x8421 = 1000 0100 0010 0001
     * Answered (B) : 0x8211 = 1000 0010 0001 0001
     *    A XOR B   : 0x0630 = 0000 0110 0011 0000
     *
     * XOR between these 2 values should give 0 for all correct answers and 1 for any differences
     *
     * Finally, We perform Bitwise shift  by 4 bits for each question and check if last 4 bits are 0000
     * since we have 4 options to check one by one
     **/
    require(
      userAttributes[msg.sender].answeredAt <= weeklyQuest.publishedDate,
      'ERROR: ALREADY ANSWERED'
    );
    uint128 result = answer ^ weeklyQuest.answer;
    // checking the difference between actual vs answered
    uint8 correctAnswers = 0;
    for (uint256 i = 0; i < weeklyQuest.totalQuestions; i++) {
      if (result % 0x10 == 0) {
        correctAnswers += 1;
        // if the number in binary ends with 0000, it is the correct answer
      }
      result = result >> 4;
    }
    uint256 rewards = rewardPoint * correctAnswers;
    userAttributes[msg.sender].point += rewards;
    userAttributes[msg.sender].answeredAt = block.timestamp;
    cJpy.transferFrom(fundAddress, msg.sender, rewards);
    // citCoin.transfer(msg.sender, rewards);
    emit CheckedAnswer(msg.sender, userAttributes[msg.sender].answeredAt);
    return correctAnswers;
  }

  function addStudents(address[] memory users) public onlyAdmin {
    registry.bulkAddToWhitelist(users);
  }

  function addStudent(address user) public onlyAdmin {
    registry.addToWhitelist(user);
  }

  function removeStudent(address user) public onlyAdmin {
    registry.removeFromWhitelist(user);
  }

  function removeStudents(address[] memory users) public onlyAdmin {
    registry.bulkRemoveFromWhitelist(users);
  }

  function isStudent(address user) public view onlyAdmin returns (bool) {
    return registry.isWhitelisted(user);
  }
}
