// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract DeenDevelopersSBT is
    Initializable,
    ERC721Upgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    error CannotTransferSBT();
    error CannotApproveSBT();
    error UnauthorizedCaller();

    using StringsUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => bool) private _isHttpURI;
    string private _baseHttpURI;

    event UpdatedBaseURI(string oldBaseURI, string newBaseURI);

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
        _tokenURIs[tokenId] = uri;
    }

    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);

        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }

    function burn(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(tokenId);
    }

    function burnMyToken(uint256 tokenId) external whenNotPaused {
        if (msg.sender != ownerOf(tokenId)) revert UnauthorizedCaller();
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

    function updateBaseURI(string memory baseURI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        string memory prevURI = _baseHttpURI;
        _baseHttpURI = baseURI;
        emit UpdatedBaseURI(prevURI, _baseHttpURI);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireMinted(tokenId);

        if (_isHttpURI[tokenId]) {
            return string(abi.encodePacked(_baseHttpURI, tokenId.toString()));
        }

        return _tokenURIs[tokenId];
    }

    function switchURI(uint256 tokenId) external {
        if (
            msg.sender != ownerOf(tokenId) &&
            !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        ) revert UnauthorizedCaller();
        _isHttpURI[tokenId] = !_isHttpURI[tokenId];
    }
}
