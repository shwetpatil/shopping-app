/**
 * Validation Utilities
 * Common validation functions for forms and data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Password validation
 */
export function validatePassword(password: string, minLength: number = 8): ValidationResult {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else {
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Credit card validation (Luhn algorithm)
 */
export function validateCreditCard(cardNumber: string): ValidationResult {
  const errors: string[] = [];
  const cleaned = cardNumber.replace(/\s+/g, '');

  if (!cleaned || cleaned.length === 0) {
    errors.push('Card number is required');
  } else if (!/^\d+$/.test(cleaned)) {
    errors.push('Card number must contain only digits');
  } else if (cleaned.length < 13 || cleaned.length > 19) {
    errors.push('Card number must be between 13 and 19 digits');
  } else {
    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    if (sum % 10 !== 0) {
      errors.push('Invalid card number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Phone number validation
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  const cleaned = phone.replace(/\D/g, '');

  if (!phone || phone.trim().length === 0) {
    errors.push('Phone number is required');
  } else if (cleaned.length < 10 || cleaned.length > 15) {
    errors.push('Phone number must be between 10 and 15 digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * URL validation
 */
export function validateURL(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || url.trim().length === 0) {
    errors.push('URL is required');
  } else {
    try {
      new URL(url);
    } catch {
      errors.push('Invalid URL format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Required field validation
 */
export function validateRequired(value: any, fieldName: string = 'Field'): ValidationResult {
  const errors: string[] = [];

  if (value == null || (typeof value === 'string' && value.trim().length === 0)) {
    errors.push(`${fieldName} is required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Min/Max length validation
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Field'
): ValidationResult {
  const errors: string[] = [];

  if (value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters`);
  }
  if (value.length > max) {
    errors.push(`${fieldName} must be no more than ${max} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Numeric range validation
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): ValidationResult {
  const errors: string[] = [];

  if (value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }
  if (value > max) {
    errors.push(`${fieldName} must be no more than ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
