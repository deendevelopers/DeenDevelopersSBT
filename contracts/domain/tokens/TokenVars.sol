// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract TokenVars {
    CountersUpgradeable.Counter internal _tokenIdCounter;
    mapping(uint256 => string) internal _tokenURIs;
    mapping(uint256 => bool) internal _isHttpURI;
    string internal _baseHttpURI;
}
