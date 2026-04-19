import { db } from './db';

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  avatar        TEXT,
  role          TEXT NOT NULL DEFAULT 'member',
  password_hash TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       TEXT NOT NULL,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS workflow_statuses (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  color      TEXT NOT NULL,
  "order"    INT  NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  status_id       TEXT NOT NULL,
  priority        TEXT NOT NULL,
  assignee_ids    TEXT[] DEFAULT '{}',
  tag_ids         TEXT[] DEFAULT '{}',
  blocked_by      TEXT[] DEFAULT '{}',
  start_date      DATE,
  due_date        DATE,
  estimated_hours NUMERIC(6,2),
  logged_hours    NUMERIC(6,2) DEFAULT 0,
  "order"         INT  NOT NULL DEFAULT 0,
  parent_id       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wiki_pages (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  version    INT  NOT NULL DEFAULT 1,
  author_id  TEXT REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  author_id  TEXT REFERENCES users(id),
  is_pinned  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,
  actor_id   TEXT REFERENCES users(id),
  payload    JSONB DEFAULT '{}',
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_logs (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id),
  hours      NUMERIC(4,2) NOT NULL,
  note       TEXT,
  date       DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS files (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  size         BIGINT NOT NULL,
  mime_type    TEXT NOT NULL,
  uploader_id  TEXT REFERENCES users(id),
  storage_path TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS polls (
  id                        TEXT PRIMARY KEY,
  project_id                TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  description               TEXT,
  is_multiple               BOOLEAN NOT NULL DEFAULT false,
  show_results_before_close BOOLEAN NOT NULL DEFAULT true,
  status                    TEXT NOT NULL DEFAULT 'active',
  due_date                  DATE,
  author_id                 TEXT REFERENCES users(id),
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id      TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label   TEXT NOT NULL,
  "order" INT  NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id   TEXT NOT NULL REFERENCES polls(id)        ON DELETE CASCADE,
  option_id TEXT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id),
  PRIMARY KEY (poll_id, option_id, user_id)
);
`;

const ALTER_SQL = `
ALTER TABLE files ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mail_app_password TEXT;
`;

async function migrate() {
  console.log('Running migration...');
  await db.query(SQL);
  await db.query(ALTER_SQL);
  console.log('Migration complete.');
  await db.end();
}

migrate().catch((err) => { console.error(err); process.exit(1); });
