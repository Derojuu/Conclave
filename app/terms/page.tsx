import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { legalConfig } from "@/constants/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing access to and use of Conclave.",
  alternates: { canonical: "/terms" },
};

const sections = [
  { id: "agreement", title: "Agreement" },
  { id: "eligibility", title: "Eligibility and authority" },
  { id: "accounts", title: "Accounts and organizations" },
  { id: "service", title: "The service" },
  { id: "content", title: "Customer content" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "third-parties", title: "Third-party services" },
  { id: "confidentiality", title: "Confidential workflows" },
  { id: "ownership", title: "Ownership" },
  { id: "availability", title: "Availability and changes" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "liability", title: "Limitation of liability" },
  { id: "termination", title: "Suspension and termination" },
  { id: "general", title: "General terms and contact" },
] as const;

function TermsSection({
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

function TermsList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-3 border-l border-black/[0.09] pl-5 dark:border-white/[0.09]">
      {children}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      lastUpdated={legalConfig.lastUpdated}
      sections={[...sections]}
      summary="These terms govern access to Conclave and establish responsibilities for accounts, organizations, confidential evaluation campaigns, submissions, and optional blockchain interactions."
      title="Terms of Service"
    >
      <TermsSection id="agreement" title="1. Agreement">
        <p>
          These Terms of Service form an agreement between you and the operator
          of the Conclave service. By accessing or using Conclave, creating an
          account, accepting an organization invitation, or submitting content,
          you agree to these terms and the Privacy Policy.
        </p>
        <p>
          An organization may have a separate written agreement governing its
          use of Conclave. If that agreement conflicts with these terms, the
          separate written agreement controls for that organization.
        </p>
      </TermsSection>

      <TermsSection id="eligibility" title="2. Eligibility and authority">
        <p>
          You must be legally able to enter this agreement. If you use Conclave
          for an employer, university, company, public body, or other
          organization, you represent that you are authorized to act for that
          organization and comply with its policies.
        </p>
        <p>
          Organizations are responsible for determining whether their use of
          Conclave complies with employment, education, procurement, financial,
          privacy, records-management, and other laws applicable to their
          decisions.
        </p>
      </TermsSection>

      <TermsSection id="accounts" title="3. Accounts and organizations">
        <TermsList>
          <li>Provide accurate account and profile information.</li>
          <li>
            Protect your Google account, devices, sessions, and optional wallet.
          </li>
          <li>
            Promptly report suspected unauthorized access or security incidents.
          </li>
          <li>
            Use only permissions assigned to you and do not attempt to bypass
            role or organization boundaries.
          </li>
          <li>
            Keep organization membership, evaluator assignments, and
            administrative roles current.
          </li>
        </TermsList>
        <p>
          Organization owners and administrators control membership, campaign
          access, submissions, templates, deadlines, and authorized results.
          They are responsible for their users&apos; use of the service.
        </p>
      </TermsSection>

      <TermsSection id="service" title="4. The service">
        <p>
          Conclave provides infrastructure for structured, confidential
          evaluation and decision workflows. It may include organization
          management, evaluation campaigns, submissions, templates, encrypted
          evaluations, confidential computation, aggregate results,
          verification records, notifications, and audit logs.
        </p>
        <p>
          Conclave does not make an organization&apos;s decision and does not
          guarantee that any evaluation criteria, scoring rule, ranking, or
          result is lawful, accurate, fair, or suitable for a particular
          purpose. The organization defines the process and remains responsible
          for the resulting decision.
        </p>
      </TermsSection>

      <TermsSection id="content" title="5. Customer content">
        <p>
          You and your organization retain ownership of information submitted
          to Conclave. You grant Conclave the limited rights necessary to host,
          protect, transmit, process, back up, and display that information in
          order to operate the service.
        </p>
        <p>
          You represent that you have the rights and lawful basis required to
          submit account information, candidate or applicant records,
          attachments, evaluation criteria, and other content. Do not submit
          information that the organization is not authorized to collect or
          process.
        </p>
      </TermsSection>

      <TermsSection id="acceptable-use" title="6. Acceptable use">
        <p>You must not use Conclave to:</p>
        <TermsList>
          <li>Break any law or violate another person&apos;s rights.</li>
          <li>
            Discriminate unlawfully or automate prohibited employment, credit,
            housing, education, or public-service decisions.
          </li>
          <li>
            Upload malware, exploit vulnerabilities, disrupt the service, or
            interfere with another organization.
          </li>
          <li>
            Access private evaluations, credentials, systems, or data without
            authorization.
          </li>
          <li>
            Reverse engineer confidential-computation controls or falsify
            commitments, receipts, results, identities, or audit records.
          </li>
          <li>
            Use the service for spam, fraud, harassment, surveillance, or
            deceptive activity.
          </li>
        </TermsList>
      </TermsSection>

      <TermsSection id="third-parties" title="7. Third-party services">
        <p>
          Conclave relies on or interoperates with third-party services,
          including Google authentication, Supabase infrastructure, iExec Nox,
          cloud hosting, wallet connectors, blockchain networks, and RPC
          providers. Your use of those services may be governed by their own
          terms and privacy policies.
        </p>
        <p>
          Third-party systems and public blockchains are outside Conclave&apos;s
          direct control. Conclave is not responsible for wallet software,
          network congestion, transaction fees, chain reorganizations, external
          service outages, or changes made by third-party providers.
        </p>
      </TermsSection>

      <TermsSection
        id="confidentiality"
        title="8. Confidential workflows"
      >
        <p>
          Conclave is designed so individual evaluation content can be
          encrypted before confidential computation. Organizations must
          correctly configure campaign permissions, encryption material,
          computation infrastructure, result policies, and evaluator access.
        </p>
        <p>
          No technology eliminates every risk. Confidentiality can be affected
          by compromised user devices, incorrect configuration, disclosure by
          participants, weak external key custody, unlawful access, or
          third-party failures. Do not represent that Conclave provides legal
          anonymity or an absolute guarantee of secrecy.
        </p>
      </TermsSection>

      <TermsSection id="ownership" title="9. Ownership">
        <p>
          Conclave and its licensors retain all rights in the application,
          interfaces, software, designs, documentation, trademarks, and service
          technology, excluding customer content and third-party materials.
        </p>
        <p>
          Feedback may be used to improve Conclave without restriction or
          compensation, provided it does not identify confidential customer
          content or disclose protected evaluation information.
        </p>
      </TermsSection>

      <TermsSection
        id="availability"
        title="10. Availability and changes"
      >
        <p>
          The service may be updated, restricted, suspended, or discontinued.
          Maintenance, security events, provider failures, network conditions,
          and technical limitations may interrupt availability. Any applicable
          service-level commitment must be stated in a separate written
          agreement.
        </p>
        <p>
          Features identified as beta, preview, demonstration, or experimental
          may change and should not be used for production decisions unless
          expressly approved for that purpose.
        </p>
      </TermsSection>

      <TermsSection id="disclaimers" title="11. Disclaimers">
        <p>
          To the maximum extent permitted by law, Conclave is provided
          &quot;as is&quot; and &quot;as available.&quot; All implied warranties,
          including merchantability, fitness for a particular purpose,
          non-infringement, accuracy, and uninterrupted availability, are
          disclaimed where legally permitted.
        </p>
        <p>
          Conclave does not provide legal, employment, investment, procurement,
          admissions, financial, compliance, or professional advice. Obtain
          appropriate independent review before using a computed result for a
          high-stakes decision.
        </p>
      </TermsSection>

      <TermsSection id="liability" title="12. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Conclave and its operators,
          suppliers, and licensors will not be liable for indirect, incidental,
          special, consequential, exemplary, or punitive damages, or for lost
          profits, revenue, data, goodwill, opportunities, or business
          interruption arising from the service.
        </p>
        <p>
          Any monetary liability cap or exclusions established in a separate
          written organization agreement will control. Some jurisdictions do
          not allow certain limitations, so parts of this section may not apply.
        </p>
      </TermsSection>

      <TermsSection
        id="termination"
        title="13. Suspension and termination"
      >
        <p>
          Access may be suspended or terminated to protect the service or other
          users, respond to legal requirements, investigate misuse, address
          non-payment under an organization agreement, or enforce these terms.
          You may stop using Conclave at any time.
        </p>
        <p>
          Provisions concerning ownership, confidentiality, disclaimers,
          liability, dispute obligations, and lawful data retention survive
          termination where their nature requires it.
        </p>
      </TermsSection>

      <TermsSection id="general" title="14. General terms and contact">
        <p>
          These terms and any applicable written organization agreement form
          the complete agreement concerning the service. If a provision is
          unenforceable, the remaining provisions continue in effect. A failure
          to enforce a provision is not a waiver. You may not transfer this
          agreement without authorization.
        </p>
        <p>
          The governing law and dispute forum stated in an applicable written
          organization agreement will control. Otherwise, applicable law will
          determine the governing rules and forum.
        </p>
        <p>
          Legal questions can be sent to{" "}
          <a
            className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-4 dark:text-zinc-200"
            href={`mailto:${legalConfig.contactEmail}`}
          >
            {legalConfig.contactEmail}
          </a>
          .
        </p>
      </TermsSection>
    </LegalPageLayout>
  );
}
