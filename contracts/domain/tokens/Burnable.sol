// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../infra/Dependencies.sol";
import "./TokenVars.sol";

contract Burnable is Dependencies, TokenVars {
    function _burnToken(uint256 tokenId) internal {
        ERC721Upgradeable._burn(tokenId);

        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }

    function _burnMyToken(uint256 tokenId) internal {
        if (msg.sender != ownerOf(tokenId)) revert UnauthorizedCaller();
        _burnToken(tokenId);
    }
}
