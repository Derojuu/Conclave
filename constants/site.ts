import { siteLinks } from "@/lib/site-links";
import type {
  Application,
  DecisionProblem,
  FaqItem,
  NavigationItem,
  ProcessStep,
  ProductFeature,
} from "@/types/site";

export const navigationItems: NavigationItem[] = [
  { label: "PRODUCT", href: siteLinks.product },
  { label: "IEXEC NOX", href: siteLinks.nox },
  { label: "APPLICATIONS", href: siteLinks.applications },
  { label: "SECURITY", href: siteLinks.security },
  { label: "FAQ", href: siteLinks.faq },
];

export const decisionProblems: DecisionProblem[] = [
  {
    title: "Evaluations leak",
    description:
      "Comments and scorecards are routinely visible to administrators, organizers, and other reviewers.",
    signal: "CONFIDENTIALITY LOST",
    icon: "eye",
  },
  {
    title: "Reviewers influence reviewers",
    description:
      "Early scores and strong opinions anchor the rest of the campaign before independent judgment is complete.",
    signal: "OUTCOME DISTORTED",
    icon: "users",
  },
  {
    title: "Politics enter the process",
    description:
      "Hiring, funding, and procurement decisions become shaped by hierarchy instead of evidence.",
    signal: "INDEPENDENCE LOST",
    icon: "briefcase",
  },
  {
    title: "Trust requires blind faith",
    description:
      "Participants cannot verify how a result was computed without exposing the sensitive inputs behind it.",
    signal: "RESULT UNVERIFIABLE",
    icon: "search-check",
  },
];

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Create campaign",
    description:
      "Define the decision, evaluation criteria, weighting, and result policy.",
    visibility: "Published",
    icon: "users",
  },
  {
    number: "02",
    title: "Invite members",
    description:
      "Give each authorized participant a private evaluation workspace.",
    visibility: "Published",
    icon: "mail",
  },
  {
    number: "03",
    title: "Submit evaluations",
    description:
      "Scores, rankings, and comments are encrypted before computation.",
    visibility: "Private",
    icon: "lock",
  },
  {
    number: "04",
    title: "Compute with Nox",
    description:
      "The agreed decision logic runs inside a confidential execution environment.",
    visibility: "Private",
    icon: "cpu",
  },
  {
    number: "05",
    title: "Publish the result",
    description:
      "Only the approved outcome and verification record leave the protected process.",
    visibility: "Published",
    icon: "check",
  },
];

export const applications: Application[] = [
  {
    title: "Hiring",
    description:
      "Protect interviewer feedback and produce a recommendation without exposing individual assessments.",
    icon: "briefcase",
  },
  {
    title: "Investment committees",
    description:
      "Keep partner conviction, risk scores, and dissent confidential during deliberation.",
    icon: "chart",
  },
  {
    title: "Scholarship selection",
    description:
      "Evaluate candidates fairly without exposing reviewer notes or individual scores.",
    icon: "graduation-cap",
  },
  {
    title: "Grant reviews",
    description:
      "Separate reviewer identity from funding recommendations and written evaluations.",
    icon: "hand-coins",
  },
  {
    title: "Procurement",
    description:
      "Protect vendor scoring and commercial assessments while producing an auditable selection.",
    icon: "handshake",
  },
  {
    title: "Board decisions",
    description:
      "Enable candid executive input without publishing individual positions.",
    icon: "landmark",
  },
  {
    title: "University admissions",
    description:
      "Combine admissions evaluations without exposing sensitive applicant discussions.",
    icon: "building",
  },
  {
    title: "Research selection",
    description:
      "Assess papers, proposals, and research programs without revealing individual reviewer positions.",
    icon: "award",
  },
];

export const productFeatures: ProductFeature[] = [
  {
    title: "Private evaluations",
    description:
      "Individual scores and rankings remain confidential throughout the process.",
    icon: "fingerprint",
  },
  {
    title: "Encrypted comments",
    description:
      "Qualitative feedback is protected alongside structured decision data.",
    icon: "message",
  },
  {
    title: "Weighted scoring",
    description:
      "Model expertise, roles, criteria, and custom decision policies.",
    icon: "sliders",
  },
  {
    title: "Consensus engine",
    description:
      "Compute rankings, thresholds, majorities, and campaign outcomes.",
    icon: "network",
  },
  {
    title: "Verifiable audit trail",
    description:
      "Prove process integrity without disclosing the private submissions.",
    icon: "search-check",
  },
  {
    title: "Campaign management",
    description:
      "Control membership, deadlines, permissions, and decision stages.",
    icon: "users",
  },
  {
    title: "Confidential computation",
    description:
      "Protect sensitive information while the decision logic is running.",
    icon: "cpu",
  },
  {
    title: "Result policies",
    description:
      "Choose exactly what becomes visible when a decision is finalized.",
    icon: "eye",
  },
  {
    title: "Enterprise controls",
    description:
      "Build repeatable workflows for high-stakes organizational decisions.",
    icon: "shield",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "How is Conclave different from Google Forms?",
    answer:
      "Google Forms collects responses for an administrator to read. Conclave is designed so the decision logic can operate on protected submissions while the approved result is revealed separately.",
  },
  {
    question: "Can administrators read individual submissions?",
    answer:
      "The intended Conclave model keeps individual scores, rankings, and comments confidential from administrators and other campaign members. Visibility is controlled by the decision policy.",
  },
  {
    question: "Can evaluators influence one another?",
    answer:
      "Evaluators work independently and cannot inspect the other submissions while evaluation is active. This reduces anchoring, hierarchy pressure, and strategic scoring.",
  },
  {
    question: "Why use confidential computation?",
    answer:
      "Encryption normally protects stored or transmitted information. Confidential computation extends protection to the moment when that information is actively being processed.",
  },
  {
    question: "What does iExec Nox provide?",
    answer:
      "iExec Nox provides the confidential execution layer used to process protected decision inputs and return the authorized output.",
  },
  {
    question: "How is the final result verified?",
    answer:
      "Conclave can publish a computation receipt and result record so participants can verify the approved process completed without exposing each private evaluation.",
  },
];
