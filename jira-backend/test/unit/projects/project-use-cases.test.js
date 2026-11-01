import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { ProjectAccess } from '../../../src/modules/projects/application/project-access.js';
import { AddMember } from '../../../src/modules/projects/application/use-cases/add-member.js';
import { DeleteProject } from '../../../src/modules/projects/application/use-cases/delete-project.js';
import { RemoveMember } from '../../../src/modules/projects/application/use-cases/remove-member.js';
import { UpdateProject } from '../../../src/modules/projects/application/use-cases/update-project.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../src/shared/domain/errors.js';
import {
  buildProject,
  OTHER_USER_ID,
  PROJECT_ID,
  USER_ID,
} from '../../support/builders.js';

const STRANGER_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

const createRepository = () => {
  const memberships = new Map([
    [`${PROJECT_ID}:${USER_ID}`, 'owner'],
    [`${PROJECT_ID}:${OTHER_USER_ID}`, 'member'],
  ]);
  const calls = { removed: [], added: [], deleted: [] };
  let project = buildProject();

  return {
    calls,
    memberships,
    findMembership: async ({ projectId, userId }) => {
      const role = memberships.get(`${projectId}:${userId}`);
      return role ? { role } : null;
    },
    filterMemberIds: async ({ projectId, userIds }) =>
      userIds.filter((id) => memberships.has(`${projectId}:${id}`)),
    findById: async () => project,
    update: async (updated) => {
      project = updated;
      return true;
    },
    deleteById: async (id) => {
      calls.deleted.push(id);
      return true;
    },
    addMember: async (entry) => {
      calls.added.push(entry);
    },
    removeMember: async (entry) => {
      calls.removed.push(entry);
      return true;
    },
    listMembers: async () => [
      {
        id: OTHER_USER_ID,
        username: 'other',
        email: 'other@mail.com',
        avatar: '/a.jpg',
        role: 'member',
      },
    ],
  };
};

describe('project use cases', () => {
  let projectRepository;
  let projectAccess;

  beforeEach(() => {
    projectRepository = createRepository();
    projectAccess = new ProjectAccess({ projectRepository });
  });

  describe('ProjectAccess', () => {
    it('hides projects from non members behind a 404', async () => {
      await assert.rejects(
        () =>
          projectAccess.requireMember({
            projectId: PROJECT_ID,
            userId: STRANGER_ID,
          }),
        NotFoundError
      );
    });

    it('rejects malformed project ids', async () => {
      await assert.rejects(
        () =>
          projectAccess.requireMember({ projectId: 'nope', userId: USER_ID }),
        ValidationError
      );
    });

    it('returns the role of members', async () => {
      const access = await projectAccess.requireMember({
        projectId: PROJECT_ID,
        userId: OTHER_USER_ID,
      });
      assert.equal(access.role, 'member');
    });

    it('asserts that every given user is a member', async () => {
      await projectAccess.assertMembers({
        projectId: PROJECT_ID,
        userIds: [USER_ID, OTHER_USER_ID, USER_ID],
      });
      await assert.rejects(
        () =>
          projectAccess.assertMembers({
            projectId: PROJECT_ID,
            userIds: [USER_ID, STRANGER_ID],
          }),
        ValidationError
      );
    });
  });

  describe('owner only operations', () => {
    it('forbids members from updating, deleting or adding members', async () => {
      const dependencies = { projectRepository, projectAccess };
      await assert.rejects(
        () =>
          new UpdateProject(dependencies).execute({
            requesterId: OTHER_USER_ID,
            projectId: PROJECT_ID,
            changes: { name: 'Hacked' },
          }),
        ForbiddenError
      );
      await assert.rejects(
        () =>
          new DeleteProject(dependencies).execute({
            requesterId: OTHER_USER_ID,
            projectId: PROJECT_ID,
          }),
        ForbiddenError
      );
      await assert.rejects(
        () =>
          new AddMember(dependencies).execute({
            requesterId: OTHER_USER_ID,
            projectId: PROJECT_ID,
            userId: STRANGER_ID,
          }),
        ForbiddenError
      );
      assert.deepEqual(projectRepository.calls.deleted, []);
      assert.deepEqual(projectRepository.calls.added, []);
    });

    it('lets the owner update the project', async () => {
      const result = await new UpdateProject({
        projectRepository,
        projectAccess,
      }).execute({
        requesterId: USER_ID,
        projectId: PROJECT_ID,
        changes: { name: 'Renamed', key: 'HACK' },
      });
      assert.equal(result.name, 'Renamed');
      assert.equal(result.key, 'JIRA');
      assert.equal(result.role, 'owner');
    });

    it('rejects updates without any updatable field', async () => {
      await assert.rejects(
        () =>
          new UpdateProject({ projectRepository, projectAccess }).execute({
            requesterId: USER_ID,
            projectId: PROJECT_ID,
            changes: { key: 'HACK', ownerId: STRANGER_ID },
          }),
        ValidationError
      );
    });

    it('adds members with the member role', async () => {
      await new AddMember({ projectRepository, projectAccess }).execute({
        requesterId: USER_ID,
        projectId: PROJECT_ID,
        userId: OTHER_USER_ID,
      });
      assert.deepEqual(projectRepository.calls.added, [
        { projectId: PROJECT_ID, userId: OTHER_USER_ID, role: 'member' },
      ]);
    });
  });

  describe('RemoveMember', () => {
    const build = () => new RemoveMember({ projectRepository, projectAccess });

    it('lets the owner remove a member', async () => {
      await build().execute({
        requesterId: USER_ID,
        projectId: PROJECT_ID,
        userId: OTHER_USER_ID,
      });
      assert.equal(projectRepository.calls.removed.length, 1);
    });

    it('lets members leave on their own', async () => {
      await build().execute({
        requesterId: OTHER_USER_ID,
        projectId: PROJECT_ID,
        userId: OTHER_USER_ID,
      });
      assert.equal(projectRepository.calls.removed.length, 1);
    });

    it('stops members from removing the owner', async () => {
      await assert.rejects(
        () =>
          build().execute({
            requesterId: OTHER_USER_ID,
            projectId: PROJECT_ID,
            userId: USER_ID,
          }),
        ForbiddenError
      );
    });

    it('never removes the owner, not even by the owner', async () => {
      await assert.rejects(
        () =>
          build().execute({
            requesterId: USER_ID,
            projectId: PROJECT_ID,
            userId: USER_ID,
          }),
        ValidationError
      );
      assert.deepEqual(projectRepository.calls.removed, []);
    });

    it('fails for users that are not members', async () => {
      await assert.rejects(
        () =>
          build().execute({
            requesterId: USER_ID,
            projectId: PROJECT_ID,
            userId: STRANGER_ID,
          }),
        NotFoundError
      );
    });
  });
});
