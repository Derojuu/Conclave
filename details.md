# Conclave

<img width="1200" height="630" alt="conclave-social" src="https://github.com/user-attachments/assets/f3a480fb-607a-4051-8ebf-7d9b2c71e5d5" />

## Project Description

Conclave is a confidential decision-making platform for organizations. It
helps teams run structured evaluation campaigns, collect independent scores
from authorized evaluators, combine those scores without exposing individual
opinions, and publish a verifiable aggregate result.

It is designed for decisions where both fairness and confidentiality matter,
such as grant reviews, hiring panels, scholarship selection, procurement,
investment committees, research assessment, and admissions.

Unlike a normal form or voting application, Conclave does not require an
administrator to see every evaluator's score before calculating the result.
Each evaluator's weighted score is encrypted in the browser, submitted to an
iExec Nox confidential smart contract, and aggregated while encrypted. The
individual score remains private while the final ranking and selected outcome
can be verified on Ethereum Sepolia.

### One-line Description

Conclave lets organizations compute trusted group decisions without exposing
the individual judgments behind them.

### Short Pitch

Most decision platforms collect private evaluations into a database that an
administrator can read or change. Conclave replaces that trust assumption with
confidential computation. Evaluators submit encrypted weighted scores, iExec
Nox aggregates them without revealing the individual values, and the smart
contract publishes only the final totals and winning submission after every
required evaluation is complete.

## The Problem

Important organizational decisions depend on people giving honest,
independent judgments. However, the software used to collect those judgments
usually makes them visible to administrators or other reviewers.

This creates several problems.

### Individual evaluations are exposed

Traditional survey, spreadsheet, and committee-management tools store scores
as readable data. Database administrators, organizers, and application
operators may be able to inspect every evaluator's response.

### Reviewers can influence one another

When reviewers can see earlier scores or opinions, they may anchor their own
assessment around those values. This weakens independent judgment and can
produce artificial consensus.

### Hierarchy and politics affect outcomes

Evaluators may change their scores when they know a manager, committee chair,
or influential participant can inspect their exact position. This is especially
harmful in hiring, funding, admissions, and procurement.

### The result requires blind trust

If an administrator calculates the final result in a private database,
participants must trust that the inputs were not changed, excluded, reordered,
or incorrectly calculated.

### Privacy and verification appear to conflict

Organizations often feel forced to choose between two weak options:

- reveal individual evaluations so that the calculation can be checked; or
- keep evaluations hidden and ask everyone to trust the result publisher.

Conclave is built to avoid that tradeoff.

## The Solution

Conclave separates private evaluation inputs from the public decision output.

The platform provides the complete operational workflow an organization needs:
organizations, members, roles, invitations, campaigns, evaluation templates,
submissions, evaluator assignments, deadlines, notifications, audit logs, and
result pages.

iExec Nox provides the confidential computation layer. Instead of sending a
plaintext score to the Conclave server, the evaluator's browser calculates a
normalized weighted score and encrypts it for the Conclave smart contract. The
contract combines encrypted scores without revealing their individual values.

Only after every authorized evaluator has submitted one score for every
submission can the campaign be finalized. Nox then produces public-decryption
proofs for the aggregate totals. The contract verifies those proofs, publishes
the totals, and selects the submission with the highest score.

Conclave's backend independently verifies the published blockchain
transaction before recording the final ranking in the application database.
The backend cannot invent a verified result because the blockchain receipt,
contract event, aggregate totals, and winner must all agree.

## How Conclave Works

### 1. Create an organization

An owner creates an organization and invites the people who will manage,
observe, or evaluate its campaigns.

Organization roles define what each person can do:

- **Owner:** full control over the organization and its data.
- **Admin:** manages members, templates, campaigns, submissions, and results.
- **Evaluator:** views assigned campaigns and submits confidential evaluations.
- **Observer:** has read-only access to permitted organizational information.
- **Super admin:** monitors the overall Conclave platform across organizations.

### 2. Build an evaluation template

An administrator defines the criteria used to assess each submission. Every
criterion includes a label, description, score range, and weight.

The confidential numeric workflow supports:

- numeric scores;
- scales;
- star ratings;
- boolean yes/no decisions; and
- pass/fail decisions.

Each value is normalized to a common range before its weight is applied. This
allows criteria with different score ranges to contribute fairly to one final
weighted score.

### 3. Create a campaign

The administrator creates a campaign, selects its evaluation template, adds a
deadline, registers the submissions being compared, and assigns evaluators.

