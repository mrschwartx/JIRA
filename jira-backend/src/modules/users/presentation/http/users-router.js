import { Router } from 'express';
import { ensureOwnAccount } from './ensure-own-account.js';

export const createUsersRouter = ({
  controller,
  authenticate,
  uploadAvatar,
}) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', controller.getUsers);
  router.get('/:id', controller.getUser);
  router.patch('/:id', controller.updateUser);
  router.put(
    '/:id/avatar',
    ensureOwnAccount('You can only upload an avatar for your own account'),
    uploadAvatar,
    controller.uploadAvatar
  );
  router.delete('/:id', controller.deleteUser);
  return router;
};
