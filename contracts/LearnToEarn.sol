// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CitCoin.sol";

contract LearnToEarn is Ownable {
    struct Quest {
        uint256 startedAt;
        string keyword;
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

    function setKeyword(string memory _keyword, uint256 startedAt) public onlyOwner {
        weeklyQuest = Quest(startedAt, _keyword);
    }

    function answerQuest(string memory _keyword) public {
        require(
            keccak256(abi.encodePacked(_keyword)) == keccak256(abi.encodePacked(weeklyQuest.keyword)),
            "WRONG ANSWER"
        );
        // This checks whether new weeklyQuest is available or not since answered timestamp will be always less than new
        // weeklyQuest timestamp
        require(
            userAttributes[msg.sender].answeredAt <= weeklyQuest.startedAt,
            "ALREADY ANSWERED"
        );
        userAttributes[msg.sender].point += rewardPoint;
        userAttributes[msg.sender].answeredAt = block.timestamp;
        citCoin.transferFrom(fundAddress, msg.sender, 5_000_000);
//        citCoin.transfer(msg.sender, 5_000_000);
        emit CheckedAnswer(msg.sender, userAttributes[msg.sender].answeredAt);
    }
}