Campaigns follow a controlled lifecycle:

```text
Draft -> Open -> Evaluating -> Completed -> Archived
```

Internal computation states are controlled by the verified result workflow
rather than arbitrary manual changes.

### 4. Initialize the confidential campaign

Before evaluations are submitted, an administrator initializes the campaign
in the deployed `ConfidentialDecisionEngine` contract on Ethereum Sepolia.

The initialization transaction registers:

- a hash of the campaign identifier;
- hashes of the submission identifiers; and
- the authorized evaluator wallet addresses.

It does not publish submission descriptions, files, criterion values, or
individual scores.

### 5. Evaluators submit independently

Each assigned evaluator signs into a private workspace, opens every submission,
and completes the evaluation criteria.

The browser then:

1. normalizes each criterion value;
2. applies the configured criterion weights;
3. produces one weighted score between `0` and `1,000,000`;
4. encrypts that score using the official iExec Nox Handle SDK; and
5. sends the encrypted handle and proof to the confidential smart contract.

The plaintext criterion values and individual weighted score are not sent to
the Conclave backend.

### 6. The contract aggregates encrypted scores

The smart contract verifies that:

- the campaign exists and is still accepting evaluations;
- the connected wallet is an authorized evaluator;
- the submission belongs to the campaign; and
- that evaluator has not already scored the same submission.

It then validates the encrypted input, bounds the score to the allowed range,
and adds it to that submission's encrypted total using Nox confidential
operations.

The public chain can observe that an evaluator participated, but it cannot read
the submitted score value.

### 7. Finalize only when the campaign is complete

The administrator cannot finalize early. The contract checks that every
registered submission has received exactly one score from every authorized
evaluator.

If even one evaluation is missing, finalization fails. This prevents selective
exclusion and protects the campaign's completeness policy.

When all evaluations are present, the contract marks each encrypted aggregate
as publicly decryptable.

### 8. Verify and publish the result

After Nox resolves the aggregate handles, it supplies public-decryption proofs.
The contract verifies each proof, publishes the aggregate total for every
submission, determines the highest total, and emits a `ResultPublished` event.

The Conclave server then independently verifies:

- the transaction succeeded;
- it targeted the configured Conclave contract;
- the expected result event was emitted;
- the event belongs to the correct campaign;
- the on-chain totals match the displayed ranking; and
- the on-chain winner matches the highest aggregate total.

Only after these checks does Conclave save the result as verified and mark the
campaign as completed.

## Core Features

### Organization workspaces

Teams can create organizations, manage profiles and logos, switch between
organizations, and keep campaigns separated by organizational ownership.

### Role-based access control

Permissions are enforced on both pages and API routes. Evaluators cannot manage
campaigns, observers cannot modify data, and only authorized administrators
can publish results.

### Member invitations

Organizations can invite new members by email, assign an appropriate role,
track invitation status, accept invitation links, and revoke pending invites.

### Reusable evaluation templates

Administrators can build weighted evaluation templates, order criteria, set
score ranges, add guidance, create versions, duplicate templates, and select a
default template.

### Campaign management

Conclave supports campaign descriptions, templates, deadlines, lifecycle
states, evaluator rosters, submissions, timelines, settings, and result views.

### Submission management

Each submission can include a title, description, category, status,
contributors, external links, and private file attachments.

### Private evaluator workspace

Evaluators see only campaigns assigned to them, the submissions that require
assessment, their completion progress, and confirmed submission receipts.

### Confidential weighted scoring

Criterion values are converted into a normalized weighted score in the
browser. The final score is encrypted before it enters the blockchain
aggregation process.

### Wallet authorization

Wallet linking uses a signed, expiring challenge. The backend verifies that the
wallet which submitted an evaluation is the wallet linked to the assigned
evaluator's account.

### On-chain duplicate prevention

An evaluator can submit only once for each submission. This rule is enforced by
the smart contract, not only by the user interface.

### Completeness enforcement

Results cannot be finalized until every evaluator has scored every submission.
The frontend checks completion before requesting a transaction, and the smart
contract enforces the same rule on-chain.

### Verified aggregate results

The result page displays the final ranking, winning submission, aggregate
scores, evaluator count, verification commitment, receipt metadata, and
publication transaction.

### Audit logs

Conclave records important organizational actions such as creation, updates,
invitations, evaluation submission, wallet connection, and result publication.
Logs can include actor, entity, campaign, timestamp, IP address, user agent, and
verification metadata.

