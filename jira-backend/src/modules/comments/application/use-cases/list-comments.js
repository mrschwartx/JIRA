import { toCommentDto } from '../comment-dto.js';

export class ListComments {
  #commentRepository;
  #projectAccess;
  #issueGateway;

  constructor({ commentRepository, projectAccess, issueGateway }) {
    this.#commentRepository = commentRepository;
    this.#projectAccess = projectAccess;
    this.#issueGateway = issueGateway;
  }

  async execute({ requesterId, projectId, issueId }) {
    const { projectId: id } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const issue = await this.#issueGateway.assertExists({
      projectId: id,
      issueId,
    });
    const views = await this.#commentRepository.listViewsByIssue(issue);
    return views.map(toCommentDto);
  }
}
