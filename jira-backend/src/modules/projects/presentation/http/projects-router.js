import { Router } from 'express';

export const createProjectsRouter = ({ controller, authenticate }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:projectId', controller.get);
  router.patch('/:projectId', controller.update);
  router.delete('/:projectId', controller.remove);
  router.get('/:projectId/members', controller.listMembers);
  router.post('/:projectId/members', controller.addMember);
  router.delete('/:projectId/members/:userId', controller.removeMember);
  return router;
};
