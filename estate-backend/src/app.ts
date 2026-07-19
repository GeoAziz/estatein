import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import { verifyToken } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/logging.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { securityHeaders } from "./middleware/security.js";
import routes from "./routes/index.js";

// Initialize Sentry for error tracking in production (must be before express init)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

const app = express();

// Security headers
app.use(helmet());
app.use(securityHeaders);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Rate limiting
app.use("/api/", apiLimiter);

// JWT token extraction (attaches user to request if token present)
app.use(verifyToken);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", routes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (capture exceptions, must be before generic error handler)
if (process.env.SENTRY_DSN) {
  app.use((err: any, req: any, res: any, next: any) => {
    Sentry.captureException(err);
    next(err);
  });
}

// Global error handler
app.use(errorHandler);

export default app;
