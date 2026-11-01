import { parseEntityId } from '../../../../shared/domain/entity-id.js';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';

const OWNER_ROLE = 'owner';

export class DeleteComment {
  #commentRepository;
  #projectAccess;
  #issueGateway;

  constructor({ commentRepository, projectAccess, issueGateway }) {
    this.#commentRepository = commentRepository;
    this.#projectAccess = projectAccess;
    this.#issueGateway = issueGateway;
  }

  async execute({ requesterId, projectId, issueId, commentId }) {
    const { projectId: id, role } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const issue = await this.#issueGateway.assertExists({
      projectId: id,
      issueId,
    });

    const comment = await this.#commentRepository.findById({
      issueId: issue,
      commentId: parseEntityId(commentId, 'comment'),
    });
    if (!comment) {
      throw new NotFoundError('Comment not found!');
    }
    if (!comment.isAuthoredBy(requesterId) && role !== OWNER_ROLE) {
      throw new ForbiddenError(
        'Only the author or the project owner can delete this comment'
      );
    }

    const deleted = await this.#commentRepository.deleteById({
      issueId: issue,
      commentId: comment.id,
    });
    if (!deleted) {
      throw new NotFoundError('Comment not found!');
    }
  }
}