### Notifications

Users receive notifications for evaluation assignments, invitations, campaign
events, results, and system activity.

### Platform administration

Super admins can monitor users, organizations, campaigns, verified results,
active computations, failed computations, and recent platform activity.

## Use Cases

### Grant and research reviews

Independent experts can assess proposals without revealing their exact scores
to organizers or other reviewers before the funding decision is complete.

### Hiring panels

Interviewers can score candidates independently, reducing pressure to match a
manager's opinion and limiting exposure of individual interviewer judgments.

### Scholarship selection

Reviewers can evaluate applicants against shared weighted criteria while the
institution publishes only the aggregate ranking or selected candidate.

### Procurement

Committee members can score vendors without revealing individual commercial or
technical judgments during the process. The organization still receives an
auditable final selection.

### Investment committees

Partners can provide independent conviction and risk scores without exposing
their individual position before the committee result is calculated.

### University admissions

Admissions reviewers can combine structured assessments without making each
reviewer's score visible to the full committee.

### Awards and competitions

Judges can score entries privately, while organizers publish a verifiable
ranking and winner after all judging is complete.

### Board and governance decisions

Members can contribute candid structured judgments while limiting the public
output to the authorized organizational decision.

## Why Confidentiality Matters

Confidentiality is not only a data-security feature. It improves the quality of
the decision itself.

When evaluators know their exact score can be inspected, they may soften
criticism, copy a dominant opinion, avoid disagreeing with leadership, or score
strategically. Keeping individual values confidential encourages honest and
independent evaluation.

Conclave protects independence while retaining accountability. Participation,
completion, aggregate totals, and the published result are verifiable, even
though individual score values remain hidden during the process.

## Why iExec Nox

Encryption at rest protects values stored in a database. Transport encryption
protects values while they move across a network. Neither prevents the
application server from seeing the values while calculating a result.

iExec Nox extends protection to computation. Conclave uses Nox confidential
types and operations so encrypted scores can be validated, bounded, added, and
prepared for controlled public decryption without first becoming plaintext in
the Conclave application.

The integration uses:

- `@iexec-nox/handle` for browser-side encryption and public decryption proofs;
- `@iexec-nox/nox-protocol-contracts` for confidential Solidity types and
  operations;
- `@iexec-nox/nox-hardhat-plugin` for contract development and integration
  testing; and
- Ethereum Sepolia for campaign, evaluation, finalization, and publication
  transactions.

## Privacy and Visibility Model

### Public or organizational data

The following information is not treated as a confidential score:

- organization and campaign configuration;
- campaign and submission identifiers;
- submission titles and descriptive content available through Conclave;
- evaluator assignments and wallet participation;
- evaluation submission status;
- encrypted handles and blockchain transaction metadata;
- final per-submission aggregate totals;
- the final ranking and selected submission; and
- audit and verification records.

### Confidential data

The active Nox workflow protects:

- the evaluator's individual criterion values while they are being entered;
- the evaluator's final normalized weighted score; and
- encrypted aggregate totals before campaign finalization.

The Conclave backend stores the encrypted handle, proof, transaction hash, and
verification context. It does not receive or store the individual plaintext
weighted score.

### Current implementation boundary

The current Nox contract aggregates a `uint256` score. Numeric, scale, star,
boolean, and pass/fail criteria are supported. Free-text rubric responses and
comments are not included in the active confidential aggregation payload.

The final aggregate totals are intentionally public after publication. This is
what allows participants to verify the ranking. For meaningful individual
privacy, campaigns should use multiple evaluators: if there is only one
evaluator, the published aggregate is mathematically equal to that evaluator's
score.

## Security and Trust Model

Conclave does not rely on one database flag or frontend message to declare a
result valid. It uses multiple controls:

- Google authentication through Supabase;
- organization and campaign role checks on server routes;
- assignment checks for evaluator access;
- expiring wallet-link challenges and signature verification;
- a unique wallet requirement for evaluator identities;
- immutable evaluator and submission sets after on-chain initialization;
- smart-contract authorization and duplicate-submission protection;
- mandatory completion before finalization;
- Nox input and public-decryption proof verification;
- transaction destination, sender, calldata, receipt, and event validation;
- on-chain aggregate and winner verification before database persistence; and
- organizational audit logs.

The blockchain does not replace the application database. The two layers have
different responsibilities:

- PostgreSQL manages users, organizations, content, workflows, assignments,
  notifications, and application views.
