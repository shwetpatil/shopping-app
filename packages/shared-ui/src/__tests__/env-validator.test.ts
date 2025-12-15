import { validateEnv, validateEnvStrict } from '../utils/env-validator';

describe('Environment Validator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should validate required string variables', () => {
      process.env.TEST_VAR = 'test-value';

      const { env, errors } = validateEnv([
        { name: 'TEST_VAR', type: 'string', required: true },
      ]);

      expect(errors).toHaveLength(0);
      expect(env.TEST_VAR).toBe('test-value');
    });

    it('should report missing required variables', () => {
      const { errors } = validateEnv([
        { name: 'MISSING_VAR', type: 'string', required: true },
      ]);

      expect(errors).toHaveLength(1);
      expect(errors[0].name).toBe('MISSING_VAR');
    });

    it('should use default values', () => {
      const { env } = validateEnv([
        { name: 'WITH_DEFAULT', type: 'string', default: 'default-value' },
      ]);

      expect(env.WITH_DEFAULT).toBe('default-value');
    });

    it('should validate number type', () => {
      process.env.PORT = '3000';

      const { env, errors } = validateEnv([
        { name: 'PORT', type: 'number', required: true },
      ]);

      expect(errors).toHaveLength(0);
      expect(env.PORT).toBe(3000);
      expect(typeof env.PORT).toBe('number');
    });

    it('should reject invalid numbers', () => {
      process.env.INVALID_NUM = 'not-a-number';

      const { errors } = validateEnv([
        { name: 'INVALID_NUM', type: 'number', required: true },
      ]);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate boolean type', () => {
      process.env.ENABLED = 'true';
      process.env.DISABLED = 'false';

      const { env } = validateEnv([
        { name: 'ENABLED', type: 'boolean', required: true },
        { name: 'DISABLED', type: 'boolean', required: true },
      ]);

      expect(env.ENABLED).toBe(true);
      expect(env.DISABLED).toBe(false);
    });

    it('should validate URL type', () => {
      process.env.API_URL = 'https://api.example.com';

      const { env, errors } = validateEnv([
        { name: 'API_URL', type: 'url', required: true },
      ]);

      expect(errors).toHaveLength(0);
      expect(env.API_URL).toBe('https://api.example.com');
    });

    it('should reject invalid URLs', () => {
      process.env.INVALID_URL = 'not-a-url';

      const { errors } = validateEnv([
        { name: 'INVALID_URL', type: 'url', required: true },
      ]);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate port type', () => {
      process.env.PORT = '8080';

      const { env, errors } = validateEnv([
        { name: 'PORT', type: 'port', required: true },
      ]);

      expect(errors).toHaveLength(0);
      expect(env.PORT).toBe(8080);
    });

    it('should reject invalid ports', () => {
      process.env.INVALID_PORT = '99999';

      const { errors } = validateEnv([
        { name: 'INVALID_PORT', type: 'port', required: true },
      ]);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should support custom validation', () => {
      process.env.CUSTOM = 'invalid';

      const { errors } = validateEnv([
        {
          name: 'CUSTOM',
          type: 'string',
          required: true,
          validate: (value) => value === 'valid',
        },
      ]);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateEnvStrict', () => {
    it('should throw on validation errors', () => {
      expect(() => {
        validateEnvStrict([
          { name: 'MISSING_REQUIRED', type: 'string', required: true },
        ]);
      }).toThrow();
    });

    it('should return validated env on success', () => {
      process.env.VALID_VAR = 'test';

      const env = validateEnvStrict([
        { name: 'VALID_VAR', type: 'string', required: true },
      ]);

      expect(env.VALID_VAR).toBe('test');
    });
  });
});
