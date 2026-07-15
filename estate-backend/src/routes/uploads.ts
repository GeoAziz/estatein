import { Router } from "express";
import multer from "multer";
import * as uploadsController from "../controllers/uploads.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimit.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WEBP files are allowed"));
    }
  },
});

const router = Router();

router.post("/", requireAuth, uploadLimiter, upload.single("file"), uploadsController.upload);
// Wildcard so S3 keys containing "/" (e.g. "folder/ownerId/file.png") route correctly.
router.delete("/:key(.*)", requireAuth, uploadsController.remove);

export default router;
