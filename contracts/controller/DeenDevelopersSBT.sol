// SPDX-License-Identifier: MIT
/*
██████╗░███████╗███████╗███╗░░██╗██████╗░███████╗██╗░░░██╗███████╗██╗░░░░░░█████╗░██████╗░███████╗██████╗░░██████╗
██╔══██╗██╔════╝██╔════╝████╗░██║██╔══██╗██╔════╝██║░░░██║██╔════╝██║░░░░░██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝
██║░░██║█████╗░░█████╗░░██╔██╗██║██║░░██║█████╗░░╚██╗░██╔╝█████╗░░██║░░░░░██║░░██║██████╔╝█████╗░░██████╔╝╚█████╗░
██║░░██║██╔══╝░░██╔══╝░░██║╚████║██║░░██║██╔══╝░░░╚████╔╝░██╔══╝░░██║░░░░░██║░░██║██╔═══╝░██╔══╝░░██╔══██╗░╚═══██╗
██████╔╝███████╗███████╗██║░╚███║██████╔╝███████╗░░╚██╔╝░░███████╗███████╗╚█████╔╝██║░░░░░███████╗██║░░██║██████╔╝
╚═════╝░╚══════╝╚══════╝╚═╝░░╚══╝╚═════╝░╚══════╝░░░╚═╝░░░╚══════╝╚══════╝░╚════╝░╚═╝░░░░░╚══════╝╚═╝░░╚═╝╚═════╝░
*/

pragma solidity 0.8.4;

import "../infra/Dependencies.sol";
import "../domain/tokens/Mintable.sol";
import "../domain/tokens/Readable.sol";
import "../domain/tokens/Burnable.sol";
import "../domain/accessRoles/AccessRoles.sol";

/**
 * @title Deen Developers NFT Hackathon Contract
 *
 * @notice This contract is used to issue tokens for participants of
 * Deen Developer Hackathons. Tokens are SBT (Soulbound Tokens) which
 * means that they are non-transferrable. This is because the ability to
 * transfer your token diminishes the value of the NFT as participants 
 * can sell/transfer their token to a non-participant.
 *
 * By default this contract publishes non-PII data and will only store 
 * PII with the users explicit consent.
 *
 * This contract aims to be GDPR compliant by hosting token metadata 
 * with PII on centralized infrastructure i.e. controlled by the team. 
 * Holders can make a request to remove their PII by contacting us.
 * 
 * All tokens with non-PII metadata are hosted permanently on Arweave+IPFS. 
 * In order to give holders the choice of permanance they can execute the 
 * switch function which host non identifiable data on decentralized 
 * infrastructure if applicable.
 *
 * @dev SBT is implemented by overriding the transfer and approve functions
 * of OpenZeppelin's ERC-721 contract. Non-personalized token metadata is permanently
 * stored on Arweave tagging the metadata's CID onto the tag "IPFS-Add". An
 * IPFS extension exists on Arweave nodes to pin files tagged with "IPFS-Add" on
 * IPFS. In the event that files get unpinned, they can be found by querying "IPFS-Add"
 * tag on Arweave with the CID value. The file can then be recovered and re-pinned to
 * IPFS.
 *
 * @author Russell Choudhury (https://github.com/TheKnightCoder)
 * @author Sparx (https://github.com/letsgitcracking)
 *
 * @custom:contact team@deendevelopers.com
 */

contract DeenDevelopersSBT is
    Dependencies,
    AccessRoles,
    Mintable,
    Readable,
    Burnable
{
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
     * will either return personalized metadata hosted on admins infrastructure
     * or non-personalized metadata hosted on Arweave+IPFS. This can be switched
     * by token holders by calling the switchURI function.
	 *
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
     * @notice Will switch the token metadata to personalized metadata hosted on
     * admins infrastructure to non-personalized metadata hosted on Arweave+IPFS.
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
     * used to host personalized SBTs pointing to admin controlled infrastructure.
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
     * @param uri The URI link to the metadata of the token
     * @notice Mint SBT to an address, minting restricted to authorized accounts
     * controlled by multi-sig contract
     */
    function safeMint(address to, string memory uri)
        external
        onlyRole(MINTER_ROLE)
    {
        Mintable._safeMint(to, uri);
    }

    /**
     * @param tokenId The Id of the token you want to burn
     * @notice Burn any token, burning restricted to the multi-sig contract, to burn a token you own; refer to BurnMyToken
     * @dev burn transfers the token to the burn address 0x00..00 and deletes the URI from storage
     */
    function burn(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Burnable._burnToken(tokenId);
    }

    /**
     * @param tokenId The Id of the token you want to burn
     * @notice Burn a token you own, caller must pass the ID of the token
     * @dev burning transfers the token to the burn address 0x00..00 and deletes the URI from storage
     */
    function burnMyToken(uint256 tokenId)
        external
        whenNotPaused
        onlyTokenHolder(tokenId)
    {
        Burnable._burnToken(tokenId);
    }

    /**
     * @notice Pauses burnMyToken, restricted to multi-sig contract
     */
    function pauseBurnMyToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._pause();
    }

    /**
     * @notice Unpauses burnMyToken, restricted to multi-sig contract
     */
    function unpauseBurnMyToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
        PausableUpgradeable._unpause();
    }
}
