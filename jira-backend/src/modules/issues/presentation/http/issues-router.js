import { Router } from 'express';

export const createIssuesRouter = ({ controller, authenticate }) => {
  const router = Router({ mergeParams: true });
  router.use(authenticate);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:issueId', controller.get);
  router.patch('/:issueId', controller.update);
  router.delete('/:issueId', controller.remove);
  return router;
};
