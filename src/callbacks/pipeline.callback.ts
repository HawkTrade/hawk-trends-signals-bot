import type { CB_Action, Context } from "../models/telegraf.model";
import type { CreatePipeline } from "../models/db.model";
import { errorWrapper, groupOrSuperGroupChecker } from "../utils/helpers";
import cache from "../db/cache";
import { HawkApi } from "../utils/fetch";
import { createPipelineSummary } from "../messages/pipeline.messages";

async function _actionCreatePipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback. Please call start");

  const key = groupOrSuperGroupChecker(ctx);
  const [, action] = ctx.callbackQuery.data.split(":") as ["", CB_Action];

  if (!cache.has(key))
    throw new Error(
      "Pipeline creation cache is seemingly empty or may have expired! Please restart the process"
    );

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  if (action === "cancel") {
    cache.delete(key);
    await ctx.answerCbQuery(
      "Pipeline creation has been successfully cancelled"
    );
    return;
  }

  const partial: CreatePipeline = JSON.parse(cache.get(key) || "{}");
  await ctx.sendChatAction("typing");
  const { error, msg } = await HawkApi.post("/pipeline", partial);
  if (error) throw error;

  await ctx.answerCbQuery(msg!, { show_alert: true });
  await ctx.editMessageText(createPipelineSummary(partial, false));
}

const createPipelineCb = errorWrapper(_actionCreatePipelineCb);

export { createPipelineCb };
