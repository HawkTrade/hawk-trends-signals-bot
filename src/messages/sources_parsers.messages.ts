import { bold, fmt, join } from "telegraf/format";

function getSourcesMessage(
  msg: string | undefined,
  sources: string[] | undefined
) {
  if (!msg || !sources) return "API response seems invalid";

  const sources_msg = sources.map((src) => fmt`• ${bold(src)}`);

  return fmt`${bold(msg)}
  
${join(sources_msg, "\n")}
`;
}

function getParserMessage(
  msg: string | undefined,
  parsers: string[] | undefined
) {
  if (!msg || !parsers) return "API response seems invalid";

  const parsers_msg = parsers.map((src) => fmt`• ${bold(src)}`);

  return fmt`${bold(msg)}
  
${join(parsers_msg, "\n")}
`;
}

export { getSourcesMessage, getParserMessage };
