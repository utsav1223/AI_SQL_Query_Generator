const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  ""
);
const ADMIN_TOKEN_KEY = "admin_token";
const API_TIMEOUT_MS = 20000;

export const adminApiRequest = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const options = {
    method,
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, options);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  let data = {};
  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const ADMIN_STORAGE_KEYS = {
  token: ADMIN_TOKEN_KEY,
  admin: "admin_user"
};
