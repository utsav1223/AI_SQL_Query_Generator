const SENSITIVE_KEY_PATTERN = /(password|token|secret|authorization|cookie|otp|api[-_]?key|key_secret|razorpay_secret)/i;
const isProduction = process.env.NODE_ENV === "production";

const redactValue = (value, depth = 0) => {
  if (depth > 5) {
    return "[MaxDepth]";
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(!isProduction && value.stack ? { stack: value.stack } : {})
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
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redactValue(metadata)
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

const logger = {
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

module.exports = logger;
