import { createClient } from '@supabase/supabase-js';

export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'your_supabase_project_url' || 
      supabaseAnonKey === 'your_supabase_anon_key' ||
      supabaseUrl === 'https://your-project.supabase.co' ||
      supabaseAnonKey === 'your_anon_key_here') {
    // Return a mock client for build-time when env vars are missing
    return {
      auth: {
        signInWithPassword: () => Promise.resolve({ 
          data: null, 
          error: new Error('يجب إعداد Supabase أولاً. يرجى إضافة URL و API Key في ملف .env.local') 
        }),
        signUp: () => Promise.resolve({ 
          data: null, 
          error: new Error('يجب إعداد Supabase أولاً. يرجى إضافة URL و API Key في ملف .env.local') 
        }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ 
          data: null, 
          error: new Error('يجب إعداد Supabase أولاً') 
        }),
        update: () => Promise.resolve({ 
          data: null, 
          error: new Error('يجب إعداد Supabase أولاً') 
        }),
        delete: () => Promise.resolve({ 
          data: null, 
          error: new Error('يجب إعداد Supabase أولاً') 
        })
      })
    } as any;
  }
  
  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
};