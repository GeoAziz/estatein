import dotenv from "dotenv";
dotenv.config();

const { initSentry, Sentry } = await import("./config/sentry.js");
initSentry();

const { default: app } = await import("./app.js");
const { default: logger } = await import("./middleware/logging.js");
const { logError } = await import("./services/telemetry.js");
const { default: redis } = await import("./config/redis.js");
const { default: elasticsearch } = await import("./config/elasticsearch.js");
const { ensureIndex } = await import("./services/elasticsearch.js");
const { startViewingReminderJob } = await import("./jobs/viewingReminders.js");

const PORT = process.env.PORT || 3000;

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  Sentry.captureException(err);
  logError({ source: "backend", message: err.message, stack: err.stack }).finally(() => process.exit(1));
});

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error({ err }, "Unhandled rejection");
  Sentry.captureException(err);
  logError({ source: "backend", message: err.message, stack: err.stack }).finally(() => process.exit(1));
});

// Connect infrastructure services
async function connectServices() {
  if (redis) {
    try {
      await redis.connect();
      logger.info("Connected to Redis");
    } catch (err) {
      logger.warn({ err }, "Failed to connect to Redis — running without cache");
    }
  }

  if (elasticsearch) {
    const created = await ensureIndex();
    if (created) {
      logger.info("Elasticsearch index ready");
    } else {
      logger.warn("Elasticsearch unavailable — using Prisma search");
    }
  }
}

async function shutdown() {
  logger.info("Shutting down...");
  if (redis) {
    try { await redis.quit(); } catch { /* ignore */ }
  }
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await connectServices();

// Start background jobs
startViewingReminderJob();

app.listen(PORT, () => {
  logger.info(`EstateIn API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});
