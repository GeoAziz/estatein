import type { Request, Response, NextFunction } from "express";
import prisma from "../config/database.js";
import { sendSuccess } from "../utils/response.js";
import { sendContactMessageNotification } from "../services/email.js";
import { trackEvent } from "../services/telemetry.js";

export async function submitContactMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email, phone, message, source, metadata } = req.body;

    const contactMessage = await prisma.contactMessage.create({
      data: { firstName, lastName, email, phone, message, source, metadata },
    });

    sendContactMessageNotification({ firstName, lastName, email, phone, message, source }).catch(() => {});
    trackEvent("contact_submitted", undefined, { source }).catch(() => {});

    sendSuccess(res, { contactMessage }, 201);
  } catch (err) {
    next(err);
  }
}
