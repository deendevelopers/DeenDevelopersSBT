// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@rari-capital/solmate/src/tokens/ERC721.sol";
import "@rari-capital/solmate/src/auth/Owned.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// TODO: make contract upgradable
// TODO: see if you save gas by not using Counters library
// TODO: write tests and test on testnet
contract DeenDevelopersSBT is ERC721, Owned, Pausable {
    error CannotTransferSBT();

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;

    constructor()
        ERC721("Deen Developers Hackathon", "DDH")
        Owned(msg.sender)
    {}

    function tokenURI(uint256 id) public view override returns (string memory) {
        ownerOf(id);
        return _tokenURIs[id];
    }

    function safeMint(address to, string memory uri) external onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
    }

    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    function burnMyToken(uint256 tokenId) public whenNotPaused {
        require(msg.sender == ownerOf(tokenId), "Unauthorized: Not your token");
        _burn(tokenId);
    }

    function pauseBurnMyToken() external onlyOwner {
        _pause();
    }

    function unpauseBurnMyToken() external onlyOwner {
        _unpause();
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public pure override {
        revert CannotTransferSBT();
    }
}
