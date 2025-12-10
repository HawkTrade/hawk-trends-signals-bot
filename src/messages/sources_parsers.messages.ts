import { bold, code, fmt, join } from "telegraf/format";
import { PingResponse } from "../models/twitter.api";

function getSourcesMessage(msg: string | undefined, sources: string[] | undefined) {
  if (!msg || !sources) return "API response seems invalid";

  const sources_msg = sources.map((src) => fmt`• ${bold(src)}`);

  return fmt`${bold(msg)}
  
${join(sources_msg, "\n")}
`;
}

function getParserMessage(msg: string | undefined, parsers: Array<string> | undefined) {
  if (!msg || !parsers) return "API response seems invalid";
  const firstParser = parsers[0] as string | object;

  const parsers_msg = parsers.map((src) => fmt`• ${bold(src)}`);
  return typeof firstParser === "object"
    ? fmt`${bold(msg)}`
    : fmt`${bold(msg)}
  
${join(parsers_msg, "\n")}
`;
}

function formatKey(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function pingMessage(payload: PingResponse) {
  const { success, message, data } = payload;
  const icon = success ? "🟢" : "🔴";

  const content = [fmt`${icon} ${bold(message)}`];

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const details = Object.entries(data).map(([key, value]) => {
      const label = formatKey(key);
      let displayValue = "N/A";

      if (Array.isArray(value)) {
        if (value.length === 0) displayValue = "None";
        else if (value.length <= 3) displayValue = value.join(", ");
        else displayValue = `${value.length} active items`;
      } else if (value !== null && value !== undefined) {
        displayValue = String(value);
      }

      return fmt`• ${bold(label)}: ${code(displayValue)}`;
    });

    if (details.length > 0) {
      content.push(fmt``);
      content.push(...details);
    }
  }

  return fmt`${join(content, "\n")}`;
}

export { getSourcesMessage, getParserMessage, pingMessage };
