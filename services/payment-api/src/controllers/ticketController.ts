import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class TicketController {
  /** Create ticket (merchant) */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { subject, message, priority } = req.body;

      if (!subject || !message) {
        res.status(400).json({ success: false, error: 'Subject and message are required' });
        return;
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          merchant_id: merchantId!,
          subject,
          priority: priority || 'medium',
          status: 'open',
          messages: {
            create: {
              sender_type: 'merchant',
              message,
            },
          },
        },
        include: { messages: true },
      });

      res.status(201).json({
        success: true,
        ticket: {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.created_at,
          messages: ticket.messages.map(m => ({
            id: m.id,
            senderType: m.sender_type,
            message: m.message,
            createdAt: m.created_at,
          })),
        },
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ success: false, error: 'Failed to create ticket' });
    }
  }

  /** List merchant tickets */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      const tickets = await prisma.supportTicket.findMany({
        where: { merchant_id: merchantId! },
        orderBy: { updated_at: 'desc' },
        include: { _count: { select: { messages: true } } },
      });

      res.json({
        success: true,
        tickets: tickets.map(t => ({
          id: t.id,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          messageCount: t._count.messages,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        })),
      });
    } catch (error) {
      console.error('List tickets error:', error);
      res.status(500).json({ success: false, error: 'Failed to list tickets' });
    }
  }

  /** Get ticket with messages */
  async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { id } = req.params;

      const ticket = await prisma.supportTicket.findFirst({
        where: { id: Number(id), merchant_id: merchantId! },
        include: { messages: { orderBy: { created_at: 'asc' } } },
      });

      if (!ticket) {
        res.status(404).json({ success: false, error: 'Ticket not found' });
        return;
      }

      res.json({
        success: true,
        ticket: {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.created_at,
          messages: ticket.messages.map(m => ({
            id: m.id,
            senderType: m.sender_type,
            senderName: m.sender_name,
            message: m.message,
            attachmentUrl: m.attachment_url,
            createdAt: m.created_at,
          })),
        },
      });
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ success: false, error: 'Failed to get ticket' });
    }
  }

  /** Reply to ticket (merchant) */
  async reply(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { id } = req.params;
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ success: false, error: 'Message is required' });
        return;
      }

      const ticket = await prisma.supportTicket.findFirst({
        where: { id: Number(id), merchant_id: merchantId! },
      });

      if (!ticket) {
        res.status(404).json({ success: false, error: 'Ticket not found' });
        return;
      }

      const reply = await prisma.ticketMessage.create({
        data: {
          ticket_id: Number(id),
          sender_type: 'merchant',
          message,
        },
      });

      // Reopen if was resolved
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        await prisma.supportTicket.update({
          where: { id: Number(id) },
          data: { status: 'open' },
        });
      }

      res.json({
        success: true,
        message: {
          id: reply.id,
          senderType: reply.sender_type,
          message: reply.message,
          createdAt: reply.created_at,
        },
      });
    } catch (error) {
      console.error('Reply ticket error:', error);
      res.status(500).json({ success: false, error: 'Failed to reply' });
    }
  }

  /** Admin: List all tickets */
  async adminList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const where: any = {};
      if (status && status !== 'all') where.status = status;

      const tickets = await prisma.supportTicket.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        include: {
          merchant: { select: { name: true, company_name: true, email: true } },
          _count: { select: { messages: true } },
        },
      });

      res.json({
        success: true,
        tickets: tickets.map(t => ({
          id: t.id,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          merchantName: t.merchant?.company_name || t.merchant?.name,
          merchantEmail: t.merchant?.email,
          messageCount: t._count.messages,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        })),
      });
    } catch (error) {
      console.error('Admin list tickets error:', error);
      res.status(500).json({ success: false, error: 'Failed to list tickets' });
    }
  }

  /** Admin: Reply to ticket */
  async adminReply(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { message, status } = req.body;

      if (!message) {
        res.status(400).json({ success: false, error: 'Message is required' });
        return;
      }

      await prisma.ticketMessage.create({
        data: {
          ticket_id: Number(id),
          sender_type: 'admin',
          sender_name: 'Support Team',
          message,
        },
      });

      if (status) {
        await prisma.supportTicket.update({
          where: { id: Number(id) },
          data: { status },
        });
      }

      res.json({ success: true, message: 'Reply sent' });
    } catch (error) {
      console.error('Admin reply error:', error);
      res.status(500).json({ success: false, error: 'Failed to reply' });
    }
  }

  /** Admin: Update ticket status */
  async adminUpdateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      await prisma.supportTicket.update({
        where: { id: Number(id) },
        data: { status },
      });

      res.json({ success: true, message: 'Status updated' });
    } catch (error) {
      console.error('Admin update status error:', error);
      res.status(500).json({ success: false, error: 'Failed to update status' });
    }
  }
}

export const ticketController = new TicketController();
