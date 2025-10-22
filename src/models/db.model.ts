export interface SessionRow {
  value: string;
}

export interface Pipeline {
  pipeline: string;
  strategyId: string;
  name: string;
}

export interface CreatePipeline {
  pipeline: string;
  description: string;
  brands: [string];
}
