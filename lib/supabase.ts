import { createClient } from '@supabase/supabase-js';

// Global singleton instance
let supabaseInstance: any = null;

export const createBrowserClient = () => {
  // Return existing instance if available
  if (typeof window !== 'undefined' && supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase غير مُعرّف. يرجى إعداد متغيرات البيئة في .env.local');
    
    // Return mock client for development
    const mockClient = {
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
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null })
          }),
          single: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('يجب إعداد Supabase أولاً') })
          })
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('يجب إعداد Supabase أولاً') })
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('يجب إعداد Supabase أولاً') })
        })
      }),
      rpc: () => Promise.resolve({ data: null, error: new Error('يجب إعداد Supabase أولاً') })
    } as any;
    
    if (typeof window !== 'undefined') {
      supabaseInstance = mockClient;
    }
    return mockClient;
  }
  
  // Create new instance only if not exists
  if (typeof window !== 'undefined' && !supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } else if (typeof window === 'undefined') {
    // Server-side: always create new instance
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }
  
  return supabaseInstance;
};

// Function to reset instance (for testing only)
export const resetSupabaseInstance = () => {
  if (typeof window !== 'undefined') {
    supabaseInstance = null;
  }
};