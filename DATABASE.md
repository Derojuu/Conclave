# Conclave Architecture

Conclave is the confidential decision infrastructure for structured,
multi-party evaluation. This document is the implementation contract for the
application and database.

## Product Boundary

Conclave is not a hackathon platform, voting product, survey tool, form
builder, or DAO governance application.

The canonical domain flow is:

`Organization -> Evaluation Campaign -> Submission -> Evaluator -> Encrypted Evaluation -> Confidential Computation -> Verified Decision`

All application language, routes, APIs, database models, audit events, and
blockchain records must use this domain.

## Trust Boundary

The application database may store:

- campaign and submission configuration
- evaluator assignments
- encrypted evaluation payloads
- cryptographic commitments and hashes
- computation lifecycle metadata
- aggregate decision results
- neutral consensus summaries generated from aggregate output

The application database must never store plaintext:

- individual criterion scores
- individual rankings
- private evaluator comments
- overall evaluator recommendations

An `Evaluation` is metadata describing an evaluator's submission. Its
confidential content is stored only as an `EncryptedEvaluationPayload`.
Application APIs must not offer a decryption or plaintext-read endpoint.

## Core Modules

### Identity and Organizations

Supabase Auth owns authentication. Prisma owns the synchronized application
profile, organization membership, roles, preferences, optional wallet
address, invitations, notifications, and audit history.

Organization roles are:

- `OWNER`: full organization control
- `ADMIN`: manages campaigns, submissions, templates, evaluators, and results
- `EVALUATOR`: accesses assigned campaigns and submits encrypted evaluations
- `OBSERVER`: read-only access to allowed campaign state and published results

### Evaluation Campaigns

An evaluation campaign defines a decision process, deadline, reusable
evaluation template, assigned evaluators, submissions, computation jobs, and
verified result.

Campaign statuses are:

- `DRAFT`
- `OPEN`
- `EVALUATING`
- `COMPUTING`
- `COMPLETED`
- `ARCHIVED`

### Submissions

A submission is a generic subject of evaluation. It may represent a person,
company, proposal, vendor, paper, application, or any other candidate.

Links, attachments, and metadata are normalized or stored as generic JSON.
Product-specific fields such as GitHub or demo URLs are link records rather
than required columns.

### Confidential Evaluations

The browser prepares the evaluation payload and encrypts it for the
confidential-computation workflow. The server validates campaign assignment
and payload metadata, persists ciphertext and commitments atomically, and
records a non-sensitive audit event.

The evaluator may see whether their own payload was submitted, but no user or
administrator receives a plaintext evaluation from Conclave.

### Confidential Computation

`ComputationJob` records the iExec Nox task lifecycle and public verification
metadata. It references encrypted inputs by commitment and stores no
individual evaluation content.

Only aggregate output is accepted into `DecisionResult`. Publishing a result
requires a successful computation job and records verification commitments,
provider task identifiers, and an optional blockchain transaction.

### Decision Results

A result may contain:

- overall score
- ordered aggregate ranking
- selected submission
- decision label
- aggregate statistics
- neutral consensus summary
- result commitment and verification metadata

It must not contain evaluator identifiers or evaluator-level values.

## Data Compatibility

The original implementation used the public names `Committee`, `Judge`, and
`Project`. Prisma maps the new application models to the existing physical
tables during migration:

- `EvaluationCampaign` -> `committees`
- `CampaignEvaluator` -> `committee_judges`
- `Submission` -> `projects`
- `SubmissionContributor` -> `project_team_members`

This preserves existing identifiers and foreign-key relationships while the
application moves to the correct product language. Old web paths may redirect
to canonical campaign and submission paths, but new features must not extend
the legacy domain.

## Delivery Phases

### Phase 1: Domain and Confidentiality Foundation

- migrate Prisma models, roles, statuses, and indexes
- normalize submission links, attachments, and metadata
- replace plaintext score/comment tables with encrypted payloads
- add computation jobs and richer decision results
- update seed data and architecture documentation

### Phase 2: Campaign Experience

- migrate committee routes and UI to evaluation campaigns
- implement generic lifecycle, templates, evaluator assignment, and timeline
- enforce evaluator assignment and observer read access
- retain compatibility redirects for old committee URLs

### Phase 3: Submission Experience

- migrate project routes and UI to submissions
- implement generic metadata, links, attachment records, ownership, and status
- remove hackathon-specific fields and language
- retain compatibility redirects for old project URLs

### Phase 4: Confidential Evaluation Workflow

- evaluator work queue
- accessible evaluation form generated from the selected template
- client-side payload construction and encryption boundary
- autosaved encrypted drafts and sealed submission
- backend authorization, validation, idempotency, and audit logging

### Phase 5: Computation and Verified Decisions

- iExec Nox computation-job orchestration boundary
- job status synchronization and failure handling
- aggregate result validation and publication
- verified-decision UI and neutral AI consensus summary boundary
- blockchain receipt and commitment presentation

### Phase 6: Platform Completion

- observer and super-admin experiences
- notifications and audit-log views
- organization-wide search and dashboard states
- accessibility, responsive behavior, loading, empty, and error states
- security, performance, lint, type, migration, and production-build checks

## Release Gate

Every phase must satisfy:

- Prisma schema validation and generated client success
- production-safe migration SQL
- strict TypeScript success
- ESLint success
- production build success
- no mock application data or placeholder implementation
- no server process started by the implementation agent
