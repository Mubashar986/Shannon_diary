# API Contract — NovaWorks CRM

Single source of truth between the FastAPI backend and the React frontend.
Base URL: `http://localhost:8000/api/v1` · OpenAPI: `http://localhost:8000/docs`

## Authentication

Every endpoint under `/api/v1/crm` requires `Authorization: Bearer <token>`.
Token is either a Supabase JWT or standard HMAC session token returned by `POST /api/v1/auth/login`.

### Demo Login Accounts
All accounts use password: `Demo123!`
- `admin@novaworks.example` (Role: ADMIN)
- `ayesha@novaworks.example` (Role: MANAGER, Web PM)
- `bilal@novaworks.example` (Role: MANAGER, Mobile PM)
- `hina@novaworks.example` (Role: MANAGER, AI PM)
- `ali@novaworks.example` (Role: AGENT, React/Frontend)
- `hamza@novaworks.example` (Role: AGENT, Full-Stack Node/APIs)
- `sara@novaworks.example` (Role: AGENT, Flutter UI)
- `usman@novaworks.example` (Role: AGENT, Mobile Integration/Testing)
- `zain@novaworks.example` (Role: AGENT, AI/Prompts)
- `maryam@novaworks.example` (Role: AGENT, Retrieval/Docs)

## Endpoints

### 1. Auth & Current User
- `POST /api/v1/auth/login`
  - Body: `{ "email": string, "password": string }`
  - Response: `{ "token": string, "user": UserProfile }`
- `GET /api/v1/auth/me`
  - Response: `UserProfile`

### 2. Team Directory
- `GET /api/v1/team`
  - Response: `UserProfile[]` (all 10 users, read-only)

### 3. Projects
- `GET /api/v1/projects`
  - Role-filtered:
    - ADMIN: all projects
    - MANAGER: projects where `manager_id == current_user.id`
    - AGENT: projects containing their assigned tasks
  - Response: `Project[]` (with task counts & total hours)
- `GET /api/v1/projects/{id}`
  - Role-gated:
    - Returns `ProjectDetail` with tasks if permitted, otherwise 403/404.

### 4. Tasks
- `GET /api/v1/tasks`
  - Query param: `project_id?` (optional UUID)
  - Role-filtered:
    - ADMIN: all tasks
    - MANAGER: all tasks within projects they manage
    - AGENT: only tasks assigned to them (`assignee_id == current_user.id`)
  - Response: `Task[]`

### 5. Transcript Automation (Admin only)
- `POST /api/v1/projects/create-from-transcript`
  - Body: `{ "transcript": string }`
  - Admin-only (returns 403 if called by MANAGER or AGENT).
  - Uses Gemini AI + Team Directory to extract structured projects and tasks.
  - Validates and saves atomically.
  - Response: `{ "message": string, "projects_created": number, "tasks_created": number, "projects": Project[] }`

### 6. Reset (Admin only / Demo reset)
- `POST /api/v1/projects/reset`
  - Clears generated projects and tasks while keeping the 10 seeded users intact.

## Types

```ts
type Role = 'ADMIN' | 'MANAGER' | 'AGENT';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialization: string;
  skills: string[];
}

interface Project {
  id: string;
  name: string;
  client_name: string;
  description: string;
  manager_id: string;
  manager_name?: string;
  deadline: string; // YYYY-MM-DD
  task_count?: number;
  total_hours?: number;
}

interface Task {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  description: string;
  assignee_id: string;
  assignee_name?: string;
  deadline: string; // YYYY-MM-DD
  estimated_hours: number;
}

interface ProjectDetail extends Project {
  tasks: Task[];
}
```

## Lanes
- frontend agent: `Shannons_diary/frontend/src/**`
- backend agent: `Shannons_diary/backend/app/**`, `Shannons_diary/database/**`
- orchestrator: `contracts/api.md`, `.heisenberg/tasks/current.json`, `README.md`
