import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { configValidationService } from '../services/configValidationService';
import { AuthenticatedRequest, CreateConfigRequest, UpdateConfigRequest } from '../types';

// Helper to cast objects to Prisma JSON type
const toJson = (obj: unknown): Prisma.InputJsonValue => obj as Prisma.InputJsonValue;

/**
 * Payment Page Configuration Controller
 * Merchant endpoints for managing payment page themes and settings
 */
class PaymentPageConfigController {
  /**
   * List all configurations for the merchant
   * GET /api/v1/portal/payment-page/configs
   */
  async listConfigs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      const configs = await prisma.paymentPageConfig.findMany({
        where: { merchant_id: merchantId },
        orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
      });

      res.json({
        success: true,
        configs: configs.map((config) => ({
          id: config.id,
          name: config.name,
          description: config.description,
          isDefault: config.is_default,
          isActive: config.is_active,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        })),
      });
    } catch (error) {
      console.error('List configs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list configurations',
      });
    }
  }

  /**
   * Get a single configuration by ID
   * GET /api/v1/portal/payment-page/configs/:id
   */
  async getConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const configId = parseInt(req.params.id);

      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid configuration ID',
        });
        return;
      }

      const config = await prisma.paymentPageConfig.findFirst({
        where: {
          id: configId,
          merchant_id: merchantId,
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
      console.error('Get config error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get configuration',
      });
    }
  }

  /**
   * Create a new configuration
   * POST /api/v1/portal/payment-page/configs
   */
  async createConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const body: CreateConfigRequest = req.body;

      // Validate required fields
      if (!body.name) {
        res.status(400).json({
          success: false,
          error: 'Configuration name is required',
        });
        return;
      }

      // Check for duplicate name
      const existing = await prisma.paymentPageConfig.findFirst({
        where: {
          merchant_id: merchantId,
          name: body.name,
        },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          error: 'A configuration with this name already exists',
        });
        return;
      }

      // Build the configuration object for validation
      const configData = {
        branding: body.branding || {},
        colors: body.colors || {},
        typography: body.typography || {},
        layout: body.layout || {},
        channels: body.channels || {},
        text: body.text || {},
        legal: body.legal || {},
        resultPages: body.resultPages || {},
        advanced: body.advanced || {},
        visibility: body.visibility,
        formConfig: body.formConfig,
        otpConfig: body.otpConfig,
      };

      // Apply locked values from admin rules
      const configWithLocked = await configValidationService.applyLockedValues(configData);

      // Validate against admin rules
      const validation = await configValidationService.validateConfig(configWithLocked);

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Configuration validation failed',
          validationErrors: validation.errors,
        });
        return;
      }

      // If this is set as default, unset other defaults
      if (body.isDefault) {
        await prisma.paymentPageConfig.updateMany({
          where: { merchant_id: merchantId, is_default: true },
          data: { is_default: false },
        });
      }

      // Create the configuration
      const config = await prisma.paymentPageConfig.create({
        data: {
          merchant_id: merchantId!,
          name: body.name,
          description: body.description,
          is_default: body.isDefault || false,
          is_active: true,
          branding: toJson(configWithLocked.branding || {}),
          colors: toJson(configWithLocked.colors || {}),
          typography: toJson(configWithLocked.typography || {}),
          layout: toJson(configWithLocked.layout || {}),
          channels: toJson(configWithLocked.channels || {}),
          text: toJson(configWithLocked.text || {}),
          legal: toJson(configWithLocked.legal || {}),
          result_pages: toJson(configWithLocked.resultPages || {}),
          advanced: toJson(configWithLocked.advanced || {}),
          visibility: configWithLocked.visibility ? toJson(configWithLocked.visibility) : Prisma.JsonNull,
          form_config: configWithLocked.formConfig ? toJson(configWithLocked.formConfig) : Prisma.JsonNull,
          otp_config: configWithLocked.otpConfig ? toJson(configWithLocked.otpConfig) : Prisma.JsonNull,
        },
      });

      res.status(201).json({
        success: true,
        config: {
          id: config.id,
          name: config.name,
          description: config.description,
          isDefault: config.is_default,
          isActive: config.is_active,
          createdAt: config.created_at,
        },
      });
    } catch (error) {
      console.error('Create config error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create configuration',
      });
    }
  }

  /**
   * Update an existing configuration
   * PUT /api/v1/portal/payment-page/configs/:id
   */
  async updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const configId = parseInt(req.params.id);
      const body: UpdateConfigRequest = req.body;

      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid configuration ID',
        });
        return;
      }

      // Check if config exists and belongs to merchant
      const existing = await prisma.paymentPageConfig.findFirst({
        where: {
          id: configId,
          merchant_id: merchantId,
        },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Configuration not found',
        });
        return;
      }

      // Check for duplicate name (if name is being changed)
      if (body.name && body.name !== existing.name) {
        const duplicate = await prisma.paymentPageConfig.findFirst({
          where: {
            merchant_id: merchantId,
            name: body.name,
            NOT: { id: configId },
          },
        });

        if (duplicate) {
          res.status(400).json({
            success: false,
            error: 'A configuration with this name already exists',
          });
          return;
        }
      }

      // Build merged configuration for validation
      const mergedConfig = {
        branding: body.branding || existing.branding,
        colors: body.colors || existing.colors,
        typography: body.typography || existing.typography,
        layout: body.layout || existing.layout,
        channels: body.channels || existing.channels,
        text: body.text || existing.text,
        legal: body.legal || existing.legal,
        resultPages: body.resultPages || existing.result_pages,
        advanced: body.advanced || existing.advanced,
        visibility: body.visibility !== undefined ? body.visibility : existing.visibility,
        formConfig: body.formConfig !== undefined ? body.formConfig : existing.form_config,
        otpConfig: body.otpConfig !== undefined ? body.otpConfig : existing.otp_config,
      };

      // Apply locked values
      const configWithLocked = await configValidationService.applyLockedValues(mergedConfig);

      // Validate against admin rules
      const validation = await configValidationService.validateConfig(configWithLocked);

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Configuration validation failed',
          validationErrors: validation.errors,
        });
        return;
      }

      // If setting as default, unset other defaults
      if (body.isDefault) {
        await prisma.paymentPageConfig.updateMany({
          where: {
            merchant_id: merchantId,
            is_default: true,
            NOT: { id: configId },
          },
          data: { is_default: false },
        });
      }

      // Update the configuration
      const config = await prisma.paymentPageConfig.update({
        where: { id: configId },
        data: {
          name: body.name,
          description: body.description,
          is_default: body.isDefault,
          branding: toJson(configWithLocked.branding),
          colors: toJson(configWithLocked.colors),
          typography: toJson(configWithLocked.typography),
          layout: toJson(configWithLocked.layout),
          channels: toJson(configWithLocked.channels),
          text: toJson(configWithLocked.text),
          legal: toJson(configWithLocked.legal),
          result_pages: toJson(configWithLocked.resultPages),
          advanced: toJson(configWithLocked.advanced),
          visibility: configWithLocked.visibility ? toJson(configWithLocked.visibility) : undefined,
          form_config: configWithLocked.formConfig ? toJson(configWithLocked.formConfig) : undefined,
          otp_config: configWithLocked.otpConfig ? toJson(configWithLocked.otpConfig) : undefined,
        },
      });

      res.json({
        success: true,
        config: {
          id: config.id,
          name: config.name,
          description: config.description,
          isDefault: config.is_default,
          isActive: config.is_active,
          updatedAt: config.updated_at,
        },
      });
    } catch (error) {
      console.error('Update config error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
      });
    }
  }

  /**
   * Delete a configuration
   * DELETE /api/v1/portal/payment-page/configs/:id
   */
  async deleteConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const configId = parseInt(req.params.id);

      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid configuration ID',
        });
        return;
      }

      // Check if config exists and belongs to merchant
      const config = await prisma.paymentPageConfig.findFirst({
        where: {
          id: configId,
          merchant_id: merchantId,
        },
      });

      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Configuration not found',
        });
        return;
      }

      // Don't allow deleting the default config if it's the only one
      if (config.is_default) {
        const count = await prisma.paymentPageConfig.count({
          where: { merchant_id: merchantId },
        });

        if (count === 1) {
          res.status(400).json({
            success: false,
            error: 'Cannot delete the only configuration. Create another one first.',
          });
          return;
        }
      }

      await prisma.paymentPageConfig.delete({
        where: { id: configId },
      });

      // If we deleted the default, make another one default
      if (config.is_default) {
        const another = await prisma.paymentPageConfig.findFirst({
          where: { merchant_id: merchantId },
          orderBy: { created_at: 'desc' },
        });

        if (another) {
          await prisma.paymentPageConfig.update({
            where: { id: another.id },
            data: { is_default: true },
          });
        }
      }

      res.json({
        success: true,
        message: 'Configuration deleted successfully',
      });
    } catch (error) {
      console.error('Delete config error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete configuration',
      });
    }
  }

  /**
   * Activate a configuration (make it the default)
   * POST /api/v1/portal/payment-page/configs/:id/activate
   */
  async activateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const configId = parseInt(req.params.id);

      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid configuration ID',
        });
        return;
      }

      // Check if config exists and belongs to merchant
      const config = await prisma.paymentPageConfig.findFirst({
        where: {
          id: configId,
          merchant_id: merchantId,
        },
      });

      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Configuration not found',
        });
        return;
      }

      // Unset other defaults and set this one
      await prisma.paymentPageConfig.updateMany({
        where: { merchant_id: merchantId, is_default: true },
        data: { is_default: false },
      });

      await prisma.paymentPageConfig.update({
        where: { id: configId },
        data: { is_default: true, is_active: true },
      });

      res.json({
        success: true,
        message: 'Configuration activated successfully',
      });
    } catch (error) {
      console.error('Activate config error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate configuration',
      });
    }
  }

  /**
   * List available templates
   * GET /api/v1/portal/payment-page/templates
   */
  async listTemplates(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templates = await prisma.paymentPageTemplate.findMany({
        where: { is_active: true },
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
          isFeatured: template.is_featured,
          usageCount: template.usage_count,
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
   * Create a configuration from a template
   * POST /api/v1/portal/payment-page/configs/from-template
   */
  async createFromTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { templateId, name, description } = req.body;

      if (!templateId || !name) {
        res.status(400).json({
          success: false,
          error: 'Template ID and name are required',
        });
        return;
      }

      // Get the template
      const template = await prisma.paymentPageTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template || !template.is_active) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }

      // Check for duplicate name
      const existing = await prisma.paymentPageConfig.findFirst({
        where: {
          merchant_id: merchantId,
          name,
        },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          error: 'A configuration with this name already exists',
        });
        return;
      }

      // Parse template configuration
      const templateConfig = template.configuration as Record<string, unknown>;

      // Apply locked values from admin rules
      const configWithLocked = await configValidationService.applyLockedValues(templateConfig);

      // Validate against admin rules
      const validation = await configValidationService.validateConfig(configWithLocked);

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Template configuration does not meet current rules',
          validationErrors: validation.errors,
        });
        return;
      }

      // Create the configuration from template
      const config = await prisma.paymentPageConfig.create({
        data: {
          merchant_id: merchantId!,
          name,
          description: description || template.description,
          is_default: false,
          is_active: true,
          branding: toJson(configWithLocked.branding || {}),
          colors: toJson(configWithLocked.colors || {}),
          typography: toJson(configWithLocked.typography || {}),
          layout: toJson(configWithLocked.layout || {}),
          channels: toJson(configWithLocked.channels || {}),
          text: toJson(configWithLocked.text || {}),
          legal: toJson(configWithLocked.legal || {}),
          result_pages: toJson(configWithLocked.resultPages || {}),
          advanced: toJson(configWithLocked.advanced || {}),
          visibility: configWithLocked.visibility ? toJson(configWithLocked.visibility) : Prisma.JsonNull,
          form_config: configWithLocked.formConfig ? toJson(configWithLocked.formConfig) : Prisma.JsonNull,
          otp_config: configWithLocked.otpConfig ? toJson(configWithLocked.otpConfig) : Prisma.JsonNull,
        },
      });

      // Increment template usage count
      await prisma.paymentPageTemplate.update({
        where: { id: templateId },
        data: { usage_count: { increment: 1 } },
      });

      res.status(201).json({
        success: true,
        config: {
          id: config.id,
          name: config.name,
          description: config.description,
          isDefault: config.is_default,
          isActive: config.is_active,
          createdAt: config.created_at,
        },
      });
    } catch (error) {
      console.error('Create from template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create configuration from template',
      });
    }
  }

  /**
   * Get admin rules (for frontend to know what's locked/required)
   * GET /api/v1/portal/payment-page/rules
   */
  async getRules(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rules = await configValidationService.getRulesForMerchant();

      res.json({
        success: true,
        rules,
      });
    } catch (error) {
      console.error('Get rules error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get rules',
      });
    }
  }

  /**
   * Get default configuration for merchant
   * GET /api/v1/portal/payment-page/configs/default
   */
  async getDefaultConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      const config = await prisma.paymentPageConfig.findFirst({
        where: {
          merchant_id: merchantId,
          is_default: true,
          is_active: true,
        },
      });

      if (!config) {
        res.status(404).json({
          success: false,
          error: 'No default configuration found',
        });
        return;
      }

      res.json({
        success: true,
        config: {
          id: config.id,
          merchantId: config.merchant_id,
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
      console.error('Get default config error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get default configuration',
      });
    }
  }
}

export const paymentPageConfigController = new PaymentPageConfigController();
