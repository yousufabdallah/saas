'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('🔐 بدء عملية تسجيل الدخول...');
    console.log('📧 البريد الإلكتروني:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        throw error;
      }
      
      console.log('✅ تم تسجيل الدخول بنجاح');
      console.log('👤 بيانات المستخدم:', {
        id: data.user?.id,
        email: data.user?.email,
        created_at: data.user?.created_at
      });

      toast.success('تم تسجيل الدخول بنجاح!');
      
      // التحقق من صلاحيات الأدمن
      if (data.user?.id) {
        console.log('🔍 فحص صلاحيات الأدمن...');
        
        // استعلام مباشر لفحص الأدمن
        const { data: adminCheck, error: adminError } = await supabase
          .rpc('check_platform_admin', { user_id: data.user.id });
        
        console.log('📊 نتيجة فحص الأدمن (RPC):', { adminCheck, adminError });
        
        // استعلام بديل إذا فشل RPC
        if (adminError) {
          console.log('🔄 استخدام استعلام بديل...');
          const { data: adminData, error: adminError2 } = await supabase
            .from('platform_admins')
            .select('user_id')
            .eq('user_id', data.user.id)
            .single();
          
          console.log('📊 نتيجة الاستعلام البديل:', { 
            adminData, 
            adminError2: adminError2?.message,
            adminErrorCode: adminError2?.code 
          });
          
          if (adminData && !adminError2) {
            console.log('✅ المستخدم أدمن منصة - توجيه إلى /admin');
            // تأخير قصير قبل التوجيه
            setTimeout(() => {
              window.location.href = '/admin';
            }, 500);
            return;
          }
        } else if (adminCheck) {
          console.log('✅ المستخدم أدمن منصة (RPC) - توجيه إلى /admin');
          setTimeout(() => {
            window.location.href = '/admin';
          }, 500);
          return;
        }
        
        console.log('❌ المستخدم ليس أدمن منصة - توجيه إلى /dashboard');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      toast.error(error instanceof Error ? error.message : 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('✅ تم إنشاء الحساب:', data.user?.email);
      toast.success('تم إنشاء الحساب بنجاح!');
      
      // إذا كان البريد الإلكتروني هو الأدمن، أضفه تلقائياً
      if (email === 'yousufalbahlouli@hotmail.com' && data.user?.id) {
        console.log('🔧 إضافة المستخدم كأدمن منصة...');
        const { error: adminError } = await supabase
          .from('platform_admins')
          .insert({ user_id: data.user.id });
        
        if (adminError) {
          console.error('❌ خطأ في إضافة الأدمن:', adminError);
        } else {
          console.log('✅ تم إضافة المستخدم كأدمن منصة');
        }
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء الحساب:', error);
      toast.error(error instanceof Error ? error.message : 'خطأ في إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
          </div>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>
            ادخل إلى حسابك للوصول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جار تسجيل الدخول...
                </div>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>
          
          <div className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleSignUp}
              disabled={loading}
            >
              إنشاء حساب جديد
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ليس لديك حساب؟{' '}
              <Link href="/pricing" className="text-blue-600 hover:underline">
                اشترك الآن
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}