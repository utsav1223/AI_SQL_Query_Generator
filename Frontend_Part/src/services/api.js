const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  ""
);

export const apiRequest = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("token");

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

    // attach backend response
    error.code = data.code;
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};
