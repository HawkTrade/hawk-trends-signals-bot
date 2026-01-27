import { errorWrapper } from "../utils/helpers";
import { Context } from "../models/telegraf.model";
import { HawkApi } from "../utils/fetch";
import { getDefaultSession, to_delete } from "../utils";

async function _generateTradeInterfaceRegexHdlr(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message))
    throw new Error("No context was provided");

  const text = ctx.message.text.trim();
  ctx.session.toDelete.push(ctx.message.message_id);

  await ctx.sendChatAction("typing");
  const { error, msg, data } = await HawkApi.post(
    "/generate-trade-request-regex",
    { text },
  );
  if (error) throw error;

  if (!msg || !data) throw new Error("API response is malformed!");

  await ctx.reply(msg);
  await ctx.reply(
    `Generated Regex Pattern:\n\n\`${data}\`\n\nYou can copy and paste it into your pipeline settings.`,
    {
      parse_mode: "MarkdownV2",
    },
  );
  ctx.session = getDefaultSession();
  await to_delete(ctx);
}

export const generateTradeInterfaceRegexHdlr = errorWrapper(
  _generateTradeInterfaceRegexHdlr,
);
