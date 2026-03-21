const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  ""
);
const API_TIMEOUT_MS = 20000;

const parseResponseBody = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const getErrorDetails = (payload = {}) => {
  if (payload && typeof payload === "object" && "success" in payload) {
    return {
      message: payload.message || "Something went wrong",
      code: payload.data?.code,
      errors: payload.data?.errors || []
    };
  }

  return {
    message: payload.message || "Something went wrong",
    code: payload.code,
    errors: payload.errors || []
  };
};

const getSuccessData = (payload = {}) => {
  if (payload && typeof payload === "object" && "success" in payload) {
    return payload.data ?? {};
  }

  return payload;
};

export const createRequest = ({ getToken }) => {
  return async (endpoint, method = "GET", body = null) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const token = typeof getToken === "function" ? getToken() : null;

    const options = {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response;

    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const details = getErrorDetails(payload);
      const error = new Error(details.message);
      error.status = response.status;
      error.code = details.code;
      error.errors = details.errors;
      error.data = payload.data || payload;
      throw error;
    }

    return getSuccessData(payload);
  };
};
