const mongoose = require("mongoose");
const dns = require("dns");

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10
};

const runtimeState = {
  activeCandidate: null,
  dnsOverrideApplied: false,
  runtimeFailoverInProgress: false,
  srvRuntimeWarningShown: false
};

const sanitizeMongoUri = (uri = "") =>
  uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

const isSrvUri = (uri = "") => uri.startsWith("mongodb+srv://");

const isSrvDnsRefusedError = (error) => /querySrv ECONNREFUSED/i.test(String(error?.message || ""));

const getMongoDnsServers = () => {
  const value = process.env.MONGO_DNS_SERVERS || "8.8.8.8,1.1.1.1";
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const applyMongoDnsOverride = () => {
  const servers = getMongoDnsServers();
  if (!servers.length) return false;

  try {
    dns.setServers(servers);
    console.log(`MongoDB DNS override enabled: ${servers.join(", ")}`);
    return true;
  } catch (error) {
    console.warn("Failed to apply MongoDB DNS override:", error.message);
    return false;
  }
};

const hasDbNameInUri = (uri = "") => {
  const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, "");
  const slashIndex = withoutProtocol.indexOf("/");
  if (slashIndex === -1) return false;

  const dbSegment = withoutProtocol.slice(slashIndex + 1).split("?")[0];
  return Boolean(dbSegment);
};

const withDbName = (uri, dbName) => {
  if (!uri || !dbName || hasDbNameInUri(uri)) return uri;

  const [base, query = ""] = uri.split("?");
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalizedBase}/${dbName}${query ? `?${query}` : ""}`;
};

const buildDirectCandidate = () => {
  if (!process.env.MONGO_URI_DIRECT) return null;

  const dbName = process.env.MONGO_DB_NAME;
  return {
    label: "MONGO_URI_DIRECT",
    uri: withDbName(process.env.MONGO_URI_DIRECT, dbName)
  };
};

const buildMongoCandidates = () => {
  const dbName = process.env.MONGO_DB_NAME;
  const candidates = [];

  if (process.env.MONGO_URI) {
    candidates.push({
      label: "MONGO_URI",
      uri: withDbName(process.env.MONGO_URI, dbName)
    });
  }

  if (process.env.MONGO_URI_DIRECT) {
    candidates.push(buildDirectCandidate());
  }

  return candidates;
};

const buildMongoTroubleshootingHint = (error) => {
  const message = String(error?.message || "");

  if (/(querySrv|_mongodb\._tcp|ENOTFOUND|EAI_AGAIN|ECONNREFUSED)/i.test(message)) {
    return [
      "Atlas SRV/DNS lookup failed. Verify network DNS resolution and consider using MONGO_URI_DIRECT.",
      "In Atlas, Network Access should include your current public IP (or 0.0.0.0/0 for testing)."
    ].join(" ");
  }

  if (/auth/i.test(message) || /Authentication failed/i.test(message)) {
    return "Atlas authentication failed. Re-check username/password in the Mongo URI.";
  }

  if (/whitelist|not authorized|IP/i.test(message)) {
    return "Atlas network access rejected the connection. Add your server IP in Atlas Network Access.";
  }

  return "Check MONGO_URI format, Atlas credentials, and network access rules.";
};

const connectWithCandidate = async (
  candidate,
  { allowSrvDnsRetry = true, context = "startup" } = {}
) => {
  if (!candidate?.uri) {
    throw new Error("Missing MongoDB connection URI");
  }

  try {
    const conn = await mongoose.connect(candidate.uri, CONNECT_OPTIONS);
    runtimeState.activeCandidate = candidate;
    console.log(`MongoDB connected (${candidate.label}${context === "startup" ? "" : ` - ${context}` }): ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed via ${candidate.label}:`, sanitizeMongoUri(candidate.uri));
    console.error(`Reason: ${error.message}`);

    if (
      allowSrvDnsRetry &&
      !runtimeState.dnsOverrideApplied &&
      isSrvUri(candidate.uri) &&
      isSrvDnsRefusedError(error)
    ) {
      const applied = applyMongoDnsOverride();
      runtimeState.dnsOverrideApplied = applied;

      if (applied) {
        try {
          const conn = await mongoose.connect(candidate.uri, CONNECT_OPTIONS);
          runtimeState.activeCandidate = candidate;
          console.log(
            `MongoDB connected (${candidate.label} with DNS override${context === "startup" ? "" : ` - ${context}` }): ${conn.connection.host}`
          );
          return conn;
        } catch (retryError) {
          console.error(
            `MongoDB retry failed via ${candidate.label} with DNS override:`,
            sanitizeMongoUri(candidate.uri)
          );
          console.error(`Reason: ${retryError.message}`);
          throw retryError;
        }
      }
    }

    throw error;
  }
};

const handleRuntimeSrvDnsError = async () => {
  const active = runtimeState.activeCandidate;

  if (!active || !isSrvUri(active.uri)) {
    return;
  }

  // If primary connection is still healthy, avoid unnecessary failovers.
  if (mongoose.connection.readyState === 1) {
    if (!runtimeState.srvRuntimeWarningShown) {
      console.warn("MongoDB SRV DNS warning detected, but active connection remains healthy.");
      runtimeState.srvRuntimeWarningShown = true;
    }
    return;
  }

  if (runtimeState.runtimeFailoverInProgress) {
    return;
  }

  const directCandidate = buildDirectCandidate();
  if (!directCandidate) {
    if (!runtimeState.srvRuntimeWarningShown) {
      console.warn(
        "MongoDB runtime SRV DNS issue detected. Configure MONGO_URI_DIRECT for automatic failover."
      );
      runtimeState.srvRuntimeWarningShown = true;
    }
    return;
  }

  runtimeState.runtimeFailoverInProgress = true;
  try {
    console.warn("MongoDB runtime SRV DNS issue detected. Switching to MONGO_URI_DIRECT...");
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore disconnect errors before failover connect attempt
    }

    await connectWithCandidate(directCandidate, {
      allowSrvDnsRetry: false,
      context: "runtime-failover"
    });
  } catch (error) {
    console.error(
      `MongoDB runtime failover failed via ${directCandidate.label}:`,
      sanitizeMongoUri(directCandidate.uri)
    );
    console.error(`Reason: ${error.message}`);
  } finally {
    runtimeState.runtimeFailoverInProgress = false;
  }
};

const connectDB = async () => {
  mongoose.set("strictQuery", true);

  const candidates = buildMongoCandidates();
  if (!candidates.length) {
    console.error("MongoDB connection error: missing MONGO_URI (or MONGO_URI_DIRECT).");
    process.exit(1);
  }

  let lastError = null;

  for (const candidate of candidates) {
    try {
      await connectWithCandidate(candidate);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.error("MongoDB troubleshooting:", buildMongoTroubleshootingHint(lastError));
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

mongoose.connection.on("error", (error) => {
  if (isSrvDnsRefusedError(error)) {
    void handleRuntimeSrvDnsError();
    return;
  }

  console.error("MongoDB runtime error:", error.message);
});

module.exports = connectDB;
