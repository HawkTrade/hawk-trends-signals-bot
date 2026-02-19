import { pollMessage } from "../messages/sources_parsers.messages";
import type { Action as Act, Context } from "../models/telegraf.model";
import { HawkApi } from "../utils/fetch";
import { errorWrapper, validateCallerIsAdmin } from "../utils/helpers";

type Action = Act | `get_pip` | "ping";
const cmd = "Please select the source";
const keyboards = (action: Action) => {
  return [
    [
      { text: "Gram", callback_data: `telegram:${action}` },
      { text: "X", callback_data: `x:${action}` },
      { text: "RSS", callback_data: `rss:${action}` },
    ],
    [
      { text: "TG Bot", callback_data: `tg_bot:${action}` },
      { text: "Discord", callback_data: `discord:${action}` },
      { text: "Web", callback_data: `web:${action}` },
    ],
    [
      { text: "Binance", callback_data: `binance:${action}` },
      { text: "New X", callback_data: `new_x:${action}` },
    ],
  ];
};

async function _sourceCmd(ctx: Context, action: Action) {
  await validateCallerIsAdmin(ctx);

  const { message_id } = await ctx.reply(cmd, {
    reply_markup: {
      inline_keyboard: keyboards(action),
    },
  });
  ctx.session.toDelete.push(message_id);
}

const makeSourceCmd = (action: Action) =>
  errorWrapper(async (ctx: Context) => {
    await _sourceCmd(ctx, action);
  });

const addSourceCmd = makeSourceCmd("add");
const removeSourceCmd = makeSourceCmd("rem");
const getSourcesCmd = makeSourceCmd("get");
const getSourcesForPipelineCmd = makeSourceCmd("get_pip");
const pingCmd = makeSourceCmd("ping");
const backfillCmd = makeSourceCmd("backfill");

const pollCmd = errorWrapper(async (ctx: Context) => {
  const { error, data, msg } = await HawkApi.get("/poll");
  if (error) throw error;

  const message = pollMessage(msg!, data!);
  await ctx.reply(message);
});

export { addSourceCmd, removeSourceCmd, getSourcesCmd, getSourcesForPipelineCmd, pingCmd, backfillCmd, pollCmd };
