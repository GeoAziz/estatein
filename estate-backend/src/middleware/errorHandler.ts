import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import { AppError, ValidationError } from "../utils/errors.js";
import { logError } from "../services/telemetry.js";
import { Sentry } from "../config/sentry.js";
import logger from "./logging.js";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
        details: err.details,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      data: null,
      error: {
        code: err.constructor.name.toUpperCase(),
        message: err.message,
        statusCode: err.statusCode,
        timestamp: new Date().toISOString(),
      },
    });
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  Sentry.captureException(err, { extra: { path: req.path, method: req.method } });
  logError({
    source: "backend",
    message: err.message,
    stack: err.stack,
    url: req.path,
    userId: (req as AuthRequest).user?.id,
  }).catch(() => {});

  return res.status(500).json({
    data: null,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      statusCode: 500,
      timestamp: new Date().toISOString(),
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    data: null,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
}
