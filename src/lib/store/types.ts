import type { Opportunity, OpportunityQuery, QueryResult, SourceRunResult } from "../types";

export interface ScrapeRun {
  startedAt: string;
  finishedAt: string;
  total: number;
  results: SourceRunResult[];
}

export interface Store {
  upsert(items: Opportunity[]): Promise<void>;
  query(query: OpportunityQuery): Promise<QueryResult>;
  get(id: string): Promise<Opportunity | null>;
  recordRun(run: ScrapeRun): Promise<void>;
  lastRun(): Promise<ScrapeRun | null>;
}
