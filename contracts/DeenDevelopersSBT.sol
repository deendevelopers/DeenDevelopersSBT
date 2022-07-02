// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DeenDevelopersSBT is
    Initializable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    error CannotTransferSBT();

    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;

    function initialize() external initializer {
        __ERC721_init("Deen Developers Hackathon", "DDH");
        __Ownable_init();
        __Pausable_init();
    }

    function safeMint(address to, string memory uri) external onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    function burnMyToken(uint256 tokenId) public whenNotPaused {
        require(
            msg.sender == ownerOf(tokenId),
            "Unauthorized: caller is not token owner"
        );
        _burn(tokenId);
    }

    function pauseBurnMyToken() external onlyOwner {
        _pause();
    }

    function unpauseBurnMyToken() external onlyOwner {
        _unpause();
    }

    function _transfer(
        address,
        address,
        uint256
    ) internal pure override {
        revert CannotTransferSBT();
    }
}
