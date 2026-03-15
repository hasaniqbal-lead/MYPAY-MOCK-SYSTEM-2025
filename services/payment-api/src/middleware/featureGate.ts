import { Request, Response, NextFunction } from 'express';

/**
 * Parses the ORG_FEATURES env var (JSON string) and caches the result.
 */
let cachedFeatures: Record<string, any> | null = null;

function getFeatures(): Record<string, any> {
  if (cachedFeatures) return cachedFeatures;

  const raw = process.env.ORG_FEATURES;
  if (!raw) {
    // No features configured = all enabled (default open)
    cachedFeatures = {};
    return cachedFeatures;
  }

  try {
    cachedFeatures = JSON.parse(raw);
  } catch {
    console.warn('Failed to parse ORG_FEATURES env var, defaulting to all enabled');
    cachedFeatures = {};
  }

  return cachedFeatures!;
}

/**
 * Middleware factory: returns 403 if the specified feature is disabled.
 *
 * Usage: router.use('/payouts', requireFeature('payouts'), payoutRoutes)
 */
export function requireFeature(featureName: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const features = getFeatures();

    // If feature key doesn't exist in config, allow (default open)
    if (features[featureName] === undefined) {
      return next();
    }

    // If explicitly set to false, block
    if (features[featureName] === false) {
      res.status(403).json({
        success: false,
        error: 'Feature Disabled',
        message: `The "${featureName}" feature is not enabled for this organization.`,
      });
      return;
    }

    next();
  };
}

/**
 * Reset cached features (useful if features are updated at runtime).
 */
export function resetFeatureCache(): void {
  cachedFeatures = null;
}
