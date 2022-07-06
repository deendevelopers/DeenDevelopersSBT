// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "../infra/Dependencies.sol";
import "../domain/tokens/Mintable.sol";
import "../domain/tokens/Readable.sol";
import "../domain/tokens/Burnable.sol";
import "../domain/accessRoles/AccessRoles.sol";

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/**
 * @title Deen Developers Hackathon
 * @notice This contract is used to issue tokens for participants of
 * Deen Developer Hackathons. Tokens are SBT (Soul Bound Tokens) which
 * means that they are non-transferrable NFTs. This was decided as being
 * able to transfer your token deminishes its value of proving participation
 * in the Hackathon as participants can sell/transfer their token to a
 * non-participant.
 *
 * This token also implements GDPR compliance for SBTs that have metadata with
 * holders personal information. This is acheived by hosting SBT metadata with
 * personal information on infrastructure controlled by the admins. Holders can
 * request for personal information to be removed by contacting the team. All
 * token metadata without personal information are hosted on Arweave+IPFS and
 * there is no way to remove it to maintain the timelessness of the SBTs. In
 * order to give that same persistance and timelessness to SBTs with personal
 * information a switch function has been implemented, which can be triggered
 * by users to switch the personal metadata of the token from the admin
 * controlled infrastructure to the Arweave+IPFS counterpart without personal
 * information. This ensures that in the event that admin infrastructure is
 * unavailable, holders will have a persistant and timelessness SBT. To trigger
 * this switch holders can call switchURI function passing the token ID, this
 * is reversable by calling the function again.
 *
 * @dev SBT is implemented by overriding the transfer and approve functions
 * of OpenZeppelin ERC-721 contract. Non-personalisedToken metadata is permanently
 * stored on Areweave tagging the metadata's CID onto the tag name IPFS-Add. An
 * IPFS extension exists on Arweave nodes to pin files tagged with IPFS-Add onto
 * IPFS. In the event that files get untagged, they can be found by querying IPFS-Add
 * tag on Arweave with the CID value. The file can then be recovered and re-pinned to
 * IPFS.
 */
contract DeenDevelopersSBT is
    Dependencies,
    AccessRoles,
    Mintable,
    Readable,
    Burnable
{
    using StringsUpgradeable for uint256;

    /**
     * @dev Initializes the contract, can only be called once. This is required
     * as contract is UUPS upgradeable and constructors do not work with
     * upgradeable proxy contracts.
     */
    function initialize() external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        __ERC721_init("Deen Developers Hackathon", "DDH");
        __Pausable_init();
    }

    /**
     * @notice approve has been disabled as this token is non-transferable and
     * therefore has no use
     */
    function approve(address, uint256) public pure override {
        revert CannotApproveSBT();
    }

    /**
     * @notice approve has been disabled as this token is non-transferable and
     * therefore has no use
     */
    function setApprovalForAll(address, bool) public pure override {
        revert CannotApproveSBT();
    }

    /**
     * @param tokenId The Id of the token
     * @notice Will return the metadata URI given a token ID. The metadata
     * will either return personalised metadata hosted on admins infrastructure
     * or non-personalised metadata hosted on Arweave+IPFS. This can be switched
     * by token holders by calling the switchURI function.
     * @dev tokenURI switching is determined by the _isHttpURI mapping which
     * maps tokenIds to a boolean, if true the _baseHttpURI concatenated with the
     * tokenId is returned, if false the _tokenURIs mapping is returned.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return Readable._tokenURI(tokenId);
    }

    /**
     * @param tokenId The Id of the token
     * @notice Will switch the token metadata to personalised metadata hosted on
     * admins infrastructure to non-personalised metadata hosted on Arweave+IPFS.
     * And vice versa.
     * @dev tokenURI switching is determined by the _isHttpURI mapping which
     * maps tokenIds to a boolean.
     */
    function switchURI(uint256 tokenId) external {
        Readable._switchURI(tokenId);
    }

    /**
     * @param baseURI the base URI for switched tokens to _isHttpURI true
     * @notice This can only be called by multi-sig admins to change the baseURI
     * used to host personalised SBTs pointint to admin controlled infrastructure.
     */
    function updateBaseURI(string memory baseURI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        string memory prevURI = Readable._updateBaseURI(baseURI);
        emit UpdatedBaseURI(prevURI, _baseHttpURI);
    }

    /**
     * @param to The address where the token will be sent to
     * @param uri The uri link to the metadata of the token
     * @notice Mint SBT to an Address, minting restricted to authorized accounts
     * controlled by multi-sig admins
     */
    function safeMint(address to, string memory uri)
        external
        onlyRole(MINTER_ROLE)
    {
        Mintable._safeMint(to, uri);
    }

    /**
     * @param tokenId The Id of the token you want to burn
     * @notice Burn any token, burning restricted to the multi-sig admins, to burn a token you own see BurnMyToken
     * @dev burning transfers the token to the burn address 0x00..00 and deletes the URI from state var
     */
    function burn(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Burnable._burnToken(tokenId);
    }

    /**
     * @param tokenId The Id of the token you want to burn
     * @notice Burn a token you own, caller must pass the ID of the token
     * @dev burning transfers the token to the burn address 0x00..00 and deletes the URI from state var
     */
    function burnMyToken(uint256 tokenId)
        external
        whenNotPaused
        onlyTokenHolder(tokenId)
    {
        Burnable._burnToken(tokenId);
    }

    /**
     * @notice Pauses burnMyToken, restricted to multi-sig admins
     */
    function pauseBurnMyToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._pause();
    }

    /**
     * @notice Unpauses burnMyToken, restricted to multi-sig admins
     */
    function unpauseBurnMyToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._unpause();
    }
}
