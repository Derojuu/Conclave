// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AccessControlUpgradeable} from
    "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from
    "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {UUPSUpgradeable} from
    "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ConclaveAccessControl
 * @notice Shared upgradeable access layer for Conclave registries.
 *
 * Platform roles control upgrades, emergency pauses, and verified-result
 * publication. Campaign ownership remains scoped to each campaign record.
 */
abstract contract ConclaveAccessControl is
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    function __ConclaveAccessControl_init(address admin) internal onlyInitializing {
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PLATFORM_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
    }

    function pause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address)
        internal
        override
        onlyRole(PLATFORM_ADMIN_ROLE)
    {}
}
