# Conclave Environment Setup

This guide explains every environment variable used by Conclave, where to
obtain it, and how to configure the external services the application expects.

Do not commit `.env`, private keys, database passwords, API secrets, or service
role keys. The repository already ignores `.env` and `.env.local`.

## Quick Start

1. Create a Supabase project.
2. Configure the PostgreSQL connection strings.
3. Configure Supabase Auth and Google OAuth.
4. Create the required Supabase Storage buckets.
5. Copy the environment template:

```powershell
Copy-Item .env.example .env
```

6. Replace every required placeholder in `.env`.
7. Generate Prisma Client and apply the migrations:

```powershell
pnpm db:generate
pnpm db:deploy
```

8. Verify the configuration without starting the application:

```powershell
pnpm db:validate
pnpm typecheck
pnpm lint
pnpm build
```

Use `pnpm db:migrate` only while developing a new Prisma migration. Use
`pnpm db:deploy` to apply committed migrations in staging and production.

## Variable Status

| Variable | Classification | Required |
| --- | --- | --- |
| `DATABASE_URL` | Server secret | Yes |
| `DIRECT_URL` | Server secret | Yes for migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-visible | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-visible | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Yes |
| `PLATFORM_ADMIN_EMAILS` | Server configuration | Recommended |
| `NEXT_PUBLIC_SITE_URL` | Browser-visible | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Browser-visible | Optional |
| `NEXT_PUBLIC_CHAIN_ID` | Browser-visible | Reserved/configuration-only |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Browser-visible | Optional |
| `NEXT_PUBLIC_CONCLAVE_REGISTRY_ADDRESS` | Browser-visible | Reserved |
| `NEXT_PUBLIC_IEXEC_APP_ADDRESS` | Browser-visible | Reserved |
| `NOX_EVALUATION_PUBLIC_KEY` | Public cryptographic material | Required for confidential evaluations |
| `NOX_EVALUATION_KEY_REFERENCE` | Server configuration | Required for confidential evaluations |
| `EVALUATOR_PSEUDONYM_SECRET` | Server secret | Required for confidential evaluations |
| `NOX_COMPUTATION_ENDPOINT` | Server configuration | Required for computation |
| `NOX_COMPUTATION_API_KEY` | Server secret | Required for computation |
| `NOX_WEBHOOK_SECRET` | Server secret | Required for computation callbacks |

`NEXT_PUBLIC_*` values are embedded in browser JavaScript. Never put a secret
in a variable with that prefix.

The three reserved variables are present for the blockchain integration, but
the current application does not actively consume them:

- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_CONCLAVE_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_IEXEC_APP_ADDRESS`

Do not invent addresses for them. Populate them after the corresponding
contracts and iExec app have been deployed.

## 1. Supabase Project

Create a project in the Supabase dashboard and save its database password in a
password manager. The project reference is the identifier used in URLs such as
`https://PROJECT_REF.supabase.co`.

### PostgreSQL Connection Strings

Open the project's database connection panel and copy both the pooler and
direct PostgreSQL connection details.

#### `DATABASE_URL`

Use the Supavisor transaction pooler for application runtime queries. It
normally uses port `6543`.

