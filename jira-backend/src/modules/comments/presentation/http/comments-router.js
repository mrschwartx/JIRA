import { Router } from 'express';

export const createCommentsRouter = ({ controller, authenticate }) => {
  const router = Router({ mergeParams: true });
  router.use(authenticate);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.patch('/:commentId', controller.update);
  router.delete('/:commentId', controller.remove);
  return router;
};
