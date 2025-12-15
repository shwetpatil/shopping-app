import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../errors';
import logger from '../logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);
    return res.status(err.statusCode).json({
      errors: err.serializeErrors(),
    });
  }

  logger.error(`500 - ${err.message} - ${req.originalUrl} - ${req.method}`, { stack: err.stack });

  res.status(500).json({
    errors: [{ message: 'Something went wrong' }],
  });
};

export default errorHandler;