```dotenv
DATABASE_URL="postgresql://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Important:

- Keep `?pgbouncer=true`.
- Use the exact region and username shown by Supabase.
- URL-encode special characters in the password.
- This value is server-only.

#### `DIRECT_URL`

Use the direct PostgreSQL connection on port `5432` for Prisma migrations.

```dotenv
DIRECT_URL="postgresql://postgres:URL_ENCODED_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
```

`prisma.config.ts` prefers `DIRECT_URL` for Prisma CLI commands and falls back
to `DATABASE_URL` if it is absent.

Supabase's direct endpoint may require IPv6. If the machine or deployment
provider cannot reach IPv6, use the Supavisor session pooler connection shown
by Supabase as the migration URL. Do not use the transaction pooler for schema
migrations unless Supabase explicitly documents it for that operation.

To URL-encode a database password in PowerShell:

```powershell
node -e "console.log(encodeURIComponent(process.argv[1]))" "YOUR_PASSWORD"
```

Do not paste the encoded password into chat, logs, source code, or screenshots.

### Supabase API Keys

In the Supabase dashboard, open the project's API settings and copy:

- Project URL
- Publishable key
- Secret key or legacy `service_role` key

Configure:

```dotenv
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_REPLACE_ME"
```

The publishable key is intended for browser use. The service role/secret key
bypasses normal data access restrictions and must only be used by server code.
Never expose `SUPABASE_SERVICE_ROLE_KEY` in a client component or deployment
preview log.

## 2. Google OAuth

Conclave uses Google through Supabase Auth. Configuration is required in both
Google Cloud and Supabase.

### Google Cloud

1. Open Google Cloud Console and create or select a project.
2. Configure the OAuth consent screen.
3. Add the application name, support email, and required authorized domains.
4. Create an OAuth 2.0 Client ID with type **Web application**.
5. Add this exact authorized redirect URI:

```text
https://PROJECT_REF.supabase.co/auth/v1/callback
```

6. Copy the Google Client ID and Client Secret.

For an app in Google testing mode, add every permitted Google account as a test
user. Production access may require completing Google's consent-screen
publishing or verification process.

### Supabase Auth

1. Open **Authentication > Providers > Google**.
2. Enable Google.
3. Enter the Google Client ID and Client Secret.
4. Save the provider.
5. Open the Supabase URL configuration for Auth.
6. Set the local site URL to:

```text
http://localhost:3000
```

7. Add these redirect URLs:

```text
http://localhost:3000/auth/callback
https://YOUR_PRODUCTION_DOMAIN/auth/callback
```

Add preview deployment callback URLs only when needed. Prefer an explicit
allowlist rather than a broad wildcard for production authentication.

The sign-in flow is:

```text
Conclave -> Google -> Supabase callback -> /auth/callback -> requested page
```

The application callback exchanges the authorization code for a session,
creates or synchronizes the Prisma user profile, and stores the Supabase
session in secure cookies.

## 3. Supabase Storage

Create these buckets from **Storage** in the Supabase dashboard.

### `organization-logos`

- Bucket name: `organization-logos`
- Visibility: public
- Application limit: 2 MB per file
- Accepted types: PNG, JPEG, and WebP

Organization logos use public URLs. Keep uploads restricted to the server-side
Conclave API. Do not create a public policy that allows anonymous uploads.

### `submission-attachments`

- Bucket name: `submission-attachments`
- Visibility: private
- Application limit: 25 MB per file
- Application limit: 20 files per submission

Supported formats include PDF, PNG, JPEG, WebP, TXT, CSV, Microsoft Office
documents, and ZIP files. Downloads use short-lived signed URLs. Do not make
this bucket public because submissions can contain confidential material.

The application performs Storage operations using
`SUPABASE_SERVICE_ROLE_KEY` after its own authentication and organization
permission checks. Public client upload policies are not required.

## 4. Platform Super Admins

`PLATFORM_ADMIN_EMAILS` is a comma-separated allowlist:

```dotenv
PLATFORM_ADMIN_EMAILS="owner@example.com,security@example.com"
```

When one of these Google-authenticated users is synchronized with Prisma, the
application assigns the global `SUPER_ADMIN` role.

Use exact email addresses controlled by your team. Addresses are normalized by
the application, but writing them in lowercase avoids ambiguity. This is a
platform role, not an organization owner/admin role.

An empty value means no Google account is automatically promoted:

```dotenv
PLATFORM_ADMIN_EMAILS=""
```

## 5. Application URL

For local development:

```dotenv
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

For production:

```dotenv
NEXT_PUBLIC_SITE_URL="https://conclave.example.com"
```

Use the exact public HTTPS origin with no path and preferably no trailing
slash. This value is used for canonical metadata, invitation links, and the
iExec Nox callback URL.

When the production domain changes, update both this variable and the Supabase
Auth redirect allowlist.

## 6. Optional Wallet Connection

Wallet connection is optional and is separate from Supabase/Google
authentication. Users can use Conclave without a wallet.

### `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

1. Create a project in Reown Cloud, formerly WalletConnect Cloud.
2. Configure the application's allowed domains.
3. Copy the project ID:

```dotenv
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="REOWN_PROJECT_ID"
```

Leaving this empty disables WalletConnect-based wallet discovery. Injected
browser wallets can still be available.

### `NEXT_PUBLIC_SEPOLIA_RPC_URL`

Create a Sepolia endpoint with a provider such as Alchemy, Infura, QuickNode,
Ankr, or another Ethereum RPC provider:

```dotenv
NEXT_PUBLIC_SEPOLIA_RPC_URL="https://YOUR_SEPOLIA_RPC_ENDPOINT"
```

This value is browser-visible. Use a provider key restricted by domain,
network, and rate limit. Do not use an unrestricted account-wide secret.

Sepolia's chain ID is:

```dotenv
NEXT_PUBLIC_CHAIN_ID="11155111"
```

The current wallet provider is configured directly for Sepolia. The variable
is retained for deployment documentation but does not currently switch chains.

## 7. Smart Contract Configuration

After deploying the Conclave registry contract to the same chain configured by
the frontend, set:

