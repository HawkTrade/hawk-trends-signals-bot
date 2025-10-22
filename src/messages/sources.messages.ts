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

export { getSourcesMessage };
