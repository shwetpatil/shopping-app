/**
 * Structured Logging Utility
 * Provides consistent logging across all MFEs with levels and metadata
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMetadata {
  [key: string]: any;
  mfeName?: string;
  userId?: string;
  timestamp?: string;
  traceId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  mfeName: string;
  enableConsole?: boolean;
  enableRemote?: boolean;
  remoteEndpoint?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;
  private buffer: Array<{ level: LogLevel; message: string; metadata?: LogMetadata }> = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: LoggerConfig) {
    this.config = {
      enableConsole: true,
      enableRemote: false,
      ...config,
    };
    
    // Start buffer flush interval if remote logging is enabled
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }



  /**
   * Send log to console
   */
  private logToConsole(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.config.enableConsole) return;

    const prefix = `[${this.config.mfeName}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, metadata || '');
        break;
      case 'info':
        console.info(prefix, message, metadata || '');
        break;
      case 'warn':
        console.warn(prefix, message, metadata || '');
        break;
      case 'error':
        console.error(prefix, message, metadata || '');
        break;
    }
  }

  /**
   * Add log to buffer for remote sending
   */
  private addToBuffer(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.config.enableRemote) return;

    this.buffer.push({ level, message, metadata });

    // Flush immediately for errors
    if (level === 'error') {
      this.flush();
    }
  }

  /**
   * Flush logs to remote endpoint
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.remoteEndpoint) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      // Failed to send logs - add them back to buffer
      this.buffer.unshift(...logs);
      console.error('Failed to send logs to remote endpoint:', error);
    }
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(level)) return;

    this.logToConsole(level, message, metadata);
    this.addToBuffer(level, message, metadata);
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    const errorMeta: LogMetadata = {
      ...metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    };
    this.log('error', message, errorMeta);
  }

  /**
   * Create child logger with additional context
   */
  child(additionalMetadata: LogMetadata): Logger {
    const childLogger = new Logger(this.config);
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, metadata?: LogMetadata) => {
      originalLog(level, message, { ...additionalMetadata, ...metadata });
    };
    
    return childLogger;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}

/**
 * Create a logger instance
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}

/**
 * Default logger instance (can be overridden)
 */
let defaultLogger: Logger | null = null;

/**
 * Set default logger
 */
export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger;
}

/**
 * Get default logger
 */
export function getDefaultLogger(): Logger {
  if (!defaultLogger) {
    throw new Error('Default logger not initialized. Call setDefaultLogger() first.');
  }
  return defaultLogger;
}

// Export logger class for advanced use cases
export { Logger };
