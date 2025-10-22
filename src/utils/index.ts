import type { Session, Context } from "../models/telegraf.model";
import dotenv from "dotenv";
dotenv.config();

function getEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

async function to_delete(ctx: Context) {
  try {
    if (ctx.session.toDelete.length === 0) return;
    await ctx.sendChatAction("typing");
    await Promise.all(ctx.session.toDelete.map((id) => ctx.deleteMessage(id)));
  } catch (error) {
    console.error("error in toDelete helper", error);
  }
}

const asyncPipe =
  <T>(...fns: Array<(arg: T) => Promise<T>>) =>
  async (arg: T) => {
    for (const fn of fns) {
      arg = await fn(arg);
    }
  };

const getDefaultSession = (): Session => ({
  state: "idle",
  source_action: null,
  parser_action: null,
  pipeline: null,
  toDelete: [],
});

export { asyncPipe, getDefaultSession, getEnv, to_delete };
