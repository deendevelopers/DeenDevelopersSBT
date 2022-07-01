// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@rari-capital/solmate/src/tokens/ERC721.sol";
import "@rari-capital/solmate/src/auth/Owned.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DeenDevelopersSBT is ERC721, Owned {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("Deen Developers SBT", "DDS") Owned(msg.sender) {}

    function tokenURI(uint256 id) public view override returns (string memory) {
        ownerOf(id);
        return _tokenURIs[id];
    }

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
    }

    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public pure override {
        revert("DeenDeveloperSBT: No transfer for soul bound tokens");
    }
}
