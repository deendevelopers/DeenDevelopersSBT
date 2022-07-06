// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./Errors.sol";
import "./Events.sol";

contract Dependencies is
    UUPSUpgradeable,
    PausableUpgradeable,
    ERC721Upgradeable,
    AccessControlUpgradeable,
    Errors,
    Events
{
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}

    /**
     * @dev This function is used by all external transfer functions
     * implemented by ERC721Upgradeable. Therefore to disable transferability
     * this function has been overriden and disabled
     */
    function _transfer(
        address,
        address,
        uint256
    ) internal pure override {
        revert CannotTransferSBT();
    }

    /**
     * @dev The following functions are overrides required by Solidity.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
