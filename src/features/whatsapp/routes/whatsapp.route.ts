import { Router } from 'express';

import { verifyRequestSignature } from '@shared/globals/helpers/verify-signature';
import { WhatsAppWebhook } from '../controller/webhook';

class WhatsAppRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  public routes(): Router {
    this.router.get('/webhook', WhatsAppWebhook.prototype.fetch);

    this.router.post('/webhook', verifyRequestSignature, WhatsAppWebhook.prototype.create);

    return this.router;
  }
}

export const whatsAppRoutes: WhatsAppRoutes = new WhatsAppRoutes();
