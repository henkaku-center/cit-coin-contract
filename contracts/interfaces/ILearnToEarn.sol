// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;


interface ILearnToEarn {
  /// @title ILearnToEarn
  /// @notice This is the interface for the LearnToEarnContract.
  /// This interface is can be used on the other contract that has dependency
  /// with LearnToEarn contract.
  /// @author ghimiresdp

  function setAdmin(address _user) external;

  function isAdmin() external returns (bool);

  function removeAdmin(address _user) external;

  function setFundAddress(address _fundAddress) external;

  function withdraw() external;

  function setRewardPoint(uint256 _points) external;

  function setQuest(uint8 _totalQuestions, uint128 answers) external;

  function answerQuest(uint128 answer) external returns (uint256);

  function addStudents(address[] memory _users) external;

  function addStudent(address _user) external;

  function removeStudents(address[] memory _users) external;

  function removeStudent(address _user) external;

  function isStudent(address _user) external returns (bool);
}
