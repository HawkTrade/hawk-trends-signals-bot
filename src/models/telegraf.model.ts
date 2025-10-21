import type { FastifyInstance } from "fastify";
import { Context as TelegrafContext } from "telegraf";

type Action = "add" | "rem" | "get";
type Source = "telegram" | "x" | "rss" | "tg_bot" | "discord";
type Parser = "regex" | "llm" | "admin" | "pipeline";

interface Session {
  state: "idle" | "source_action" | "parser_action" | "pipeline_create";
  source_action: `${Source}:${Action}` | null;
  parser_action: `${Parser}:${Action}` | null;
  pipeline: string | null;
}

type Context = TelegrafContext & {
  session: Session;
  match?: RegExpExecArray;
  fastify: FastifyInstance;
};
export type { Session, Context, Source, Action, Parser };
