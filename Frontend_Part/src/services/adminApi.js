const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  ""
);
const ADMIN_TOKEN_KEY = "admin_token";

export const adminApiRequest = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

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
