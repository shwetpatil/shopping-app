import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import xss from 'xss';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return xss(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Helmet middleware for security headers
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },
  // X-Content-Type-Options
  noSniff: true,
  // X-XSS-Protection
  xssFilter: true,
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  // Hide X-Powered-By
  hidePoweredBy: true,
  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },
  // IE No Open
  ieNoOpen: true,
});

/**
 * Sanitize data to prevent NoSQL injection
 */
export const noSqlSanitize = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized field ${key} in request from ${req.ip}`);
  },
});

/**
 * Additional XSS protection headers
 */
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (req: Request, res: Response, next: NextFunction) => {
  // Convert array query parameters to single value (use last value)
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        const arr = req.query[key] as string[];
        req.query[key] = arr[arr.length - 1];
      }
    }
  }
  next();
};

/**
 * Sanitize file uploads
 * Note: Requires multer types to be installed in the consuming service
 */
export const sanitizeFileUpload = (req: Request, res: Response, next: NextFunction) => {
  // Type assertion for multer file properties
  const reqWithFile = req as any;
  
  if (reqWithFile.file) {
    // Remove special characters from filename
    reqWithFile.file.originalname = reqWithFile.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
    const fileExtension = reqWithFile.file.originalname.toLowerCase().slice(reqWithFile.file.originalname.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
  }

  if (reqWithFile.files && Array.isArray(reqWithFile.files)) {
    reqWithFile.files.forEach((file: any) => {
      file.originalname = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    });
  }

  next();
};

/**
 * Combined sanitization middleware
 */
export const sanitize = [
  noSqlSanitize,
  sanitizeInput,
  xssProtection,
  preventParameterPollution,
];
