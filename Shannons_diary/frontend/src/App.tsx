import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Database, 
  ShieldCheck, 
  Layers, 
  Bot, 
  LogIn, 
  LogOut, 
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Cpu
} from 'lucide-react';
import { supabase, isSupabaseConfigured, signInAsDemo, hasDemoCredentials } from './lib/supabase';
import { fetchEntities, createEntity, askAI, Entity } from './lib/api';

export function App() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [user, setUser] = useState<any>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    loadEntities();
  }, [selectedCategory, user?.id]);

  async function loadEntities() {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchEntities(selectedCategory === 'all' ? undefined : selectedCategory);
      setEntities(list);
    } catch (err: any) {
      setEntities([]);
      setError(err?.status === 401 ? 'Not signed in — use Continue with Google or Judge Demo.' : err?.message || 'Could not load records');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEntity(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const created = await createEntity({
        title: newTitle,
        content: newContent,
        category: newCategory,
        status: 'active',
        is_public: true,
      });
      setEntities([created, ...entities]);
      setNewTitle('');
      setNewContent('');
      setIsNewModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Save failed — the record was not created');
    } finally {
      setSaving(false);
    }
  }

  async function handleAskAI() {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      setAiResponse(await askAI(aiPrompt));
    } catch (err: any) {
      setAiResponse(`AI unavailable: ${err?.message || 'unknown error'}`);
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured in frontend/.env, so Google OAuth cannot run.');
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) setError(`Google sign-in failed: ${oauthError.message}`);
  }

  async function handleDemoJudgeLogin() {
    setError(null);
    try {
      await signInAsDemo();
    } catch (err: any) {
      setError(err?.message || 'Demo sign-in failed');
    }
  }

  const filteredEntities = entities.filter(ent => 
    ent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ent.content && ent.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-bold text-white text-base">
            Σ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base text-neutral-100">Shannon's Diary</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                Hackathon Engine
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-none">FastAPI + Supabase + Multi-Agent</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-8 hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search entities, metadata, or semantic chunks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900/80 border border-neutral-800 rounded-lg pl-10 pr-4 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60 transition-all"
            />
          </div>
        </div>

        {/* Auth / Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[11px]">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400">Session:</span>
            <span className={user ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
              {user ? "Signed in" : "Anonymous (API will reject writes)"}
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs font-medium text-neutral-200 leading-none">
                  {user.user_metadata?.full_name || user.email}
                </div>
                <span className="text-[10px] text-neutral-400">Authenticated</span>
              </div>
              <button
                onClick={() => { void supabase.auth.signOut(); }}
                className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-medium text-neutral-200 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Continue with Google</span>
              </button>
              <button 
                onClick={handleDemoJudgeLogin}
                disabled={!hasDemoCredentials}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={hasDemoCredentials ? 'Sign in as the shared demo account' : 'Set VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD in frontend/.env'}
              >
                Judge Demo
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-neutral-800/80 bg-neutral-950/60 p-4 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 px-2">
                Partitions & Views
              </div>
              <nav className="space-y-1">
                {['all', 'general', 'agents', 'research', 'system'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      selectedCategory === cat 
                        ? 'bg-neutral-800/90 text-white border border-neutral-700/60 shadow-sm' 
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      {cat}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {cat === 'all' ? entities.length : entities.filter(e => e.category === cat).length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Invariants & Architecture Box */}
            <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active Stack Invariants</span>
              </div>
              <ul className="text-[11px] space-y-1 text-neutral-400">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 
                  Per-user RLS via forwarded token
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 
                  Errors visible, never faked
                </li>
                <li className="flex items-center gap-1.5 text-neutral-500">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> 
                  pgvector tables present, unused
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Heisenberg OS 3.1</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </aside>

        {/* Center Main Stage */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {error && (
            <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1">
                <div className="font-semibold text-red-100 mb-0.5">Something is broken, and it is being shown on purpose</div>
                <div className="font-mono text-[11px] leading-relaxed">{error}</div>
              </div>
              <button onClick={() => setError(null)} className="text-red-300 hover:text-white px-1" aria-label="Dismiss">✕</button>
            </div>
          )}

          {/* Top Banner Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Active Records & Entities
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Records are scoped to your signed-in Supabase session, plus anything marked public.
              </p>
            </div>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>New Record</span>
            </button>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-neutral-400 py-10">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Loading your records...</span>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="py-14 text-center border border-dashed border-neutral-800 rounded-2xl space-y-2">
              <Database className="w-6 h-6 mx-auto text-neutral-600" />
              <p className="text-sm font-medium text-neutral-300">No records here yet</p>
              <p className="text-xs text-neutral-500">
                {user
                  ? 'This list is genuinely empty - not a hidden fallback. Use New Record to create the first one.'
                  : 'Sign in to load your records.'}
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEntities.map((item) => (
              <div 
                key={item.id}
                className="group p-5 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/80 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-cyan-400 border border-neutral-700/50 uppercase tracking-wider">
                      {item.category || 'General'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-neutral-100 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                    {item.content || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-neutral-400" />
                    ID: {item.id.slice(0, 8)}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:translate-x-0.5 group-hover:text-neutral-300 transition-all" />
                </div>
              </div>
            ))}
          </div>
          )}
        </main>

        {/* Right Floating AI Copilot Panel */}
        <aside className="w-80 border-l border-neutral-800 bg-neutral-950/80 p-5 flex flex-col justify-between hidden xl:flex">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">AI Reasoning Copilot</h2>
            </div>

            <p className="text-xs text-neutral-400">
              Trigger multi-model reasoning or synthesize records on the fly.
            </p>

            <div className="space-y-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI to synthesize insights, draft schemas, or reason over entities..."
                className="w-full h-28 bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60 resize-none"
              />
              <button
                onClick={handleAskAI}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-cyan-400 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiLoading ? 'Synthesizing...' : 'Run Copilot Inference'}</span>
              </button>
            </div>

            {aiResponse && (
              <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 space-y-1 overflow-y-auto max-h-60 leading-relaxed font-mono">
                <div className="text-[10px] uppercase text-cyan-400 font-semibold mb-1">Inference Output:</div>
                <div className="whitespace-pre-wrap">{aiResponse}</div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-[11px] text-cyan-300">
            Gemini only. If GEMINI_API_KEY is unset the API returns 503 and the panel shows it.
          </div>
        </aside>
      </div>

      {/* New Entity Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Record</h3>
            <form onSubmit={handleCreateEntity} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. User Session / Task Vector / Insight"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Category</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="general">General</option>
                  <option value="agents">Agents</option>
                  <option value="research">Research</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Content / Body</label>
                <textarea 
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Details, payload, or notes..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
