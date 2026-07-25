import type { IconName } from "@/components/ui/icons";

export type NavigationItem = {
  label: string;
  href: string;
};

export type DecisionProblem = {
  title: string;
  description: string;
  signal: string;
  icon: IconName;
};

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
  visibility: "Private" | "Published";
  icon: IconName;
};

export type Application = {
  title: string;
  description: string;
  icon: IconName;
};

export type ProductFeature = {
  title: string;
  description: string;
  icon: IconName;
};

export type FaqItem = {
  question: string;
  answer: string;
};
