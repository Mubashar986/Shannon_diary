"""NovaWorks CRM Database and Seeder.
Uses SQLite with WAL mode for zero-configuration, robust persistence.
Provides schemas for Users, Projects, and Tasks with role-based queries.
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).resolve().parent.parent / "novaworks.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with static salt."""
    salt = "novaworks_crm_2026"
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def init_db() -> None:
    """Initialize database tables."""
    conn = get_connection()
    try:
        with conn:
            conn.executescript("""
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
            """)
    finally:
        conn.close()


DEMO_USERS = [
    {
        "id": "ADMIN",
        "name": "Admin",
        "email": "admin@novaworks.example",
        "password": "Demo123!",
        "role": "ADMIN",
        "specialization": "Administrator",
        "skills": ["Company overview", "transcript creation"],
    },
    {
        "id": "PM01",
        "name": "Ayesha Khan",
        "email": "ayesha@novaworks.example",
        "password": "Demo123!",
        "role": "MANAGER",
        "specialization": "Web PM",
        "skills": ["Web projects", "client coordination"],
    },
    {
        "id": "PM02",
        "name": "Bilal Ahmed",
        "email": "bilal@novaworks.example",
        "password": "Demo123!",
        "role": "MANAGER",
        "specialization": "Mobile PM",
        "skills": ["Mobile projects", "delivery planning"],
    },
    {
        "id": "PM03",
        "name": "Hina Malik",
        "email": "hina@novaworks.example",
        "password": "Demo123!",
        "role": "MANAGER",
        "specialization": "AI PM",
        "skills": ["AI projects", "requirement review"],
    },
    {
        "id": "DEV01",
        "name": "Ali Raza",
        "email": "ali@novaworks.example",
        "password": "Demo123!",
        "role": "AGENT",
        "specialization": "Full-Stack",
        "skills": ["React", "frontend integration"],
    },
    {
        "id": "DEV02",
        "name": "Hamza Shah",
        "email": "hamza@novaworks.example",
        "password": "Demo123!",
        "role": "AGENT",
        "specialization": "Full-Stack",
        "skills": ["Node.js", "databases", "APIs"],
    },
    {
        "id": "DEV03",
        "name": "Sara Noor",
        "email": "sara@novaworks.example",
        "password": "Demo123!",
        "role": "AGENT",
        "specialization": "App Developer",
        "skills": ["Flutter", "mobile UI"],
    },
    {
        "id": "DEV04",
        "name": "Usman Tariq",
        "email": "usman@novaworks.example",
        "password": "Demo123!",
        "role": "AGENT",
        "specialization": "App Developer",
        "skills": ["Flutter", "integration", "testing"],
    },
    {
        "id": "DEV05",
        "name": "Zain Abbas",
        "email": "zain@novaworks.example",
        "password": "Demo123!",
        "role": "AGENT",
        "specialization": "AI Developer",
        "skills": ["LLMs", "extraction", "prompts"],
    },
    {
        "id": "DEV06",
        "name": "Maryam Asif",
        "email": "maryam@novaworks.example",
        "password": "Demo123!",
        "role": "AGENT",
        "specialization": "AI Developer",
        "skills": ["Retrieval", "document processing"],
    },
]


