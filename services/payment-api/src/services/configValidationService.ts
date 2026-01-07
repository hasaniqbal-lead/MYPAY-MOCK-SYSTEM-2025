import { prisma } from '../config/database';
import {
  PaymentPageRule,
  RuleType,
  RuleValue,
  ValidationResult,
  ValidationError,
} from '../types';

/**
 * Configuration Validation Service
 * Validates merchant payment page configurations against admin-defined rules
 */
class ConfigValidationService {
  private rulesCache: PaymentPageRule[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  /**
   * Get active rules from database (with caching)
   */
  async getActiveRules(): Promise<PaymentPageRule[]> {
    const now = Date.now();

    // Return cached rules if still valid
    if (this.rulesCache && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.rulesCache;
    }

    const rules = await prisma.paymentPageRule.findMany({
      where: { is_active: true },
      orderBy: { priority: 'desc' },
    });

    // Map database records to PaymentPageRule type
    this.rulesCache = rules.map((rule) => ({
      id: rule.id,
      fieldPath: rule.field_path,
      ruleType: rule.rule_type as RuleType,
      ruleValue: rule.rule_value as RuleValue,
      description: rule.description || undefined,
      isActive: rule.is_active,
      priority: rule.priority,
      createdBy: rule.created_by || undefined,
      createdAt: rule.created_at.toISOString(),
      updatedAt: rule.updated_at.toISOString(),
    }));

    this.cacheTimestamp = now;
    return this.rulesCache;
  }

  /**
   * Invalidate the rules cache (call after rule changes)
   */
  invalidateCache(): void {
    this.rulesCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get value from object by dot-notation path
   * e.g., "colors.primary" gets obj.colors.primary
   */
  private getValueByPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Validate a single field against a rule
   */
  private validateField(
    config: Record<string, unknown>,
    rule: PaymentPageRule
  ): ValidationError | null {
    const value = this.getValueByPath(config as Record<string, unknown>, rule.fieldPath);
    const ruleValue = rule.ruleValue;

    switch (rule.ruleType) {
      case 'locked':
        // Field must have exactly the locked value
        if (value !== ruleValue.value) {
          return {
            field: rule.fieldPath,
            message: ruleValue.message || `Field "${rule.fieldPath}" is locked to a specific value`,
            rule: 'locked',
          };
        }
        break;

      case 'required':
        // Field must have a non-empty value
        if (value === undefined || value === null || value === '') {
          return {
            field: rule.fieldPath,
            message: ruleValue.message || `Field "${rule.fieldPath}" is required`,
            rule: 'required',
          };
        }
        break;

      case 'allowed_values':
        // Field must be one of the allowed values
        if (ruleValue.values && !ruleValue.values.includes(value)) {
          return {
            field: rule.fieldPath,
            message:
              ruleValue.message ||
              `Field "${rule.fieldPath}" must be one of: ${ruleValue.values.join(', ')}`,
            rule: 'allowed_values',
          };
        }
        break;

      case 'regex':
        // Field must match the regex pattern
        if (ruleValue.pattern && typeof value === 'string') {
          const regex = new RegExp(ruleValue.pattern);
          if (!regex.test(value)) {
            return {
              field: rule.fieldPath,
              message: ruleValue.message || `Field "${rule.fieldPath}" has invalid format`,
              rule: 'regex',
            };
          }
        }
        break;

      case 'range':
        // Field must be within the specified range
        if (typeof value === 'number') {
          if (ruleValue.min !== undefined && value < ruleValue.min) {
            return {
              field: rule.fieldPath,
              message: ruleValue.message || `Field "${rule.fieldPath}" must be at least ${ruleValue.min}`,
              rule: 'range',
            };
          }
          if (ruleValue.max !== undefined && value > ruleValue.max) {
            return {
              field: rule.fieldPath,
              message: ruleValue.message || `Field "${rule.fieldPath}" must be at most ${ruleValue.max}`,
              rule: 'range',
            };
          }
        }
        break;
    }

    return null;
  }

  /**
   * Validate a configuration against all active rules
   */
  async validateConfig(config: Record<string, unknown>): Promise<ValidationResult> {
    const rules = await this.getActiveRules();
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const error = this.validateField(config, rule);
      if (error) {
        errors.push(error);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Apply locked values from rules to a configuration
   * Used when saving to ensure locked fields have correct values
   */
  async applyLockedValues(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    const rules = await this.getActiveRules();
    const result = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;

    for (const rule of rules) {
      if (rule.ruleType === 'locked' && rule.ruleValue.value !== undefined) {
        this.setValueByPath(result, rule.fieldPath, rule.ruleValue.value);
      }
    }

    return result;
  }

  /**
   * Set value in object by dot-notation path
   */
  private setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Get locked fields for frontend display
   * Returns a map of field paths to their locked values
   */
  async getLockedFields(): Promise<Record<string, unknown>> {
    const rules = await this.getActiveRules();
    const locked: Record<string, unknown> = {};

    for (const rule of rules) {
      if (rule.ruleType === 'locked') {
        locked[rule.fieldPath] = rule.ruleValue.value;
      }
    }

    return locked;
  }

  /**
   * Get all rules formatted for frontend display
   * Includes which fields are locked, required, or have restrictions
   */
  async getRulesForMerchant(): Promise<{
    locked: Record<string, unknown>;
    required: string[];
    restricted: Record<string, unknown[]>;
  }> {
    const rules = await this.getActiveRules();

    const locked: Record<string, unknown> = {};
    const required: string[] = [];
    const restricted: Record<string, unknown[]> = {};

    for (const rule of rules) {
      switch (rule.ruleType) {
        case 'locked':
          locked[rule.fieldPath] = rule.ruleValue.value;
          break;
        case 'required':
          required.push(rule.fieldPath);
          break;
        case 'allowed_values':
          if (rule.ruleValue.values) {
            restricted[rule.fieldPath] = rule.ruleValue.values;
          }
          break;
      }
    }

    return { locked, required, restricted };
  }

  /**
   * Validate only specific fields (for partial updates)
   */
  async validatePartialConfig(
    fields: Record<string, unknown>,
    fieldPaths: string[]
  ): Promise<ValidationResult> {
    const rules = await this.getActiveRules();
    const errors: ValidationError[] = [];

    // Filter rules to only those affecting the updated fields
    const relevantRules = rules.filter((rule) =>
      fieldPaths.some((path) => rule.fieldPath === path || rule.fieldPath.startsWith(path + '.'))
    );

    for (const rule of relevantRules) {
      const error = this.validateField(fields as Record<string, unknown>, rule);
      if (error) {
        errors.push(error);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const configValidationService = new ConfigValidationService();
