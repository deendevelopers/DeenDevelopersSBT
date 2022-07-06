// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../infra/Dependencies.sol";
import "../domain/tokens/Mintable.sol";
import "../domain/tokens/Readable.sol";
import "../domain/tokens/Burnable.sol";
import "../domain/accessRoles/AccessRoles.sol";

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract DeenDevelopersSBT is
    Dependencies,
    AccessRoles,
    Mintable,
    Readable,
    Burnable
{
    using StringsUpgradeable for uint256;

    function initialize() external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        __ERC721_init("Deen Developers Hackathon", "DDH");
        __Pausable_init();
    }

    function approve(address, uint256) public pure override {
        revert CannotApproveSBT();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert CannotApproveSBT();
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return Readable._tokenURI(tokenId);
    }

    function switchURI(uint256 tokenId) external {
        Readable._switchURI(tokenId);
    }

    function updateBaseURI(string memory baseURI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        string memory prevURI = Readable._updateBaseURI(baseURI);
        emit UpdatedBaseURI(prevURI, _baseHttpURI);
    }

    function safeMint(address to, string memory uri)
        external
        onlyRole(MINTER_ROLE)
    {
        Mintable._safeMint(to, uri);
    }

    function burn(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Burnable._burnToken(tokenId);
    }

    function burnMyToken(uint256 tokenId)
        external
        whenNotPaused
        onlyTokenHolder(tokenId)
    {
        Burnable._burnToken(tokenId);
    }

    function pauseBurnMyToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._pause();
    }

    function unpauseBurnMyToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._unpause();
    }
}
