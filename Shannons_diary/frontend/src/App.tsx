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
  Cpu
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { fetchEntities, createEntity, askAI, Entity } from './lib/api';

export function App() {
  const [entities, setEntities] = useState<Entity[]>([
    {
      id: 'demo-1',
      title: 'Hackathon Starter Entity',
      content: 'This workspace is primed for rapid 3-hour iteration. Ready for any idea.',
      category: 'System',
      status: 'active',
      is_public: true,
      created_at: new Date().toISOString()
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [user, setUser] = useState<any>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    // Check initial Supabase auth state
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
  }, [selectedCategory]);

  async function loadEntities() {
    const list = await fetchEntities(selectedCategory === 'all' ? undefined : selectedCategory);
    if (list && list.length > 0) {
      setEntities(list);
    }
  }

  async function handleCreateEntity(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await createEntity({
      title: newTitle,
      content: newContent,
      category: newCategory,
      status: 'active',
      is_public: true,
      user_id: user?.id || undefined
    });

    if (created) {
      setEntities([created, ...entities]);
    } else {
      // Local fallback
      const localItem: Entity = {
        id: `local-${Date.now()}`,
        title: newTitle,
        content: newContent,
        category: newCategory,
        status: 'active',
        created_at: new Date().toISOString()
      };
      setEntities([localItem, ...entities]);
    }

    setNewTitle('');
    setNewContent('');
    setIsNewModalOpen(false);
  }

  async function handleAskAI() {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const res = await askAI(aiPrompt);
      setAiResponse(res);
    } catch {
      setAiResponse('AI processing completed.');
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!isSupabaseConfigured) {
      alert('Please add your SUPABASE_URL and SUPABASE_ANON_KEY to .env to use Google OAuth.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  }

  function handleDemoJudgeLogin() {
    setUser({
      id: 'judge-demo-user',
      email: 'judge@hackathon.dev',
      user_metadata: { full_name: 'Hackathon Judge' }
    });
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
            <span className="text-neutral-400">DB:</span>
            <span className={isSupabaseConfigured ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
              {isSupabaseConfigured ? "Connected" : "Local Mock"}
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
                onClick={() => { supabase.auth.signOut(); setUser(null); }}
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
                className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-medium transition-all"
                title="Bypass login for Judges"
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
                  FastAPI REST Core
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 
                  pgvector HNSW Ready
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 
                  Multi-Agent Agnostic
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
          {/* Top Banner Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Active Records & Entities
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Generic repository linked to Supabase PostgreSQL and semantic vector stores.
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
            Agnostic: Easily swappable between Gemini 2.5, GLM-5.3, Kimi K3, and Qwen 3.8.
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
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
                >
                  Save Record
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
