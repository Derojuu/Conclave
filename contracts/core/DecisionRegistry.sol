// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ConclaveAccessControl} from "../access/ConclaveAccessControl.sol";
import {CampaignRegistry} from "./CampaignRegistry.sol";
import {IResultVerifier} from "../verify/IResultVerifier.sol";

/**
 * @title DecisionRegistry
 * @notice Records aggregate-only confidential decision commitments.
 *
 * The chain never stores plaintext scores, rankings, comments, evaluator
 * identities, or encrypted evaluation payloads. It anchors the result
 * commitment, an optional selected submission reference, the Nox receipt
 * commitment, and the provider task identifier.
 */
contract DecisionRegistry is ConclaveAccessControl {
    struct Result {
        bytes32 resultHash;
        bytes32 selectedSubmissionRef;
        bytes32 receiptHash;
        bytes32 taskId;
        uint64 publishedAt;
        bool exists;
    }

    /// @custom:storage-location erc7201:conclave.storage.DecisionRegistry
    struct DecisionRegistryStorage {
        CampaignRegistry campaignRegistry;
        IResultVerifier verifier;
        mapping(bytes32 campaignId => Result) results;
        mapping(bytes32 taskId => bool) usedTaskIds;
    }

    // keccak256(abi.encode(uint256(keccak256("conclave.storage.DecisionRegistry")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant STORAGE_SLOT =
        0x2ca34994c1c96baa0ff71f3ae3a36f9bf726ca6cacd53a268e843af940ec0300;

    event ResultPublished(
        bytes32 indexed campaignId,
        bytes32 indexed selectedSubmissionRef,
        bytes32 resultHash,
        bytes32 taskId
    );
    event VerifierUpdated(address indexed previous, address indexed current);
    event CampaignRegistryUpdated(address indexed previous, address indexed current);

    error ResultAlreadyPublished(bytes32 campaignId);
    error TaskIdAlreadyUsed(bytes32 taskId);
    error CampaignNotComputing(bytes32 campaignId);
    error InvalidAttestation(bytes32 campaignId, bytes32 taskId);
    error InvalidCommitment();
    error ZeroAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin, address campaignRegistry_, address verifier_)
        external
        initializer
    {
        if (admin == address(0) || campaignRegistry_ == address(0) || verifier_ == address(0)) {
            revert ZeroAddress();
        }

        __ConclaveAccessControl_init(admin);
        DecisionRegistryStorage storage $ = _s();
        $.campaignRegistry = CampaignRegistry(campaignRegistry_);
        $.verifier = IResultVerifier(verifier_);
        emit CampaignRegistryUpdated(address(0), campaignRegistry_);
        emit VerifierUpdated(address(0), verifier_);
    }

    function setVerifier(address newVerifier) external onlyRole(PLATFORM_ADMIN_ROLE) {
        if (newVerifier == address(0)) revert ZeroAddress();

        DecisionRegistryStorage storage $ = _s();
        emit VerifierUpdated(address($.verifier), newVerifier);
        $.verifier = IResultVerifier(newVerifier);
    }

    function setCampaignRegistry(address newRegistry)
        external
        onlyRole(PLATFORM_ADMIN_ROLE)
    {
        if (newRegistry == address(0)) revert ZeroAddress();

        DecisionRegistryStorage storage $ = _s();
        emit CampaignRegistryUpdated(address($.campaignRegistry), newRegistry);
        $.campaignRegistry = CampaignRegistry(newRegistry);
    }

    /**
     * @notice Publishes one verified aggregate result for a campaign.
     * @param campaignId keccak256 of the canonical off-chain campaign ID.
     * @param resultHash Commitment to the complete aggregate result document.
     * @param selectedSubmissionRef Optional keccak256 submission reference, or zero.
     * @param receiptHash Commitment to the confidential-computation receipt.
     * @param taskId iExec Nox task identifier.
     * @param proof Verifier-specific result attestation.
     */
    function publishResult(
        bytes32 campaignId,
        bytes32 resultHash,
        bytes32 selectedSubmissionRef,
        bytes32 receiptHash,
        bytes32 taskId,
        bytes calldata proof
    ) external whenNotPaused onlyRole(VERIFIER_ROLE) {
        if (campaignId == bytes32(0) || resultHash == bytes32(0)) {
            revert InvalidCommitment();
        }
        if (receiptHash == bytes32(0) || taskId == bytes32(0)) {
            revert InvalidCommitment();
        }

        DecisionRegistryStorage storage $ = _s();
        if ($.results[campaignId].exists) {
            revert ResultAlreadyPublished(campaignId);
        }
        if ($.usedTaskIds[taskId]) revert TaskIdAlreadyUsed(taskId);
        if ($.campaignRegistry.statusOf(campaignId) != CampaignRegistry.Status.COMPUTING) {
            revert CampaignNotComputing(campaignId);
        }
        if (!$.verifier.verifyResult(campaignId, resultHash, taskId, proof)) {
            revert InvalidAttestation(campaignId, taskId);
        }

        $.usedTaskIds[taskId] = true;
        $.results[campaignId] = Result({
            resultHash: resultHash,
            selectedSubmissionRef: selectedSubmissionRef,
            receiptHash: receiptHash,
            taskId: taskId,
            publishedAt: uint64(block.timestamp),
            exists: true
        });

        $.campaignRegistry.markCompleted(campaignId);
        emit ResultPublished(campaignId, selectedSubmissionRef, resultHash, taskId);
    }

    function getResult(bytes32 campaignId) external view returns (Result memory) {
        return _s().results[campaignId];
    }

    function isPublished(bytes32 campaignId) external view returns (bool) {
        return _s().results[campaignId].exists;
    }

    function isTaskIdUsed(bytes32 taskId) external view returns (bool) {
        return _s().usedTaskIds[taskId];
    }

    function campaignRegistry() external view returns (address) {
        return address(_s().campaignRegistry);
    }

    function verifier() external view returns (address) {
        return address(_s().verifier);
    }

    function _s() private pure returns (DecisionRegistryStorage storage $) {
        assembly {
            $.slot := STORAGE_SLOT
        }
    }
}
