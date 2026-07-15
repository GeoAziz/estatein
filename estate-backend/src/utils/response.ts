import type { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string) {
  const response: any = { data };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any,
  requestId?: string
) {
  return res.status(statusCode).json({
    data: null,
    error: {
      code,
      message,
      details,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return res.status(200).json({
    data,
    total,
    pages: Math.ceil(total / limit),
    page,
    limit,
  });
}
