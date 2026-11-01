import { CreateComment } from './application/use-cases/create-comment.js';
import { DeleteComment } from './application/use-cases/delete-comment.js';
import { ListComments } from './application/use-cases/list-comments.js';
import { UpdateComment } from './application/use-cases/update-comment.js';
import { PostgresCommentRepository } from './infrastructure/postgres-comment-repository.js';
import { createCommentsController } from './presentation/http/comments-controller.js';
import { createCommentsRouter } from './presentation/http/comments-router.js';

export const createCommentsModule = ({
  pool,
  authenticate,
  projectAccess,
  issueGateway,
}) => {
  const commentRepository = new PostgresCommentRepository({ pool });
  const dependencies = { commentRepository, projectAccess, issueGateway };

  const useCases = {
    listComments: new ListComments(dependencies),
    createComment: new CreateComment(dependencies),
    updateComment: new UpdateComment(dependencies),
    deleteComment: new DeleteComment(dependencies),
  };

  const router = createCommentsRouter({
    controller: createCommentsController(useCases),
    authenticate,
  });

  return { router, useCases };
};
