import rateLimit from 'express-rate-limit';
import { TooManyRequest } from '@shared/globals/helpers/error-handler';
import { config } from '@root/config';

const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQ,
  message: { error: 'Too Many Requests', message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw new TooManyRequest('Too many requests, please try again later.');
  }
});

export { rateLimiter };
