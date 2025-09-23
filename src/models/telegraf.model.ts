import type { FastifyInstance } from "fastify";
import { Context as TelegrafContext } from "telegraf";

type Action = "add" | "rem" | "get";
type Source = "telegram" | "x" | "rss";
type Parser = "regex" | "llm";

interface Session {
  ticketId: string | null;
  state: "idle" | "source_action" | "parser_action";
  lastInteraction: number;
  source_action: `${Source}:${Action}` | null;
  parser_action: `${Parser}:${Action}` | null;
}

type Context = TelegrafContext & {
  session: Session;
  match?: RegExpExecArray;
  fastify: FastifyInstance;
};
export type { Session, Context, Source, Action, Parser };
