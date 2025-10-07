import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import Logger from 'bunyan';
import apiStats from 'swagger-stats';

import 'express-async-errors';

import { config } from '@root/config';
import applicationRoutes from '@root/routes';
import { CustomError, IErrorResponse } from '@shared/globals/helpers/error-handler';
import { rateLimiter } from '@shared/globals/helpers/rate-limiter';

const SERVER_PORT = config.PORT!;
const log: Logger = config.createLogger('Server');

export class Server {
  private app: express.Application;

  constructor(app: express.Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.apiMonitoring(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: express.Application): void {
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

    app.use(
      cors({
        origin: function (origin, callback) {
          if (!origin) return callback(null, true);

          if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        preflightContinue: false,
        maxAge: 86400,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        optionsSuccessStatus: 200
      })
    );

    app.options(
      '*',
      cors({
        origin: function (origin, callback) {
          if (!origin) return callback(null, true);

          if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        secure: config.NODE_ENV !== 'development',
        maxAge: 24 * 60 * 60 * 1000 * 7
      })
    );
  }

  private standardMiddleware(app: express.Application): void {
    app.set('trust proxy', 1);
    app.use(compression());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use(rateLimiter);
  }

  private routesMiddleware(app: express.Application): void {
    applicationRoutes(app);
  }

  private apiMonitoring(app: Application): void {
    app.use(
      apiStats.getMiddleware({
        uriPath: '/api-monitoring',
        authentication: true,
        onAuthenticate: function (_req, username, password) {
          return username === config.API_MONITORING_USERNAME && password === config.API_MONITORING_PASSWORD;
        }
      })
    );
  }

  private globalErrorHandler(app: express.Application): void {
    app.all('*', (req: express.Request, res: express.Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((error: IErrorResponse, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.code).json(error.serializeErrors());
      }
      next();
    });
  }

  private async startServer(app: express.Application): Promise<void> {
    if (!config.JWT_SECRET) {
      throw new Error('JWT_TOKEN must be provided');
    }

    try {
      const httpServer: http.Server = http.createServer(app);
      // const socketIO = await this.createSocketIO(httpServer);

      this.startHttpServer(httpServer);
      // this.socketIOConnections(socketIO);
    } catch (error) {
      log.error(error);
    }
  }

  // private async createSocketIO(httpServer: http.Server): Promise<SocketIOServer> {
  //   const io: SocketIOServer = new SocketIOServer(httpServer, {
  //     cors: {
  //       origin: '*',
  //       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  //     }
  //   });

  //   const pubClient = createClient({ url: config.REDIS_HOST });
  //   const subClient = pubClient.duplicate();

  //   await Promise.all([pubClient.connect(), subClient.connect()]);
  //   io.adapter(createAdapter(pubClient, subClient));

  //   return io;
  // }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Worker with process id of ${process.pid} has started...`);
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server is running on port ${SERVER_PORT}`);
    });
  }

  // private socketIOConnections(_io: SocketIOServer): void {
  //   log.info('socketIOConnections', _io);
  // }
}

export default Server;
