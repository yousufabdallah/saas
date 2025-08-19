'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // تسجيل حساب جديد
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Email signups are disabled')) {
            toast.error('تسجيل الحسابات الجديدة معطل. يرجى التواصل مع الإدارة.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          toast.success('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
          setIsSignUp(false);
        }
      } else {
        // تسجيل الدخول
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error('خطأ في تسجيل الدخول: ' + error.message);
          return;
        }

        if (data.user) {
          toast.success('تم تسجيل الدخول بنجاح!');
          
          // التحقق من صلاحيات الأدمن
          try {
            const { data: isAdmin, error: adminError } = await supabase
              .rpc('check_platform_admin', { user_id: data.user.id });

            if (!adminError && isAdmin) {
              // توجيه الأدمن إلى لوحة الأدمن
              router.push('/admin');
            } else {
              // توجيه العميل العادي إلى لوحة التحكم
              router.push('/dashboard');
            }
          } catch (adminCheckError) {
            console.log('تعذر فحص صلاحيات الأدمن، توجيه إلى لوحة التحكم العادية');
            router.push('/dashboard');
          }
        }
      }
    } catch (error) {
      console.error('خطأ في المصادقة:', error);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <LogIn className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'أنشئ حساباً جديداً للبدء في استخدام المنصة'
              : 'سجل دخولك للوصول إلى لوحة التحكم'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  {isSignUp ? 'جار إنشاء الحساب...' : 'جار تسجيل الدخول...'}
                </div>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus className="h-4 w-4 ml-2" />
                      إنشاء حساب
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 ml-2" />
                      تسجيل الدخول
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}
            </p>
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700"
            >
              {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/">
              <Button variant="ghost" className="text-gray-600">
                العودة للصفحة الرئيسية
              </Button>
            </Link>
          </div>

          {/* معلومات تجريبية للاختبار */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">للاختبار:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>أدمن المنصة:</strong></p>
              <p>البريد: yousufalbahlouli@hotmail.com</p>
              <p>كلمة المرور: 96327566</p>
              <hr className="my-2 border-blue-200" />
              <p><strong>عميل عادي:</strong></p>
              <p>أنشئ حساب جديد بأي بريد إلكتروني</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}