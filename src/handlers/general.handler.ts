import { fmt, mention } from "telegraf/format";
import cache from "../db/cache";
import type { Action, Context, Parser, Source } from "../models/telegraf.model";
import { HawkApi } from "../utils/fetch";
import { errorWrapper } from "../utils/helpers";
import { getDefaultSession, to_delete } from "../utils";

async function _addAdminMsg(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message))
    throw new Error("No message was provided");

  const text = ctx.message.text.trim();
  const adminId = Number(text);
  ctx.session.toDelete.push(ctx.message.message_id);

  await ctx.sendChatAction("typing");
  const { error } = await HawkApi.post("/admin", { adminId });
  if (error) throw error;

  cache.delete("admins");
  const { user } = await ctx.getChatMember(adminId);
  await ctx.reply(
    fmt`${mention(
      user.first_name,
      adminId
    )} has been successfully added as an admin to manage the Hawk Trends Bot`
  );
  await to_delete(ctx);
}

async function _addSourceMsg(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message))
    throw new Error("No message in text");
  const text = ctx.message.text;
  const [source] = ctx.session.source_action!.split(":") as [Source];

  const pipeline = ctx.session.pipeline;
  const body = { value: text, source, pipeline };

  ctx.session.pipeline = null;

  const { msg, error } = await HawkApi.post("source", body);
  if (error) throw error;
  if (!msg) throw new Error("API response is malformed!");

  await ctx.reply(msg);
  ctx.session = getDefaultSession();
}

async function _addParserMsg(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message))
    throw new Error("No message in text");
  const text = ctx.message.text;
  const [source, action] = ctx.session.parser_action!.split(":") as [
    Parser,
    Action
  ];

  const pipeline = ctx.session.pipeline;
  const body = { value: text, source, pipeline };

  ctx.session.pipeline = null;
  const method = action === "add" ? "post" : "delete";

  const { msg, error } = await HawkApi[method]("source", body);
  if (error) throw error;
  if (!msg) throw new Error("API response is malformed!");

  await ctx.reply(msg);
  ctx.session = getDefaultSession();
}

const addAdminMsg = errorWrapper(_addAdminMsg);
const addSourceMsg = errorWrapper(_addSourceMsg);
const addParserMsg = errorWrapper(_addParserMsg);

export { addAdminMsg, addSourceMsg, addParserMsg };
