import express, { Router } from 'express';

import { SignUp } from '@features/users/controller/signup';
import { Login } from '@features/users/controller/login';
import { Logout } from '@features/users/controller/logout';
import { RefreshToken } from '@features/users/controller/refresh-token';
import { MyDetail } from '@features/users/controller/my-detail';
import { authMiddleware } from '@shared/middleware/auth.middleware';

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/signup', SignUp.prototype.create);
    this.router.post('/signin', Login.prototype.read);
    this.router.get('/refresh-token', RefreshToken.prototype.update);
    this.router.delete('/signout', authMiddleware, Logout.prototype.delete);
    this.router.get('/my-detail', authMiddleware, MyDetail.prototype.read);
    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
