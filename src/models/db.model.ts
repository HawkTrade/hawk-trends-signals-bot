export interface SessionRow {
  value: string;
}

export interface CreatePipeline {
  pipeline: string;
  description: string;
  brands: [string];
}
type LocalPipeline = {
  pipeline: string;
  strategyId: string;
  name: string;
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

export type { Pipeline, LocalPipeline };
