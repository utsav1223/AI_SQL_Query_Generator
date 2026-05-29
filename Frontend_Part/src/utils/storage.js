export const STORAGE_KEYS = {
  token: "token",
  user: "user",
  accountRestriction: "account_restriction",
  adminToken: "admin_token",
  admin: "admin_user"
};

export const readJson = (key) => {
  const value = localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

export const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeItems = (...keys) => {
  keys.forEach((key) => {
    localStorage.removeItem(key);
  });
};
