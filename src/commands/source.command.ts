import type { Action as Act, Context } from "../models/telegraf.model";
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
    ],
  ];
};

async function _sourceCmd(ctx: Context, action: Action) {
  await validateCallerIsAdmin(ctx);

  await ctx.reply(cmd, {
    reply_markup: {
      inline_keyboard: keyboards(action),
    },
  });
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

export { addSourceCmd, removeSourceCmd, getSourcesCmd, getSourcesForPipelineCmd, pingCmd };
