const normalizeSearchText = (search) => String(search || "").trim().slice(0, 120);

const escapeRegex = (value) => {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const buildRegexSearchFilter = (search, fields = []) => {
  const searchText = normalizeSearchText(search);

  if (!searchText || fields.length === 0) {
    return {};
  }

  const safeSearch = escapeRegex(searchText);

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: safeSearch, $options: "i" }
    }))
  };
};

const tokenizeSearchText = (search) => {
  return normalizeSearchText(search)
    .toLowerCase()
    .split(/[^a-z0-9_]+/i)
    .map((token) => token.trim())
    .filter(Boolean);
};

module.exports = {
  buildRegexSearchFilter,
  escapeRegex,
  normalizeSearchText,
  tokenizeSearchText
};
