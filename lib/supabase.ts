import { createClient } from '@supabase/supabase-js';

// Singleton instance
let supabaseInstance: any = null;

export const createBrowserClient = () => {
  // إذا كان هناك instance موجود، أرجعه
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // التحقق من وجود متغيرات البيئة
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase غير مُعرّف. يرجى إعداد متغيرات البيئة في .env.local');
    
    // إرجاع client وهمي للتطوير
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
      })
    } as any;
    
    supabaseInstance = mockClient;
    return mockClient;
  }
  
  // إنشاء instance جديد فقط إذا لم يكن موجود
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  
  return supabaseInstance;
};

// دالة لإعادة تعيين instance (للاختبار فقط)
export const resetSupabaseInstance = () => {
  supabaseInstance = null;
};