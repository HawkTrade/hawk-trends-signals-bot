function buildPaginatedKeyboard<T>({
  items,
  page,
  makeLabel,
  makeCallback,
  navPrefix,
}: {
  items: T[];
  page: number;
  makeLabel: (item: T, index: number) => string;
  makeCallback: (item: T, index: number) => string;
  navPrefix: string;
}) {
  const pageSize = 10;
  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const start = page * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const keyboard = pageItems.map((item, i) => [
    {
      text: makeLabel(item, start + i),
      callback_data: makeCallback(item, start + i),
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
