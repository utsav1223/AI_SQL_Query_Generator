import {
  buildRequestCacheKey,
  clearRequestCache,
  getCachedRequest
} from "../dsa/cache/requestCache";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  ""
);
const DEFAULT_API_TIMEOUT_MS = 20000;
export const API_AUTH_EVENT = "api:auth-error";

const PUBLIC_AUTH_ENDPOINTS = new Set([
  "/admin/login"
]);

const ACCOUNT_RESTRICTION_CODES = new Set([
  "ACCOUNT_DELETED",
  "ACCOUNT_REJECTED",
  "ACCOUNT_SUSPENDED",
  "WAITLIST_PENDING"
]);

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

const shouldNotifyAuthError = ({ endpoint, status, authScope, code }) => {
  if (!authScope || ![401, 403].includes(status)) {
    return false;
  }

  if (status === 403 && code !== "AUTH_FORBIDDEN" && !ACCOUNT_RESTRICTION_CODES.has(code)) {
    return false;
  }

  return !PUBLIC_AUTH_ENDPOINTS.has(endpoint.split("?")[0]);
};

const notifyAuthError = ({ endpoint, status, authScope, message, code, data }) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(API_AUTH_EVENT, {
      detail: {
        endpoint,
        status,
        authScope,
        message,
        code,
        data,
        accountRestriction: data?.accountRestriction || null,
        returnTo: window.location.pathname + window.location.search
      }
    })
  );
};

const resolveTimeoutMs = (requestOptions = {}) => {
  const timeoutMs = Number(requestOptions.timeoutMs ?? DEFAULT_API_TIMEOUT_MS);

  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    return DEFAULT_API_TIMEOUT_MS;
  }

  return timeoutMs;
};

export const createRequest = ({ getToken, authScope } = {}) => {
  return async (endpoint, method = "GET", body = null, requestOptions = {}) => {
    const normalizedMethod = String(method || "GET").toUpperCase();
    const cacheKey = buildRequestCacheKey({ authScope, method: normalizedMethod, endpoint });
    const shouldUseCache = normalizedMethod === "GET" && requestOptions.cache !== false;

    const executeRequest = async () => {
      const controller = new AbortController();
      const timeoutMs = resolveTimeoutMs(requestOptions);
      const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
      const token =
        requestOptions.token !== undefined
          ? requestOptions.token
          : typeof getToken === "function"
            ? await getToken()
            : null;
      const notifyOnAuthError = requestOptions.notifyOnAuthError !== false;

      const options = {
        method: normalizedMethod,
        signal: controller.signal,
        credentials: "include",
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
          const timeoutError = new Error("Request timed out while the server was still working.");
          timeoutError.code = "REQUEST_TIMEOUT";
          throw timeoutError;
        }

        throw error;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }

      const payload = await parseResponseBody(response);

      if (!response.ok) {
        const details = getErrorDetails(payload);
        const error = new Error(details.message);
        error.status = response.status;
        error.code = details.code;
        error.errors = details.errors;
        error.data = payload.data || payload;

        if (
          notifyOnAuthError &&
          shouldNotifyAuthError({
            endpoint,
            status: response.status,
            authScope,
            code: details.code
          })
        ) {
          notifyAuthError({
            endpoint,
            status: response.status,
            authScope,
            message: details.message,
            code: details.code,
            data: error.data
          });
        }

        throw error;
      }

      const data = getSuccessData(payload);

      if (normalizedMethod !== "GET") {
        clearRequestCache(`${authScope || "public"}:GET:`);
      }

      return data;
    };

    if (!shouldUseCache) {
      return executeRequest();
    }

    return getCachedRequest({
      key: cacheKey,
      ttlMs: requestOptions.cacheTtlMs,
      request: executeRequest
    });
  };
};
