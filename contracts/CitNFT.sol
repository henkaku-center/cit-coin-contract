// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IRegistry.sol';
import './Whitelistable.sol';
import './interfaces/ILearnToEarn.sol';

/**
 * @dev The contract CitNFT is an ERC-721 compliant NFT that is received in
   * exchange for cJPY that is earned by students answering questions from the
   * LearnToEarn tests. The ERC721URIStorage provides attributes and methods to
   * store mappings for NFTs and their URIs.
   */
contract CitNFT is ERC721URIStorage, Ownable, Whitelistable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  IERC20 public cJPY;
  ILearnToEarn public learnToEarn;

  uint256 public price;   // amount of cJPY needed to mint an NFT
  string private _contractURI;
  mapping(address => uint256) public earnedTokens;  // mapping of user vs earned token

  event BoughtNFT(address _owner, uint256 _tokenId);

  modifier onlyNoneHolder(address _address) {
    require(balanceOf(_address) == 0, 'ERROR: User must not be a token holder to continue');
    _;
  }
  modifier onlyHolder(address _address) {
    require(balanceOf(_address) != 0, 'ERROR: User must be a token holder to continue');
    _;
  }

  modifier hasTokenId(uint256 _tokenId) {
    require(_exists(_tokenId), 'ERC721Metadata: NONEXISTENT TOKEN.');
    _;
  }

  /**
   * @param _registry:  Address of the registry Contract
   * @param _cJpy:  Address of the cJpy Contract
   * @param _learnToEarn: Address of the Learn to Earn Contract
   */
  constructor(IRegistry _registry, IERC20 _cJpy, ILearnToEarn _learnToEarn)
  ERC721('Cit NFT', 'CNFT')
  Whitelistable(_registry) {
    cJPY = _cJpy;
    registry = _registry;
    learnToEarn = _learnToEarn;
    setPrice(8000e18);
  }

  function setPrice(uint256 _price) public onlyOwner {
    /// Sets the price of the token that needs to be spent to earn the NFT.
    require(_price >= 1e18, 'MUST BE GTE 1e18');
    price = _price;
  }

  function transferFrom(
    address _from,
    address _to,
    uint256 _tokenId
  ) public virtual override onlyOwner {
    _transfer(_from, _to, _tokenId);
  }

  function _mint(string memory _tokenUri, address _to) internal onlyNoneHolder(msg.sender) returns (uint256) {
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();
    _safeMint(_to, newItemId);
    _setTokenURI(newItemId, _tokenUri);
    return newItemId;
  }


  function _afterTokenTransfer(address _from, address _to, uint256 _tokenId) internal virtual {
    earnedTokens[_to] = _tokenId;
    delete earnedTokens[_from];
  }

  function updateNFT(uint256 tokenId, string memory finalTokenUri) public onlyOwner {
    _setTokenURI(tokenId, finalTokenUri);
  }

  function claimToken() public onlyHolder(msg.sender) {
    (uint256 points,) = learnToEarn.userAttributes(msg.sender);
    require(cJPY.balanceOf(address(this)) >= points, 'INSUFFICIENT FUND IN WALLET');
    bool success = cJPY.transfer(msg.sender, points);
    require(success, 'TX FAILED');
    emit BoughtNFT(msg.sender, points);
  }
}
