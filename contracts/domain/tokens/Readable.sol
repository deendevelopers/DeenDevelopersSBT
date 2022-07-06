// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "../../infra/Dependencies.sol";
import "./TokenVars.sol";

contract Readable is Dependencies, TokenVars {
    using StringsUpgradeable for uint256;

    function _updateBaseURI(string memory baseURI)
        internal
        returns (string memory)
    {
        string memory prevURI = _baseHttpURI;
        _baseHttpURI = baseURI;
        return prevURI;
    }

    function _switchURI(uint256 tokenId) internal {
        if (
            msg.sender != ERC721Upgradeable.ownerOf(tokenId) &&
            !AccessControlUpgradeable.hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        ) revert UnauthorizedCaller();
        _isHttpURI[tokenId] = !_isHttpURI[tokenId];
    }

    function _tokenURI(uint256 tokenId) internal view returns (string memory) {
        ERC721Upgradeable._requireMinted(tokenId);

        if (_isHttpURI[tokenId]) {
            return string(abi.encodePacked(_baseHttpURI, tokenId.toString()));
        }

        return _tokenURIs[tokenId];
    }
}
