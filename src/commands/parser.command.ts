import { sharedSelectPipelineCb_ } from "../callbacks/shared_pipeline.callback";
import { Action, Context, Parser } from "../models/telegraf.model";
import { errorWrapper, validateCallerIsAdmin } from "../utils/helpers";

type ParserAction = `${Parser}:${Action}`;
async function _parserCmd(ctx: Context, ps: ParserAction) {
  await validateCallerIsAdmin(ctx);
  ctx.session.parser_action = ps;
  await sharedSelectPipelineCb_(ctx);
}

const makeParserCmd = (ps: ParserAction) =>
  errorWrapper(async (ctx: Context) => {
    await _parserCmd(ctx, ps);
  });

const addRegexCmd = makeParserCmd("regex:add");
const removeRegexCmd = makeParserCmd("regex:rem");
const getRegexesCmd = makeParserCmd("regex:get");
const setPromptCmd = makeParserCmd("llm:add");
const getPromptCmd = makeParserCmd("llm:get");

export {
  addRegexCmd,
  removeRegexCmd,
  getRegexesCmd,
  setPromptCmd,
  getPromptCmd,
};
