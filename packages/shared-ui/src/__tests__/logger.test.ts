import { createLogger, setDefaultLogger, getDefaultLogger } from '../utils/logger';

describe('Logger', () => {
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('createLogger', () => {
    it('should create logger with config', () => {
      const logger = createLogger({ level: 'info', mfeName: 'test-logger' });
      logger.info('test message');

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should log at different levels', () => {
      const logger = createLogger({ level: 'debug', mfeName: 'test' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include metadata', () => {
      const logger = createLogger({ level: 'info', mfeName: 'test' });
      logger.info('message', { userId: '123', action: 'test' });

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should respect minimum log level', () => {
      const logger = createLogger({ level: 'warn', mfeName: 'test' });

      logger.debug('should not log');
      logger.info('should not log');
      logger.warn('should log');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should enable remote logging', () => {
      const logger = createLogger({
        level: 'info',
        mfeName: 'test',
        enableRemote: true,
        remoteEndpoint: 'https://logs.example.com',
      });

      expect(logger).toBeDefined();
    });
  });

  describe('default logger', () => {
    it('should set and get default logger', () => {
      const logger = createLogger({ level: 'info', mfeName: 'default-test' });
      setDefaultLogger(logger);

      const retrieved = getDefaultLogger();
      expect(retrieved).toBe(logger);
    });

    it('should create default logger if none exists', () => {
      const logger = getDefaultLogger();
      expect(logger).toBeDefined();
      logger.info('test');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });
});
