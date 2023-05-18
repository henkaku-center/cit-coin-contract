// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IRegistry.sol';
import './Whitelistable.sol';
import './interfaces/ILearnToEarn.sol';

contract CitReward is ERC721, Ownable, Whitelistable {
  /**
   * @dev The contract CitReward is an ERC-721 compliant NFT that is received by
   * students who earns cJPY by answering questions from the LearnToEarn tests.
   * The contract is a non-fungible token that is earned by students in exchange
   * with the cJPY.
   */

  struct Attributes {
    uint256 point;
    uint256 claimableToken;
  }

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  IERC20 public cJPY;
  IRegistry public registry;
  ILearnToEarn public learnToEarn;

  uint256 public price;
  address public fundAddress;
  string private _contractURL;
  mapping(uint256 => string) public _tokenURLs;
  mapping(address => Attributes) public userAttributes;

  event BoughtCitReward(address _owner, uint256 _tokenId);

  modifier onlyNoneHolder(address _address){
    require(balanceOf(_address) == 0, 'ERROR: User must not be a token holder to continue');
    _;
  }
  modifier onlyHolder(address _address){
    require(balanceOf(_address) != 0, 'ERROR: User must be a token holder to continue');
    _;
  }

  modifier hasTokenId(uint256 _tokenId) {
    require(
      _exists(_tokenId),
      "ERC721Metadata: The token does not exist with this ID."
    );
    _;
  }

  constructor(
    IRegistry _registry,
    IERC20 _cJpy,
    address _learnToEarn,
    address _fundAddress
  ) ERC721('Cit Reward', 'cit-reward') Whitelistable(_registry) {
    setFundAddress(_fundAddress);
    cJPY = _cJpy;
    registry = _registry;
  }

  function setPrice(uint256 _price) public onlyOwner {
    require(_price >= 1e18, 'MUST BE GTE 1e18');
    price = _price;
  }

  function setFundAddress(address _fundAddress) public onlyOwner {
    fundAddress = _fundAddress;
  }

  function transferFrom(
    address _from,
    address _to,
    uint256 _tokenId
  ) public virtual override onlyOwner {
    _transfer(_from, _to, _tokenId);
  }
}
