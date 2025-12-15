import cors from 'cors';

/**
 * CORS configuration
 */
interface CorsConfig {
  whitelist?: string[];
  allowAllOrigins?: boolean;
}

/**
 * Default whitelist for allowed origins
 */
const DEFAULT_WHITELIST = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4200',
  'https://yourdomain.com',
  'https://www.yourdomain.com',
];

/**
 * Create CORS middleware with whitelist
 */
export const createCorsMiddleware = (config: CorsConfig = {}) => {
  const whitelist = config.whitelist || process.env.CORS_WHITELIST?.split(',') || DEFAULT_WHITELIST;
  const allowAllOrigins = config.allowAllOrigins || process.env.CORS_ALLOW_ALL === 'true';

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow all origins in development
      if (allowAllOrigins || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Check whitelist
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Request-ID',
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Request-ID',
    ],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200,
  });
};

/**
 * Default CORS middleware
 */
export const corsMiddleware = createCorsMiddleware();

/**
 * Strict CORS for production
 */
export const strictCors = createCorsMiddleware({
  allowAllOrigins: false,
});

/**
 * Permissive CORS for development
 */
export const devCors = createCorsMiddleware({
  allowAllOrigins: true,
});
