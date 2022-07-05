// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DeenDevelopersSBT is
    Initializable,
    ERC721URIStorageUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    error CannotTransferSBT();
    error CannotApproveSBT();

    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;

    function initialize() external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        __ERC721_init("Deen Developers Hackathon", "DDH");
        __Pausable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return
            ERC721Upgradeable.supportsInterface(interfaceId) ||
            AccessControlUpgradeable.supportsInterface(interfaceId);
    }

    function safeMint(address to, string memory uri)
        external
        onlyRole(MINTER_ROLE)
    {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function burn(uint256 tokenId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(tokenId);
    }

    function burnMyToken(uint256 tokenId) public whenNotPaused {
        require(
            msg.sender == ownerOf(tokenId),
            "Unauthorized: caller is not token owner"
        );
        _burn(tokenId);
    }

    function pauseBurnMyToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpauseBurnMyToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _transfer(
        address,
        address,
        uint256
    ) internal pure override {
        revert CannotTransferSBT();
    }

    function approve(address, uint256) public pure override {
        revert CannotApproveSBT();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert CannotApproveSBT();
    }
}
