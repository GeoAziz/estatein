import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import * as analyticsService from '../services/analytics.js';

function parseDateRange(req: AuthRequest) {
  const { from, to } = req.query;
  return {
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
  };
}

export async function getOverview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const range = parseDateRange(req);
    const result = await analyticsService.getOverview(range);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getPropertyAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const result = await analyticsService.getPropertyAnalytics(id);
    if (!result) return sendError(res, 404, 'NOT_FOUND', 'Property not found');
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getAgentPerformance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const result = await analyticsService.getAgentPerformance(id);
    if (!result) return sendError(res, 404, 'NOT_FOUND', 'Agent not found');
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getRegionalTrends(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getRegionalTrends();
    sendSuccess(res, { regions: result });
  } catch (err) {
    next(err);
  }
}

export async function exportAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const format = (req.query.format as string) || 'csv';
    const data = await analyticsService.getExportData();

    if (format === 'csv') {
      const rows: string[] = ['county,propertyCount,avgPrice,inquiryCount'];
      for (const r of data.regional) {
        rows.push(`${r.county},${r.propertyCount},${r.avgPrice},${r.inquiryCount}`);
      }
      const csv = rows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
      return res.send(csv);
    }

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
