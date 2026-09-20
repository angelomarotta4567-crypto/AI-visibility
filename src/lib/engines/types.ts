export type EngineCitation = {
  uri: string;
  title: string | null;
  domain: string | null;
};

export type EngineQueryResult = {
  responseText: string;
  citations: EngineCitation[];
  raw: unknown;
};

/** Isolation layer between the measurement orchestrator and each answer
 * engine (CLAUDE.md vincolo #2): policy/rate-limit/interface changes on a
 * given platform stay contained to that platform's adapter. */
export interface EngineAdapter {
  code: string;
  isConfigured(): boolean;
  query(queryText: string): Promise<EngineQueryResult>;
}
