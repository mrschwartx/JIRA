import { parseEntityId } from '../../../../shared/domain/entity-id.js';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import { CommentBody } from '../../domain/comment-body.js';
import { toCommentDto } from '../comment-dto.js';

export class UpdateComment {
  #commentRepository;
  #projectAccess;
  #issueGateway;

  constructor({ commentRepository, projectAccess, issueGateway }) {
    this.#commentRepository = commentRepository;
    this.#projectAccess = projectAccess;
    this.#issueGateway = issueGateway;
  }

  async execute({ requesterId, projectId, issueId, commentId, input }) {
    const { projectId: id } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const issue = await this.#issueGateway.assertExists({
      projectId: id,
      issueId,
    });
    const body = CommentBody.create((input ?? {}).body);

    const comment = await this.#commentRepository.findById({
      issueId: issue,
      commentId: parseEntityId(commentId, 'comment'),
    });
    if (!comment) {
      throw new NotFoundError('Comment not found!');
    }
    if (!comment.isAuthoredBy(requesterId)) {
      throw new ForbiddenError('You can only edit your own comments');
    }

    comment.edit(body);
    const updated = await this.#commentRepository.update(comment);
    if (!updated) {
      throw new NotFoundError('Comment not found!');
    }
    return toCommentDto(await this.#commentRepository.findViewById(comment.id));
  }
}
