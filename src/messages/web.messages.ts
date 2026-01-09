import { bold, fmt, italic, code, underline, join } from "telegraf/format";
import type { WebData, WebScraperParams } from "../models/db.model";

const containerMsg = fmt`
${bold("Step 1: Container Selector")}

Please enter the ${underline("container selector")}.
This should be a CSS selector (class, attribute, etc.) that reflects an item wrapper for every blog/article on the page.

${italic("Example: .article-card, div[data-testid='post-container']")}

${bold`💡 Tip: Use /test_web_source to verify your selectors before adding them!`}
`;

const titleMsg = fmt`
${bold("Step 2: Title Selector")}

Please enter the ${underline("title selector")}.
This is the selector for the article title ${italic(
  "relative"
)} to the container.

${italic("Example: h2.title, .post-header > a")}
`;

const urlMsg = fmt`
${bold("Step 3: URL Selector")}

Please enter the ${underline("URL selector")}.
This is the selector for the link to the article. It should target the ${code(
  "<a>"
)} tag or an element with an ${code("href")} attribute.

${italic("Example: a.link, .article-title > a")}
`;

const contentMsg = fmt`
${bold("Step 4: Content Selector")}

Please enter the ${underline("Content selector")}.
This is the selector for the preview or main content of the article.
${italic(
  "Note: If it's a paragraph, be explicit (e.g., p.description) so you don't query more than you need."
)}

${italic("Example: .post-content, div.entry-summary")}
`;

const webSelectorSummary = (sourceUrl: string, selectors: WebScraperParams) => {
  return fmt`
${bold("Web Source Selector Summary")}

${bold("Source URL:")} ${code(sourceUrl)}

${bold("Container:")} ${code(selectors.container)}
${bold("Title:")} ${code(selectors.title)}
${bold("URL:")} ${code(selectors.url)}
${bold("Content:")} ${code(selectors.content)}

Please confirm the selectors above are correct.
`;
};

const testResultMsg = (msg: string, data: WebData[]) => {
  const items = data.slice(0, 3).map(
    (item, i) => fmt`
${bold(`Result ${i + 1}:`)}
${bold("Title:")} ${item.title}
${bold("URL:")} ${item.url}
${bold("Content Preview:")} ${item.content.slice(0, 100)}...
`
  );

  return fmt`
${bold(msg)}

${join(items, "\n")}

${data.length > 3 ? italic(`...and ${data.length - 3} more results.`) : ""}
`;
};

export {
  containerMsg,
  titleMsg,
  urlMsg,
  contentMsg,
  webSelectorSummary,
  testResultMsg,
};
