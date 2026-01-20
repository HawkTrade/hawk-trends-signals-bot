import type { LocalPipeline } from "../models/db.model";

type PipelineCallback = "remove_pipeline" | "get_pipeline" | "edit_pipeline";
function pipelinesKeyboard(
  pipelines: LocalPipeline[] | undefined,
  callback: PipelineCallback,
  page: number = 1,
) {
  if (!pipelines || !pipelines.length) return [];

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(pipelines.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const currentPipelines = pipelines.slice(start, end);

  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  for (let i = 0; i < currentPipelines.length; i += 2) {
    const rowPipelines = currentPipelines.slice(i, i + 2);

    const row: Array<{ text: string; callback_data: string }> =
      rowPipelines.map((pipeline) => ({
        text: pipeline.name,
        callback_data: `${callback}:${pipeline.pipeline}`,
      }));

    keyboard.push(row);
  }

  const navigationRow: Array<{ text: string; callback_data: string }> = [];
  if (page > 1) {
    navigationRow.push({
      text: "« Previous",
      callback_data: `list_pipelines:${callback}:${page - 1}`,
    });
  }
  if (page < totalPages) {
    navigationRow.push({
      text: "Next »",
      callback_data: `list_pipelines:${callback}:${page + 1}`,
    });
  }
  if (navigationRow.length > 0) {
    keyboard.push(navigationRow);
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
