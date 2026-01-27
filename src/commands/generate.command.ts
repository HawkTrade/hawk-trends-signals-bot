import { errorWrapper, validateCallerIsAdmin } from "../utils/helpers";
import { Context } from "../models/telegraf.model";
import { getDefaultSession, to_delete } from "../utils";

async function _generateTradeInterfaceRegexCmd(ctx: Context) {
  await validateCallerIsAdmin(ctx);
  await to_delete(ctx);

  ctx.session = getDefaultSession();
  ctx.session.state = "generate_regex";
  await ctx.reply(
    "Please provide an example content to generate the regex pattern.",
  );
}

export const generateTradeInterfaceRegexCmd = errorWrapper(
  _generateTradeInterfaceRegexCmd,
);
