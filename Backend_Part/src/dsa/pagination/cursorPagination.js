const clampLimit = (limit, { fallback = 10, max = 50 } = {}) => {
  return Math.min(Math.max(parseInt(limit || String(fallback), 10), 1), max);
};

const getOffsetPagination = ({ page = 1, limit = 10, maxLimit = 50 } = {}) => {
  const safePage = Math.max(parseInt(page || "1", 10), 1);
  const safeLimit = clampLimit(limit, { fallback: 10, max: maxLimit });

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit
  };
};

const buildPaginationMeta = ({ total = 0, page = 1, limit = 10 }) => {
  return {
    total,
    page,
    limit,
    pages: Math.max(Math.ceil(total / limit), 1)
  };
};

const buildCreatedAtCursorFilter = ({ cursor, direction = "newest" } = {}) => {
  if (!cursor) {
    return {};
  }

  const cursorDate = new Date(cursor);

  if (Number.isNaN(cursorDate.getTime())) {
    return {};
  }

  return {
    createdAt: direction === "oldest" ? { $gt: cursorDate } : { $lt: cursorDate }
  };
};

module.exports = {
  buildCreatedAtCursorFilter,
  buildPaginationMeta,
  clampLimit,
  getOffsetPagination
};
