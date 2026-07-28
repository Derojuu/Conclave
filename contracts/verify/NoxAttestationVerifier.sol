// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IResultVerifier} from "./IResultVerifier.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NoxAttestationVerifier
 * @notice Verifies an EIP-712 attestation from the trusted Nox result signer.
 *
 * The verifier is intentionally replaceable through DecisionRegistry rather
 * than upgradeable itself. A production PoCo verifier can replace this signer
 * implementation without changing the decision registry.
 */
contract NoxAttestationVerifier is IResultVerifier, EIP712, Ownable {
    bytes32 public constant RESULT_TYPEHASH =
        keccak256("Result(bytes32 campaignId,bytes32 resultHash,bytes32 taskId)");

    address public trustedSigner;

    event TrustedSignerUpdated(address indexed previous, address indexed current);

    error ZeroSigner();

    constructor(address initialSigner, address initialOwner)
        EIP712("ConclaveNoxAttestation", "1")
        Ownable(initialOwner)
    {
        if (initialSigner == address(0)) revert ZeroSigner();
        trustedSigner = initialSigner;
        emit TrustedSignerUpdated(address(0), initialSigner);
    }

    function setTrustedSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroSigner();
        emit TrustedSignerUpdated(trustedSigner, newSigner);
        trustedSigner = newSigner;
    }

    function verifyResult(
        bytes32 campaignId,
        bytes32 resultHash,
        bytes32 taskId,
        bytes calldata proof
    ) external view returns (bool ok) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(RESULT_TYPEHASH, campaignId, resultHash, taskId))
        );
        (address recovered, ECDSA.RecoverError error,) = ECDSA.tryRecover(digest, proof);
        return error == ECDSA.RecoverError.NoError && recovered == trustedSigner;
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
