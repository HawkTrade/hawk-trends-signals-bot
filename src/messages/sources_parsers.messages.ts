import { bold, code, fmt, join, italic, FmtString } from "telegraf/format";
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
function formatValue(value: any): string {
  if (value === null || value === undefined) return "N/A";

  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    if (value.length <= 3) return value.join(", ");
    return `${value.length} items`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "Empty Object";

    return entries.map(([k, v]) => `${formatKey(k)}: ${typeof v === "object" ? "{...}" : v}`).join(" | ");
  }

  return String(value);
}

function pingMessage(payload: PingResponse) {
  const { success, message, data } = payload;
  const icon = success ? "🟢" : "🔴";
  const content = [fmt`${icon} ${bold(message)}`];

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const processEntry = (obj: object, indent = ""): FmtString<"fmt">[] => {
      return Object.entries(obj).flatMap(([key, value]) => {
        const label = formatKey(key);

        if (value && typeof value === "object" && !Array.isArray(value)) {
          return [fmt`${indent}• ${bold(label)}:`, ...processEntry(value, indent + "  ")];
        }

        return [fmt`${indent}• ${bold(label)}: ${code(formatValue(value))}`];
      });
    };

    const details = processEntry(data);

    if (details.length > 0) {
      content.push(fmt``);
      content.push(...details);
    }
  }

  return fmt`${join(content, "\n")}`;
}

function pollMessage(msg: string, data: string[]) {
  if (data.length === 0) {
    return fmt`${bold(msg)}

${italic("There are no data polled at the moment")}`;
  } else {
    const sources_msg = data.map((src) => fmt`• ${bold(src)}`);
    return fmt`${bold(msg)}
  
${join(sources_msg, "\n")}
`;
  }
}

export { getSourcesMessage, getParserMessage, pingMessage, pollMessage };
