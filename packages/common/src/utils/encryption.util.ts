import crypto from 'crypto';

/**
 * Encryption utilities for sensitive data
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment
 */
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  return key;
};

/**
 * Derive a key from password using PBKDF2
 */
const deriveKey = (password: string, salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
};

/**
 * Encrypt data
 */
export const encrypt = (text: string): string => {
  try {
    const password = getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
    
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data
 */
export const decrypt = (encryptedText: string): string => {
  try {
    const password = getEncryptionKey();
    const buffer = Buffer.from(encryptedText, 'base64');
    
    // Extract salt, iv, tag, and encrypted data
    const salt = buffer.slice(0, SALT_LENGTH);
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt an object (converts to JSON first)
 */
export const encryptObject = <T>(obj: T): string => {
  const json = JSON.stringify(obj);
  return encrypt(json);
};

/**
 * Decrypt an object (parses JSON after decryption)
 */
export const decryptObject = <T>(encryptedText: string): T => {
  const json = decrypt(encryptedText);
  return JSON.parse(json) as T;
};

/**
 * Hash data (one-way, for passwords, etc.)
 */
export const hash = (text: string): string => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Generate a secure random token
 */
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure random string
 */
export const generateSecureString = (length: number = 16): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = crypto.randomBytes(length);
  const result = new Array(length);
  
  for (let i = 0; i < length; i++) {
    result[i] = charset[randomBytes[i] % charset.length];
  }
  
  return result.join('');
};

/**
 * Compare two strings in constant time to prevent timing attacks
 */
export const secureCompare = (a: string, b: string): boolean => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
};

/**
 * Mask sensitive data (e.g., credit card numbers)
 */
export const maskString = (str: string, visibleChars: number = 4, maskChar: string = '*'): string => {
  if (str.length <= visibleChars) {
    return str;
  }
  
  const visible = str.slice(-visibleChars);
  const masked = maskChar.repeat(str.length - visibleChars);
  
  return masked + visible;
};

/**
 * Encrypt specific fields in an object
 */
export const encryptFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const result = { ...obj };
  
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encrypt(String(result[field])) as any;
    }
  }
  
  return result;
};

/**
 * Decrypt specific fields in an object
 */
export const decryptFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const result = { ...obj };
  
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      try {
        result[field] = decrypt(String(result[field])) as any;
      } catch (error) {
        console.error(`Failed to decrypt field: ${String(field)}`);
        // Keep original value if decryption fails
      }
    }
  }
  
  return result;
};

/**
 * Generate a cryptographically secure UUID
 */
export const generateUUID = (): string => {
  return crypto.randomUUID();
};
