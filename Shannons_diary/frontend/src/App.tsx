import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  Briefcase,
  CheckSquare,
  Clock,
  Calendar,
  Shield,
  LogOut,
  RotateCcw,
  PlusCircle,
  ExternalLink,
  Layers,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  UserCheck,
  Building,
  Terminal,
  X,
  FileText
} from 'lucide-react';
import {
  UserProfile,
  Project,
  Task,
  ProjectDetail,
  login,
  logout,
  getStoredUser,
  getProjects,
  getProjectDetail,
  getTasks,
  getTeam,
  createFromTranscript,
  resetDemo
} from './lib/novaworksApi';

const SAMPLE_TRANSCRIPT = `Meeting: NovaWorks Client Delivery Planning
Date: 7 October 2026 | Scheduled duration: 60 minutes
Participants: Ayesha, Bilal, Hina, Ali, Hamza, Sara, Usman, Zain, Maryam

09:00-09:04 | Opening and company workflow
Ayesha: Good morning. We have three client engagements to plan today: UrbanCart Clothing's website, QuickServe's customer mobile app, and HelpDeskPro's AI support assistant. Please keep these as three separate projects.
Bilal: We should finish with a project manager, deadline, task owner, and estimated hours for every piece of work.
Hina: Agreed. Please use our supplied team directory. Record developer work only in the estimated hours.
Ayesha: Keep this version simple. Cost calculation and progress monitoring are outside this challenge.

09:04-09:08 | UrbanCart project scope
Ayesha: First project is UrbanCart Website, for client UrbanCart Clothing. I'll manage it. They need a responsive website where customers can browse products, view product details, and add items to a demo cart.
Ali: Do they need a real checkout, payment gateway, and stock integration?
Ayesha: No. For this phase the cart is a demo. Real payments and inventory integration are not included. Don't add a payment task or an inventory task.

09:08-09:12 | UrbanCart frontend assignment
Ali: I can own the product catalog interface: product listing, a product detail screen, and responsive layout. Put that down as 12 estimated hours, due on 12 October.
Ayesha: Please call that task Product catalog UI. We also need the demo cart interface as a separate task.
Ali: Yes. Demo cart UI will take 8 hours, due 15 October. I am the owner of both frontend tasks.

09:12-09:16 | UrbanCart backend and delivery correction
Hamza: For Product and cart APIs, I estimate 14 hours. I own it, and the deadline is 14 October.
Ayesha: Good. After that, Ali owns Website integration and testing. Six hours, due 19 October. Final UrbanCart project deadline is 20 October.
Hamza: So the final website plan has four tasks, and the new deadline is 20 October. No payment gateway in this phase.

09:16-09:20 | QuickServe scope and manager
Bilal: The second project is QuickServe Mobile App, for client QuickServe Services. I am the project manager. The client needs a customer app for signing in, requesting a service, and seeing the request's current status. The project deadline is 24 October. Exclude live maps, driver tracking, and payments.

09:20-09:24 | QuickServe screen work
Sara: I'll own Login and profile screens. That is 8 hours, due 12 October. Second task is Service booking screens. 12 hours, due 17 October.

09:24-09:28 | QuickServe API assignment
Hamza: I can build Booking and account APIs for the app. 16 hours, due 16 October. Put me as the owner.

09:28-09:32 | QuickServe integration estimate correction
Usman: I will own Mobile integration and testing. Make the final estimate 10 hours. Keep the task deadline at 22 October.
Bilal: Final agreement: Mobile integration and testing, Usman, 10 hours, 22 October. QuickServe still delivers on 24 October.

09:32-09:36 | HelpDeskPro scope and manager
Hina: Third project is HelpDeskPro AI Assistant, for client HelpDeskPro Solutions. I am managing it. Support assistant that answers questions from a supplied FAQ document and passes unresolved questions to human team. Project deadline is 22 October.

09:36-09:40 | HelpDeskPro document work
Maryam: I'll own FAQ document processing. Prepare and retrieve from the FAQ. 10 hours, due 13 October.
Zain: I can own Assistant answer generation. 14 hours, due 17 October.

09:40-09:44 | HelpDeskPro escalation
Zain: Next task is Human escalation flow: save unresolved questions. 6 hours, due 18 October. Keep task assigned to Zain. Note: Kamran is not a company employee, do not add him.

09:44-09:48 | HelpDeskPro testing owner correction
Hina: For Assistant evaluation and testing, Maryam is the final owner instead of Zain.
Maryam: Put the estimate at 8 hours, due 21 October. HelpDeskPro deadline stays 22 October.

09:56-10:00 | Final recap
Ayesha: Recap: UrbanCart Website, manager Ayesha, deadline 20 October. Ali owns Product catalog UI (12h, 12 Oct), Demo cart UI (8h, 15 Oct), Website integration and testing (6h, 19 Oct). Hamza owns Product and cart APIs (14h, 14 Oct).
Bilal: QuickServe Mobile App, manager Bilal, deadline 24 October. Sara owns Login and profile screens (8h, 12 Oct), Service booking screens (12h, 17 Oct). Hamza owns Booking and account APIs (16h, 16 Oct). Usman owns Mobile integration and testing (10h, 22 Oct).
Hina: HelpDeskPro AI Assistant, manager Hina, deadline 22 October. Maryam owns FAQ document processing (10h, 13 Oct), Assistant evaluation and testing (8h, 21 Oct). Zain owns Assistant answer generation (14h, 17 Oct), Human escalation flow (6h, 18 Oct).`;

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', name: 'Admin', email: 'admin@novaworks.example', spec: 'Administrator' },
  { role: 'MANAGER', name: 'Ayesha Khan', email: 'ayesha@novaworks.example', spec: 'Web PM' },
  { role: 'MANAGER', name: 'Bilal Ahmed', email: 'bilal@novaworks.example', spec: 'Mobile PM' },
  { role: 'MANAGER', name: 'Hina Malik', email: 'hina@novaworks.example', spec: 'AI PM' },
  { role: 'AGENT', name: 'Ali Raza', email: 'ali@novaworks.example', spec: 'Full-Stack (React)' },
  { role: 'AGENT', name: 'Hamza Shah', email: 'hamza@novaworks.example', spec: 'Full-Stack (Node/APIs)' },
  { role: 'AGENT', name: 'Sara Noor', email: 'sara@novaworks.example', spec: 'App Dev (Flutter)' },
  { role: 'AGENT', name: 'Usman Tariq', email: 'usman@novaworks.example', spec: 'App Dev (QA/Mobile)' },
  { role: 'AGENT', name: 'Zain Abbas', email: 'zain@novaworks.example', spec: 'AI Dev (LLMs/Prompts)' },
  { role: 'AGENT', name: 'Maryam Asif', email: 'maryam@novaworks.example', spec: 'AI Dev (Retrieval)' },
];

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getStoredUser());
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [transcriptText, setTranscriptText] = useState(SAMPLE_TRANSCRIPT);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);

  // Manual login fields
  const [loginEmail, setLoginEmail] = useState('admin@novaworks.example');
  const [loginPassword, setLoginPassword] = useState('Demo123!');

  // Active view tab for Admin
  const [adminTab, setAdminTab] = useState<'projects' | 'tasks'>('projects');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser?.id]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [projList, taskList, teamList] = await Promise.all([
        getProjects(),
        getTasks(),
        getTeam(),
      ]);
      setProjects(projList);
      setTasks(taskList);
      setTeam(teamList);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch CRM records');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email: string, pass: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, pass);
      setCurrentUser(res.user);
      setSuccessMsg(`Logged in as ${res.user.name} (${res.user.role})`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setCurrentUser(null);
    setProjects([]);
    setTasks([]);
    setSelectedProject(null);
  }

  async function handleCreateFromTranscript() {
    if (!transcriptText.trim()) return;
    setIsProcessingTranscript(true);
    setError(null);
    try {
      const res = await createFromTranscript(transcriptText);
      setSuccessMsg(res.message);
      setIsTranscriptModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Transcript processing failed');
    } finally {
      setIsProcessingTranscript(false);
    }
  }

  async function handleReset() {
    if (!window.confirm('Reset will remove all projects and tasks. Seeded users remain active. Proceed?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await resetDemo();
      setSuccessMsg(res.message);
      setSelectedProject(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  async function openProjectDetail(projId: string) {
    setLoading(true);
    try {
      const detail = await getProjectDetail(projId);
      setSelectedProject(detail);
    } catch (err: any) {
      setError(err?.message || 'Could not load project detail');
    } finally {
      setLoading(false);
    }
  }

  const roleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300';
      case 'AGENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // ==============================================================================
  // RENDER: LOGIN SCREEN (if not authenticated)
  // ==============================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl mb-4">
            <Building className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            NovaWorks Technologies CRM
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            The Infinity Hack '26 · AI Meeting to Project Execution Platform (Lahore, PK)
          </p>
        </div>

        {error && (
          <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-xl bg-red-950/50 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
            <h3 className="text-base font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              Judge Quick-Login (Select Any Account)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              All 10 demo accounts are pre-seeded with password <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">Demo123!</code>.
            </p>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Administrator (All Access & AI Parsing)
                </span>
                <div className="mt-1.5 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleLogin('admin@novaworks.example', 'Demo123!')}
                    className="flex items-center justify-between p-2.5 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg text-left transition group"
                  >
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-purple-300">Admin</div>
                      <div className="text-xs text-slate-400">admin@novaworks.example · Company Overview</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      ADMIN
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Project Managers (Assigned Projects Only)
                </span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.filter((a) => a.role === 'MANAGER').map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleLogin(acc.email, 'Demo123!')}
                      className="p-2.5 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 rounded-lg text-left transition group"
                    >
                      <div className="text-xs font-medium text-white group-hover:text-blue-300 truncate">
                        {acc.name.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{acc.spec}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Developer Agents (Assigned Tasks Only)
                </span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.filter((a) => a.role === 'AGENT').map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleLogin(acc.email, 'Demo123!')}
                      className="p-2 bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-500/20 rounded-lg text-left transition group"
                    >
                      <div className="text-xs font-medium text-white group-hover:text-emerald-300 truncate">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{acc.spec}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin(loginEmail, loginPassword);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300">Custom Email Sign In</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="email@novaworks.example"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In with Credentials'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // RENDER: AUTHENTICATED CRM INTERFACE
  // ==============================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
              <Building className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">NovaWorks CRM</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400">
                · AI Meeting to Execution
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher Dropdown */}
            <select
              value={currentUser.email}
              onChange={(e) => {
                const target = DEMO_ACCOUNTS.find((a) => a.email === e.target.value);
                if (target) handleLogin(target.email, 'Demo123!');
              }}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              {DEMO_ACCOUNTS.map((acc) => (
                <option key={acc.email} value={acc.email}>
                  Switch: [{acc.role}] {acc.name} ({acc.spec})
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            >
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              Team Directory
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Current User Pill */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${roleColor(currentUser.role)}`}
              >
                {currentUser.role}
              </span>
              <span className="text-xs font-medium text-slate-200 hidden md:inline">
                {currentUser.name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="bg-red-950/60 border border-red-500/50 p-3 rounded-xl flex items-center justify-between text-red-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="bg-emerald-950/60 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between text-emerald-200 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Role Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${roleColor(currentUser.role)}`}>
                {currentUser.role} WORKSPACE
              </span>
              <span className="text-sm font-semibold text-white">{currentUser.name}</span>
              <span className="text-xs text-slate-400">({currentUser.specialization})</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {currentUser.role === 'ADMIN' &&
                'Full management authority: Paste meeting transcripts, trigger AI extraction, and monitor all projects.'}
              {currentUser.role === 'MANAGER' &&
                `Filtered view: Showing only projects managed by you (${currentUser.name}). Access to other managers' projects is restricted.`}
              {currentUser.role === 'AGENT' &&
                `Filtered view: Showing only tasks assigned to you (${currentUser.name}). Other team members' tasks are hidden.`}
            </p>
          </div>

          {currentUser.role === 'ADMIN' && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsTranscriptModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
              >
                <Sparkles className="h-4 w-4" />
                Create from Transcript
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-700 transition"
                title="Reset demo projects and tasks"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Data
              </button>
            </div>
          )}
        </div>

        {/* ADMIN OVERVIEW METRICS */}
        {currentUser.role === 'ADMIN' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Projects</span>
                <Briefcase className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">{projects.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Expected: 3 projects</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Tasks</span>
                <CheckSquare className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">{tasks.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Expected: 12 tasks</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Effort</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {projects.reduce((acc, p) => acc + (p.total_hours || 0), 0)}h
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Sum of estimated hours</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Team Members</span>
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">{team.length || 10}</div>
              <div className="text-[11px] text-slate-500 mt-1">1 Admin, 3 PMs, 6 Agents</div>
            </div>
          </div>
        )}

        {/* ADMIN VIEW TABS */}
        {currentUser.role === 'ADMIN' && (
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setAdminTab('projects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                adminTab === 'projects'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setAdminTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                adminTab === 'tasks'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Tasks ({tasks.length})
            </button>
          </div>
        )}

        {/* PROJECTS LIST (for ADMIN and MANAGER) */}
        {(currentUser.role === 'MANAGER' || (currentUser.role === 'ADMIN' && adminTab === 'projects')) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-400" />
                {currentUser.role === 'ADMIN' ? 'All Client Projects' : 'Your Managed Projects'}
              </h3>
              <span className="text-xs text-slate-400">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'} loaded
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-white">No projects found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {currentUser.role === 'ADMIN'
                    ? 'No projects exist yet. Click "Create from Transcript" above to run AI extraction on the meeting notes.'
                    : 'No projects currently assigned to your manager account.'}
                </p>
                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={() => setIsTranscriptModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                    Open Transcript Creator
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => openProjectDetail(proj.id)}
                    className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 cursor-pointer transition shadow-lg group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                          {proj.client_name}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          {proj.deadline}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-3 group-hover:text-indigo-400 transition">
                        {proj.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Manager</span>
                        <span className="font-medium text-slate-200">{proj.manager_name || 'Assigned PM'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px] uppercase">Tasks & Hours</span>
                        <span className="font-semibold text-emerald-400">
                          {proj.task_count} tasks · {proj.total_hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AGENT VIEW: MY ASSIGNED TASKS */}
        {currentUser.role === 'AGENT' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-400" />
                My Assigned Tasks ({tasks.length})
              </h3>
              <span className="text-xs text-emerald-400 font-medium">
                Total Allocated: {tasks.reduce((sum, t) => sum + t.estimated_hours, 0)} hours
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <CheckSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-white">No tasks assigned to you</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Once the administrator processes the meeting transcript, tasks assigned to{' '}
                  <strong className="text-white">{currentUser.name}</strong> will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-semibold">
                          {task.project_name || 'Project'}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          Due: {task.deadline}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-2.5">{task.title}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {task.description || 'No detailed instructions.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        {currentUser.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
                        {task.estimated_hours} Hours
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN ALL TASKS TABLE */}
        {currentUser.role === 'ADMIN' && adminTab === 'tasks' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">All Company Tasks ({tasks.length})</h3>
              <span className="text-xs text-slate-400">Aggregated across all 3 client projects</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Assigned Agent</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4 text-right">Effort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-850/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{task.title}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-xs">{task.description}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{task.project_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {task.assignee_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{task.deadline}</td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-300">{task.estimated_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================================== */}
      {/* MODAL: CREATE FROM TRANSCRIPT */}
      {/* ============================================================================== */}
      {isTranscriptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Projects from Meeting Transcript</h3>
                  <p className="text-xs text-slate-400">
                    AI analyzes transcript, maps to directory, and creates projects and tasks atomically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTranscriptModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 flex-1 flex flex-col overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Meeting Transcript Input:</label>
                <button
                  type="button"
                  onClick={() => setTranscriptText(SAMPLE_TRANSCRIPT)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
                >
                  Insert Supplied 7 Oct Transcript
                </button>
              </div>
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                rows={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Paste meeting transcript here..."
              />
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                <strong>Enforced Invariants:</strong> UrbanCart deadline 20 Oct · QuickServe integration 10h / 22 Oct · Maryam owns HelpDeskPro testing · Excludes payment gateways, inventory sync, maps, driver tracking, and non-employee Kamran.
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsTranscriptModalOpen(false)}
                disabled={isProcessingTranscript}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFromTranscript}
                disabled={isProcessingTranscript || !transcriptText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {isProcessingTranscript ? 'Processing with AI...' : 'Create Projects & Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL: PROJECT DETAIL */}
      {/* ============================================================================== */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-semibold">
                  {selectedProject.client_name}
                </span>
                <h3 className="text-lg font-bold text-white mt-2">{selectedProject.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedProject.description}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 border-b border-slate-800/80 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Manager</span>
                <span className="font-semibold text-white">{selectedProject.manager_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Project Deadline</span>
                <span className="font-semibold text-indigo-400">{selectedProject.deadline}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase">Total Work</span>
                <span className="font-semibold text-emerald-400">
                  {selectedProject.task_count} Tasks · {selectedProject.total_hours}h
                </span>
              </div>
            </div>

            <div className="py-4 flex-1 overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Assigned Tasks Breakdown ({selectedProject.tasks.length})
              </h4>
              <div className="space-y-2.5">
                {selectedProject.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">{t.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.description}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium">
                        {t.assignee_name}
                      </span>
                      <span className="text-slate-400 text-xs">{t.deadline}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
                        {t.estimated_hours}h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL: TEAM DIRECTORY */}
      {/* ============================================================================== */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">NovaWorks Team Directory</h3>
                  <p className="text-xs text-slate-400">
                    Ten pre-seeded company accounts (1 Administrator, 3 Managers, 6 Agents).
                  </p>
                </div>
              </div>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Specialization</th>
                    <th className="py-2.5 px-3">Skills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {team.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-850">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{u.specialization}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {u.skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
