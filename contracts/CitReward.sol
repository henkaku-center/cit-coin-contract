// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IRegistry.sol";

contract CitReward is ERC721, Ownable {
  /**
   * @dev The contract CitReward is an ERC-721 compliant NFT that is received by
   * students who earns cJPY by answering questions from the LearnToEarn tests.
   * The contract is a non-fungible token that is earned by students in exchange
   * with the cJPY.
   */

  struct Attributes{
    uint256 point;
    uint256 claimableToken;
  }


  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  IERC20 public cJPY;
  IRegistry public registry;

  uint256 public price;
  uint256 public rewardPoint;
  uint256 public rewardCjpy;
  address public fundAddress;
  string private _contractURL;

  mapping (uint256 => string) public _tokenURLs;
  mapping (address => Attributes) public userAttributes;

}