```dotenv
NEXT_PUBLIC_CONCLAVE_REGISTRY_ADDRESS="0xDEPLOYED_REGISTRY_ADDRESS"
```

This variable is reserved for contract interaction and is not currently read
by the application UI. Record the deployment transaction, chain ID, deployed
bytecode, and contract address before enabling blockchain features.

Never use:

- a random address
- a wallet address
- an address from a different network
- a placeholder address in production

## 8. iExec Nox Configuration

These values are not automatically supplied by Supabase, an Ethereum RPC
provider, or a generic iExec public endpoint. They require Conclave's Nox
confidential worker, key custody, and gateway to be provisioned.

Until that infrastructure exists, authentication, organizations, campaigns,
submissions, and template management can run, but confidential evaluation
submission and final computation cannot be considered production-ready.

### iExec App Address

After deploying and registering the Nox application, set:

```dotenv
NEXT_PUBLIC_IEXEC_APP_ADDRESS="0xDEPLOYED_IEXEC_APP_ADDRESS"
```

This public variable is reserved and is not currently consumed by the
application UI.

### Evaluation Encryption Key

The browser encrypts confidential evaluation payloads using an RSA public key:

```dotenv
NOX_EVALUATION_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nBASE64_KEY_DATA\n-----END PUBLIC KEY-----"
NOX_EVALUATION_KEY_REFERENCE="iexec-nox://production/evaluation-key-v1"
```

Requirements:

- The key must be an RSA public key in PEM SPKI format.
- Store line breaks as literal `\n` sequences in `.env`.
- The key reference must identify the matching key/version to the Nox worker.
- The matching private key must exist only inside the confidential
  execution/key-management boundary.
- Never place the RSA private key in `.env`, the repository, Supabase, or the
  application server.

For local integration testing only, OpenSSL can generate a key pair:

```powershell
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out nox-private.pem
openssl pkey -in nox-private.pem -pubout -out nox-public.pem
```

The generated private key is not production-grade merely because it is
cryptographically valid. Production key custody, access control, rotation,
backup, and destruction must be designed with the Nox deployment.

### Evaluator Pseudonym Secret

This independent HMAC secret pseudonymizes evaluator identity references:

```dotenv
EVALUATOR_PSEUDONYM_SECRET="GENERATED_RANDOM_SECRET"
```

Generate it:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Do not rotate this value casually. Changing it changes deterministic
pseudonyms and can affect in-progress computation records.

### Computation Gateway

Configure the deployed HTTPS gateway that accepts Conclave computation jobs:

```dotenv
NOX_COMPUTATION_ENDPOINT="https://nox-gateway.example.com/v1/computations"
NOX_COMPUTATION_API_KEY="GATEWAY_BEARER_TOKEN"
```

Conclave sends:

- an HTTP `POST`
- `Content-Type: application/json`
- `Authorization: Bearer NOX_COMPUTATION_API_KEY`
- `Idempotency-Key: COMPUTATION_JOB_ID`
- a 30-second request timeout

The gateway response and callback payload must satisfy the schemas implemented
in `lib/validation/computation.ts`.

### Nox Webhook Secret

Generate a second, independent secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Store it as:

```dotenv
NOX_WEBHOOK_SECRET="A_DIFFERENT_GENERATED_RANDOM_SECRET"
```

Do not reuse `EVALUATOR_PSEUDONYM_SECRET`. Give the webhook secret only to the
Conclave server and the trusted Nox gateway.

The gateway must call:

```text
POST https://YOUR_DOMAIN/api/nox/computations/JOB_ID/callback
```

It must include:

```text
x-conclave-timestamp: UNIX_TIMESTAMP_IN_SECONDS
x-conclave-signature: HEX_HMAC_SHA256
```

The signature input is the timestamp, one period, and the exact raw HTTP body:

```text
HMAC_SHA256(NOX_WEBHOOK_SECRET, "timestamp.rawBody")
```

The signature may be sent as either the 64-character lowercase hex digest or
with a `sha256=` prefix. The application rejects callbacks more than five
minutes away from server time, so both systems must use synchronized clocks.
The raw body must not be parsed and re-serialized before signing.

## Local `.env` Example

Use this only as a shape reference. Replace every placeholder with your own
credential:

