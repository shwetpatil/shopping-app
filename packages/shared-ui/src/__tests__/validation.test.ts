import {
  validateEmail,
  validatePassword,
  validateCreditCard,
  validatePhone,
  validateURL,
  validateRequired,
  validateLength,
  validateRange,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true);
      expect(validateEmail('user.name@domain.co.uk').isValid).toBe(true);
      expect(validateEmail('first+last@example.com').isValid).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid').isValid).toBe(false);
      expect(validateEmail('no@domain').isValid).toBe(false);
      expect(validateEmail('@example.com').isValid).toBe(false);
      expect(validateEmail('test@').isValid).toBe(false);
      expect(validateEmail('').isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!').isValid).toBe(true);
      expect(validatePassword('MyP@ssw0rd').isValid).toBe(true);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should check minimum length', () => {
      const result = validatePassword('Short1!', 12);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters');
    });

    it('should require uppercase letters', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letters', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require numbers', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special characters', () => {
      const result = validatePassword('NoSpecial123');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Password must contain at least one special character');
    });
  });

  describe('validateCreditCard', () => {
    it('should validate valid credit card numbers (Luhn algorithm)', () => {
      expect(validateCreditCard('4532015112830366').isValid).toBe(true); // Visa
      expect(validateCreditCard('5425233430109903').isValid).toBe(true); // Mastercard
      expect(validateCreditCard('374245455400126').isValid).toBe(true); // Amex
    });

    it('should reject invalid credit card numbers', () => {
      expect(validateCreditCard('1234567890123456').isValid).toBe(false);
      expect(validateCreditCard('123').isValid).toBe(false);
    });

    it('should handle spaces in card numbers', () => {
      expect(validateCreditCard('4532 0151 1283 0366').isValid).toBe(true);
    });
  });

  describe('validatePhone', () => {
    it('should validate various phone number formats', () => {
      expect(validatePhone('1234567890').isValid).toBe(true);
      expect(validatePhone('123-456-7890').isValid).toBe(true);
      expect(validatePhone('(123) 456-7890').isValid).toBe(true);
      expect(validatePhone('+1 123 456 7890').isValid).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123').isValid).toBe(false);
      expect(validatePhone('abcdefghij').isValid).toBe(false);
      expect(validatePhone('').isValid).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      expect(validateURL('https://example.com').isValid).toBe(true);
      expect(validateURL('http://example.com/path').isValid).toBe(true);
      expect(validateURL('https://sub.domain.com').isValid).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('not a url').isValid).toBe(false);
      expect(validateURL('example.com').isValid).toBe(false);
      expect(validateURL('').isValid).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should validate non-empty values', () => {
      expect(validateRequired('test').isValid).toBe(true);
      expect(validateRequired('0').isValid).toBe(true);
      expect(validateRequired('false').isValid).toBe(true);
    });

    it('should reject empty values', () => {
      expect(validateRequired('').isValid).toBe(false);
      expect(validateRequired('   ').isValid).toBe(false);
    });
  });

  describe('validateLength', () => {
    it('should validate string length', () => {
      expect(validateLength('test', 1, 10).isValid).toBe(true);
      expect(validateLength('hello', 5, 5).isValid).toBe(true);
    });

    it('should reject strings that are too short', () => {
      const result = validateLength('hi', 3, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('at least 3 characters');
    });

    it('should reject strings that are too long', () => {
      const result = validateLength('toolong', 1, 5);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('no more than 5 characters');
    });
  });

  describe('validateRange', () => {
    it('should validate numbers in range', () => {
      expect(validateRange(5, 1, 10).isValid).toBe(true);
      expect(validateRange(0, 0, 100).isValid).toBe(true);
    });

    it('should reject numbers below minimum', () => {
      const result = validateRange(-5, 0, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('at least 0');
    });

    it('should reject numbers above maximum', () => {
      const result = validateRange(15, 0, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('no more than 10');
    });
  });
});
