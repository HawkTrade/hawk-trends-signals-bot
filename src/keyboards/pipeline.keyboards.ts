import type { LocalPipeline } from "../models/db.model";

type PipelineCallback = "remove_pipeline" | "get_pipeline" | "edit_pipeline";
function pipelinesKeyboard(
  pipelines: LocalPipeline[] | undefined,
  callback: PipelineCallback
) {
  if (!pipelines || !pipelines.length) return [];

  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  for (let i = 0; i < pipelines.length; i += 2) {
    const rowPipelines = pipelines.slice(i, i + 2);

    const row: Array<{ text: string; callback_data: string }> =
      rowPipelines.map((pipeline) => ({
        text: pipeline.name,
        callback_data: `${callback}:${pipeline.pipeline}`,
      }));

    keyboard.push(row);
  }

  return keyboard;
}

const actionCreatePipelineKeyboard = {
  inline_keyboard: [
    [
      { text: "✅ Confirm", callback_data: "pipeline_create:confirm" },
      { text: "❌ Cancel", callback_data: "pipeline_create:cancel" },
    ],
  ],
};

const selectBrandForPipelineKeyboard = {
  keyboard: [[{ text: "ArcDefi" }, { text: "Hawk" }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

const setupTradeConfiguration = {
  keyboard: [[{ text: "Yes" }, { text: "No" }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

export {
  pipelinesKeyboard,
  actionCreatePipelineKeyboard,
  selectBrandForPipelineKeyboard,
  setupTradeConfiguration,
};
