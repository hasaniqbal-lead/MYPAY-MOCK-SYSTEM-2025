import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class OperationsController {
  // ============ ADMIN USER MANAGEMENT ============

  async listAdmins(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const admins = await prisma.adminUser.findMany({ orderBy: { created_at: 'desc' } });
      res.json({
        success: true,
        admins: admins.map(a => ({
          id: a.id, email: a.email, name: a.name, role: a.role,
          isActive: a.is_active, createdAt: a.created_at,
        })),
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list admins' });
    }
  }

  async createAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, name, role, password } = req.body;
      if (!email || !name || !password) {
        res.status(400).json({ success: false, error: 'email, name, and password are required' });
        return;
      }
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(password, 10);
      const admin = await prisma.adminUser.create({
        data: { email, name, password_hash: hash, role: role || 'admin', is_active: true },
      });
      res.status(201).json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
    } catch (error: any) {
      if (error.code === 'P2002') res.status(409).json({ success: false, error: 'Email already exists' });
      else res.status(500).json({ success: false, error: 'Failed to create admin' });
    }
  }

  async toggleAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const admin = await prisma.adminUser.findUnique({ where: { id: Number(id) } });
      if (!admin) { res.status(404).json({ success: false, error: 'Admin not found' }); return; }
      await prisma.adminUser.update({ where: { id: Number(id) }, data: { is_active: !admin.is_active } });
      res.json({ success: true, isActive: !admin.is_active });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to toggle admin' });
    }
  }

  async resetAdminPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const admin = await prisma.adminUser.findUnique({ where: { id: Number(id) } });
      if (!admin) { res.status(404).json({ success: false, error: 'Admin not found' }); return; }
      const crypto = require('crypto');
      const bcrypt = require('bcryptjs');
      const newPassword = crypto.randomBytes(6).toString('hex') + '!A';
      const hash = await bcrypt.hash(newPassword, 10);
      await prisma.adminUser.update({ where: { id: Number(id) }, data: { password_hash: hash } });
      res.json({ success: true, email: admin.email, password: newPassword });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to reset password' });
    }
  }

  // ============ KEY APPROVAL ============

  async listPendingKeys(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { approval_status: 'pending_approval' },
        include: { merchant: { select: { name: true, company_name: true, email: true } } },
        orderBy: { created_at: 'desc' },
      });
      res.json({
        success: true,
        keys: keys.map(k => ({
          id: k.id, vendorId: k.vendor_id, label: k.label, keyType: k.key_type,
          merchantName: k.merchant?.company_name || k.merchant?.name,
          merchantEmail: k.merchant?.email, createdAt: k.created_at,
        })),
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list pending keys' });
    }
  }

  async approveKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { approve } = req.body; // true or false
      await prisma.apiKey.update({
        where: { id: Number(id) },
        data: { approval_status: approve ? 'approved' : 'rejected', is_active: approve ? true : false },
      });
      res.json({ success: true, message: approve ? 'Key approved' : 'Key rejected' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update key' });
    }
  }

  // ============ BLACKLIST ============

  async listBlacklist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type } = req.query;
      const where: any = { is_active: true };
      if (type && type !== 'all') where.type = type;
      const entries = await prisma.blacklistEntry.findMany({ where, orderBy: { created_at: 'desc' }, take: 100 });
      res.json({ success: true, entries });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list blacklist' });
    }
  }

  async addToBlacklist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type, value, reason, expiresAt } = req.body;
      if (!type || !value) { res.status(400).json({ success: false, error: 'type and value are required' }); return; }
      const entry = await prisma.blacklistEntry.create({
        data: { type, value, reason, added_by: 'admin', is_active: true, expires_at: expiresAt ? new Date(expiresAt) : null },
      });
      res.status(201).json({ success: true, entry });
    } catch (error: any) {
      if (error.code === 'P2002') res.status(409).json({ success: false, error: 'Entry already exists' });
      else res.status(500).json({ success: false, error: 'Failed to add to blacklist' });
    }
  }

  async removeFromBlacklist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.blacklistEntry.update({ where: { id: Number(id) }, data: { is_active: false } });
      res.json({ success: true, message: 'Removed from blacklist' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to remove from blacklist' });
    }
  }

  // ============ PAYMENT METHOD CONTROLS ============

  async listMethods(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let methods = await prisma.paymentMethodConfig.findMany({ orderBy: { method: 'asc' } });
      // Seed defaults if empty
      if (methods.length === 0) {
        const defaults = [
          { method: 'easypaisa', display_name: 'Easypaisa', is_enabled: true, min_amount: 1, max_amount: 50000 },
          { method: 'jazzcash', display_name: 'JazzCash', is_enabled: true, min_amount: 1, max_amount: 50000 },
          { method: 'card', display_name: 'Card Payment', is_enabled: true, min_amount: 10, max_amount: 500000 },
        ];
        for (const d of defaults) {
          await prisma.paymentMethodConfig.create({ data: d });
        }
        methods = await prisma.paymentMethodConfig.findMany({ orderBy: { method: 'asc' } });
      }
      res.json({
        success: true,
        methods: methods.map(m => ({
          id: m.id, method: m.method, displayName: m.display_name, isEnabled: m.is_enabled,
          minAmount: Number(m.min_amount), maxAmount: Number(m.max_amount),
          dailyLimit: m.daily_limit ? Number(m.daily_limit) : null,
        })),
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list methods' });
    }
  }

  async updateMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isEnabled, minAmount, maxAmount, dailyLimit, displayName } = req.body;
      const data: any = {};
      if (isEnabled !== undefined) data.is_enabled = isEnabled;
      if (minAmount !== undefined) data.min_amount = minAmount;
      if (maxAmount !== undefined) data.max_amount = maxAmount;
      if (dailyLimit !== undefined) data.daily_limit = dailyLimit;
      if (displayName !== undefined) data.display_name = displayName;
      await prisma.paymentMethodConfig.update({ where: { id: Number(id) }, data });
      res.json({ success: true, message: 'Method updated' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update method' });
    }
  }

  // ============ NOTIFICATIONS ============

  async listNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const notifications = await prisma.adminNotification.findMany({ orderBy: { created_at: 'desc' }, take: 50 });
      res.json({ success: true, notifications });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list notifications' });
    }
  }

  async createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type, title, message, target } = req.body;
      if (!title || !message) { res.status(400).json({ success: false, error: 'title and message are required' }); return; }
      const notification = await prisma.adminNotification.create({
        data: { type: type || 'info', title, message, target: target || 'all', sent_by: 'admin' },
      });
      res.status(201).json({ success: true, notification });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create notification' });
    }
  }

  // ============ ACTIVITY LOGS ============

  async listActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entityType, limit = 50 } = req.query;
      const where: any = {};
      if (entityType && entityType !== 'all') where.entity_type = entityType;
      const logs = await prisma.activityLog2.findMany({
        where, orderBy: { created_at: 'desc' }, take: Number(limit),
      });
      res.json({ success: true, logs });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list activity logs' });
    }
  }
}

export const operationsController = new OperationsController();
