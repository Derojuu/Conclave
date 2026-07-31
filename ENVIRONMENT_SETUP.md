# Conclave Environment Setup

This is the complete environment-variable list for the deployed application.
Conclave uses the official iExec Nox packages and managed Ethereum Sepolia
infrastructure. It does not require a self-hosted computation gateway, an RSA
key, an iExec privacy iApp address, or Docker for the Vercel workflow.

Never commit `.env`, database passwords, service-role keys, wallet private
keys, or provider secrets.

## Values Required in Vercel

| Variable                               | Where it comes from                      | Secret?         |
| -------------------------------------- | ---------------------------------------- | --------------- |
| `DATABASE_URL`                         | Supabase database connection panel       | Yes             |
| `DIRECT_URL`                           | Supabase database connection panel       | Yes             |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project API settings            | No              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project API settings            | No              |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase project API settings            | Yes             |
| `PLATFORM_ADMIN_EMAILS`                | Email address you choose                 | No              |
| `NEXT_PUBLIC_SITE_URL`                 | Your final Vercel URL or custom domain   | No              |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Reown Cloud                              | No              |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL`          | Ethereum RPC provider                    | Browser-visible |
| `NEXT_PUBLIC_CONCLAVE_NOX_ADDRESS`     | Output of Conclave's contract deployment | No              |

You already have Supabase database and Google Auth. Keep those working values.
The Web3 values you still need are the final four rows beginning with
`NEXT_PUBLIC_SITE_URL`.

Every `NEXT_PUBLIC_*` value is included in browser JavaScript. Never place a
private key or secret API token in a `NEXT_PUBLIC_*` variable.

## 1. Site URL

Deploy the repository to Vercel once, then copy its production URL from the
Vercel project dashboard:

```dotenv
NEXT_PUBLIC_SITE_URL="https://YOUR-PROJECT.vercel.app"
```

Use the exact HTTPS origin with no path. In Supabase, add this callback to
**Authentication > URL Configuration > Redirect URLs**:

```text
https://YOUR-PROJECT.vercel.app/auth/callback
```

Also keep Google's authorized redirect URI pointed at Supabase, not Vercel:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

Redeploy after changing a `NEXT_PUBLIC_*` value because Next.js embeds it at
build time.

## 2. WalletConnect Project ID

This enables RainbowKit to discover mobile and WalletConnect wallets. Injected
wallets such as MetaMask can still work without it, but configure it for the
hackathon demo.

1. Open [Reown Cloud](https://cloud.reown.com/).
2. Sign in and create a project.
3. Select **AppKit** and choose a web application.
4. Add the production Vercel domain to the allowed-domain list.
5. Copy the project ID, not an API secret.
6. Add it to Vercel:

```dotenv
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="YOUR_REOWN_PROJECT_ID"
```

## 3. Ethereum Sepolia RPC URL

Use Alchemy, Infura, QuickNode, Ankr, or another Ethereum provider. With
Alchemy, for example:

1. Create an account at [Alchemy](https://www.alchemy.com/).
2. Create an app for **Ethereum**.
3. Select the **Sepolia** network.
4. Open the app's endpoint/API-key page.
5. Copy the HTTPS endpoint.
6. Restrict browser requests to your Vercel domain when the provider supports
   domain allowlists.
7. Add it to Vercel:

```dotenv
NEXT_PUBLIC_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
```

Sepolia's chain ID is fixed in the application as `11155111`; there is no
separate chain-ID environment variable.

The same endpoint can be used temporarily as `SEPOLIA_RPC_URL` when deploying
the contract. The deployment variable has no `NEXT_PUBLIC_` prefix because it
is read by Hardhat rather than the browser.

## 4. Deploy the Nox Contract

`NEXT_PUBLIC_CONCLAVE_NOX_ADDRESS` is not issued by a dashboard. It is the
address of this repository's `ConfidentialDecisionEngine` after you deploy it
to Ethereum Sepolia.

Create a dedicated deployment wallet rather than using a wallet that holds
mainnet funds:

1. Create a fresh account in MetaMask or another wallet.
2. Export that account's private key and keep it only in a password manager.
3. Obtain Sepolia ETH from a reputable faucet listed by
   [ethereum.org](https://ethereum.org/en/developers/docs/networks/#sepolia).
4. Confirm the wallet shows a nonzero Sepolia ETH balance.
5. In a local PowerShell session, set the two deployment-only variables:

```powershell
$env:SEPOLIA_RPC_URL="https://YOUR_SEPOLIA_RPC_ENDPOINT"
$env:SEPOLIA_PRIVATE_KEY="0xYOUR_DEDICATED_DEPLOYER_PRIVATE_KEY"
```


6. Install and deploy with the pinned package manager:

```powershell
npx --yes pnpm@10.13.1 install --frozen-lockfile
npx --yes pnpm@10.13.1 compile
npx --yes pnpm@10.13.1 deploy:nox:sepolia
```

7. The last command prints:

```text
ConfidentialDecisionEngine=0x...
```

8. Confirm that address on [Sepolia Etherscan](https://sepolia.etherscan.io/).
9. Add it to Vercel:

```dotenv
NEXT_PUBLIC_CONCLAVE_NOX_ADDRESS="0xDEPLOYED_CONTRACT_ADDRESS"
```

10. Redeploy the Vercel project.
11. Clear the PowerShell secrets when finished:

```powershell
Remove-Item Env:SEPOLIA_PRIVATE_KEY
Remove-Item Env:SEPOLIA_RPC_URL
```

Do not add `SEPOLIA_PRIVATE_KEY` to Vercel. The deployed application signs
transactions through each user's connected wallet and never needs a server
wallet private key.

## 5. What iExec Nox Provides Automatically

The official `@iexec-nox/handle` SDK resolves the managed Handle Gateway and
NoxCompute deployment for Ethereum Sepolia. Conclave encrypts a `uint256`
weighted score with that SDK and binds the encrypted handle to the deployed
`ConfidentialDecisionEngine`.

You do not need any of these obsolete values:

```text
NEXT_PUBLIC_IEXEC_APP_ADDRESS
NOX_EVALUATION_PUBLIC_KEY
NOX_EVALUATION_KEY_REFERENCE
EVALUATOR_PSEUDONYM_SECRET
NOX_COMPUTATION_ENDPOINT
NOX_COMPUTATION_API_KEY
NOX_WEBHOOK_SECRET
NEXT_PUBLIC_CONCLAVE_REGISTRY_ADDRESS
NEXT_PUBLIC_CHAIN_ID
```

They are not used by the current code and have been removed from
`.env.example`.

## 6. Existing Supabase Values

Keep your existing database and Auth values in this shape:

```dotenv
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
PLATFORM_ADMIN_EMAILS="your-google-account@example.com"
```

`DATABASE_URL`, `DIRECT_URL`, and `SUPABASE_SERVICE_ROLE_KEY` must be marked as
secrets in Vercel and must never appear in client-side code.

The Storage buckets expected by the application are:

| Bucket                   | Visibility |
| ------------------------ | ---------- |
| `organization-logos`     | Public     |
| `submission-attachments` | Private    |

## 7. Final Vercel Checklist

1. Add all ten Vercel variables from the first table.
2. Select Production, and Preview only if you intentionally test previews.
3. Run `npx --yes pnpm@10.13.1 db:deploy` against the production database.
4. Redeploy after setting the contract address.
5. Open the deployed app and sign in with Google.
6. Link the admin wallet and every evaluator wallet.
7. Put Sepolia ETH in every wallet that will submit a transaction.
8. Follow [WEB3_SETUP.md](./WEB3_SETUP.md) for the full Nox test flow.

Docker is not part of this deployment checklist.
