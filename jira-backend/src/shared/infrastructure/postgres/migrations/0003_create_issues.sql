CREATE TABLE issues (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number         INTEGER NOT NULL,
  title          VARCHAR(200) NOT NULL,
  type           VARCHAR(10) NOT NULL CHECK (type IN ('task','bug','story')),
  status         VARCHAR(20) NOT NULL CHECK (status IN ('backlog','selected','inprogress','done')),
  priority       VARCHAR(10) NOT NULL CHECK (priority IN ('lowest','low','medium','high','highest')),
  list_position  DOUBLE PRECISION NOT NULL,
  description    VARCHAR(20000) NOT NULL DEFAULT '',
  estimate       INTEGER CHECK (estimate >= 0),
  time_spent     INTEGER CHECK (time_spent >= 0),
  time_remaining INTEGER CHECK (time_remaining >= 0),
  reporter_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX issues_project_number ON issues (project_id, number);
CREATE INDEX issues_project_status_position ON issues (project_id, status, list_position);

CREATE TABLE issue_assignees (
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, user_id)
);

CREATE INDEX issue_assignees_user ON issue_assignees (user_id);
