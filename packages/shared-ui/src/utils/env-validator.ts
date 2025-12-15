/**
 * Environment Variable Validation
 * Validates environment variables at startup to catch configuration errors early
 */

export type EnvVarType = 'string' | 'number' | 'boolean' | 'url' | 'port';

export interface EnvVarSchema {
  name: string;
  type: EnvVarType;
  required?: boolean;
  default?: any;
  validate?: (value: any) => boolean;
  description?: string;
}

export interface ValidationError {
  name: string;
  error: string;
}

export interface ValidatedEnv {
  [key: string]: any;
}

/**
 * Parse value based on type
 */
function parseValue(value: string | undefined, type: EnvVarType, defaultValue?: any): any {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  switch (type) {
    case 'string':
      return value;
    
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Invalid number: ${value}`);
      }
      return num;
    
    case 'boolean':
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      throw new Error(`Invalid boolean: ${value}`);
    
    case 'url':
      try {
        new URL(value);
        return value;
      } catch {
        throw new Error(`Invalid URL: ${value}`);
      }
    
    case 'port':
      const port = Number(value);
      if (isNaN(port) || port < 0 || port > 65535) {
        throw new Error(`Invalid port: ${value}`);
      }
      return port;
    
    default:
      return value;
  }
}

/**
 * Validate environment variables against schema
 */
export function validateEnv(schema: EnvVarSchema[]): {
  env: ValidatedEnv;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const env: ValidatedEnv = {};

  for (const rule of schema) {
    try {
      const rawValue = process.env[rule.name];
      
      // Check if required
      if (rule.required && !rawValue && rule.default === undefined) {
        errors.push({
          name: rule.name,
          error: `Required environment variable is missing`,
        });
        continue;
      }

      // Parse value
      const value = parseValue(rawValue, rule.type, rule.default);

      // Custom validation
      if (rule.validate && value !== undefined) {
        if (!rule.validate(value)) {
          errors.push({
            name: rule.name,
            error: `Custom validation failed`,
          });
          continue;
        }
      }

      env[rule.name] = value;
    } catch (error) {
      errors.push({
        name: rule.name,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    }
  }

  return { env, errors };
}

/**
 * Validate environment variables and throw on error
 */
export function validateEnvStrict(schema: EnvVarSchema[]): ValidatedEnv {
  const { env, errors } = validateEnv(schema);

  if (errors.length > 0) {
    const errorMessage = errors
      .map(e => `  - ${e.name}: ${e.error}`)
      .join('\n');
    
    throw new Error(`Environment validation failed:\n${errorMessage}`);
  }

  return env;
}

/**
 * Common MFE environment schema
 */
export const commonMFESchema: EnvVarSchema[] = [
  {
    name: 'NEXT_PUBLIC_API_URL',
    type: 'url',
    required: true,
    description: 'API Gateway URL',
  },
  {
    name: 'NEXT_PUBLIC_MFE_NAME',
    type: 'string',
    required: true,
    description: 'Microfrontend name',
  },
  {
    name: 'PORT',
    type: 'port',
    required: false,
    default: 3000,
    description: 'Server port',
  },
  {
    name: 'NODE_ENV',
    type: 'string',
    required: false,
    default: 'development',
    validate: (value) => ['development', 'production', 'test'].includes(value),
    description: 'Node environment',
  },
  {
    name: 'NEXT_PUBLIC_ENABLE_ANALYTICS',
    type: 'boolean',
    required: false,
    default: false,
    description: 'Enable analytics tracking',
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    type: 'string',
    required: false,
    description: 'Sentry DSN for error tracking',
  },
  {
    name: 'NEXT_PUBLIC_LOG_LEVEL',
    type: 'string',
    required: false,
    default: 'info',
    validate: (value) => ['debug', 'info', 'warn', 'error'].includes(value),
    description: 'Logging level',
  },
];

/**
 * Create environment schema for specific MFE
 */
export function createMFESchema(_mfeName: string, additionalSchema: EnvVarSchema[] = []): EnvVarSchema[] {
  return [
    ...commonMFESchema,
    ...additionalSchema,
  ];
}

/**
 * Pretty print validation errors
 */
export function printValidationErrors(errors: ValidationError[]): void {
  console.error('\n❌ Environment Validation Failed:\n');
  errors.forEach(error => {
    console.error(`  ${error.name}: ${error.error}`);
  });
  console.error('\nPlease check your .env file or environment variables.\n');
}

/**
 * Validate and initialize environment
 */
export function initEnv(schema: EnvVarSchema[]): ValidatedEnv {
  const { env, errors } = validateEnv(schema);

  if (errors.length > 0) {
    printValidationErrors(errors);
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
  return env;
}
