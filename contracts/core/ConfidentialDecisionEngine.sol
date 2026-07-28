// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    Nox,
    ebool,
    euint256,
    externalEuint256
} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

/**
 * @title ConfidentialDecisionEngine
 * @notice Aggregates normalized evaluation scores without exposing individual values.
 *
 * Campaign, submission, and evaluator participation are public. Individual scores
 * remain Nox encrypted. Only aggregate totals become publicly decryptable after
 * every authorized evaluator has submitted once for every submission.
 */
contract ConfidentialDecisionEngine is Ownable {
    uint256 public constant SCORE_SCALE = 1_000_000;
    uint256 public constant MAX_SUBMISSIONS = 20;
    uint256 public constant MAX_EVALUATORS = 50;

    struct Campaign {
        address administrator;
        bool exists;
        bool finalized;
        bool published;
        uint32 evaluatorCount;
        bytes32 winnerSubmissionId;
        uint256 winningTotal;
        bytes32[] submissionIds;
    }

    mapping(bytes32 campaignId => Campaign campaign) private campaigns;
    mapping(bytes32 campaignId => mapping(address evaluator => bool authorized))
        private evaluators;
    mapping(bytes32 campaignId => mapping(bytes32 submissionId => bool registered))
        private submissions;
    mapping(bytes32 campaignId => mapping(bytes32 submissionId => euint256 total))
        private aggregateTotals;
    mapping(bytes32 campaignId => mapping(bytes32 submissionId => uint32 count))
        private submissionCounts;
    mapping(
        bytes32 campaignId
            => mapping(bytes32 submissionId => mapping(address evaluator => bool submitted))
    ) private scoreSubmissions;
    mapping(bytes32 campaignId => mapping(bytes32 submissionId => uint256 total))
        private publishedTotals;

    event CampaignCreated(
        bytes32 indexed campaignId,
        address indexed administrator,
        uint256 submissionCount,
        uint256 evaluatorCount
    );
    event ScoreSubmitted(
        bytes32 indexed campaignId,
        bytes32 indexed submissionId,
        address indexed evaluator,
        bytes32 encryptedScoreHandle
    );
    event CampaignFinalized(bytes32 indexed campaignId);
    event ResultPublished(
        bytes32 indexed campaignId,
        bytes32 indexed winnerSubmissionId,
        uint256 winningTotal,
        uint256 evaluatorCount
    );

    error CampaignAlreadyExists(bytes32 campaignId);
    error CampaignNotFound(bytes32 campaignId);
    error CampaignAlreadyFinalized(bytes32 campaignId);
    error CampaignNotFinalized(bytes32 campaignId);
    error ResultAlreadyPublished(bytes32 campaignId);
    error NotCampaignAdministrator(bytes32 campaignId, address caller);
    error EvaluatorNotAuthorized(bytes32 campaignId, address evaluator);
    error SubmissionNotFound(bytes32 campaignId, bytes32 submissionId);
    error ScoreAlreadySubmitted(
        bytes32 campaignId,
        bytes32 submissionId,
        address evaluator
    );
    error EvaluationsIncomplete(
        bytes32 campaignId,
        bytes32 submissionId,
        uint256 received,
        uint256 expected
    );
    error InvalidCampaignConfiguration();
    error InvalidDecryptionProofCount();

    constructor() Ownable(msg.sender) {}

    function createCampaign(
        bytes32 campaignId,
        bytes32[] calldata submissionIds,
        address[] calldata authorizedEvaluators
    ) external {
        if (campaigns[campaignId].exists) {
            revert CampaignAlreadyExists(campaignId);
        }
        if (
            campaignId == bytes32(0) || submissionIds.length == 0
                || submissionIds.length > MAX_SUBMISSIONS
                || authorizedEvaluators.length == 0
                || authorizedEvaluators.length > MAX_EVALUATORS
        ) {
            revert InvalidCampaignConfiguration();
        }

        Campaign storage campaign = campaigns[campaignId];
        campaign.administrator = msg.sender;
        campaign.exists = true;
        campaign.evaluatorCount = uint32(authorizedEvaluators.length);

        for (uint256 index = 0; index < submissionIds.length; index++) {
            bytes32 submissionId = submissionIds[index];
            if (submissionId == bytes32(0) || submissions[campaignId][submissionId]) {
                revert InvalidCampaignConfiguration();
            }

            submissions[campaignId][submissionId] = true;
            campaign.submissionIds.push(submissionId);
            euint256 zero = Nox.toEuint256(0);
            aggregateTotals[campaignId][submissionId] = zero;
            Nox.allowThis(zero);
            Nox.allow(zero, msg.sender);
        }

        for (uint256 index = 0; index < authorizedEvaluators.length; index++) {
            address evaluator = authorizedEvaluators[index];
            if (evaluator == address(0) || evaluators[campaignId][evaluator]) {
                revert InvalidCampaignConfiguration();
            }
            evaluators[campaignId][evaluator] = true;
        }

        emit CampaignCreated(
            campaignId,
            msg.sender,
            submissionIds.length,
            authorizedEvaluators.length
        );
    }

    function submitScore(
        bytes32 campaignId,
        bytes32 submissionId,
        externalEuint256 inputHandle,
        bytes calldata inputProof
    ) external {
        Campaign storage campaign = _campaign(campaignId);
        if (campaign.finalized) revert CampaignAlreadyFinalized(campaignId);
        if (!evaluators[campaignId][msg.sender]) {
            revert EvaluatorNotAuthorized(campaignId, msg.sender);
        }
        if (!submissions[campaignId][submissionId]) {
            revert SubmissionNotFound(campaignId, submissionId);
        }
        if (scoreSubmissions[campaignId][submissionId][msg.sender]) {
            revert ScoreAlreadySubmitted(campaignId, submissionId, msg.sender);
        }

        euint256 score = Nox.fromExternal(inputHandle, inputProof);
        euint256 maximum = Nox.toEuint256(SCORE_SCALE);
        euint256 zero = Nox.toEuint256(0);
        ebool withinRange = Nox.le(score, maximum);
        euint256 boundedScore = Nox.select(withinRange, score, zero);
        euint256 current = aggregateTotals[campaignId][submissionId];
        (ebool additionSucceeded, euint256 updated) = Nox.safeAdd(
            current,
            boundedScore
        );
        euint256 nextTotal = Nox.select(additionSucceeded, updated, current);

        aggregateTotals[campaignId][submissionId] = nextTotal;
        scoreSubmissions[campaignId][submissionId][msg.sender] = true;
        submissionCounts[campaignId][submissionId] += 1;
        Nox.allowThis(nextTotal);
        Nox.allow(nextTotal, campaign.administrator);

        emit ScoreSubmitted(
            campaignId,
            submissionId,
            msg.sender,
            externalEuint256.unwrap(inputHandle)
        );
    }

    function finalizeCampaign(bytes32 campaignId) external {
        Campaign storage campaign = _campaign(campaignId);
        _onlyAdministrator(campaignId, campaign);
        if (campaign.finalized) revert CampaignAlreadyFinalized(campaignId);

        for (uint256 index = 0; index < campaign.submissionIds.length; index++) {
            bytes32 submissionId = campaign.submissionIds[index];
            uint256 received = submissionCounts[campaignId][submissionId];
            if (received != campaign.evaluatorCount) {
                revert EvaluationsIncomplete(
                    campaignId,
                    submissionId,
                    received,
                    campaign.evaluatorCount
                );
            }
            Nox.allowPublicDecryption(aggregateTotals[campaignId][submissionId]);
        }

        campaign.finalized = true;
        emit CampaignFinalized(campaignId);
    }

    function publishResults(bytes32 campaignId, bytes[] calldata decryptionProofs)
        external
    {
        Campaign storage campaign = _campaign(campaignId);
        _onlyAdministrator(campaignId, campaign);
        if (!campaign.finalized) revert CampaignNotFinalized(campaignId);
        if (campaign.published) revert ResultAlreadyPublished(campaignId);
        if (decryptionProofs.length != campaign.submissionIds.length) {
            revert InvalidDecryptionProofCount();
        }

        bytes32 winner;
        uint256 highest;
        for (uint256 index = 0; index < campaign.submissionIds.length; index++) {
            bytes32 submissionId = campaign.submissionIds[index];
            uint256 total = Nox.publicDecrypt(
                aggregateTotals[campaignId][submissionId],
                decryptionProofs[index]
            );
            publishedTotals[campaignId][submissionId] = total;
            if (index == 0 || total > highest) {
                highest = total;
                winner = submissionId;
            }
        }

        campaign.published = true;
        campaign.winnerSubmissionId = winner;
        campaign.winningTotal = highest;
        emit ResultPublished(campaignId, winner, highest, campaign.evaluatorCount);
    }

    function campaignInfo(bytes32 campaignId)
        external
        view
        returns (
            address administrator,
            bool exists,
            bool finalized,
            bool published,
            uint32 evaluatorCount,
            uint256 submissionCount
        )
    {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.administrator,
            campaign.exists,
            campaign.finalized,
            campaign.published,
            campaign.evaluatorCount,
            campaign.submissionIds.length
        );
    }

    function getSubmissionIds(bytes32 campaignId)
        external
        view
        returns (bytes32[] memory)
    {
        return _campaign(campaignId).submissionIds;
    }

    function getAggregateHandle(bytes32 campaignId, bytes32 submissionId)
        external
        view
        returns (bytes32)
    {
        _requireSubmission(campaignId, submissionId);
        return euint256.unwrap(aggregateTotals[campaignId][submissionId]);
    }

    function getSubmissionCount(bytes32 campaignId, bytes32 submissionId)
        external
        view
        returns (uint32)
    {
        _requireSubmission(campaignId, submissionId);
        return submissionCounts[campaignId][submissionId];
    }

    function getPublishedTotal(bytes32 campaignId, bytes32 submissionId)
        external
        view
        returns (uint256)
    {
        Campaign storage campaign = _campaign(campaignId);
        if (!campaign.published) revert CampaignNotFinalized(campaignId);
        _requireSubmission(campaignId, submissionId);
        return publishedTotals[campaignId][submissionId];
    }

    function getPublishedWinner(bytes32 campaignId)
        external
        view
        returns (bytes32 submissionId, uint256 total, uint32 evaluatorCount)
    {
        Campaign storage campaign = _campaign(campaignId);
        if (!campaign.published) revert CampaignNotFinalized(campaignId);
        return (
            campaign.winnerSubmissionId,
            campaign.winningTotal,
            campaign.evaluatorCount
        );
    }

    function isEvaluator(bytes32 campaignId, address evaluator)
        external
        view
        returns (bool)
    {
        return campaigns[campaignId].exists && evaluators[campaignId][evaluator];
    }

    function hasSubmitted(
        bytes32 campaignId,
        bytes32 submissionId,
        address evaluator
    ) external view returns (bool) {
        return scoreSubmissions[campaignId][submissionId][evaluator];
    }

    function _campaign(bytes32 campaignId)
        private
        view
        returns (Campaign storage campaign)
    {
        campaign = campaigns[campaignId];
        if (!campaign.exists) revert CampaignNotFound(campaignId);
    }

    function _requireSubmission(bytes32 campaignId, bytes32 submissionId)
        private
        view
    {
        _campaign(campaignId);
        if (!submissions[campaignId][submissionId]) {
            revert SubmissionNotFound(campaignId, submissionId);
        }
    }

    function _onlyAdministrator(bytes32 campaignId, Campaign storage campaign)
        private
        view
    {
        if (msg.sender != campaign.administrator) {
            revert NotCampaignAdministrator(campaignId, msg.sender);
        }
    }
}
