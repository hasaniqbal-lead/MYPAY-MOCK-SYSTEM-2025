import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class TeamController {
  /**
   * List team members
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      const members = await prisma.merchantTeamMember.findMany({
        where: { merchant_id: merchantId! },
        orderBy: { created_at: 'desc' },
      });

      res.json({
        success: true,
        members: members.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          isActive: m.is_active,
          createdAt: m.created_at,
        })),
      });
    } catch (error) {
      console.error('List team error:', error);
      res.status(500).json({ success: false, error: 'Failed to list team members' });
    }
  }

  /**
   * Add team member (auto-generate email + password)
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { name, role } = req.body;

      if (!name || !role) {
        res.status(400).json({ success: false, error: 'Name and role are required' });
        return;
      }

      const validRoles = ['admin', 'viewer', 'accountant', 'ops', 'marketing', 'hr', 'finance', 'business', 'hod', 'custom'];
      if (!validRoles.includes(role)) {
        res.status(400).json({ success: false, error: `Invalid role. Use: ${validRoles.join(', ')}` });
        return;
      }

      // Get merchant for email domain
      const merchant = await prisma.merchant.findUnique({ where: { id: merchantId! } });
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }

      // Auto-generate email: {name.slug}@{merchant_domain}
      const emailDomain = process.env.ORG_EMAIL_DOMAIN || 'settlix.net';
      const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${nameSlug}.${merchant.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@${emailDomain}`;

      // Check uniqueness
      const existing = await prisma.merchantTeamMember.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ success: false, error: 'A team member with this email already exists' });
        return;
      }

      // Auto-generate password
      const password = crypto.randomBytes(6).toString('hex') + '!A';
      const passwordHash = await bcrypt.hash(password, 10);

      // Max 10 team members
      const count = await prisma.merchantTeamMember.count({ where: { merchant_id: merchantId! } });
      if (count >= 10) {
        res.status(400).json({ success: false, error: 'Maximum 10 team members per merchant' });
        return;
      }

      const member = await prisma.merchantTeamMember.create({
        data: {
          merchant_id: merchantId!,
          name,
          email,
          password_hash: passwordHash,
          role,
          is_active: true,
        },
      });

      // Return credentials (shown once)
      res.status(201).json({
        success: true,
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          isActive: true,
          createdAt: member.created_at,
        },
        credentials: {
          email,
          password, // Shown once — cannot be recovered
        },
      });
    } catch (error) {
      console.error('Create team member error:', error);
      res.status(500).json({ success: false, error: 'Failed to create team member' });
    }
  }

  /**
   * Update team member (role, toggle active)
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { id } = req.params;
      const { role, isActive, name } = req.body;

      const member = await prisma.merchantTeamMember.findFirst({
        where: { id: Number(id), merchant_id: merchantId! },
      });

      if (!member) {
        res.status(404).json({ success: false, error: 'Team member not found' });
        return;
      }

      const data: any = {};
      if (role !== undefined) data.role = role;
      if (isActive !== undefined) data.is_active = isActive;
      if (name !== undefined) data.name = name;

      const updated = await prisma.merchantTeamMember.update({
        where: { id: Number(id) },
        data,
      });

      res.json({
        success: true,
        member: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          isActive: updated.is_active,
        },
      });
    } catch (error) {
      console.error('Update team member error:', error);
      res.status(500).json({ success: false, error: 'Failed to update team member' });
    }
  }

  /**
   * Delete team member
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { id } = req.params;

      const member = await prisma.merchantTeamMember.findFirst({
        where: { id: Number(id), merchant_id: merchantId! },
      });

      if (!member) {
        res.status(404).json({ success: false, error: 'Team member not found' });
        return;
      }

      await prisma.merchantTeamMember.delete({ where: { id: Number(id) } });

      res.json({ success: true, message: 'Team member removed' });
    } catch (error) {
      console.error('Delete team member error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete team member' });
    }
  }
}

export const teamController = new TeamController();
