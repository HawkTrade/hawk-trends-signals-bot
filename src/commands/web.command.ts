import type { Context } from "../models/telegraf.model";
import { errorWrapper } from "../utils/helpers";
import { HawkApi } from "../utils/fetch";
import type { HawkApiResponse } from "../models/twitter.api";
import type { Pipeline } from "../models/db.model";
import { pipelinesKeyboard } from "../keyboards/pipeline.keyboards";
import { localPipelineMessage } from "../messages/pipeline.messages";

async function _addWebSelectorCmd(ctx: Context) {
  const { data, error } = await HawkApi.get<HawkApiResponse<Pipeline[]>>(
    "/pipeline?with_hawk=false"
  );
  if (error) throw error;

  const keyboard = pipelinesKeyboard(data, "web_pipeline" as any);
  const message = localPipelineMessage(data, "view");

  const { message_id } = await ctx.reply(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
  ctx.session.toDelete.push(message_id);
}

const addWebSelectorCmd = errorWrapper(_addWebSelectorCmd);

async function _testWebSourceCmd(ctx: Context) {
  ctx.session.state = "web_test";
  const { message_id } = await ctx.reply(
    "Please enter the URL of the web source you want to test."
  );
  ctx.session.toDelete.push(message_id);
}

const testWebSourceCmd = errorWrapper(_testWebSourceCmd);

export { addWebSelectorCmd, testWebSourceCmd };
