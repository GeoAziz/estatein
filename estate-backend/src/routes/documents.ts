import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as documentsController from "../controllers/documents.js";

const router = Router();

// Upload a document
router.post("/upload", requireAuth, ...documentsController.uploadDocument);

// Get user's documents
router.get("/", requireAuth, documentsController.getDocuments);

// Delete a document
router.delete("/:documentId", requireAuth, documentsController.deleteDocument);

// Verify document (admin only)
router.patch("/:documentId/verify", requireAuth, documentsController.verifyDocument);

// Get documents for a property
router.get("/property/:propertyId", documentsController.getPropertyDocuments);

export default router;
