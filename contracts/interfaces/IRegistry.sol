// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

error MemberNotWhitelisted(address member);
error NotWhitelisted();

/// @title IRegistry
/// @notice This is the interface for a registry contract
/// @author thev
interface IRegistry {
    function isWhitelisted(address member) external view returns (bool);
    function areWhitelisted(address[] calldata member) external view returns (bool);
}
