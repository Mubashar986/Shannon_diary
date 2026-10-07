import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id') &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key'),
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const hasDemoCredentials = Boolean(
  import.meta.env.VITE_DEMO_EMAIL && import.meta.env.VITE_DEMO_PASSWORD,
);

/**
 * Judge Demo must produce a real Supabase session, because the API now rejects
 * anonymous requests. This signs into a shared demo account, so that account must
 * hold nothing you would not show a stranger.
 */
export async function signInAsDemo(): Promise<void> {
  const email = import.meta.env.VITE_DEMO_EMAIL;
  const password = import.meta.env.VITE_DEMO_PASSWORD;
  if (!email || !password) {
    throw new Error('Judge demo is not configured. Set VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD in frontend/.env, then create the user with database/seed_demo_user.py.');
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Demo sign-in failed: ${error.message}`);
}
