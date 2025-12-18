import { Request, Response, NextFunction } from 'express';

export interface CacheControlOptions {
  maxAge?: number; // seconds
  sMaxAge?: number; // seconds for shared caches (CDN)
  public?: boolean;
  private?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  immutable?: boolean;
}

/**
 * Middleware to set Cache-Control headers on responses
 */
export const cacheControl = (options: CacheControlOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const directives: string[] = [];

    if (options.noStore) {
      directives.push('no-store');
    } else if (options.noCache) {
      directives.push('no-cache');
    } else {
      if (options.public) {
        directives.push('public');
      } else if (options.private) {
        directives.push('private');
      }

      if (options.maxAge !== undefined) {
        directives.push(`max-age=${options.maxAge}`);
      }

      if (options.sMaxAge !== undefined) {
        directives.push(`s-maxage=${options.sMaxAge}`);
      }

      if (options.mustRevalidate) {
        directives.push('must-revalidate');
      }

      if (options.immutable) {
        directives.push('immutable');
      }
    }

    if (directives.length > 0) {
      res.setHeader('Cache-Control', directives.join(', '));
    }

    next();
  };
};

/**
 * Preset cache control configurations
 */
export const CachePresets = {
  // No caching - always fetch fresh
  noCache: (): ReturnType<typeof cacheControl> =>
    cacheControl({ noStore: true }),

  // Cache for a short time (5 minutes browser, 5 min CDN)
  shortTerm: (): ReturnType<typeof cacheControl> =>
    cacheControl({ public: true, maxAge: 300, sMaxAge: 300 }),

  // Cache for medium time (10 min browser, 1 hour CDN)
  mediumTerm: (): ReturnType<typeof cacheControl> =>
    cacheControl({ public: true, maxAge: 600, sMaxAge: 3600 }),

  // Cache for long time (1 hour browser, 24 hours CDN)
  longTerm: (): ReturnType<typeof cacheControl> =>
    cacheControl({ public: true, maxAge: 3600, sMaxAge: 86400 }),

  // Static assets - cache forever
  immutable: (): ReturnType<typeof cacheControl> =>
    cacheControl({ public: true, maxAge: 31536000, immutable: true }),

  // Private data - browser only, no CDN
  private: (maxAge: number = 300): ReturnType<typeof cacheControl> =>
    cacheControl({ private: true, maxAge }),

  // Revalidate - cache but check with server
  revalidate: (maxAge: number = 300): ReturnType<typeof cacheControl> =>
    cacheControl({ public: true, maxAge, mustRevalidate: true }),

  // CDN optimized - short browser cache, longer CDN cache
  cdnOptimized: (browserTTL: number = 60, cdnTTL: number = 300): ReturnType<typeof cacheControl> =>
    cacheControl({ public: true, maxAge: browserTTL, sMaxAge: cdnTTL }),
};
