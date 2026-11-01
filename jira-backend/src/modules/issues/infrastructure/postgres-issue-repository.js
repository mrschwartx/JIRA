import { generateEntityId } from '../../../shared/domain/entity-id.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { Issue } from '../domain/issue.js';
import { IssueRepository } from '../domain/issue-repository.js';

const COLUMNS = `i.id, i.project_id, i.number, i.title, i.type, i.status, i.priority,
  i.list_position, i.description, i.estimate, i.time_spent, i.time_remaining,
  i.reporter_id, i.created_at, i.updated_at,
  COALESCE(
    (SELECT array_agg(a.user_id ORDER BY a.user_id)
       FROM issue_assignees a WHERE a.issue_id = i.id),
    '{}'
  ) AS assignee_ids`;

const escapeLikePattern = (value) => value.replace(/[\\%_]/g, '\\$&');

const toEntity = (row) =>
  Issue.restore({
    id: row.id,
    projectId: row.project_id,
    number: row.number,
    title: row.title,
    type: row.type,
    status: row.status,
    priority: row.priority,
    listPosition: row.list_position,
    description: row.description,
    estimate: row.estimate,
    timeSpent: row.time_spent,
    timeRemaining: row.time_remaining,
    reporterId: row.reporter_id,
    assigneeIds: row.assignee_ids,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });

const replaceAssignees = async (client, issueId, userIds) => {
  await client.query('DELETE FROM issue_assignees WHERE issue_id = $1', [
    issueId,
  ]);
  if (userIds.length > 0) {
    await client.query(
      `INSERT INTO issue_assignees (issue_id, user_id)
       SELECT $1, unnest($2::uuid[])`,
      [issueId, userIds]
    );
  }
};

export class PostgresIssueRepository extends IssueRepository {
  #pool;

  constructor({ pool }) {
    super();
    this.#pool = pool;
  }

  nextId() {
    return generateEntityId();
  }

  async #inTransaction(callback) {
    const client = await this.#pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async add(issue) {
    const snapshot = issue.toSnapshot();
    return this.#inTransaction(async (client) => {
      const { rows } = await client.query(
        `WITH next AS (
           UPDATE projects
              SET issue_counter = issue_counter + 1
            WHERE id = $2
        RETURNING issue_counter
         )
         INSERT INTO issues (
           id, project_id, number, title, type, status, priority, list_position,
           description, estimate, time_spent, time_remaining, reporter_id,
           created_at, updated_at
         )
         SELECT $1, $2, next.issue_counter, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14
           FROM next
      RETURNING number`,
        [
          snapshot.id,
          snapshot.projectId,
          snapshot.title,
          snapshot.type,
          snapshot.status,
          snapshot.priority,
          snapshot.listPosition,
          snapshot.description,
          snapshot.estimate,
          snapshot.timeSpent,
          snapshot.timeRemaining,
          snapshot.reporterId,
          snapshot.createdAt,
          snapshot.updatedAt,
        ]
      );
      if (rows.length === 0) {
        throw new NotFoundError('Project not found!');
      }
      await replaceAssignees(client, snapshot.id, snapshot.assigneeIds);
      issue.assignNumber(rows[0].number);
    });
  }

  async update(issue) {
    const snapshot = issue.toSnapshot();
    return this.#inTransaction(async (client) => {
      const result = await client.query(
        `UPDATE issues
            SET title = $2,
                type = $3,
                status = $4,
                priority = $5,
                list_position = $6,
                description = $7,
                estimate = $8,
                time_spent = $9,
                time_remaining = $10,
                reporter_id = $11,
                updated_at = $12
          WHERE id = $1`,
        [
          snapshot.id,
          snapshot.title,
          snapshot.type,
          snapshot.status,
          snapshot.priority,
          snapshot.listPosition,
          snapshot.description,
          snapshot.estimate,
          snapshot.timeSpent,
          snapshot.timeRemaining,
          snapshot.reporterId,
          snapshot.updatedAt,
        ]
      );
      if (result.rowCount !== 1) {
        return false;
      }
      await replaceAssignees(client, snapshot.id, snapshot.assigneeIds);
      return true;
    });
  }

  async findById({ projectId, issueId }) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNS} FROM issues i WHERE i.id = $1 AND i.project_id = $2`,
      [issueId, projectId]
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async list({ projectId, search, status, type, assigneeId, limit }) {
    const values = [projectId];
    const conditions = ['i.project_id = $1'];
    if (search) {
      values.push(`%${escapeLikePattern(search)}%`);
      conditions.push(
        `(i.title ILIKE $${values.length} OR i.description ILIKE $${values.length})`
      );
    }
    if (status) {
      values.push(status);
      conditions.push(`i.status = $${values.length}`);
    }
    if (type) {
      values.push(type);
      conditions.push(`i.type = $${values.length}`);
    }
    if (assigneeId) {
      values.push(assigneeId);
      conditions.push(
        `EXISTS (SELECT 1 FROM issue_assignees a
                  WHERE a.issue_id = i.id AND a.user_id = $${values.length})`
      );
    }
    values.push(limit);

    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNS} FROM issues i
        WHERE ${conditions.join(' AND ')}
        ORDER BY i.list_position ASC, i.created_at ASC, i.id ASC
        LIMIT $${values.length}`,
      values
    );
    return rows.map(toEntity);
  }

  async minListPosition({ projectId, status }) {
    const { rows } = await this.#pool.query(
      `SELECT MIN(list_position) AS position FROM issues
        WHERE project_id = $1 AND status = $2`,
      [projectId, status]
    );
    return rows[0].position;
  }

  async deleteById({ projectId, issueId }) {
    const result = await this.#pool.query(
      'DELETE FROM issues WHERE id = $1 AND project_id = $2',
      [issueId, projectId]
    );
    return result.rowCount === 1;
  }

  async exists({ projectId, issueId }) {
    const { rowCount } = await this.#pool.query(
      'SELECT 1 FROM issues WHERE id = $1 AND project_id = $2',
      [issueId, projectId]
    );
    return rowCount > 0;
  }
}
