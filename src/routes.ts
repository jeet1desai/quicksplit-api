import express from 'express';

import { healthRoutes } from '@features/health/routes/health.route';
import { authRoutes } from '@features/users/route/auth.route';
import { onboardRoutes } from '@features/onboard/route/onboard.route';
import { whatsAppRoutes } from '@features/whatsapp/routes/whatsapp.route';

const BASE_PATH = '/api/v1';

export default (app: express.Application): void => {
  const routes = () => {
    app.use('/', healthRoutes.check());
    app.use('/', healthRoutes.health());
    app.use('/', healthRoutes.env());

    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, onboardRoutes.routes());

    app.use('/whatsapp', whatsAppRoutes.routes());
  };
  routes();
};
