import { Comment } from '../../domain/comment.js';
import { CommentBody } from '../../domain/comment-body.js';
import { toCommentDto } from '../comment-dto.js';

export class CreateComment {
  #commentRepository;
  #projectAccess;
  #issueGateway;

  constructor({ commentRepository, projectAccess, issueGateway }) {
    this.#commentRepository = commentRepository;
    this.#projectAccess = projectAccess;
    this.#issueGateway = issueGateway;
  }

  async execute({ requesterId, projectId, issueId, input }) {
    const { projectId: id } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const issue = await this.#issueGateway.assertExists({
      projectId: id,
      issueId,
    });

    const comment = Comment.create({
      id: this.#commentRepository.nextId(),
      issueId: issue,
      authorId: requesterId,
      body: CommentBody.create((input ?? {}).body),
    });
    await this.#commentRepository.add(comment);
    return toCommentDto(await this.#commentRepository.findViewById(comment.id));
  }
}
