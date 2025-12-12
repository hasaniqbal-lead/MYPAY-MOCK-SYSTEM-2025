import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

interface AuthenticatedAdminRequest extends Request {
  admin?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  adminId?: number;
}

interface JwtPayload {
  adminId: number;
  role: string;
}

export async function requireAdminAuth(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided',
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Get admin from database
    const admin = await prisma.adminUser.findFirst({
      where: {
        id: decoded.adminId,
        is_active: true,
      },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Admin not found or inactive',
      });
      return;
    }

    // Attach admin to request
    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
    req.adminId = admin.id;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or expired token',
      });
      return;
    }

    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
}

