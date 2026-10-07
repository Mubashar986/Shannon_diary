-- ==============================================================================
-- NOVAWORKS TECHNOLOGIES CRM SCHEMA (Infinity Hack '26)
-- Entities: crm_users, crm_projects, crm_tasks
-- ==============================================================================

CREATE TABLE IF NOT EXISTS crm_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'AGENT')),
    specialization TEXT,
    skills TEXT NOT NULL, -- JSON array of strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    description TEXT,
    manager_id TEXT NOT NULL REFERENCES crm_users(id),
    deadline TEXT NOT NULL, -- YYYY-MM-DD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES crm_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id TEXT NOT NULL REFERENCES crm_users(id),
    deadline TEXT NOT NULL, -- YYYY-MM-DD
    estimated_hours REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON crm_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON crm_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON crm_projects(manager_id);
