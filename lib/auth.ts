import { createServerSupabaseClient } from './supabase/server';
import { createBrowserClient } from './supabase';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = createServerSupabaseClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getUser();
  
  if (!user) {
    redirect('/auth/signin');
  }
  
  return user;
}

export async function isPlatformAdmin(userId: string) {
  const supabase = createServerSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', userId)
      .single();
      
    return !error && !!data;
  } catch (error) {
    console.error('Error checking platform admin status:', error);
    return false;
  }
}

export async function getUserStores(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('store_members')
    .select(`
      store_id,
      role,
      stores (
        id,
        name,
        slug,
        plan,
        active,
        created_at
      )
    `)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching user stores:', error);
    return [];
  }
  
  return data || [];
}

export async function signOut() {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}