def seed_demo_users() -> int:
    """Seed all 10 demo accounts. Idempotent: does not duplicate or overwrite."""
    init_db()
    conn = get_connection()
    inserted = 0
    try:
        with conn:
            for u in DEMO_USERS:
                existing = conn.execute(
                    "SELECT id FROM crm_users WHERE email = ?", (u["email"],)
                ).fetchone()
                if not existing:
                    conn.execute(
                        """
                        INSERT INTO crm_users (id, name, email, password_hash, role, specialization, skills)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            u["id"],
                            u["name"],
                            u["email"],
                            hash_password(u["password"]),
                            u["role"],
                            u["specialization"],
                            json.dumps(u["skills"]),
                        ),
                    )
                    inserted += 1
    finally:
        conn.close()
    return inserted


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM crm_users WHERE LOWER(email) = LOWER(?)", (email.strip(),)
        ).fetchone()
        if not row:
            return None
        res = dict(row)
        res["skills"] = json.loads(res["skills"])
        return res
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM crm_users WHERE id = ?", (user_id,)
        ).fetchone()
        if not row:
            return None
        res = dict(row)
        res["skills"] = json.loads(res["skills"])
        return res
    finally:
        conn.close()


def get_all_users() -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM crm_users ORDER BY role, name").fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["skills"] = json.loads(d["skills"])
            d.pop("password_hash", None)
            result.append(d)
        return result
    finally:
        conn.close()


def get_projects_for_user(user: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Role-filtered projects query."""
    conn = get_connection()
    role = user["role"]
    user_id = user["id"]
    try:
        if role == "ADMIN":
            query = """
                SELECT p.*, u.name as manager_name,
                       (SELECT COUNT(*) FROM crm_tasks t WHERE t.project_id = p.id) as task_count,
                       (SELECT COALESCE(SUM(t.estimated_hours), 0) FROM crm_tasks t WHERE t.project_id = p.id) as total_hours
                FROM crm_projects p
                LEFT JOIN crm_users u ON p.manager_id = u.id
                ORDER BY p.deadline ASC
            """
            rows = conn.execute(query).fetchall()
        elif role == "MANAGER":
            query = """
                SELECT p.*, u.name as manager_name,
                       (SELECT COUNT(*) FROM crm_tasks t WHERE t.project_id = p.id) as task_count,
                       (SELECT COALESCE(SUM(t.estimated_hours), 0) FROM crm_tasks t WHERE t.project_id = p.id) as total_hours
                FROM crm_projects p
                LEFT JOIN crm_users u ON p.manager_id = u.id
                WHERE p.manager_id = ?
                ORDER BY p.deadline ASC
            """
            rows = conn.execute(query, (user_id,)).fetchall()
        elif role == "AGENT":
            query = """
                SELECT DISTINCT p.*, u.name as manager_name,
                       (SELECT COUNT(*) FROM crm_tasks t WHERE t.project_id = p.id AND t.assignee_id = ?) as task_count,
                       (SELECT COALESCE(SUM(t.estimated_hours), 0) FROM crm_tasks t WHERE t.project_id = p.id AND t.assignee_id = ?) as total_hours
                FROM crm_projects p
                JOIN crm_tasks t ON t.project_id = p.id
                LEFT JOIN crm_users u ON p.manager_id = u.id
                WHERE t.assignee_id = ?
                ORDER BY p.deadline ASC
            """
            rows = conn.execute(query, (user_id, user_id, user_id)).fetchall()
        else:
            return []
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_project_detail(project_id: str, user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Returns project detail with tasks if permitted."""
    conn = get_connection()
    try:
        p_row = conn.execute("""
            SELECT p.*, u.name as manager_name,
                   (SELECT COUNT(*) FROM crm_tasks t WHERE t.project_id = p.id) as task_count,
                   (SELECT COALESCE(SUM(t.estimated_hours), 0) FROM crm_tasks t WHERE t.project_id = p.id) as total_hours
            FROM crm_projects p
            LEFT JOIN crm_users u ON p.manager_id = u.id
            WHERE p.id = ?
        """, (project_id,)).fetchone()

        if not p_row:
            return None

        project = dict(p_row)
        role = user["role"]
        user_id = user["id"]

        # Permission check
        if role == "MANAGER" and project["manager_id"] != user_id:
            return None  # Forbidden

        if role == "AGENT":
            # Must have at least one task in this project
            has_task = conn.execute(
                "SELECT 1 FROM crm_tasks WHERE project_id = ? AND assignee_id = ?",
                (project_id, user_id)
            ).fetchone()
            if not has_task:
                return None  # Forbidden

            # Agent only sees their own tasks
            t_rows = conn.execute("""
                SELECT t.*, u.name as assignee_name, p.name as project_name
                FROM crm_tasks t
                JOIN crm_projects p ON t.project_id = p.id
                LEFT JOIN crm_users u ON t.assignee_id = u.id
                WHERE t.project_id = ? AND t.assignee_id = ?
                ORDER BY t.deadline ASC
            """, (project_id, user_id)).fetchall()
        else:
            # ADMIN and authorized MANAGER see all tasks in project
            t_rows = conn.execute("""
                SELECT t.*, u.name as assignee_name, p.name as project_name
                FROM crm_tasks t
                JOIN crm_projects p ON t.project_id = p.id
                LEFT JOIN crm_users u ON t.assignee_id = u.id
                WHERE t.project_id = ?
                ORDER BY t.deadline ASC
            """, (project_id,)).fetchall()

        project["tasks"] = [dict(t) for t in t_rows]
        return project
    finally:
        conn.close()


def get_tasks_for_user(user: Dict[str, Any], project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Role-filtered tasks query."""
    conn = get_connection()
    role = user["role"]
    user_id = user["id"]
    try:
        base_query = """
            SELECT t.*, u.name as assignee_name, p.name as project_name
            FROM crm_tasks t
            JOIN crm_projects p ON t.project_id = p.id
            LEFT JOIN crm_users u ON t.assignee_id = u.id
        """
        conditions = []
        params = []

        if project_id:
            conditions.append("t.project_id = ?")
            params.append(project_id)

        if role == "ADMIN":
            pass  # no extra condition
        elif role == "MANAGER":
            conditions.append("p.manager_id = ?")
            params.append(user_id)
        elif role == "AGENT":
            conditions.append("t.assignee_id = ?")
            params.append(user_id)
        else:
            return []

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)

        base_query += " ORDER BY t.deadline ASC"
        rows = conn.execute(base_query, tuple(params)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def save_projects_and_tasks_atomic(projects_data: List[Dict[str, Any]]) -> int:
    """Atomic transaction to save extracted projects and tasks."""
    conn = get_connection()
    tasks_count = 0
    try:
        with conn:
            for p in projects_data:
                p_id = p.get("id") or str(uuid.uuid4())
                conn.execute("""
                    INSERT INTO crm_projects (id, name, client_name, description, manager_id, deadline)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    p_id,
                    p["name"],
                    p["clientName"],
                    p.get("description", ""),
                    p["managerId"],
                    p["deadline"]
                ))

                for t in p.get("tasks", []):
                    t_id = t.get("id") or str(uuid.uuid4())
                    conn.execute("""
                        INSERT INTO crm_tasks (id, project_id, title, description, assignee_id, deadline, estimated_hours)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        t_id,
                        p_id,
                        t["title"],
                        t.get("description", ""),
                        t["assigneeId"],
                        t["deadline"],
                        float(t["estimatedHours"])
                    ))
                    tasks_count += 1
    finally:
        conn.close()
    return tasks_count


def reset_projects_and_tasks() -> None:
    """Deletes all projects and tasks while keeping seeded users."""
    conn = get_connection()
    try:
        with conn:
            conn.execute("DELETE FROM crm_tasks")
            conn.execute("DELETE FROM crm_projects")
    finally:
        conn.close()
