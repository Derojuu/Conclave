// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ConclaveAccessControl} from "../access/ConclaveAccessControl.sol";

/**
 * @title CampaignRegistry
 * @notice On-chain lifecycle and ownership anchor for Conclave evaluation campaigns.
 *
 * The registry stores no submissions, evaluations, scores, comments, or evaluator
 * identities. It only records campaign ownership, lifecycle state, and a commitment
 * to the off-chain evaluation and disclosure policy.
 */
contract CampaignRegistry is ConclaveAccessControl {
    /// @notice Backend or deployment identity allowed to anchor campaigns.
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    /// @notice DecisionRegistry role allowed to complete a campaign.
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");

    enum Status {
        NONE,
        DRAFT,
        OPEN,
        EVALUATING,
        COMPUTING,
        COMPLETED,
        ARCHIVED
    }

    struct Campaign {
        address owner;
        Status status;
        bool exists;
        address pendingOwner;
        bytes32 policyHash;
        uint64 createdAt;
        uint64 updatedAt;
    }

    /// @custom:storage-location erc7201:conclave.storage.CampaignRegistry
    struct CampaignRegistryStorage {
        mapping(bytes32 campaignId => Campaign) campaigns;
    }

    // keccak256(abi.encode(uint256(keccak256("conclave.storage.CampaignRegistry")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant STORAGE_SLOT =
        0x9e2b06ba61347f935fdf9d299e637402b16cf6b0e36792784a1b3a1d76881900;

    event CampaignRegistered(
        bytes32 indexed campaignId,
        address indexed owner,
        bytes32 policyHash
    );
    event CampaignStatusChanged(
        bytes32 indexed campaignId,
        Status indexed from,
        Status indexed to
    );
    event CampaignOwnershipTransferStarted(
        bytes32 indexed campaignId,
        address indexed from,
        address indexed to
    );
    event CampaignOwnershipTransferred(
        bytes32 indexed campaignId,
        address indexed from,
        address indexed to
    );
    event CampaignPolicyHashUpdated(
        bytes32 indexed campaignId,
        bytes32 previous,
        bytes32 current
    );

    error CampaignExists(bytes32 campaignId);
    error UnknownCampaign(bytes32 campaignId);
    error NotCampaignOwner(bytes32 campaignId, address caller);
    error NotPendingOwner(bytes32 campaignId, address caller);
    error BadTransition(bytes32 campaignId, Status from, Status to);
    error InvalidCampaignId();
    error EmptyPolicyHash();
    error ZeroAddress();

    modifier onlyCampaignOwner(bytes32 campaignId) {
        Campaign storage campaign = _load(campaignId);
        if (msg.sender != campaign.owner) {
            revert NotCampaignOwner(campaignId, msg.sender);
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) external initializer {
        if (admin == address(0)) revert ZeroAddress();
        __ConclaveAccessControl_init(admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    /**
     * @notice Anchors a new campaign in DRAFT state.
     * @param campaignId keccak256 of the canonical off-chain campaign ID.
     * @param owner Organization-controlled campaign owner.
     * @param policyHash Commitment to criteria, weights, result policy, and disclosure rules.
     */
    function registerCampaign(bytes32 campaignId, address owner, bytes32 policyHash)
        external
        whenNotPaused
        onlyRole(REGISTRAR_ROLE)
    {
        if (campaignId == bytes32(0)) revert InvalidCampaignId();
        if (owner == address(0)) revert ZeroAddress();
        if (policyHash == bytes32(0)) revert EmptyPolicyHash();

        CampaignRegistryStorage storage $ = _s();
        if ($.campaigns[campaignId].exists) revert CampaignExists(campaignId);

        uint64 timestamp = uint64(block.timestamp);
        $.campaigns[campaignId] = Campaign({
            owner: owner,
            status: Status.DRAFT,
            exists: true,
            pendingOwner: address(0),
            policyHash: policyHash,
            createdAt: timestamp,
            updatedAt: timestamp
        });

        emit CampaignRegistered(campaignId, owner, policyHash);
        emit CampaignStatusChanged(campaignId, Status.NONE, Status.DRAFT);
    }

    function openCampaign(bytes32 campaignId)
        external
        whenNotPaused
        onlyCampaignOwner(campaignId)
    {
        _transition(campaignId, Status.DRAFT, Status.OPEN);
    }

    function beginEvaluation(bytes32 campaignId)
        external
        whenNotPaused
        onlyCampaignOwner(campaignId)
    {
        _transition(campaignId, Status.OPEN, Status.EVALUATING);
    }

    function beginComputation(bytes32 campaignId)
        external
        whenNotPaused
        onlyCampaignOwner(campaignId)
    {
        _transition(campaignId, Status.EVALUATING, Status.COMPUTING);
    }

    /**
     * @notice Completes a campaign after DecisionRegistry records a verified result.
     */
    function markCompleted(bytes32 campaignId)
        external
        whenNotPaused
        onlyRole(PUBLISHER_ROLE)
    {
        _transition(campaignId, Status.COMPUTING, Status.COMPLETED);
    }

    /**
     * @notice Archives a draft or completed campaign.
     */
    function archiveCampaign(bytes32 campaignId)
        external
        whenNotPaused
        onlyCampaignOwner(campaignId)
    {
        Campaign storage campaign = _load(campaignId);
        if (campaign.status != Status.DRAFT && campaign.status != Status.COMPLETED) {
            revert BadTransition(campaignId, campaign.status, Status.ARCHIVED);
        }

        Status previous = campaign.status;
        campaign.status = Status.ARCHIVED;
        campaign.updatedAt = uint64(block.timestamp);
        emit CampaignStatusChanged(campaignId, previous, Status.ARCHIVED);
    }

    /**
     * @notice Updates the policy commitment while a campaign is still a draft.
     */
    function setPolicyHash(bytes32 campaignId, bytes32 policyHash)
        external
        whenNotPaused
        onlyCampaignOwner(campaignId)
    {
        if (policyHash == bytes32(0)) revert EmptyPolicyHash();

        Campaign storage campaign = _load(campaignId);
        if (campaign.status != Status.DRAFT) {
            revert BadTransition(campaignId, campaign.status, Status.DRAFT);
        }

        bytes32 previous = campaign.policyHash;
        campaign.policyHash = policyHash;
        campaign.updatedAt = uint64(block.timestamp);
        emit CampaignPolicyHashUpdated(campaignId, previous, policyHash);
    }

    function transferCampaignOwnership(bytes32 campaignId, address newOwner)
        external
        whenNotPaused
        onlyCampaignOwner(campaignId)
    {
        if (newOwner == address(0)) revert ZeroAddress();

        Campaign storage campaign = _load(campaignId);
        campaign.pendingOwner = newOwner;
        campaign.updatedAt = uint64(block.timestamp);
        emit CampaignOwnershipTransferStarted(campaignId, campaign.owner, newOwner);
    }

    function acceptCampaignOwnership(bytes32 campaignId) external whenNotPaused {
        Campaign storage campaign = _load(campaignId);
        if (msg.sender != campaign.pendingOwner) {
            revert NotPendingOwner(campaignId, msg.sender);
        }

        address previous = campaign.owner;
        campaign.owner = campaign.pendingOwner;
        campaign.pendingOwner = address(0);
        campaign.updatedAt = uint64(block.timestamp);
        emit CampaignOwnershipTransferred(campaignId, previous, msg.sender);
    }

    function getCampaign(bytes32 campaignId) external view returns (Campaign memory) {
        return _load(campaignId);
    }

    function statusOf(bytes32 campaignId) external view returns (Status) {
        return _load(campaignId).status;
    }

    function ownerOf(bytes32 campaignId) external view returns (address) {
        return _load(campaignId).owner;
    }

    function exists(bytes32 campaignId) external view returns (bool) {
        return _s().campaigns[campaignId].exists;
    }

    function _s() private pure returns (CampaignRegistryStorage storage $) {
        assembly {
            $.slot := STORAGE_SLOT
        }
    }

    function _load(bytes32 campaignId) private view returns (Campaign storage campaign) {
        campaign = _s().campaigns[campaignId];
        if (!campaign.exists) revert UnknownCampaign(campaignId);
    }

    function _transition(bytes32 campaignId, Status from, Status to) private {
        Campaign storage campaign = _load(campaignId);
        if (campaign.status != from) {
            revert BadTransition(campaignId, campaign.status, to);
        }

        campaign.status = to;
        campaign.updatedAt = uint64(block.timestamp);
        emit CampaignStatusChanged(campaignId, from, to);
    }
}
