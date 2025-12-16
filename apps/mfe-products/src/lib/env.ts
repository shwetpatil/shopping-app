import { z } from 'zod';

/**
 * Environment Variable Validation Schema
 * Validates all environment variables on app startup
 */
const envSchema = z.object({
  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
  
  // Feature Flags
  NEXT_PUBLIC_USE_MOCK_DATA: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  
  NEXT_PUBLIC_ENABLE_REVIEWS: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  
  NEXT_PUBLIC_ENABLE_WISHLIST: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional: Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed config
 * Throws error if validation fails
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
      NEXT_PUBLIC_ENABLE_REVIEWS: process.env.NEXT_PUBLIC_ENABLE_REVIEWS,
      NEXT_PUBLIC_ENABLE_WISHLIST: process.env.NEXT_PUBLIC_ENABLE_WISHLIST,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => {
        return `  - ${issue.path.join('.')}: ${issue.message}`;
      });
      
      throw new Error(
        `❌ Invalid environment variables:\n${issues.join('\n')}\n\nPlease check your .env file.`
      );
    }
    throw error;
  }
}

/**
 * Validated and typed environment configuration
 * Safe to use throughout the application
 */
export const env = validateEnv();
