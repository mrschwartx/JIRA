import { generateEntityId } from '../../../shared/domain/entity-id.js';
import {
  AlreadyExistsError,
  NotFoundError,
} from '../../../shared/domain/errors.js';
import { isUniqueViolationError } from '../../../shared/infrastructure/postgres/is-unique-violation-error.js';
import { MEMBER_ROLES } from '../domain/member-role.js';
import { Project } from '../domain/project.js';
import { ProjectRepository } from '../domain/project-repository.js';

const FOREIGN_KEY_VIOLATION_CODE = '23503';
const DUPLICATE_KEY_MESSAGE = 'Project key is already in use.';

const COLUMNS =
  'id, owner_id, key, name, url, description, category, created_at, updated_at';
const PREFIXED_COLUMNS = COLUMNS.split(', ')
  .map((column) => `p.${column}`)
  .join(', ');

const toEntity = (row) =>
  Project.restore({
    id: row.id,
    ownerId: row.owner_id,
    key: row.key,
    name: row.name,
    url: row.url,
    description: row.description,
    category: row.category,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });

export class PostgresProjectRepository extends ProjectRepository {
  #pool;

  constructor({ pool }) {
    super();
    this.#pool = pool;
  }

  nextId() {
    return generateEntityId();
  }

  async add(project) {
    const snapshot = project.toSnapshot();
    const client = await this.#pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO projects (${COLUMNS})
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          snapshot.id,
          snapshot.ownerId,
          snapshot.key,
          snapshot.name,
          snapshot.url,
          snapshot.description,
          snapshot.category,
          snapshot.createdAt,
          snapshot.updatedAt,
        ]
      );
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [snapshot.id, snapshot.ownerId, MEMBER_ROLES.OWNER]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolationError(error)) {
        throw new AlreadyExistsError(DUPLICATE_KEY_MESSAGE);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async update(project) {
    const snapshot = project.toSnapshot();
    const result = await this.#pool.query(
      `UPDATE projects
          SET name = $2,
              url = $3,
              description = $4,
              category = $5,
              updated_at = $6
        WHERE id = $1`,
      [
        snapshot.id,
        snapshot.name,
        snapshot.url,
        snapshot.description,
        snapshot.category,
        snapshot.updatedAt,
      ]
    );
    return result.rowCount === 1;
  }

  async findById(id) {
    const { rows } = await this.#pool.query(
      `SELECT ${COLUMNS} FROM projects WHERE id = $1`,
      [id]
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findMembership({ projectId, userId }) {
    const { rows } = await this.#pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    return rows[0] ? { role: rows[0].role } : null;
  }

  async listByMember(userId) {
    const { rows } = await this.#pool.query(
      `SELECT ${PREFIXED_COLUMNS}, m.role
         FROM projects p
         JOIN project_members m ON m.project_id = p.id
        WHERE m.user_id = $1
        ORDER BY p.created_at ASC, p.id ASC`,
      [userId]
    );
    return rows.map((row) => ({ project: toEntity(row), role: row.role }));
  }

  async listMembers(projectId) {
    const { rows } = await this.#pool.query(
      `SELECT u.id, u.username, u.email, u.avatar_file, m.role
         FROM project_members m
         JOIN users u ON u.id = m.user_id
        WHERE m.project_id = $1
        ORDER BY (m.role = 'owner') DESC, u.username ASC, u.id ASC`,
      [projectId]
    );
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      avatar: row.avatar_file,
      role: row.role,
    }));
  }

  async addMember({ projectId, userId, role }) {
    try {
      await this.#pool.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [projectId, userId, role]
      );
    } catch (error) {
      if (isUniqueViolationError(error)) {
        throw new AlreadyExistsError('User is already a project member.');
      }
      if (error?.code === FOREIGN_KEY_VIOLATION_CODE) {
        throw new NotFoundError('User not found!');
      }
      throw error;
    }
  }

  async removeMember({ projectId, userId }) {
    const client = await this.#pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `DELETE FROM issue_assignees
          WHERE user_id = $2
            AND issue_id IN (SELECT id FROM issues WHERE project_id = $1)`,
        [projectId, userId]
      );
      const result = await client.query(
        'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      await client.query('COMMIT');
      return result.rowCount === 1;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async filterMemberIds({ projectId, userIds }) {
    const { rows } = await this.#pool.query(
      `SELECT user_id FROM project_members
        WHERE project_id = $1 AND user_id = ANY($2::uuid[])`,
      [projectId, userIds]
    );
    return rows.map((row) => row.user_id);
  }

  async deleteById(id) {
    const result = await this.#pool.query(
      'DELETE FROM projects WHERE id = $1',
      [id]
    );
    return result.rowCount === 1;
  }
}
