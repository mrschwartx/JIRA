import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Project } from '../../../src/modules/projects/domain/project.js';
import { ProjectCategory } from '../../../src/modules/projects/domain/value-objects/project-category.js';
import { ProjectKey } from '../../../src/modules/projects/domain/value-objects/project-key.js';
import { ProjectName } from '../../../src/modules/projects/domain/value-objects/project-name.js';
import { ProjectUrl } from '../../../src/modules/projects/domain/value-objects/project-url.js';
import { ValidationError } from '../../../src/shared/domain/errors.js';
import {
  buildProject,
  OTHER_USER_ID,
  USER_ID,
} from '../../support/builders.js';

describe('ProjectKey', () => {
  it('normalizes to upper case', () => {
    assert.equal(ProjectKey.create(' jira ').value, 'JIRA');
  });

  it('rejects malformed keys', () => {
    for (const raw of [undefined, 'J', '1ABC', 'TOO-LONG', 'ABCDEFGHIJK', '']) {
      assert.throws(() => ProjectKey.create(raw), ValidationError);
    }
  });
});

describe('ProjectUrl', () => {
  it('accepts an empty value as no url', () => {
    for (const raw of [undefined, null, '']) {
      assert.equal(ProjectUrl.create(raw).value, null);
    }
  });

  it('accepts http and https urls', () => {
    assert.equal(
      ProjectUrl.create('https://example.com/a').value,
      'https://example.com/a'
    );
  });

  it('rejects other protocols, garbage and non strings', () => {
    for (const raw of ['javascript:alert(1)', 'ftp://x.org', 'nope', 42]) {
      assert.throws(() => ProjectUrl.create(raw), ValidationError);
    }
  });

  it('is not vulnerable to catastrophic backtracking', () => {
    const started = Date.now();
    assert.throws(
      () => ProjectUrl.create(`${'a.'.repeat(5000)} `),
      ValidationError
    );
    assert.ok(Date.now() - started < 500);
  });
});

describe('ProjectCategory and ProjectName', () => {
  it('defaults the category to software', () => {
    assert.equal(ProjectCategory.create(undefined).value, 'software');
  });

  it('rejects unknown categories and blank names', () => {
    assert.throws(() => ProjectCategory.create('hobby'), ValidationError);
    assert.throws(() => ProjectName.create('   '), ValidationError);
    assert.throws(() => ProjectName.create('x'.repeat(101)), ValidationError);
  });
});

describe('Project', () => {
  it('derives roles from ownership', () => {
    const project = buildProject();
    assert.equal(project.roleOf(USER_ID), 'owner');
    assert.equal(project.roleOf(OTHER_USER_ID), 'member');
    assert.equal(project.isOwnedBy(USER_ID), true);
  });

  it('updates only the provided fields and keeps the key', () => {
    const project = buildProject();
    project.update(
      { name: ProjectName.create('Renamed') },
      new Date('2026-02-01T00:00:00.000Z')
    );

    const snapshot = project.toSnapshot();
    assert.equal(snapshot.name, 'Renamed');
    assert.equal(snapshot.key, 'JIRA');
    assert.equal(snapshot.category, 'software');
    assert.equal(snapshot.updatedAt, '2026-02-01T00:00:00.000Z');
  });

  it('round trips through a snapshot', () => {
    const snapshot = buildProject().toSnapshot();
    assert.deepEqual(Project.restore(snapshot).toSnapshot(), snapshot);
  });
});
