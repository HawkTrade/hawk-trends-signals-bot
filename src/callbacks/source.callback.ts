import type { Action, Context, Source } from "../models/telegraf.model";
import { HawkApi } from "../utils/fetch";
import { getChannelNames } from "../utils/utils";
import { errorWrapper } from "../utils/helpers";
import { getSourcesMessage } from "../messages/sources.messages";
import { sharedSelectPipelineCb_ } from "./shared_pipeline.callback";

async function _sourceSelectedCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("Callback Query data is empty");

  const [source, action, pipeline] = ctx.callbackQuery.data.split(":") as [
    Source,
    Action,
    string | undefined
  ];
  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  if (action === "get" && !pipeline) {
    await ctx.sendChatAction("typing");
    const { data, msg, error } = await HawkApi.get("/source/" + source);
    if (error) throw error;

    const sources =
      (source === "telegram" || source === "tg_bot") && data
        ? await getChannelNames(data, ctx)
        : data;
    const message = getSourcesMessage(msg, sources);

    await ctx.reply(message);
    return;
  }

  ctx.session.source_action = `${source}:${action}`;
  await sharedSelectPipelineCb_(ctx);
}

const sourceSelectedCb = errorWrapper(_sourceSelectedCb);

export { sourceSelectedCb };
