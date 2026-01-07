import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { configValidationService } from '../services/configValidationService';
import { AuthenticatedAdminRequest } from '../middleware/adminAuth';
import { CreateRuleRequest, UpdateRuleRequest, CreateTemplateRequest, UpdateTemplateRequest } from '../types';

// Helper to cast objects to Prisma JSON type
const toJson = (obj: unknown): Prisma.InputJsonValue => obj as Prisma.InputJsonValue;

/**
 * Admin Payment Page Controller
 * Admin endpoints for managing payment page rules, templates, and configs
 */
class AdminPaymentPageController {
  // ============================================
  // RULES MANAGEMENT
  // ============================================

  /**
   * List all rules
   * GET /api/v1/admin/payment-page/rules
   */
  async listRules(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const rules = await prisma.paymentPageRule.findMany({
        orderBy: [{ priority: 'desc' }, { field_path: 'asc' }],
      });

      res.json({
        success: true,
        rules: rules.map((rule) => ({
          id: rule.id,
          fieldPath: rule.field_path,
          ruleType: rule.rule_type,
          ruleValue: rule.rule_value,
          description: rule.description,
          isActive: rule.is_active,
          priority: rule.priority,
          createdBy: rule.created_by,
          createdAt: rule.created_at,
          updatedAt: rule.updated_at,
        })),
      });
    } catch (error) {
      console.error('List rules error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list rules',
      });
    }
  }

  /**
   * Get a single rule by ID
   * GET /api/v1/admin/payment-page/rules/:id
   */
  async getRule(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const ruleId = parseInt(req.params.id);

      if (isNaN(ruleId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule ID',
        });
        return;
      }

      const rule = await prisma.paymentPageRule.findUnique({
        where: { id: ruleId },
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
        return;
      }

      res.json({
        success: true,
        rule: {
          id: rule.id,
          fieldPath: rule.field_path,
          ruleType: rule.rule_type,
          ruleValue: rule.rule_value,
          description: rule.description,
          isActive: rule.is_active,
          priority: rule.priority,
          createdBy: rule.created_by,
          createdAt: rule.created_at,
          updatedAt: rule.updated_at,
        },
      });
    } catch (error) {
      console.error('Get rule error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get rule',
      });
    }
  }

  /**
   * Create a new rule
   * POST /api/v1/admin/payment-page/rules
   */
  async createRule(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const body: CreateRuleRequest = req.body;

      // Validate required fields
      if (!body.fieldPath || !body.ruleType || !body.ruleValue) {
        res.status(400).json({
          success: false,
          error: 'Field path, rule type, and rule value are required',
        });
        return;
      }

      // Validate rule type
      const validRuleTypes = ['required', 'allowed_values', 'locked', 'regex', 'range'];
      if (!validRuleTypes.includes(body.ruleType)) {
        res.status(400).json({
          success: false,
          error: `Invalid rule type. Must be one of: ${validRuleTypes.join(', ')}`,
        });
        return;
      }

      // Check for duplicate field path
      const existing = await prisma.paymentPageRule.findUnique({
        where: { field_path: body.fieldPath },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          error: 'A rule for this field path already exists',
        });
        return;
      }

      const rule = await prisma.paymentPageRule.create({
        data: {
          field_path: body.fieldPath,
          rule_type: body.ruleType,
          rule_value: toJson(body.ruleValue),
          description: body.description,
          is_active: body.isActive !== false,
          priority: body.priority || 0,
          created_by: req.adminId,
        },
      });

      // Invalidate cache
      configValidationService.invalidateCache();

      res.status(201).json({
        success: true,
        rule: {
          id: rule.id,
          fieldPath: rule.field_path,
          ruleType: rule.rule_type,
          ruleValue: rule.rule_value,
          description: rule.description,
          isActive: rule.is_active,
          priority: rule.priority,
          createdAt: rule.created_at,
        },
      });
    } catch (error) {
      console.error('Create rule error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create rule',
      });
    }
  }

  /**
   * Update an existing rule
   * PUT /api/v1/admin/payment-page/rules/:id
   */
  async updateRule(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const ruleId = parseInt(req.params.id);
      const body: UpdateRuleRequest = req.body;

      if (isNaN(ruleId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule ID',
        });
        return;
      }

      // Check if rule exists
      const existing = await prisma.paymentPageRule.findUnique({
        where: { id: ruleId },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
        return;
      }

      // Check for duplicate field path (if changing)
      if (body.fieldPath && body.fieldPath !== existing.field_path) {
        const duplicate = await prisma.paymentPageRule.findUnique({
          where: { field_path: body.fieldPath },
        });

        if (duplicate) {
          res.status(400).json({
            success: false,
            error: 'A rule for this field path already exists',
          });
          return;
        }
      }

      // Validate rule type if provided
      if (body.ruleType) {
        const validRuleTypes = ['required', 'allowed_values', 'locked', 'regex', 'range'];
        if (!validRuleTypes.includes(body.ruleType)) {
          res.status(400).json({
            success: false,
            error: `Invalid rule type. Must be one of: ${validRuleTypes.join(', ')}`,
          });
          return;
        }
      }

      const rule = await prisma.paymentPageRule.update({
        where: { id: ruleId },
        data: {
          field_path: body.fieldPath,
          rule_type: body.ruleType,
          rule_value: body.ruleValue ? toJson(body.ruleValue) : undefined,
          description: body.description,
          is_active: body.isActive,
          priority: body.priority,
        },
      });

      // Invalidate cache
      configValidationService.invalidateCache();

      res.json({
        success: true,
        rule: {
          id: rule.id,
          fieldPath: rule.field_path,
          ruleType: rule.rule_type,
          ruleValue: rule.rule_value,
          description: rule.description,
          isActive: rule.is_active,
          priority: rule.priority,
          updatedAt: rule.updated_at,
        },
      });
    } catch (error) {
      console.error('Update rule error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update rule',
      });
    }
  }

  /**
   * Delete a rule
   * DELETE /api/v1/admin/payment-page/rules/:id
   */
  async deleteRule(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const ruleId = parseInt(req.params.id);

      if (isNaN(ruleId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule ID',
        });
        return;
      }

      // Check if rule exists
      const rule = await prisma.paymentPageRule.findUnique({
        where: { id: ruleId },
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
        return;
      }

      await prisma.paymentPageRule.delete({
        where: { id: ruleId },
      });

      // Invalidate cache
      configValidationService.invalidateCache();

      res.json({
        success: true,
        message: 'Rule deleted successfully',
      });
    } catch (error) {
      console.error('Delete rule error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete rule',
      });
    }
  }

  /**
   * Toggle rule active status
   * POST /api/v1/admin/payment-page/rules/:id/toggle
   */
  async toggleRule(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const ruleId = parseInt(req.params.id);

      if (isNaN(ruleId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule ID',
        });
        return;
      }

      const rule = await prisma.paymentPageRule.findUnique({
        where: { id: ruleId },
      });

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
        return;
      }

      const updated = await prisma.paymentPageRule.update({
        where: { id: ruleId },
        data: { is_active: !rule.is_active },
      });

      // Invalidate cache
      configValidationService.invalidateCache();

      res.json({
        success: true,
        rule: {
          id: updated.id,
          fieldPath: updated.field_path,
          isActive: updated.is_active,
        },
        message: `Rule ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Toggle rule error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle rule',
      });
    }
  }

  // ============================================
  // TEMPLATES MANAGEMENT
  // ============================================

  /**
   * List all templates
   * GET /api/v1/admin/payment-page/templates
   */
  async listTemplates(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const templates = await prisma.paymentPageTemplate.findMany({
        orderBy: [{ is_featured: 'desc' }, { usage_count: 'desc' }],
      });

      res.json({
        success: true,
        templates: templates.map((template) => ({
          id: template.id,
          name: template.name,
          slug: template.slug,
          category: template.category,
          description: template.description,
          thumbnailUrl: template.thumbnail_url,
          tags: template.tags,
          isActive: template.is_active,
          isFeatured: template.is_featured,
          usageCount: template.usage_count,
          createdAt: template.created_at,
          updatedAt: template.updated_at,
        })),
      });
    } catch (error) {
      console.error('List templates error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list templates',
      });
    }
  }

  /**
   * Get a single template by ID
   * GET /api/v1/admin/payment-page/templates/:id
   */
  async getTemplate(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID',
        });
        return;
      }

      const template = await prisma.paymentPageTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }

      res.json({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          category: template.category,
          description: template.description,
          thumbnailUrl: template.thumbnail_url,
          configuration: template.configuration,
          tags: template.tags,
          isActive: template.is_active,
          isFeatured: template.is_featured,
          usageCount: template.usage_count,
          createdAt: template.created_at,
          updatedAt: template.updated_at,
        },
      });
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get template',
      });
    }
  }

  /**
   * Create a new template
   * POST /api/v1/admin/payment-page/templates
   */
  async createTemplate(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const body: CreateTemplateRequest = req.body;

      // Validate required fields
      if (!body.name || !body.slug || !body.category || !body.configuration) {
        res.status(400).json({
          success: false,
          error: 'Name, slug, category, and configuration are required',
        });
        return;
      }

      // Check for duplicate name or slug
      const existingName = await prisma.paymentPageTemplate.findUnique({
        where: { name: body.name },
      });

      if (existingName) {
        res.status(400).json({
          success: false,
          error: 'A template with this name already exists',
        });
        return;
      }

      const existingSlug = await prisma.paymentPageTemplate.findUnique({
        where: { slug: body.slug },
      });

      if (existingSlug) {
        res.status(400).json({
          success: false,
          error: 'A template with this slug already exists',
        });
        return;
      }

      const template = await prisma.paymentPageTemplate.create({
        data: {
          name: body.name,
          slug: body.slug,
          category: body.category,
          description: body.description,
          thumbnail_url: body.thumbnailUrl,
          configuration: toJson(body.configuration),
          tags: body.tags ? toJson(body.tags) : toJson([]),
          is_active: body.isActive !== false,
          is_featured: body.isFeatured || false,
        },
      });

      res.status(201).json({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          category: template.category,
          description: template.description,
          isActive: template.is_active,
          isFeatured: template.is_featured,
          createdAt: template.created_at,
        },
      });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create template',
      });
    }
  }

  /**
   * Update an existing template
   * PUT /api/v1/admin/payment-page/templates/:id
   */
  async updateTemplate(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const templateId = parseInt(req.params.id);
      const body: UpdateTemplateRequest = req.body;

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID',
        });
        return;
      }

      // Check if template exists
      const existing = await prisma.paymentPageTemplate.findUnique({
        where: { id: templateId },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }

      // Check for duplicate name (if changing)
      if (body.name && body.name !== existing.name) {
        const duplicate = await prisma.paymentPageTemplate.findUnique({
          where: { name: body.name },
        });

        if (duplicate) {
          res.status(400).json({
            success: false,
            error: 'A template with this name already exists',
          });
          return;
        }
      }

      // Check for duplicate slug (if changing)
      if (body.slug && body.slug !== existing.slug) {
        const duplicate = await prisma.paymentPageTemplate.findUnique({
          where: { slug: body.slug },
        });

        if (duplicate) {
          res.status(400).json({
            success: false,
            error: 'A template with this slug already exists',
          });
          return;
        }
      }

      const template = await prisma.paymentPageTemplate.update({
        where: { id: templateId },
        data: {
          name: body.name,
          slug: body.slug,
          category: body.category,
          description: body.description,
          thumbnail_url: body.thumbnailUrl,
          configuration: body.configuration ? toJson(body.configuration) : undefined,
          tags: body.tags ? toJson(body.tags) : undefined,
          is_active: body.isActive,
          is_featured: body.isFeatured,
        },
      });

      res.json({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          category: template.category,
          isActive: template.is_active,
          isFeatured: template.is_featured,
          updatedAt: template.updated_at,
        },
      });
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update template',
      });
    }
  }

  /**
   * Delete a template
   * DELETE /api/v1/admin/payment-page/templates/:id
   */
  async deleteTemplate(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID',
        });
        return;
      }

      const template = await prisma.paymentPageTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }

      await prisma.paymentPageTemplate.delete({
        where: { id: templateId },
      });

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete template',
      });
    }
  }

  // ============================================
  // MERCHANT CONFIGS MANAGEMENT
  // ============================================

  /**
   * List all merchant configs (for admin oversight)
   * GET /api/v1/admin/payment-page/configs
   */
  async listAllConfigs(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const merchantId = req.query.merchantId
        ? parseInt(req.query.merchantId as string)
        : undefined;

      const where = merchantId ? { merchant_id: merchantId } : {};

      const configs = await prisma.paymentPageConfig.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              email: true,
              company_name: true,
            },
          },
        },
        orderBy: [{ merchant_id: 'asc' }, { is_default: 'desc' }],
      });

      res.json({
        success: true,
        configs: configs.map((config) => ({
          id: config.id,
          merchantId: config.merchant_id,
          merchant: config.merchant
            ? {
                id: config.merchant.id,
                name: config.merchant.name,
                email: config.merchant.email,
                companyName: config.merchant.company_name,
              }
            : null,
          name: config.name,
          description: config.description,
          isDefault: config.is_default,
          isActive: config.is_active,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        })),
      });
    } catch (error) {
      console.error('List all configs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list configurations',
      });
    }
  }

  /**
   * Get a merchant config by ID (with full configuration)
   * GET /api/v1/admin/payment-page/configs/:id
   */
  async getConfigById(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const configId = parseInt(req.params.id);

      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid configuration ID',
        });
        return;
      }

      const config = await prisma.paymentPageConfig.findUnique({
        where: { id: configId },
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              email: true,
              company_name: true,
            },
          },
        },
      });

      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Configuration not found',
        });
        return;
      }

      res.json({
        success: true,
        config: {
          id: config.id,
          merchantId: config.merchant_id,
          merchant: config.merchant
            ? {
                id: config.merchant.id,
                name: config.merchant.name,
                email: config.merchant.email,
                companyName: config.merchant.company_name,
              }
            : null,
          name: config.name,
          description: config.description,
          isDefault: config.is_default,
          isActive: config.is_active,
          branding: config.branding,
          colors: config.colors,
          typography: config.typography,
          layout: config.layout,
          channels: config.channels,
          text: config.text,
          legal: config.legal,
          resultPages: config.result_pages,
          advanced: config.advanced,
          visibility: config.visibility,
          formConfig: config.form_config,
          otpConfig: config.otp_config,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        },
      });
    } catch (error) {
      console.error('Get config by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get configuration',
      });
    }
  }
}

export const adminPaymentPageController = new AdminPaymentPageController();
