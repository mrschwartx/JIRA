CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key           VARCHAR(10) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  url           VARCHAR(2048),
  description   VARCHAR(10000) NOT NULL DEFAULT '',
  category      VARCHAR(20) NOT NULL CHECK (category IN ('software','marketing','business')),
  issue_counter INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX projects_key_unique ON projects (key);
CREATE INDEX projects_owner ON projects (owner_id);

CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(10) NOT NULL CHECK (role IN ('owner','member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX project_members_user ON project_members (user_id);
