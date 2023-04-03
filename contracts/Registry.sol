// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./interfaces/IRegistry.sol";
import "./Ownable.sol";

/// @title Registry
/// @notice This contract is used to manage the whitelist of addresses that can be used across the Chibarihill program.
/// @author thev
contract Registry is IRegistry, Ownable {
    mapping(address => bool) public whitelist;

    event Whitelisted(address indexed member);

    constructor() {}

    /// @notice This function is used to bulk add addresses to the whitelist.
    /// @param members Array of addresses of the members of cohort to add.
    function bulkAddToWhitelist(address[] calldata members) external onlyOwner {
        for (uint256 i = 0; i < members.length; i++) {
            _whitelist(members[i]);
        }
    }

    /// @notice This function is used to add addresses to the whitelist.
    /// @param member Address of the member to add.
    function addToWhitelist(address member) external onlyOwner {
        _whitelist(member);
    }

    function _whitelist(address member) internal {
        whitelist[member] = true;
        emit Whitelisted(member);
    }

    /// @notice This function is used to check if an address is whitelisted.
    /// @dev this call assumes that you are interested in the current cohort
    /// @param member Address of the member to check.
    /// @return True if the address is whitelisted, false otherwise.
    function isWhitelisted(address member) public view returns (bool) {
        return whitelist[member];
    }

    /// @notice This function is used to check if an array of addresses are whitelisted.
    /// @param members Array of addresses of the members to check.
    /// @return True if all addresses are whitelisted, false otherwise.
    function areWhitelisted(address[] calldata members) external view returns (bool) {
        for (uint256 i = 0; i < members.length; ++i) {
            if (!isWhitelisted(members[i])) return false;
        }
        return true;
    }
}
