import { isAddress, keccak256, toHex, type Address, type Hex } from "viem";

export const NOX_SCORE_SCALE = 1_000_000;
export const NOX_CHAIN_ID = 11_155_111;

export function toNoxId(value: string): Hex {
  return keccak256(toHex(value));
}

export function getNoxContractAddress(): Address | null {
  const value = process.env.NEXT_PUBLIC_CONCLAVE_NOX_ADDRESS?.trim();
  return value && isAddress(value) ? value : null;
}

export function requireNoxContractAddress(): Address {
  const address = getNoxContractAddress();
  if (!address) {
    throw new Error("NEXT_PUBLIC_CONCLAVE_NOX_ADDRESS is not configured.");
  }
  return address;
}

export const confidentialDecisionEngineAbi = [
  {
    type: "function",
    name: "createCampaign",
    stateMutability: "nonpayable",
    inputs: [
      { name: "campaignId", type: "bytes32" },
      { name: "submissionIds", type: "bytes32[]" },
      { name: "authorizedEvaluators", type: "address[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submitScore",
    stateMutability: "nonpayable",
    inputs: [
      { name: "campaignId", type: "bytes32" },
      { name: "submissionId", type: "bytes32" },
      { name: "inputHandle", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "finalizeCampaign",
    stateMutability: "nonpayable",
    inputs: [{ name: "campaignId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "publishResults",
    stateMutability: "nonpayable",
    inputs: [
      { name: "campaignId", type: "bytes32" },
      { name: "decryptionProofs", type: "bytes[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "campaignInfo",
    stateMutability: "view",
    inputs: [{ name: "campaignId", type: "bytes32" }],
    outputs: [
      { name: "administrator", type: "address" },
      { name: "exists", type: "bool" },
      { name: "finalized", type: "bool" },
      { name: "published", type: "bool" },
      { name: "evaluatorCount", type: "uint32" },
      { name: "submissionCount", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getAggregateHandle",
    stateMutability: "view",
    inputs: [
      { name: "campaignId", type: "bytes32" },
      { name: "submissionId", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getSubmissionCount",
    stateMutability: "view",
    inputs: [
      { name: "campaignId", type: "bytes32" },
      { name: "submissionId", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint32" }],
  },
  {
    type: "function",
    name: "getPublishedTotal",
    stateMutability: "view",
    inputs: [
      { name: "campaignId", type: "bytes32" },
      { name: "submissionId", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getPublishedWinner",
    stateMutability: "view",
    inputs: [{ name: "campaignId", type: "bytes32" }],
    outputs: [
      { name: "submissionId", type: "bytes32" },
      { name: "total", type: "uint256" },
      { name: "evaluatorCount", type: "uint32" },
    ],
  },
  {
    type: "function",
    name: "isEvaluator",
    stateMutability: "view",
    inputs: [
      { name: "campaignId", type: "bytes32" },
      { name: "evaluator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "hasSubmitted",
    stateMutability: "view",
    inputs: [
      { name: "campaignId", type: "bytes32" },
      { name: "submissionId", type: "bytes32" },
      { name: "evaluator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "ScoreSubmitted",
    anonymous: false,
    inputs: [
      { name: "campaignId", type: "bytes32", indexed: true },
      { name: "submissionId", type: "bytes32", indexed: true },
      { name: "evaluator", type: "address", indexed: true },
      { name: "encryptedScoreHandle", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ResultPublished",
    anonymous: false,
    inputs: [
      { name: "campaignId", type: "bytes32", indexed: true },
      { name: "winnerSubmissionId", type: "bytes32", indexed: true },
      { name: "winningTotal", type: "uint256", indexed: false },
      { name: "evaluatorCount", type: "uint256", indexed: false },
    ],
  },
] as const;
