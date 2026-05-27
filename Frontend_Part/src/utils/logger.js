const SENSITIVE_KEY_PATTERN = /(password|token|secret|authorization|cookie|otp|api[-_]?key|signature)/i;
const isEnabled = import.meta.env.DEV || import.meta.env.MODE === "test";

const redactValue = (value, depth = 0) => {
  if (depth > 4) {
    return "[MaxDepth]";
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      status: value.status,
      code: value.code
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, item]) => {
      acc[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[Redacted]" : redactValue(item, depth + 1);
      return acc;
    }, {});
  }

  return value;
};

const write = (level, message, metadata = {}) => {
  if (!isEnabled) {
    return;
  }

  const entry = {
    level,
    message,
    ...redactValue(metadata)
  };

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  console.info(entry);
};

export const logger = {
  info(message, metadata = {}) {
    write("info", message, metadata);
  },

  warn(message, metadata = {}) {
    write("warn", message, metadata);
  },

  error(message, error = null, metadata = {}) {
    write("error", message, {
      ...metadata,
      ...(error ? { error } : {})
    });
  }
};
