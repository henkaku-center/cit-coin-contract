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
  uint256 public price;   // amount of cJPY needed to mint an NFT
  string private _contractURI;
  mapping(address => uint256) public earnedTokens;  // mapping of user vs earned token
  bool public locked;

  event BoughtNFT(address _owner, uint256 _tokenId);

  modifier onlyNoneHolder(address _address) {
    require(balanceOf(_address) == 0, 'ERROR: USER ALREADY HOLDS THIS NFT');
    _;
  }
  modifier onlyHolder(address _address) {
    require(balanceOf(_address) != 0, 'ERROR:USER DOES NOT HOLD THIS NFT');
    _;
  }

  modifier hasTokenId(uint256 _tokenId) {
    require(_exists(_tokenId), 'ERC721Metadata: NONEXISTENT TOKEN.');
    _;
  }

  modifier onlyUnlocked() {
    require(!locked, 'ERROR: CONTRACT LOCKED');
    _;
  }

  /** CIT NFT depends on 2 contracts cJPY and Registry.
   * cJPY is an ERC-20 compliant token that will be earned by students by
   * answering questions in LearnToEarn Contract.
   * Registry is the contract to whitelist different addresses with roles and
   * permissions to act upon.
   *
   * The Contract has to set certain price before someone can claim or buy an
   * NFT. The graphics is automatically generated off the chain and pinned in
   * the IPFS.
   *
   * @param _registry:  Address of the registry Contract
   * @param _cJpy:  Address of the cJpy Contract
   */
  constructor(IRegistry _registry, IERC20 _cJpy)
  ERC721('Cit NFT', 'CNFT')
  Whitelistable(_registry) {
    cJPY = _cJpy;
    registry = _registry;
    setPrice(1e22); // 10,000 CJPY
    locked = false;
  }

  /** This method is useful when we want the NFT to be locked and not claimable.
  * We will lock the contract whenever our course completes. Upon the completion
  * of the course, we can lock the contract so that transferring cJPY randomly
  * to some address will not make that address able to claim NFT.
  *
  * @param _status: new status of the contract.
  */
  function lock(bool _status) public onlyOwner {
    // locks or unlocks the faucet
    locked = _status;
  }


  /**
   * This method will be useful if we want to update the price of NFT in the
   * future.
   * @param _price New price of the contract in cJPY.
   */
  function setPrice(uint256 _price) public onlyOwner {
    /// Sets the price of the token that needs to be spent to earn the NFT.
    require(_price >= 1e18, 'NFT_PRICE_ERROR: THE PRICE CANNOT BE LESS THAN 1e18');
    price = _price;
  }

  function transferFrom(
    address _from,
    address _to,
    uint256 _tokenId
  ) public virtual override onlyOwner hasTokenId(_tokenId) {
    require(registry.isWhitelisted(_to), 'REGISTRY: USER NOT WHITELISTED');
    _transfer(_from, _to, _tokenId);
  }

  /**
   * This method will mint NFT to an address which has never holded any CitNFT.
   * If a student holds an NFT, they should get an error.
   *
   * The method should also deduct all the cJPY from the holder's account since
   * it is exchanged with cJPY.
   *
   * @param _tokenUri URL of the graphics pinned in the pinata server or similar IPFS system
   * @param _to  Address of the recipient of the NFT
   */
  function _mint(string memory _tokenUri, address _to) internal onlyNoneHolder(msg.sender) onlyUnlocked returns (uint256) {
    uint256 userBalance = cJPY.balanceOf(_to);
    require(userBalance >= price, 'CJPY: INSUFFICIENT FUNDS TO PURCHASE NFT');
    require(registry.isWhitelisted(_to), 'REGISTRY: USER NOT WHITELISTED');
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();
    _safeMint(_to, newItemId);
    _setTokenURI(newItemId, _tokenUri);
    emit BoughtNFT(_to, userBalance);
    return newItemId;
  }


  /**
   * This method works only when token is transferred between 2 addresses. It is
   * useful only when someone sends or sells NFT to another address.
   * @param _from Address of the current NFT Holder
   * @param _to  Address of the new NFT Holder
   * @param _tokenId Id of the NFT
   */
  function _afterTokenTransfer(address _from, address _to, uint256 _tokenId) internal virtual {
    earnedTokens[_to] = _tokenId;
    delete earnedTokens[_from];
  }

  /**
   * This method is useful when we have to update the token URL. We generally
   * update the token URL if we wish to change the IPFS server or we want to
   * update the graphics and pin the new graphics to the same NFT.
   * @param tokenId Id of the token to update
   * @param _newTokenUri New URL for the generated graphics or the file
   */
  function update(uint256 tokenId, string memory _newTokenUri) public onlyOwner hasTokenId(tokenId) {
    _setTokenURI(tokenId, _newTokenUri);
  }

  /**
   * This method is called by an owner of the contract when they want to reward
   * an student the NFT.
   * @param tokenURI URL of the generated Graphics (IPFS URL)
   * @param to Address of the recipient
   */
  function mintTo(string memory tokenURI, address to) external onlyOwner returns (uint256){
    return _mint(tokenURI, to);
  }

  /**
   * This method is called by a whitelisted person who has earned minimum point
   * specified in the `price` attribute of the contract.
   * @param tokenUri URL of the generated Graphics (IPFS URL)
   */
  function mint(string memory tokenUri) external returns (uint256) {
    return _mint(tokenUri, msg.sender);
  }
}
