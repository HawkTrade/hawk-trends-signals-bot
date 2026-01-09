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

export type { Pipeline, LocalPipeline, WebData, WebScraperParams };
