import { Response, Request } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class DocumentController {
  // ============ ADMIN ============

  async adminList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { merchantId, type, status } = req.query;
      const where: any = {};
      if (merchantId) where.merchant_id = Number(merchantId);
      if (type && type !== 'all') where.type = type;
      if (status && status !== 'all') where.status = status;

      const docs = await prisma.document.findMany({
        where, orderBy: { created_at: 'desc' }, take: 100,
        include: { merchant: { select: { name: true, company_name: true, email: true } } },
      });
      res.json({ success: true, documents: docs });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list documents' });
    }
  }

  async adminCreate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, type, merchantId, visibility, required, fileUrl } = req.body;
      if (!title) { res.status(400).json({ success: false, error: 'Title is required' }); return; }

      const doc = await prisma.document.create({
        data: {
          title, description, type: type || 'general',
          merchant_id: merchantId ? Number(merchantId) : null,
          visibility: visibility || 'both', required: required || false,
          uploaded_by: 'admin', status: 'approved', file_url: fileUrl,
        },
      });
      res.status(201).json({ success: true, document: doc });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create document' });
    }
  }

  async adminRequestUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params;
      const { title, description, type, required } = req.body;
      if (!title) { res.status(400).json({ success: false, error: 'Title is required' }); return; }

      const token = crypto.randomBytes(32).toString('hex');
      const doc = await prisma.document.create({
        data: {
          title, description, type: type || 'request',
          merchant_id: Number(merchantId), visibility: 'both',
          required: required !== false, uploaded_by: 'admin',
          status: 'pending', upload_token: token,
        },
      });

      const uploadUrl = `${process.env.PAYMENT_PAGE_URL || 'https://sbx-pay.settlix.net'}/upload/${token}`;
      res.status(201).json({ success: true, document: doc, uploadUrl, uploadToken: token });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to request upload' });
    }
  }

  async adminUpdateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await prisma.document.update({ where: { id: Number(id) }, data: { status } });
      res.json({ success: true, message: 'Status updated' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update status' });
    }
  }

  // ============ MERCHANT PORTAL ============

  async merchantList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const docs = await prisma.document.findMany({
        where: {
          OR: [
            { merchant_id: merchantId, visibility: { in: ['merchant', 'both'] } },
            { merchant_id: null, visibility: { in: ['merchant', 'both'] } },
          ],
        },
        orderBy: { created_at: 'desc' },
      });
      res.json({ success: true, documents: docs });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list documents' });
    }
  }

  async merchantUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { documentId, fileUrl, fileType, fileSize } = req.body;

      if (documentId) {
        // Uploading to an existing request
        await prisma.document.update({
          where: { id: Number(documentId) },
          data: { file_url: fileUrl, file_type: fileType, file_size: fileSize, uploaded_by: 'merchant', status: 'pending' },
        });
      } else {
        // New upload
        const { title } = req.body;
        await prisma.document.create({
          data: {
            title: title || 'Merchant Upload', merchant_id: merchantId!,
            file_url: fileUrl, file_type: fileType, file_size: fileSize,
            uploaded_by: 'merchant', visibility: 'both', status: 'pending',
          },
        });
      }
      res.json({ success: true, message: 'Document uploaded' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to upload document' });
    }
  }

  // ============ PUBLIC (Standalone upload) ============

  async getUploadInfo(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const doc = await prisma.document.findUnique({ where: { upload_token: token } });
      if (!doc) { res.status(404).json({ success: false, error: 'Upload link not found or expired' }); return; }
      res.json({
        success: true,
        document: { id: doc.id, title: doc.title, description: doc.description, type: doc.type, required: doc.required, status: doc.status },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get upload info' });
    }
  }

  async publicUpload(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { fileUrl, fileType, fileSize } = req.body;
      const doc = await prisma.document.findUnique({ where: { upload_token: token } });
      if (!doc) { res.status(404).json({ success: false, error: 'Upload link not found' }); return; }

      await prisma.document.update({
        where: { upload_token: token },
        data: { file_url: fileUrl, file_type: fileType, file_size: fileSize, uploaded_by: 'merchant', status: 'pending' },
      });
      res.json({ success: true, message: 'Document uploaded successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to upload' });
    }
  }
}

export const documentController = new DocumentController();
