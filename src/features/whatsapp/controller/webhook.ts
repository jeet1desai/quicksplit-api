import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import Logger from 'bunyan';

import { config } from '@root/config';
import { messageService } from '@shared/services/whatsapp/message.services';

const log: Logger = config.createLogger('Whatsapp webhook');

export class WhatsAppWebhook {
  public async fetch(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === config.META_VERIFY_TOKEN) {
        log.info('✅ Webhook verified successfully');
        const code = HTTP_STATUS.OK;
        res.status(200).send(challenge);
      } else {
        log.error('❌ Webhook verification failed');
        res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      log.error('❌ Webhook verification failed');
      res.status(400).json({ error: 'Bad Request' });
    }
  }

  public async create(req: Request, res: Response) {
    try {
      if (req.body.object) {
        const body = req.body;

        if (body.object === 'whatsapp_business_account') {
          for (const entry of body.entry) {
            for (const change of entry.changes) {
              if (change.field === 'messages') {
                const value = change.value;
                try {
                  if (value.messages) {
                    for (const message of value.messages) {
                      if (message.type !== 'typing') {
                        await messageService.processMessage(message, value.metadata);
                      }
                    }
                  }
                } catch (error) {
                  log.error('Error handling messages:', error);
                }
              }
            }
          }
        }

        return res.status(HTTP_STATUS.OK).json({ code: HTTP_STATUS.OK, status: 'success', data: body, message: 'Webhook verified successfully' });
      } else {
        return res.status(400).json({ error: 'Bad Request' });
      }
    } catch (error) {
      log.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
}
