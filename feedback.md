# iExec Nox Tooling Feedback

This feedback comes from integrating Nox into Conclave, a real Next.js decision
workflow that encrypts evaluator scores, aggregates them in a confidential
contract, and publishes proof-verified totals on Ethereum Sepolia.

## What Worked Well

- The Solidity SDK makes the privacy boundary visible in code. The sequence of
  `Nox.fromExternal`, encrypted arithmetic, ACL grants, and
  `Nox.allowPublicDecryption` is understandable during review.
- Binding an encrypted input to a destination contract in
  `encryptInput(value, type, contractAddress)` is a strong default and fits a
  browser-wallet flow well.
- The Handle SDK integrates with Viem without requiring users to change
  wallets.
- Public decryption proofs allow Conclave to publish aggregate results without
  asking the backend to be trusted as the result authority.
- The Hardhat starter's end-to-end examples are useful references for the full
  encrypt, transact, resolve, and decrypt cycle.

## Friction Encountered

1. The distinction between current Nox confidential contracts and older iExec
   privacy iApp workflows was not obvious from search results. It is easy to
   incorrectly conclude that a Nox dApp needs an iApp address, a custom worker,
   or an application gateway.
2. The starter emphasizes Docker because its local integration harness needs
   it. A separate first-class managed-testnet guide would make it clearer that
   Docker is not required for a Sepolia front end using managed Nox services.
3. The deployable network table, NoxCompute addresses, compatible package
   versions, and managed gateway URLs should be available together on one
   versioned documentation page.
4. Nox supports a deliberately small encrypted type set. A prominent type
   support matrix near the getting-started flow would help product teams decide
   early how to encode domain data such as ratings, fixed-point values, enums,
   and text.
5. The SDK's branded handle types occasionally require explicit TypeScript
   narrowing when passing values between Viem contract reads and public
   decryption. More framework-specific examples would reduce guesswork.
6. Production guidance for retrying handle resolution and public-decryption
   requests would help applications build resilient transaction UX.

## Suggested Documentation Additions

- A "managed Sepolia dApp" tutorial covering contract deployment, Handle SDK
  setup, browser encryption, and public decryption without a local stack.
- A concise "Nox vs privacy iApps" page explaining when each architecture is
  appropriate.
- A package compatibility table for `@iexec-nox/handle`,
  `@iexec-nox/nox-protocol-contracts`, and the Hardhat plugin.
- Copyable React/Wagmi examples for account switching, chain enforcement,
  transaction confirmation, and decryption-proof retry behavior.
- Explorer links and status endpoints for every managed testnet component.

## Overall

Nox provides a credible route to confidential computation while retaining
normal EVM transactions and wallet composability. The core APIs are compact;
the largest integration cost was determining the correct managed-testnet
architecture and separating it from older iExec deployment models.
