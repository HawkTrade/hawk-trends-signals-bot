import type { DataSource } from "../models/twitter.api";

function buildPaginatedKeyboard({
  data,
  page,
  makeCallback,
  navPrefix,
}: {
  data: DataSource;
  page: number;
  makeCallback: (item: string) => string;
  navPrefix: string;
}) {
  const { sources, labels } = data;
  const pageSize = 10;
  const totalPages = Math.ceil(sources.length / pageSize) || 1;
  const start = page * pageSize;
  const pageItems = sources.slice(start, start + pageSize);

  const keyboard = pageItems.map((source, i) => [
    {
      text: labels[i] ?? source,
      callback_data: makeCallback(source),
    },
  ]);

  const navRow = [];
  if (page > 0) {
    navRow.push({
      text: "⬅️ Prev",
      callback_data: `${navPrefix}:page:${page - 1}`,
    });
  }
  if (page < totalPages - 1) {
    navRow.push({
      text: "Next ➡️",
      callback_data: `${navPrefix}:page:${page + 1}`,
    });
  }

  if (navRow.length > 0) keyboard.push(navRow);

  return {
    keyboard,
    totalPages,
  };
}

export { buildPaginatedKeyboard };