```dotenv
DATABASE_URL="postgresql://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:URL_ENCODED_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_REPLACE_ME"

PLATFORM_ADMIN_EMAILS="admin@example.com"

NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=""
NEXT_PUBLIC_CHAIN_ID="11155111"
NEXT_PUBLIC_SEPOLIA_RPC_URL=""

NEXT_PUBLIC_SITE_URL="http://localhost:3000"

NEXT_PUBLIC_CONCLAVE_REGISTRY_ADDRESS=""

NEXT_PUBLIC_IEXEC_APP_ADDRESS=""
NOX_EVALUATION_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nREPLACE_WITH_NOX_RSA_PUBLIC_KEY\n-----END PUBLIC KEY-----"
NOX_EVALUATION_KEY_REFERENCE="iexec-nox://development/evaluation-key-v1"
EVALUATOR_PSEUDONYM_SECRET="REPLACE_WITH_GENERATED_SECRET"
NOX_COMPUTATION_ENDPOINT="https://nox-gateway.example.com/v1/computations"
NOX_COMPUTATION_API_KEY="REPLACE_WITH_GATEWAY_TOKEN"
NOX_WEBHOOK_SECRET="REPLACE_WITH_DIFFERENT_GENERATED_SECRET"
```

## Production Deployment Checklist

1. Store variables in the deployment provider's encrypted environment settings.
2. Set separate credentials for preview, staging, and production.
3. Use the production Supabase project and production Google OAuth client.
4. Set `NEXT_PUBLIC_SITE_URL` to the exact production HTTPS origin.
5. Add the production `/auth/callback` URL to Supabase Auth.
6. Restrict the Reown and RPC project keys to production domains.
7. Apply committed migrations with `pnpm db:deploy`.
8. Run `pnpm build` using the same environment configuration.
9. Confirm `organization-logos` is public.
10. Confirm `submission-attachments` is private.
11. Confirm server secrets are absent from client bundles and logs.
12. Test Nox callbacks with valid and invalid signatures before processing real
    evaluations.
13. Store key rotation and recovery procedures with the deployment runbook.

Do not run `pnpm db:seed` against production unless the seed script has been
reviewed for that exact environment. Seed data is intended for development and
controlled test environments.

## Safe Configuration Checks

These commands validate configuration without printing secret values:

```powershell
pnpm db:validate
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

To check whether expected variables are set without displaying their values:

```powershell
node --env-file=.env -e "for (const key of ['DATABASE_URL','DIRECT_URL','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_SITE_URL']) console.log(key, process.env[key] ? 'set' : 'missing')"
```

## Common Errors

### Prisma cannot connect

- Confirm the project is running and not paused.
- Confirm the database password is URL-encoded.
- Use port `6543` plus `?pgbouncer=true` for `DATABASE_URL`.
- Use the direct or session-pooler URL for `DIRECT_URL`.
- Check whether the current network supports IPv6 for the direct endpoint.

### Google returns a redirect URI mismatch

- The Google authorized redirect URI must be the Supabase callback URL, not the
  Conclave callback URL.
- Google: `https://PROJECT_REF.supabase.co/auth/v1/callback`
- Supabase redirect allowlist: `http://localhost:3000/auth/callback` and the
  production Conclave callback.

### Login works but profile synchronization fails

- Confirm `DATABASE_URL` is reachable by the Next.js server.
- Confirm Prisma migrations have been applied.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` belongs to the same Supabase project as
  `NEXT_PUBLIC_SUPABASE_URL`.

### Logo upload fails

- Confirm the `organization-logos` bucket exists and is public.
- Confirm the file is PNG, JPEG, or WebP and no larger than 2 MB.
- Confirm the service role key is valid.

### Attachment upload or download fails

- Confirm the `submission-attachments` bucket exists and is private.
- Confirm the file is an accepted type and no larger than 25 MB.
- Confirm the service role key is valid.
- Do not replace signed download URLs with permanent public URLs.

### WalletConnect does not open

- Confirm the Reown project ID is correct.
- Confirm the current domain is allowed in Reown Cloud.
- Confirm the browser can reach the configured Sepolia RPC endpoint.

### Confidential evaluation is not configured

Both `NOX_EVALUATION_PUBLIC_KEY` and `NOX_EVALUATION_KEY_REFERENCE` must be
set. A valid public key without a matching private key inside the Nox worker
will encrypt data that cannot be computed.

### Nox callback is rejected

- Confirm both systems use the same `NOX_WEBHOOK_SECRET`.
- Sign the exact raw request body.
- Use a Unix timestamp in seconds.
- Confirm server clocks differ by less than five minutes.
- Confirm the callback job ID matches the computation job.
- Confirm the signature is lowercase hexadecimal, optionally prefixed with
  `sha256=`.

## Secret Handling Rules

- Never commit `.env`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`.
- Never expose `DATABASE_URL` or `DIRECT_URL`.
- Never store the Nox RSA private key in the application environment.
- Use separate credentials and secrets per environment.
- Restrict provider keys by domain, network, IP, and scope where supported.
- Rotate a credential immediately if it appears in source control or logs.
- Restart or redeploy the application after changing environment variables.
- Keep production credentials in the deployment platform's secret manager.
