// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IResultVerifier
 * @notice Swappable trust anchor for confidential-computation results.
 */
interface IResultVerifier {
    /**
     * @notice Verifies that an aggregate campaign result is authentic.
     * @param campaignId keccak256 of the canonical off-chain campaign ID.
     * @param resultHash Commitment to the published aggregate outcome.
     * @param taskId iExec Nox task identifier that produced the result.
     * @param proof Verifier-specific attestation.
     */
    function verifyResult(
        bytes32 campaignId,
        bytes32 resultHash,
        bytes32 taskId,
        bytes calldata proof
    ) external view returns (bool ok);
}
