'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, User, ArrowLeft, Store } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 [SIGNIN] محاولة تسجيل الدخول:', formData.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('❌ [SIGNIN] خطأ في تسجيل الدخول:', error);
        toast.error('خطأ في تسجيل الدخول: ' + error.message);
        return;
      }

      if (data.user) {
        console.log('✅ [SIGNIN] تم تسجيل الدخول بنجاح:', data.user.email);
        toast.success('تم تسجيل الدخول بنجاح');

        // التحقق من صلاحيات الأدمن
        try {
          const { data: isAdmin, error: adminError } = await supabase
            .rpc('check_platform_admin', { user_id: data.user.id });

          if (!adminError && isAdmin) {
            console.log('🔄 [SIGNIN] المستخدم أدمن منصة، توجيه إلى /admin');
            router.push('/admin');
          } else {
            console.log('🔄 [SIGNIN] المستخدم عميل عادي، توجيه إلى /dashboard');
            router.push('/dashboard');
          }
        } catch (adminCheckError) {
          console.log('⚠️ [SIGNIN] تعذر فحص صلاحيات الأدمن، توجيه إلى /dashboard');
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('❌ [SIGNIN] خطأ عام في تسجيل الدخول:', error);
      toast.error('حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 [SIGNUP] محاولة إنشاء حساب جديد:', formData.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('❌ [SIGNUP] خطأ في إنشاء الحساب:', error);
        toast.error('خطأ في إنشاء الحساب: ' + error.message);
        return;
      }

      if (data.user) {
        console.log('✅ [SIGNUP] تم إنشاء الحساب بنجاح:', data.user.email);
        
        // إنشاء متجر مجاني تلقائياً
        try {
          const storeName = `متجر ${formData.email.split('@')[0]}`;
          const storeSlug = formData.email.split('@')[0].toLowerCase() + '-' + Math.random().toString(36).substring(2, 6);
          
          const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .insert({
              name: storeName,
              slug: storeSlug,
              owner_user_id: data.user.id,
              plan: 'basic',
              active: true,
            })
            .select()
            .single();

          if (!storeError && storeData) {
            // إضافة المستخدم كمالك للمتجر
            await supabase
              .from('store_members')
              .insert({
                store_id: storeData.id,
                user_id: data.user.id,
                role: 'owner',
              });

            console.log('✅ [SIGNUP] تم إنشاء متجر مجاني:', storeName);
            toast.success('تم إنشاء حسابك ومتجرك المجاني بنجاح!');
          } else {
            console.log('⚠️ [SIGNUP] تعذر إنشاء المتجر التلقائي');
            toast.success('تم إنشاء حسابك بنجاح! يمكن إنشاء متجر لاحقاً');
          }
        } catch (storeCreationError) {
          console.log('⚠️ [SIGNUP] خطأ في إنشاء المتجر التلقائي:', storeCreationError);
          toast.success('تم إنشاء حسابك بنجاح! يمكن إنشاء متجر لاحقاً');
        }

        // تسجيل الدخول تلقائياً والتوجيه
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('❌ [SIGNUP] خطأ عام في إنشاء الحساب:', error);
      toast.error('حدث خطأ في إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 space-x-reverse mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SaaSy
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            مرحباً بك
          </h2>
          <p className="text-gray-600">
            سجل دخولك أو أنشئ حساب جديد للبدء
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signin-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signin-password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signin-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="كلمة المرور"
                        className="pl-10"
                        required
                      />
                    </div>
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
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Store className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-800 font-medium">
                      🎉 متجر مجاني فوراً!
                    </p>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    سيتم إنشاء متجرك الإلكتروني المجاني تلقائياً عند التسجيل
                  </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="كلمة المرور (6 أحرف على الأقل)"
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="تأكيد كلمة المرور"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        جار إنشاء الحساب...
                      </div>
                    ) : (
                      <>
                        <Store className="h-4 w-4 ml-2" />
                        إنشاء حساب + متجر مجاني
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-600">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </div>

        {/* Demo Accounts */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">حسابات تجريبية</CardTitle>
            <CardDescription className="text-blue-700">
              للاختبار السريع
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white p-3 rounded-md border">
              <p className="text-sm font-medium text-gray-900 mb-1">حساب الأدمن:</p>
              <p className="text-xs text-gray-600">البريد: yousufalbahlouli@hotmail.com</p>
              <p className="text-xs text-gray-600">كلمة المرور: 96327566</p>
            </div>
            <div className="bg-white p-3 rounded-md border">
              <p className="text-sm font-medium text-gray-900 mb-1">حساب عميل:</p>
              <p className="text-xs text-gray-600">أنشئ حساب جديد للحصول على متجر مجاني</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}