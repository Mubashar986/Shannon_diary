# NovaWorks CRM - AI Meeting to Project CRM

The Infinity Hack '26 · AI Project Manager Challenge: Meeting to Execution

## Team
- Team name: NovaWorks Innovators
- Four members and responsibilities:
  - Lead Full-Stack Architect: System architecture, role access control, API contract
  - Backend Engineer: FastAPI endpoints, SQLite WAL database, AI extraction pipeline
  - Frontend Developer: React, TypeScript, Tailwind CRM UI, quick demo switcher
  - QA & AI Engineer: Transcript parsing validation, organizer test cases, edge cases
- Repository: [https://github.com/Mubashar986/Shannon_diary](https://github.com/Mubashar986/Shannon_diary)

## What Works
- **Seeded Login & Quick Switcher**: Instant 1-click login as Admin, any of the 3 Project Managers, or any of the 6 Developer Agents with password `Demo123!`.
- **Admin Transcript Automation**: Paste raw 60-minute meeting transcript or click "Insert Supplied 7 Oct Transcript" and click "Create Projects & Tasks". Extracts and saves 3 projects (UrbanCart, QuickServe, HelpDeskPro) and 12 tasks atomically.
- **Strict Role-Based Access Control**:
  - **Admin**: Views all projects, all tasks, team directory, can create from transcript, and can reset demo data.
  - **Manager (Ayesha, Bilal, Hina)**: Views only projects where they are assigned manager (`managerId == user.id`) and their project tasks. Access to other projects is rejected at both UI and API level.
  - **Agent (Ali, Hamza, Sara, Usman, Zain, Maryam)**: Views "My Assigned Tasks" across projects (`assigneeId == user.id`). Cannot view other developers' tasks or unrelated projects.
- **Dynamic Revisions & Verification Reference**: Follows agreed revisions (UrbanCart 20 Oct; QuickServe integration 10h / 22 Oct; Maryam owns testing; excludes payment gateways, inventory sync, maps, driver tracking, and non-employee Kamran). Handles modified transcript inputs (e.g., Usman 12h / 23 Oct).
- **Persistence**: Saved projects and tasks remain intact across browser refreshes in `novaworks.db`.
- **Read-Only Team Directory**: Displays all 10 company members with specializations and skill tags.
- **One-Click Demo Reset**: Clears generated projects/tasks for re-testing without deleting seeded users.

## Technology Stack
- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3, Lucide React
- **Backend**: FastAPI 0.110+, Python 3.12+, Pydantic v2, Uvicorn
- **Database**: SQLite (WAL mode, foreign keys enabled) with PostgreSQL migration script provided
- **AI**: Google Gemini Flash (`gemini-2.5-flash`) via REST API + Dynamic Semantic Meeting Parser fallback
- **Authentication**: Signed HMAC-SHA256 session token verified against database on every API route

## Links
- Live application: Local / [Deployable to Vercel + Render/Railway]
- Demo video: [Link to demo video]

## Requirements
- Node.js 18+ and npm
- Python 3.10+ (tested on Python 3.12/3.14)
- (Optional) Google Gemini API Key for direct Gemini API calls; system includes built-in semantic fallback parser that functions without an API key.

## Run Locally

### 1. Clone this repository
```sh
git clone https://github.com/your-username/novaworks-crm.git
cd Hackathon
```

### 2. Backend Setup
```powershell
cd Shannons_diary\backend
# Create and activate virtual environment if not already active
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (port 8000)
uvicorn app.main:app --reload --port 8000
```
Backend API docs available at: `http://localhost:8000/docs`  
Health check at: `http://localhost:8000/health`

### 3. Seed All Ten Demo Users (One-time or on demand)
```powershell
# From Hackathon root or backend directory:
python Shannons_diary/database/seed_novaworks_users.py
```
*(The backend also automatically seeds these accounts on boot if not already present. Re-running will not duplicate users).*

### 4. Frontend Setup
```powershell
# In a new terminal:
cd Shannons_diary\frontend
npm install
npm run dev
```
Open browser at: `http://localhost:5173`

---

## Environment Variables

| Variable | Purpose | Where configured |
| --- | --- | --- |
| `GEMINI_API_KEY` | Google Gemini API key for AI transcript extraction | `Shannons_diary/backend/.env` |
| `HOST` | Backend server host (default `0.0.0.0`) | `Shannons_diary/backend/.env` |
| `PORT` | Backend server port (default `8000`) | `Shannons_diary/backend/.env` |
| `VITE_API_BASE_URL` | Backend API URL for frontend client | `Shannons_diary/frontend/.env` |

---

## Demo Login Accounts

| Role | Name | Demo email | Specialization | Password |
| --- | --- | --- | --- | --- |
| Admin | Admin | `admin@novaworks.example` | Company overview & transcript creation | `Demo123!` |
| Manager | Ayesha Khan | `ayesha@novaworks.example` | Web PM (UrbanCart Website) | `Demo123!` |
| Manager | Bilal Ahmed | `bilal@novaworks.example` | Mobile PM (QuickServe Mobile App) | `Demo123!` |
| Manager | Hina Malik | `hina@novaworks.example` | AI PM (HelpDeskPro AI Assistant) | `Demo123!` |
| Agent | Ali Raza | `ali@novaworks.example` | Full-Stack (React, frontend) | `Demo123!` |
| Agent | Hamza Shah | `hamza@novaworks.example` | Full-Stack (Node.js, APIs) | `Demo123!` |
| Agent | Sara Noor | `sara@novaworks.example` | App Developer (Flutter, UI) | `Demo123!` |
| Agent | Usman Tariq | `usman@novaworks.example` | App Developer (Testing, integration) | `Demo123!` |
| Agent | Zain Abbas | `zain@novaworks.example` | AI Developer (LLMs, prompts) | `Demo123!` |
| Agent | Maryam Asif | `maryam@novaworks.example` | AI Developer (Retrieval, docs) | `Demo123!` |

*(Judges can also use the **Quick Demo Switcher** buttons on the login screen or top navbar to switch roles in 1 click).*

---

## How Judges Can Test

1. **Open Application**: Navigate to `http://localhost:5173`.
2. **Login as Admin**: Click the purple **Admin** button (or sign in with `admin@novaworks.example` / `Demo123!`).
3. **Open Transcript Modal**: Click **Create from Transcript** in the top action bar.
4. **Insert Meeting Notes**: Click **"Insert Supplied 7 Oct Transcript"** (or paste your own meeting transcript).
5. **Process with AI**: Click **"Create Projects & Tasks"**. Notice the loading indicator and instant creation of **3 projects** and **12 tasks** (UrbanCart, QuickServe, HelpDeskPro).
6. **Inspect UrbanCart Details**: Click on the **UrbanCart Website** card:
   - Manager: Ayesha Khan
   - Deadline: 20 October 2026
   - 4 Tasks: Product catalog UI (Ali, 12h), Demo cart UI (Ali, 8h), Product and cart APIs (Hamza, 14h), Website integration (Ali, 6h). Total: 40h.
7. **Role Verification — Manager**:
   - Use the top dropdown to switch to **Ayesha Khan (Web PM)**.
   - Verify that **only UrbanCart Website** is visible. QuickServe and HelpDeskPro are hidden.
8. **Role Verification — Agent (Ali)**:
   - Switch to **Ali Raza (Full-Stack)**.
   - Verify that **only his 3 assigned tasks** appear under "My Assigned Tasks" (all under UrbanCart).
9. **Role Verification — Agent (Hamza)**:
   - Switch to **Hamza Shah (Full-Stack)**.
   - Verify that **his 2 API tasks** appear across both UrbanCart and QuickServe.
10. **Data Persistence**: Refresh the browser (`F5`). All projects and tasks persist.
11. **Modified Transcript Test**:
    - Switch back to Admin, click **Reset Data** to clear projects.
    - Click **Create from Transcript**, change Usman's estimate to **12 hours** and deadline to **23 October**.
    - Click Create, switch to **Usman Tariq**, and verify his task reflects 12 hours and 23 October.

---

## Known Limitations
- Real payment processing and live driver GPS tracking were discussed in the meeting but explicitly rejected in scope by the team.
- Accounts are seeded for demo speed; user registration and password recovery flows are intentionally bypassed as per challenge guidelines.

## Submission Summary
- **Source repository**: [https://github.com/Mubashar986/Shannon_diary](https://github.com/Mubashar986/Shannon_diary)
- **Status**: Complete MVP meeting-to-execution CRM ready for judging.
- **Seeded accounts**: 10 accounts verified working.
- **AI Transcript Automation**: Tested and verified.
