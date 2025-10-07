import express, { Router } from 'express';

import { authMiddleware } from '@shared/middleware/auth.middleware';
import { IssueInvite } from '@features/onboard/controller/issue-invite';

class OnboardRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/users/:userId/invite', authMiddleware, IssueInvite.prototype.create);
    return this.router;
  }
}

export const onboardRoutes: OnboardRoutes = new OnboardRoutes();
