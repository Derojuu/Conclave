# Managed Nox Sepolia Guide

This guide covers the Web3 path actually implemented in Conclave. It uses
Ethereum Sepolia, the official iExec Nox Handle SDK, the managed Nox
infrastructure selected by that SDK, and the repository's confidential smart
contract.

There is no custom computation server, callback webhook, RSA key, or separate
privacy iApp in this architecture.

## Architecture

```text
Evaluator enters criterion values in the browser
                |
                v
Browser computes one normalized weighted score (0 to 1,000,000)
                |
                v
@iexec-nox/handle encrypts uint256 for ConfidentialDecisionEngine
                |
                v
Evaluator submits handle + proof on Ethereum Sepolia
                |
                v
Nox confidential operations add encrypted scores per submission
                |
                v
Admin finalizes after every required score exists
                |
                v
Nox public-decryption proofs reveal aggregate totals only
                |
                v
Contract verifies proofs and publishes winner + aggregate totals
                |
                v
Conclave backend verifies receipt/event and records the ranking
```

Criterion values and the weighted individual score are never sent to the
Conclave backend in plaintext. The database stores the Nox handle, proof,
transaction hash, and verification context. Public chain observers can see
participation and encrypted handles, but not individual score values.

The final total for each submission is intentionally public after all assigned
evaluators have submitted. Text comments are not part of the Nox payload
because the current Nox contract types used here aggregate numeric values.

## Network and Limits

| Setting                                   | Value                                    |
| ----------------------------------------- | ---------------------------------------- |
| Network                                   | Ethereum Sepolia                         |
| Chain ID                                  | `11155111`                               |
| Score range                               | `0` to `1,000,000`                       |
| Maximum submissions per on-chain campaign | `20`                                     |
| Maximum evaluators per on-chain campaign  | `50`                                     |
| Supported Conclave criterion types        | Numeric, scale, star, boolean, pass/fail |

Do not use free-text rubric criteria in a Nox campaign. Nox aggregation in this
contract is numeric, and the evaluator screen will reject a template that
contains a free-text rubric.

## One-Time Deployment

Complete the four Web3 values in
[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md), then deploy:

```powershell
$env:SEPOLIA_RPC_URL="https://YOUR_SEPOLIA_RPC_ENDPOINT"
$env:SEPOLIA_PRIVATE_KEY="0xYOUR_FUNDED_DEPLOYER_PRIVATE_KEY"
npx --yes pnpm@10.13.1 deploy:nox:sepolia
```

Copy the printed `ConfidentialDecisionEngine` address into Vercel as
`NEXT_PUBLIC_CONCLAVE_NOX_ADDRESS` and redeploy. One contract deployment can
host many Conclave campaigns.

## Wallet Preparation

The organization administrator and every evaluator need:

1. A wallet account linked from Conclave account settings.
2. The same wallet connected in RainbowKit when signing a transaction.
3. Ethereum Sepolia selected.
4. Enough Sepolia ETH for contract transactions.

The administrator pays for campaign initialization, finalization, and result
publication. Each evaluator pays for one score-submission transaction per
submission.

Use separate wallet accounts when demonstrating multiple evaluators. The
contract rejects a campaign configuration containing duplicate evaluator
addresses.

## End-to-End Vercel Test

### 1. Prepare the Organization

1. Sign in to the deployed Vercel application with the administrator's Google
   account.
2. Link the administrator's Sepolia wallet in account settings.
3. Create an organization.
4. Invite evaluator accounts and assign the evaluator role.
5. Ask each evaluator to sign in, accept the invitation, and link a unique
   Sepolia wallet.

### 2. Build the Campaign

1. Create an evaluation template with at least one weighted numeric, scale,
   star, boolean, or pass/fail criterion.
2. Create a campaign using that template.
3. Add between 1 and 20 submissions.
4. Assign between 1 and 50 evaluators.
5. Move the campaign through its normal states until it reaches
   **Evaluating**.

Do not change the submission list or evaluator assignments after initializing
the on-chain campaign. The confidential contract deliberately freezes those
participants for the campaign.

### 3. Initialize Nox

1. Open the campaign's **Results** page as an administrator.
2. Connect the linked administrator wallet on Sepolia.
3. Click **Initialize Nox campaign**.
4. Approve the wallet transaction and wait for confirmation.

The transaction registers hashes of the campaign and submission UUIDs plus
the authorized evaluator wallet addresses. It does not publish submission
content.

### 4. Submit Evaluations

For every evaluator and every submission:

1. Sign in with the evaluator's Google account.
2. Connect the wallet linked to that account.
3. Open the assigned submission evaluation.
4. Complete every criterion.
5. Click **Encrypt and submit**.
6. Approve the Sepolia transaction.
7. Wait for the confirmed-success message before leaving the page.

The browser normalizes each criterion, applies its weight, encrypts the final
score with `@iexec-nox/handle`, and submits only the encrypted handle and proof.
The backend records the evaluation only after independently verifying the
transaction sender, destination, calldata, receipt, and `ScoreSubmitted`
event.

Each evaluator can submit only once for each submission.

### 5. Finalize and Publish

1. Return to **Results** as the administrator.
2. Connect the linked administrator wallet.
3. Click **Finalize Nox decision**.
4. Approve the finalization transaction.
5. Wait while the browser obtains public-decryption proofs for every aggregate.
6. Approve the result-publication transaction.

Finalization reverts if even one assigned evaluator has not evaluated every
submission. The publication transaction verifies each Nox proof inside the
contract, records the aggregate totals, selects the highest total, and emits
`ResultPublished`.

Conclave's API then verifies that real event and reads the totals from the
contract before saving the verified result. It does not accept mock result
data.

## What Judges Can Verify

Judges can inspect:

- `contracts/core/ConfidentialDecisionEngine.sol` for `Nox.fromExternal`,
  confidential arithmetic, access control, and public proof verification.
- `components/evaluations/confidential-evaluation-form.tsx` for official Handle
  SDK encryption.
- The evaluation API route for transaction and event verification.
- `components/results/nox-campaign-control.tsx` for finalization and Nox public
  decryption.
- The computation API route for verified result persistence.
- Sepolia transactions emitted by the deployed application.

## Docker Clarification

Docker is not required to deploy the contract to Sepolia, deploy the Next.js
application to Vercel, or run the managed-Sepolia demo above.

The repository includes an optional `pnpm test:nox` contract integration test.
Like iExec's official Hardhat starter, that one command boots a local Nox stack
and therefore requires Docker. It is separated from `pnpm test` and is not a
prerequisite for your Vercel workflow.

## Troubleshooting

**"Connect the linked wallet"**

The connected address must exactly match the address saved in the signed-in
user's Conclave profile.

**"Switch to Ethereum Sepolia"**

Change the network in the connected wallet to Sepolia, chain ID `11155111`.

**"Every assigned evaluator must link a valid wallet"**

At least one assigned evaluator has not linked a wallet. Ask them to link one
before initialization.

**Campaign finalization reverted**

Every assigned evaluator must submit one score for every registered
submission. Check the evaluation progress and submit the missing assignments.

**Nox gateway or handle resolution failed**

Confirm the wallet is on Sepolia, the RPC endpoint works, and the deployed
address is correct. Then check the current iExec Nox service status or ask in
the iExec Discord WTF support channel.

**Result recording failed after publication**

Do not republish. The publication transaction is already on-chain. Retry the
Results page flow or submit the existing publication transaction to the API;
the backend uses the confirmed receipt as its source of truth.
