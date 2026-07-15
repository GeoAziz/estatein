// Document management controller

import { Request, Response } from 'express';
import { DocumentType } from '@prisma/client';
import prisma from '../config/database.js';
import { uploadImage as uploadToS3, deleteImage as deleteFromS3 } from '../services/s3.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export const uploadDocument = [
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { type, title, propertyId } = req.body;

      if (!type || !Object.values(DocumentType).includes(type)) {
        return res.status(400).json({ error: 'Invalid document type' });
      }

      if (!title) {
        return res.status(400).json({ error: 'Document title required' });
      }

      // Upload to S3
      const result = await uploadToS3(req.file, `documents/${userId}/${type}`);

      // Create document record
      const document = await prisma.document.create({
        data: {
          userId,
          propertyId: propertyId || undefined,
          type,
          title,
          url: result.url,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedBy: userId,
        },
      });

      res.json({
        id: document.id,
        title: document.title,
        type: document.type,
        url: document.url,
        uploadedAt: document.uploadedAt,
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({
        error: 'Failed to upload document',
      });
    }
  },
];

export async function getDocuments(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { type, propertyId, limit = '20', offset = '0' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const whereClause: any = { userId };

    if (type) {
      whereClause.type = type;
    }

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: { uploadedAt: 'desc' },
      take: Math.min(parseInt(String(limit)), 100),
      skip: parseInt(String(offset)),
    });

    const total = await prisma.document.count({ where: whereClause });

    res.json({
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        url: doc.url,
        uploadedAt: doc.uploadedAt,
        isVerified: doc.isVerified,
      })),
      total,
      limit: parseInt(String(limit)),
      offset: parseInt(String(offset)),
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
    });
  }
}

export async function deleteDocument(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const documentId = String(req.params.documentId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete from S3
    try {
      const key = String(document.url).split('/').slice(3).join('/');
      await deleteFromS3(key);
    } catch (error) {
      console.error('Failed to delete from S3:', error);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Failed to delete document',
    });
  }
}

export async function verifyDocument(req: Request, res: Response) {
  try {
    const adminId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!adminId || userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const documentId = String(req.params.documentId);
    const { isVerified } = req.body;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        isVerified,
        verifiedBy: isVerified ? adminId : null,
        verifiedAt: isVerified ? new Date() : null,
      },
    });

    res.json({
      id: updated.id,
      isVerified: updated.isVerified,
      verifiedAt: updated.verifiedAt,
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({
      error: 'Failed to verify document',
    });
  }
}

export async function getPropertyDocuments(req: Request, res: Response) {
  try {
    const propertyId = String(req.params.propertyId);

    const documents = await prisma.document.findMany({
      where: { propertyId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        url: true,
        uploadedAt: true,
        isVerified: true,
      },
    });

    res.json({ documents });
  } catch (error) {
    console.error('Get property documents error:', error);
    res.status(500).json({
      error: 'Failed to fetch property documents',
    });
  }
}
