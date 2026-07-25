# Conclave

**The Confidential Decision Infrastructure.**

Conclave enables organizations to run structured evaluation campaigns while
keeping individual scores, comments, rankings, and recommendations private.
Encrypted evaluations are processed through confidential computation, and only
the final verified decision is revealed.

Conclave is designed for high-stakes workflows such as:

- Hiring and admissions
- Scholarship and grant selection
- Investment committees
- Vendor procurement
- Research reviews
- Innovation challenges
- Board and executive decisions

Conclave is not a voting platform, survey tool, form builder, DAO governance
application, or hackathon platform.

## Core Workflow

```text
Organization
    |
Evaluation Campaign
    |
Submissions + Assigned Evaluators
    |
Encrypted Private Evaluations
    |
iExec Nox Confidential Computation
    |
Verified Aggregate Decision
```

The application database stores encrypted evaluation payloads and public
verification metadata. It must never store plaintext individual scores,
private comments, rankings, or recommendations.

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth and Storage
- Supabase PostgreSQL
- Prisma ORM
- Google OAuth
- RainbowKit, Wagmi, and Viem
- iExec Nox integration boundary
- Hardhat and Solidity
- Zod and React Hook Form
- Framer Motion

## Product Modules

- Google authentication and persistent sessions
- User profiles and account settings
- Optional wallet connection
- Multi-organization membership
- Owner, admin, evaluator, observer, and super-admin roles
- Organization invitations and member management
- Evaluation campaign management
- Generic submission management
- Reusable and versioned evaluation templates
- Weighted evaluation criteria
- Evaluator assignments
- Client-side confidential evaluation encryption
- Confidential computation job orchestration
- Verified aggregate decisions
- Notifications and audit logs

## Getting Started

### Prerequisites

- Node.js 22 or newer
- pnpm 10
- A Supabase project
- Google OAuth credentials
- PostgreSQL connection credentials

iExec Nox credentials are required to exercise the complete confidential
evaluation and computation workflow. Wallet and blockchain credentials are
optional until blockchain features are used.

### Install Dependencies

```powershell
pnpm install
```

### Configure Environment Variables

Copy the template:

```powershell
Copy-Item .env.example .env
```

Follow [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for instructions on
obtaining and configuring every credential.

### Prepare the Database

Generate Prisma Client and apply committed migrations:

```powershell
pnpm db:generate
pnpm db:deploy
```

For a controlled development database, optional seed data can be installed
with:

```powershell
pnpm db:seed
```

Do not run the seed command against production without reviewing the seed
script for that environment.

### Start Development

```powershell
pnpm dev
```

The application is available at `http://localhost:3000` by default.

## Available Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm format` | Format supported files |
| `pnpm format:check` | Check formatting |
| `pnpm compile` | Compile Solidity contracts |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:validate` | Validate the Prisma schema |
| `pnpm db:migrate` | Create and apply a development migration |
| `pnpm db:deploy` | Apply committed migrations |
| `pnpm db:seed` | Seed a controlled development database |
| `pnpm db:studio` | Open Prisma Studio |

## Repository Structure

```text
app/                 Next.js routes, pages, layouts, and API handlers
components/          Reusable product and UI components
constants/           Shared application constants
contracts/           Solidity contracts
hooks/               Reusable React hooks
lib/                 Auth, database, security, Nox, and domain services
prisma/              Prisma schema, migrations, and seed script
public/              Public static assets
styles/              Global styles
test/                Automated tests
types/               Shared TypeScript types
utils/               Focused utility functions
```

## Roles

| Role | Scope |
| --- | --- |
| Super Admin | Platform administration |
| Owner | Full control of an organization |
| Admin | Manages campaigns, submissions, templates, and members |
| Evaluator | Accesses assignments and submits private evaluations |
| Observer | Read-only access to permitted state and published results |

Permissions are enforced in server-side routes and services. Client-side
visibility is used for user experience, not as the security boundary.

## Confidentiality Model

Conclave may store:

- Campaign and submission configuration
- Evaluator assignments
- Encrypted evaluation payloads
- Cryptographic hashes and commitments
- Computation lifecycle metadata
- Aggregate decision results
- Neutral aggregate consensus summaries

Conclave must not expose or store in plaintext:

- Individual criterion scores
- Individual rankings
- Private evaluator comments
- Individual recommendations
- Evaluator identities when anonymous evaluation is required

The private key capable of decrypting evaluations must remain within the Nox
confidential execution and key-management boundary. It must never be placed in
the application environment or repository.

## Documentation

- [Environment and credential setup](./ENVIRONMENT_SETUP.md)
- [Architecture and delivery phases](./DATABASE.md)
- [Prisma schema](./prisma/schema.prisma)

## Production Checklist

Before deployment:

1. Configure production environment variables and OAuth redirects.
2. Apply migrations with `pnpm db:deploy`.
3. Confirm private and public Supabase Storage bucket settings.
4. Run `pnpm db:validate`.
5. Run `pnpm typecheck`.
6. Run `pnpm lint`.
7. Run `pnpm test`.
8. Run `pnpm compile`.
9. Run `pnpm build`.
10. Verify Nox key custody, callback signatures, and secret rotation procedures.

Never commit `.env`, database credentials, Supabase service keys, Nox API
tokens, webhook secrets, or cryptographic private keys.

