import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Logger from 'bunyan';

import { config } from '@root/config';
import { BadRequestError, ForbiddenError, ServerError } from './error-handler';

const log: Logger = config.createLogger('whatsapp signature verification');

export const verifyRequestSignature = (req: Request, res: Response, next: NextFunction) => {
  if (req.path !== '/whatsapp/webhook') {
    return next();
  }

  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    log.error("Couldn't validate the signature.");
    throw new BadRequestError('Missing signature');
  }

  const elements = signature.split('=');
  const signatureHash = elements[1];

  if (!config.META_VERIFY_TOKEN) {
    log.error('WHATSAPP_APP_SECRET is not configured');
    throw new ServerError('Server error');
  }

  const expectedHash = crypto.createHmac('sha256', config.META_VERIFY_TOKEN).update(JSON.stringify(req.body)).digest('hex');

  if (signatureHash !== expectedHash) {
    log.error("Couldn't validate the request signature.");
    throw new ForbiddenError('Forbidden');
  }

  next();
};
