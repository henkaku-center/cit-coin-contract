// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract CitCoin is ERC20, Ownable {
    uint256 private maxSupply = 1_000_000_000e18;
    mapping(address => bool) private whitelist;
    address public dev; // EOA which updates whitelist systematically like using crontab.
    address public gateKeeper;
    bool unlock;

    constructor() ERC20("CitCoin", "CIT") {
        // when initializing the ERC20, the initial value is locked
//        _mint(msg.sender, 1000);
    }

    //    function _mintMinerReward() internal {
    //        _mint(block.coinbase, 1000);
    //    }

    function mint(address _to, uint256 amount) public onlyOwner {
        // The mint function should allow user to mint the token that is within the max supply limit
        require(maxSupply >= (totalSupply() + amount), "EXCEED MAX SUPPLY");
        _mint(_to, amount);
    }

    function burn(address _of, uint256 amount) public {
        // The burn function is used to burn own token.
        // If someone tries to burn other people's token, it should raise "INVALID: NOT YOUR ASSET"
        require(
            _of == msg.sender || msg.sender == owner(),
            "INVALID: NOT YOUR ASSET"
        );
        _burn(_of, amount);
    }

    modifier onlyAllowed(address sender) {
        // needs user to be whitelisted to be allowed to perform actions
        require(whitelist[sender], "INVALID: NOT ALLOWED");
        _;
    }

    modifier onlyAdmin() {
        // This modifier checks whether the sender is owner or developer
        require(
            msg.sender == owner() ||
            msg.sender == gateKeeper ||
            msg.sender == dev,
            "INVALID: ONLY ADMIN CAN EXECUTE"
        );
        _;
    }

    function isAllowed(address user) public view onlyOwner returns (bool) {
        // This function checks whether the user is in the whitelist or not
        return whitelist[user];
    }

    function unLock() public onlyOwner {
        unlock = true;
    }

    function setDevAddress(address user) public onlyOwner {
        dev = user;
    }

    function setGateKeeper(address user) public onlyOwner {
        // Setting the gatekeeper who is going to manage the network
        gateKeeper = user;
    }

    function addWhitelistUsers(address[] memory users) public onlyAdmin {
        for (uint256 i = 0; i < users.length; i++) {
            addWhitelistUser(users[i]);
        }
    }

    function addWhitelistUser(address user) public onlyAdmin {
        whitelist[user] = true;
    }

    function removeWhitelistUsers(address[] memory users) public onlyAdmin {
        for (uint256 i = 0; i < users.length; i++) {
            removeWhitelistUser(users[i]);
        }
    }

    function removeWhitelistUser(address user) public onlyAdmin {
        whitelist[user] = false;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(
            whitelist[from] || unlock || from == address(0),
            "INVALID: SENDER IS NOT ALLOWED"
        );
        require(
            whitelist[to] || unlock || from == address(0),
            "INVALID: RECEIVER IS NOT ALLOWED"
        );
    }
}