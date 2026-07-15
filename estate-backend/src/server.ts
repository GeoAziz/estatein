import dotenv from "dotenv";
dotenv.config();

// Static imports are hoisted and evaluated before the lines above in ESM, so
// modules that read process.env at import time (e.g. config/auth.ts) would
// see an empty environment unless these are loaded dynamically after
// dotenv.config() has actually run.
const { default: app } = await import("./app.js");
const { default: logger } = await import("./middleware/logging.js");
const { logError } = await import("./services/telemetry.js");

const PORT = process.env.PORT || 3000;

// Errors thrown outside an Express request (e.g. in a fire-and-forget async
// job) never reach errorHandler.ts — without these, they'd otherwise crash
// the process silently or hang it. Log + persist, then exit so the process
// manager (Docker/pm2) can restart into a known-good state.
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  logError({ source: "backend", message: err.message, stack: err.stack }).finally(() => process.exit(1));
});

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error({ err }, "Unhandled rejection");
  logError({ source: "backend", message: err.message, stack: err.stack }).finally(() => process.exit(1));
});

app.listen(PORT, () => {
  logger.info(`EstateIn API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});
