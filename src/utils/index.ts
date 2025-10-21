import type { Session } from "../models/telegraf.model";
import dotenv from "dotenv";
dotenv.config();

function getEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
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
});

export { asyncPipe, getDefaultSession, getEnv };
