export type Severity = "bloccante" | "limitante" | "opportunita";

export type Finding = {
  title: string;
  severity: Severity;
  description: string;
};

export type DiagnosisResult = {
  recoverability_score: number;
  findings: Finding[];
};
