// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CitCoin.sol";

contract LearnToEarn is Ownable {
    struct Quest {
        // We can store  32 answers with 4 options with uint128 answers
        /**
         * We can store 16 answers with 4 choices if we use uint128
         * Example: Q1 has first correct and Q2 has second correct answer, we can represent it as
         * Q1: A, Q2: B = 1000 0100 = 0x84
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
    CitCoin public citCoin;
    Quest private weeklyQuest;
    mapping(address => Attributes) public userAttributes;

    // Events
    event CheckedAnswer(address _by, uint256 at);
    event ClaimedToken(address _by, uint256 _amount);

    constructor(address _citCoin, address _fundAddress){
        fundAddress = _fundAddress;
        citCoin = CitCoin(_citCoin);

    }

    // Set the address of the funding account
    function setFundAddress(address _fundAddress) public onlyOwner {
        fundAddress = _fundAddress;
    }

    function withdraw() public onlyOwner {
        uint256 _amount = citCoin.balanceOf(address(this));
        bool success = citCoin.transfer(fundAddress, _amount);
        require(success, "TXN FAILED");
    }

    function setRewardPoint(uint256 _rewardPoint) public onlyOwner {
        rewardPoint = _rewardPoint;
    }

    function setQuest(uint8 totalQuestions, uint128 answers) public onlyOwner {
        // uint128 cannot store answers for more than 32 questions
        require(totalQuestions > 0 && totalQuestions < 32);
        weeklyQuest = Quest(block.timestamp, totalQuestions, answers);
    }

    function answerQuest(uint128 answer) public {
        // This checks whether new weeklyQuest is available or not since answered timestamp will be always less than new
        // weeklyQuest timestamp
        require(
            userAttributes[msg.sender].answeredAt <= weeklyQuest.publishedDate,
            "ALREADY ANSWERED"
        );
        uint128 result = answer ^ weeklyQuest.answer;
        uint8 correctAnswers = 0;
        for (uint256 i = 0; i < weeklyQuest.totalQuestions; i++) {
            if (result % 16 == 0) {
                correctAnswers += 1;
            }
            result = result >> 4;
        }
        userAttributes[msg.sender].point += rewardPoint * correctAnswers;
        userAttributes[msg.sender].answeredAt = block.timestamp;
        citCoin.transferFrom(fundAddress, msg.sender, rewardPoint * correctAnswers);
        //        citCoin.transfer(msg.sender, rewardPoint * correctAnswers);
        emit CheckedAnswer(msg.sender, userAttributes[msg.sender].answeredAt);
    }
}
