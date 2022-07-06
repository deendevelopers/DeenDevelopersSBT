// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../infra/Dependencies.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract TestUpgradable is Dependencies {
    CountersUpgradeable.Counter internal _tokenIdCounter;
    mapping(uint256 => string) internal _tokenURIs;
    mapping(uint256 => bool) internal _isHttpURI;
    string internal _baseHttpURI;
    string public newVariable;

    function burnMyToken(uint256) public pure {
        revert("this is a upgraded function with new logic");
    }

    function newFunction() public pure returns (string memory) {
        return "this is a new function";
    }
}
