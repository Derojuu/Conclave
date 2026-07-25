import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { legalConfig } from "@/constants/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Conclave collects, uses, protects, and shares information.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  { id: "scope", title: "Scope" },
  { id: "information", title: "Information we collect" },
  { id: "google-data", title: "Google account data" },
  { id: "use", title: "How information is used" },
  { id: "confidentiality", title: "Confidential evaluations" },
  { id: "sharing", title: "How information is shared" },
  { id: "cookies", title: "Cookies and sessions" },
  { id: "retention", title: "Retention and deletion" },
  { id: "security", title: "Security" },
  { id: "rights", title: "Your choices and rights" },
  { id: "children", title: "Children's privacy" },
  { id: "changes", title: "Changes and contact" },
] as const;

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-28" id={id}>
      <h2 className="mb-5 text-xl font-bold text-zinc-950 dark:text-white">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PolicyList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-3 border-l border-black/[0.09] pl-5 dark:border-white/[0.09]">
      {children}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacy"
      lastUpdated={legalConfig.lastUpdated}
      sections={[...sections]}
      summary="This policy describes how Conclave handles account information, organization data, confidential evaluation workflows, optional wallet information, and technical records."
      title="Privacy Policy"
    >
      <PolicySection id="scope" title="1. Scope">
        <p>
          This Privacy Policy applies to the Conclave website, application,
          authentication flow, and related services operated under the Conclave
          name. An organization using Conclave may also provide its own privacy
          notice for information it controls within an evaluation campaign.
        </p>
        <p>
          Conclave provides confidential decision infrastructure. It is
          designed to protect individual evaluations while allowing an
          authorized aggregate result to be computed and published.
        </p>
      </PolicySection>

      <PolicySection id="information" title="2. Information we collect">
        <PolicyList>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-200">
              Account information:
            </strong>{" "}
            name, email address, profile image, authentication provider
            identifier, account preferences, and profile settings.
          </li>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-200">
              Organization information:
            </strong>{" "}
            memberships, invitations, roles, permissions, organization
            profiles, and administrative activity.
          </li>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-200">
              Campaign and submission information:
            </strong>{" "}
            campaign settings, evaluation templates, submission descriptions,
            links, files, metadata, assignments, deadlines, and result records.
          </li>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-200">
              Confidential evaluation data:
            </strong>{" "}
            encrypted evaluation payloads, cryptographic commitments, payload
            hashes, submission status, and computation metadata.
          </li>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-200">
              Optional wallet information:
            </strong>{" "}
            a public wallet address when you choose to connect and save one.
          </li>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-200">
              Technical information:
            </strong>{" "}
            IP address, browser and device information, session data, request
            timestamps, security events, error records, and audit logs.
          </li>
        </PolicyList>
      </PolicySection>

      <PolicySection id="google-data" title="3. Google account data">
        <p>
          When you choose Google Sign-In, Google provides Conclave with the
          basic profile information needed to authenticate you: your Google
          account identifier, name, email address, and profile image when
          available.
        </p>
        <p>
          Conclave uses this information only to sign you in, create and
          maintain your Conclave profile, associate you with organizations and
          permissions, secure your session, and communicate account or service
          information. Conclave does not request access to Gmail, Google Drive,
          contacts, calendars, or other Google product data.
        </p>
        <p>
          Conclave&apos;s use and transfer of information received from Google
          APIs will adhere to the Google API Services User Data Policy,
          including the Limited Use requirements.
        </p>
      </PolicySection>

      <PolicySection id="use" title="4. How information is used">
        <PolicyList>
          <li>Authenticate users and maintain secure sessions.</li>
          <li>Create profiles and enforce organization permissions.</li>
          <li>
            Operate campaigns, submissions, templates, invitations, and
            evaluator assignments.
          </li>
          <li>
            Accept encrypted evaluations and coordinate confidential
            computation.
          </li>
          <li>Publish authorized aggregate results and verification records.</li>
          <li>
            Prevent fraud, investigate security events, enforce policies, and
            maintain audit records.
          </li>
          <li>
            Maintain, troubleshoot, measure, and improve the reliability and
            accessibility of the service.
          </li>
          <li>Comply with legal obligations and enforce agreements.</li>
        </PolicyList>
        <p>
          Conclave does not sell personal information or Google user data. It
          does not use Google user data for advertising.
        </p>
      </PolicySection>

      <PolicySection
        id="confidentiality"
        title="5. Confidential evaluations"
      >
        <p>
          Individual criterion scores, rankings, private comments, and
          recommendations are intended to be encrypted before confidential
          computation. The application stores encrypted payloads and related
          integrity metadata, not a plaintext copy for administrators to read.
        </p>
        <p>
          iExec Nox processes protected inputs within the configured
          confidential-computation boundary. Only the result authorized by the
          campaign policy should be returned, such as a ranking,
          recommendation, aggregate score, or neutral consensus summary.
        </p>
        <p>
          Campaign configuration, submission materials, evaluator assignments,
          aggregate results, and operational metadata are separate from the
          encrypted evaluation payload and may be visible to authorized
          organization members according to their role.
        </p>
      </PolicySection>

      <PolicySection id="sharing" title="6. How information is shared">
        <p>Information may be disclosed to:</p>
        <PolicyList>
          <li>
            Your organization and its authorized members, according to
            organization roles and campaign permissions.
          </li>
          <li>
            Infrastructure and service providers that support authentication,
            hosting, database, storage, confidential computation, monitoring,
            and security.
          </li>
          <li>
            Google when you use Google authentication, and wallet/RPC providers
            when you voluntarily use wallet or blockchain functionality.
          </li>
          <li>
            Authorities or other parties when reasonably necessary to comply
            with law, protect rights and safety, investigate abuse, or enforce
            agreements.
          </li>
          <li>
            A successor in connection with a merger, financing, acquisition,
            reorganization, or transfer of the service, subject to appropriate
            confidentiality protections.
          </li>
        </PolicyList>
        <p>
          Public blockchain transactions can reveal wallet addresses,
          transaction data, and contract interactions permanently. Conclave
          only initiates wallet activity after the user chooses to connect a
          wallet and approves the relevant interaction.
        </p>
      </PolicySection>

      <PolicySection id="cookies" title="7. Cookies and sessions">
        <p>
          Conclave uses essential cookies and similar browser storage to
          complete authentication, persist sessions, protect requests, remember
          interface preferences, and maintain security. These technologies are
          required for signed-in functionality.
        </p>
        <p>
          Google, wallet providers, and other external services may set or read
          their own cookies under their respective policies when you interact
          with them.
        </p>
      </PolicySection>

      <PolicySection id="retention" title="8. Retention and deletion">
        <p>
          Information is retained for as long as needed to provide the service,
          maintain organization and campaign records, meet contractual or legal
          requirements, resolve disputes, prevent abuse, and preserve required
          audit and verification records.
        </p>
        <p>
          Retention can vary by organization and campaign. Organization
          administrators may control records they submit to Conclave. Account
          deletion requests may be subject to legal, security, audit,
          contractual, backup, and verified-result retention requirements.
        </p>
        <p>
          Data recorded on a public blockchain cannot generally be altered or
          deleted by Conclave.
        </p>
      </PolicySection>

      <PolicySection id="security" title="9. Security">
        <p>
          Conclave applies technical and organizational measures intended to
          protect information, including role-based access controls, secure
          authentication, encrypted transport, restricted service credentials,
          audit logging, encrypted evaluation payloads, and integrity
          verification.
        </p>
        <p>
          No system can guarantee absolute security. Users are responsible for
          protecting their Google account, devices, active sessions, wallet
          recovery material, and organization access.
        </p>
      </PolicySection>

      <PolicySection id="rights" title="10. Your choices and rights">
        <p>
          Depending on your location, you may have rights to request access,
          correction, deletion, restriction, portability, or objection
          concerning personal information. You may update available profile
          information from account settings and disconnect an optional wallet.
        </p>
        <p>
          You can revoke Conclave&apos;s Google account access from your Google
          account permissions. Revocation prevents future Google
          authentication but does not automatically delete records Conclave is
          required or permitted to retain.
        </p>
      </PolicySection>

      <PolicySection id="children" title="11. Children's privacy">
        <p>
          Conclave is an organizational decision service and is not directed
          to children under 13. Organizations are responsible for obtaining any
          consent required before submitting information about minors in
          admissions, scholarship, hiring, or similar workflows.
        </p>
      </PolicySection>

      <PolicySection id="changes" title="12. Changes and contact">
        <p>
          This policy may be updated as Conclave, applicable law, or service
          providers change. Material updates will be reflected by changing the
          date at the top of this page and, where appropriate, providing an
          additional notice.
        </p>
        <p>
          Privacy questions and requests can be sent to{" "}
          <a
            className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-4 dark:text-zinc-200"
            href={`mailto:${legalConfig.contactEmail}`}
          >
            {legalConfig.contactEmail}
          </a>
          . Organization-controlled data questions should also be directed to
          the relevant organization administrator.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}
