import { Router } from 'express';

export const createAuthRouter = ({ controller, authenticate }) => {
  const router = Router();
  router.post('/signup', controller.signUp);
  router.post('/signin', controller.signIn);
  router.post('/signout', controller.signOut);
  router.get('/me', authenticate, controller.me);
  return router;
};
