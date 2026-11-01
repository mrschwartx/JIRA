import { generateEntityId } from '../../../shared/domain/entity-id.js';
import { Comment } from '../domain/comment.js';
import { CommentRepository } from '../domain/comment-repository.js';

const COLUMNS = 'id, issue_id, author_id, body, created_at, updated_at';

const VIEW_SELECT = `SELECT c.id, c.issue_id, c.body, c.created_at, c.updated_at,
       u.id AS author_id, u.username AS author_username,
       u.avatar_file AS author_avatar
  FROM comments c
  LEFT JOIN users u ON u.id = c.author_id`;

const toEntity = (row) =>
  Comment.restore({
    id: row.id,
    issueId: row.issue_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });

const toView = (row) => ({
  id: row.id,
  issueId: row.issue_id,
  body: row.body,
  author: row.author_id
    ? {
        id: row.author_id,
        username: row.author_username,
        avatar: row.author_avatar,
      }
    : null,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export class PostgresCommentRepository extends CommentRepository {
  #pool;

  constructor({ pool }) {
    super();
    this.#pool = pool;
  }

  nextId() {
    return generateEntityId();
  }

  async add(comment) {
    const snapshot = comment.toSnapshot();
    await this.#pool.query(
      `INSERT INTO comments (${COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        snapshot.id,
        snapshot.issueId,
        snapshot.authorId,
        snapshot.body,
        snapshot.createdAt,
        snapshot.updatedAt,
      ]
    );
  }

  async update(comment) {
    const snapshot = comment.toSnapshot();
    const result = await this.#pool.query(
      'UPDATE comments SET body = $2, updated_at = $3 WHERE id = $1',
      [snapshot.id, snapshot.body, snapshot.updatedAt]
    );
    return result.rowCount === 1;
  }

  async findById({ issueId, commentId }) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNS} FROM comments WHERE id = $1 AND issue_id = $2`,
      [commentId, issueId]
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findViewById(commentId) {
    const { rows } = await this.#pool.query(`${VIEW_SELECT} WHERE c.id = $1`, [
      commentId,
    ]);
    return rows[0] ? toView(rows[0]) : null;
  }

  async listViewsByIssue(issueId) {
    const { rows } = await this.#pool.query(
      `${VIEW_SELECT} WHERE c.issue_id = $1 ORDER BY c.created_at DESC, c.id DESC`,
      [issueId]
    );
    return rows.map(toView);
  }

  async deleteById({ issueId, commentId }) {
    const result = await this.#pool.query(
      'DELETE FROM comments WHERE id = $1 AND issue_id = $2',
      [commentId, issueId]
    );
    return result.rowCount === 1;
  }
}
