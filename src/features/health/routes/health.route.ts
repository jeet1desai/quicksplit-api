import { config } from '@root/config';
import express, { Router } from 'express';
import HTTP_STATUS from 'http-status-codes';

class HealthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public check(): Router {
    this.router.get('/', (req: express.Request, res: express.Response) => {
      res.status(HTTP_STATUS.OK).send('Check Route is working');
    });

    return this.router;
  }

  public health(): Router {
    this.router.get('/health', (req: express.Request, res: express.Response) => {
      res.status(HTTP_STATUS.OK).send('Health Route');
    });

    return this.router;
  }

  public env(): Router {
    this.router.get('/env', (req: express.Request, res: express.Response) => {
      res.status(HTTP_STATUS.OK).send(`${config.NODE_ENV}`);
    });

    return this.router;
  }
}

export const healthRoutes: HealthRoutes = new HealthRoutes();
