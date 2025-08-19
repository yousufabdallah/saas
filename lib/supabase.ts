import { createClient } from '@supabase/supabase-js';

export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // التحقق من وجود متغيرات البيئة
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://hvkiutapcccmhrijkquo.supabase.co' || 
      supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a2l1dGFwY2NjbWhyaWprcXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjEyMDgsImV4cCI6MjA3MTE5NzIwOH0.bXwCp-2CtVgfjtYfyZsNFsriWN6aDydEHI0gPcxE8WA') {
    
    console.warn('⚠️ Supabase غير مُعرّف. يرجى إعداد متغيرات البيئة في .env.local');
    
    // إرجاع client وهمي للتطوير
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
      })
    } as any;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};