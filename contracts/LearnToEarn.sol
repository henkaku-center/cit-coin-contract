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

    function answerQuest(uint128 answer) public returns (uint) {
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
            "ALREADY ANSWERED"
        );
        uint128 result = answer ^ weeklyQuest.answer;
        // checking the difference between actual vs answered
        uint8 correctAnswers = 0;
        for (uint256 i = 0; i < weeklyQuest.totalQuestions; i++) {
            if (result % 0x10 == 0) {// checking if the number in binary ends with 0000
                correctAnswers += 1;
                // if the number in binary ends with 0000, it is the correct answer
            }
            result = result >> 4;
        }
        uint256 rewards = rewardPoint * correctAnswers;
        userAttributes[msg.sender].point += rewards;
        userAttributes[msg.sender].answeredAt = block.timestamp;
        citCoin.transferFrom(fundAddress, msg.sender, rewards);
        // citCoin.transfer(msg.sender, rewards);
        emit CheckedAnswer(msg.sender, userAttributes[msg.sender].answeredAt);
        return correctAnswers;
    }
}
