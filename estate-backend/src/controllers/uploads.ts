import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import { uploadImage, deleteImage } from "../services/s3.js";
import { sendSuccess } from "../utils/response.js";
import { AuthorizationError, ValidationError } from "../utils/errors.js";

export async function upload(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new ValidationError("No file uploaded");
    }

    const folder = (req.body.type as string) || "general";
    const result = await uploadImage(req.file, folder, req.user!.id);

    sendSuccess(res, {
      url: result.url,
      key: result.key,
      size: result.size,
      uploadedAt: new Date().toISOString(),
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const key = String(req.params.key);

    // Keys are namespaced as "<folder>/<ownerId>/<file>" at upload time; only
    // the owner (or an admin) may delete a given key.
    const segments = key.split("/");
    const ownerId = segments.length >= 3 ? segments[1] : null;
    if (req.user!.role !== "admin" && (!ownerId || ownerId !== req.user!.id)) {
      throw new AuthorizationError("You don't have permission to delete this file");
    }

    await deleteImage(key);
    sendSuccess(res, null, 200, "File deleted successfully");
  } catch (err) {
    next(err);
  }
}
