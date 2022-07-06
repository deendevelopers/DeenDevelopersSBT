// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../../infra/Dependencies.sol";
import "./TokenVars.sol";

contract Mintable is Dependencies, TokenVars {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    function _safeMint(address to, string memory uri) internal {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _tokenURIs[tokenId] = uri;
        ERC721Upgradeable._safeMint(to, tokenId);
    }
}
