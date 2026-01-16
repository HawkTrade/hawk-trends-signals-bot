import type { FastifyInstance } from "fastify";
import { Context as TelegrafContext } from "telegraf";

type Action = "add" | "rem" | "get";
type Source =
  | "telegram"
  | "x"
  | "rss"
  | "tg_bot"
  | "discord"
  | "web"
  | "binance";
type Parser = "regex" | "llm";
type State =
  | "idle"
  | "source_action"
  | "parser_action"
  | "pipeline_create"
  | "pipeline_edit"
  | "admin_add"
  | "web_selector"
  | "web_test"
  | "binance_account";

type CB_Action = "confirm" | "cancel";

interface Session {
  state: State;
  source_action: `${Source}:${Action}` | null;
  parser_action: `${Parser}:${Action}` | null;
  pipeline: string | null;
  toDelete: number[];
}

type Context = TelegrafContext & {
  session: Session;
  match?: RegExpExecArray;
  fastify: FastifyInstance;
  _cbAnswered?: boolean;
};
export type { Session, Context, Source, Action, Parser, CB_Action };