- The confidential contract enforces evaluator authorization, aggregates
  encrypted scores, enforces completeness, verifies decryption proofs, and
  publishes the result.
- The backend connects both layers by verifying that confirmed blockchain
  activity matches the correct Conclave records.

## Smart Contract Rules

The active `ConfidentialDecisionEngine` contract enforces the following rules:

- one deployed contract can host multiple campaigns;
- campaign and submission UUIDs are represented on-chain as hashes;
- a campaign must contain between 1 and 20 submissions;
- a campaign must contain between 1 and 50 unique evaluator wallets;
- only registered evaluator wallets can submit;
- each evaluator can submit only once per submission;
- encrypted scores are bounded to the `0` to `1,000,000` scale;
- aggregate addition uses Nox confidential arithmetic;
- only the campaign administrator can finalize and publish;
- finalization requires every expected evaluation;
- publication requires one valid Nox proof per submission; and
- the contract selects the submission with the highest aggregate total.

## Technology Stack

### Application

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod validation

### Authentication, data, and storage

- Supabase Authentication with Google OAuth
- Supabase PostgreSQL
- Supabase Storage
- Prisma ORM

### Web3 and confidential computation

- iExec Nox Handle SDK
- iExec Nox protocol contracts
- Solidity
- Ethereum Sepolia
- Viem
- Wagmi
- RainbowKit
- Hardhat
- OpenZeppelin contracts

## Architecture Summary

```text
Evaluator criterion values
          |
          v
Browser normalization and weighting
          |
          v
One score from 0 to 1,000,000
          |
          v
iExec Nox browser encryption
          |
          v
Encrypted handle + proof submitted on Sepolia
          |
          v
ConfidentialDecisionEngine aggregates encrypted totals
          |
          v
Completion check for every evaluator and submission
          |
          v
Nox public-decryption proofs for aggregate totals
          |
          v
Contract verifies proofs, publishes totals, selects winner
          |
          v
Conclave verifies receipt and event, then records ranking
```

## What Makes Conclave Different

Conclave is not simply a survey form, voting interface, encrypted database, or
blockchain record system.

Its defining difference is the separation of input visibility from result
verifiability:

- evaluators can contribute without revealing individual score values;
- administrators can manage the process without reading those values;
- the contract cannot finalize an incomplete campaign;
- the backend cannot declare an arbitrary result verified; and
- participants can inspect the published aggregate outcome and its blockchain
  record.

This creates a decision process in which confidentiality does not require blind
trust and verification does not require exposing every opinion.

## Target Users

Conclave is intended for:

- organizations running competitive selection processes;
- committee chairs and program administrators;
- foundations and grant-making bodies;
- universities and research institutions;
- companies running hiring or procurement panels;
- investment and governance committees;
- hackathons, award programs, and competitions; and
- evaluators who need independence from organizational pressure.

## Project Status

The repository contains a functional Next.js application and a deployed-style
managed Nox workflow for Ethereum Sepolia. The implemented experience includes
authentication, organizations, permissions, invitations, campaigns,
submissions, templates, assignments, browser-side score encryption,
confidential on-chain aggregation, proof-based publication, server-side result
verification, audit records, notifications, and result presentation.

The project was developed as an entry for the **iExec WTF Hackathon Summer
Edition**. Its central demonstration is a complete path from structured human
evaluation to a confidentially computed and independently verifiable decision.

## Future Direction

Conclave can evolve beyond winner-by-highest-score campaigns into a broader
confidential decision infrastructure layer. Potential extensions include:

- threshold and quorum-based decisions;
- private ranked-choice aggregation;
- evaluator groups with different weights;
- conflict-of-interest declarations;
- configurable tie-breaking policies;
- selective disclosure policies;
- confidential qualitative feedback when supported by the computation layer;
- multi-chain deployments;
- production monitoring for Nox gateway and handle resolution;
- richer public verification pages; and
- integrations with HR, grant, procurement, and governance systems.

## Final Summary

Conclave addresses a fundamental weakness in digital decision systems: the
people operating the workflow are usually able to inspect the private opinions
that determine its outcome.

By combining a complete organizational evaluation platform with iExec Nox
confidential computation and Ethereum verification, Conclave enables teams to
collect honest independent assessments, enforce a complete and consistent
decision policy, keep individual weighted scores private, and publish a result
that participants can verify.

**Conclave reveals the decision, not the individual opinions behind it.**
