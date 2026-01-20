import type { DataSource } from "../models/twitter.api";

function buildPaginatedKeyboard<T>({
  data,
  page,
  makeCallback,
  navPrefix,
  label = (item: T) => String(item),
  value = (item: T) => String(item),
}: {
  data: T[] | DataSource;
  page: number;
  makeCallback: (item: string) => string;
  navPrefix: string;
  label?: (item: T) => string;
  value?: (item: T) => string;
}) {
  let sources: any[];
  let labels: string[] | undefined;

  if (Array.isArray(data)) {
    sources = data;
  } else {
    sources = (data as DataSource).sources;
    labels = (data as DataSource).labels;
  }

  const pageSize = 10;
  const totalPages = Math.ceil(sources.length / pageSize) || 1;
  const start = page * pageSize;
  const pageItems = sources.slice(start, start + pageSize);

  const keyboard = pageItems.map((item, i) => {
    let btnText: string;
    let btnValue: string;

    if (Array.isArray(data)) {
      btnText = label(item);
      btnValue = value(item);
    } else {
      btnText = labels?.[start + i] ?? String(item);
      btnValue = String(item);
    }

    return [
      {
        text: btnText,
        callback_data: makeCallback(btnValue),
      },
    ];
  });

  const navRow = [];
  if (page > 0) {
    navRow.push({
      text: "<< Prev",
      callback_data: `${navPrefix}:page:${page - 1}`,
    });
  }
  if (page < totalPages - 1) {
    navRow.push({
      text: "Next >>",
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
