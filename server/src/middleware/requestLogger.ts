import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '../logger';

declare global {
  namespace Express {
    interface Request { requestId: string; }
  }
}

const SKIP = new Set(['/health', '/favicon.ico']);

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (SKIP.has(req.path)) return next();

  req.requestId = randomUUID();
  const start = Date.now();

  res.on('finish', () => {
    const ms     = Date.now() - start;
    const status = res.statusCode;
    const userId = (req as any).user?.sub ?? null;
    const entry  = {
      requestId: req.requestId,
      method:    req.method,
      url:       req.originalUrl,
      status,
      ms,
      userId,
      ip:        req.ip ?? req.socket.remoteAddress,
      ua:        req.headers['user-agent'] ?? null,
    };

    if (status >= 500)      logger.error(entry, 'request error');
    else if (status >= 400) logger.warn(entry,  'request warning');
    else                    logger.info(entry,  'request');
  });

  next();
}
