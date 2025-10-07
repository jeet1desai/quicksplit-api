import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import Logger from 'bunyan';

import { config } from '@root/config';
import { BadRequestError, ForbiddenError, ServerError } from '@shared/globals/helpers/error-handler';

const log: Logger = config.createLogger('whatsapp webhook');

export class WhatsAppWebhook {
  public async get(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === config.META_VERIFY_TOKEN) {
        log.info('✅ Webhook verified successfully');
        const code = HTTP_STATUS.OK;
        return res.status(code).json({ code: code, status: 'success', data: challenge, message: 'Webhook verified successfully' });
      } else {
        log.error('❌ Webhook verification failed');
        throw new ForbiddenError('Webhook verification failed');
      }
    } else {
      log.error('❌ Webhook verification failed');
      throw new BadRequestError('Bad Request');
    }
  }

  public async post(req: Request, res: Response) {
    try {
      if (req.body.object) {
        const body = req.body;

        log.info('✅ Webhook verified successfully', body);

        // if (
        //   body.entry &&
        //   body.entry[0].changes &&
        //   body.entry[0].changes[0] &&
        //   body.entry[0].changes[0].value.messages &&
        //   body.entry[0].changes[0].value.messages[0]
        // ) {
        //   const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
        //   const from = body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
        //   const msgBody = body.entry[0].changes[0].value.messages[0].text.body; // extract the message text

        //   console.log('Received WhatsApp message from', from, ':', msgBody);
        // }

        res
          .status(HTTP_STATUS.OK)
          .json({ code: HTTP_STATUS.OK, status: 'success', data: 'EVENT_RECEIVED', message: 'Webhook verified successfully' });
      } else {
        throw new BadRequestError('Bad Request');
      }
    } catch (error) {
      log.error('Error processing webhook:', error);
      throw new ServerError('Server error');
    }
  }
}
