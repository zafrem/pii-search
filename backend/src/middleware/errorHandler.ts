import { Request, Response, NextFunction } from 'express';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log' }),
    new transports.Console()
  ],
});

export interface APIError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: APIError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  const errorResponse = {
    error: {
      message: error.message || 'Internal Server Error',
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  };

  logger.error('API Error:', {
    ...errorResponse.error,
    body: req.body,
    query: req.query,
    params: req.params,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  if (!isOperational) {
    logger.error('Non-operational error occurred. Server might need to restart.');
  }

  res.status(statusCode).json(errorResponse);
};

export const createAPIError = (message: string, statusCode: number = 500, isOperational: boolean = true): APIError => {
  const error: APIError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = isOperational;
  return error;
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};