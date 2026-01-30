export interface SessionRow {
  value: string;
}

export interface CreatePipeline {
  pipeline: string;
  description: string;
  brands: [string];
  tp?: number;
  sl?: number;
}

export interface EditPipeline {
  pipeline: string;
  tp: number;
  sl: number;
}
type LocalPipeline = {
  pipeline: string;
  strategyId: string;
  name: string;
  takeProfit?: number;
  stopLoss: number;
};

type ExternalPipeline = {
  id: string;
  name: string;
  description: string;
  brands: [string];
  created_at: Date;
  updated_at: Date;
};

type Pipeline = LocalPipeline & Omit<ExternalPipeline, "id">;

interface WebData {
  title: string;
  url: string;
  content: string;
}

interface WebScraperParams extends WebData {
  container: string;
}

interface BinanceAccount {
  apiKey: string;
  apiSecret: string;
  name: string;
}

interface BackfillJob {
  type: "date" | "count";
  start?: Date;
  end?: Date;
  count?: number;
  source: string;
  pipeline: string;
  requestedBy: number;
  sourceType: string;
}

export type {
  Pipeline,
  LocalPipeline,
  WebData,
  WebScraperParams,
  BinanceAccount,
  BackfillJob,
};
