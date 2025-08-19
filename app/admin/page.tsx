'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Store, TrendingUp, Settings, LogOut } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        console.log('🔍 [ADMIN PAGE] فحص وصول الأدمن...');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('❌ [ADMIN PAGE] لا يوجد مستخدم مسجل دخول');
          router.push('/auth/signin');
          return;
        }

        console.log('👤 [ADMIN PAGE] المستخدم الحالي:', user.email);
        setUser(user);

        // التحقق من صلاحيات الأدمن باستخدام RPC
        console.log('🔍 [ADMIN PAGE] فحص صلاحيات الأدمن باستخدام RPC...');
        const { data: isAdmin, error: rpcError } = await supabase
          .rpc('check_platform_admin', { user_id: user.id });

        console.log('🔍 [ADMIN PAGE] نتيجة فحص صلاحيات الأدمن:', {
          isAdmin,
          rpcError: rpcError?.message,
          userId: user.id,
          userEmail: user.email
        });

        if (rpcError || !isAdmin) {
          console.log('❌ [ADMIN PAGE] المستخدم ليس أدمن منصة');
          console.log('🔄 [ADMIN PAGE] محاولة استعلام بديل...');
          
          // استعلام بديل
          const { data: adminData, error: adminError } = await supabase
            .from('platform_admins')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
          
          console.log('📊 [ADMIN PAGE] نتيجة الاستعلام البديل:', {
            adminData,
            adminError: adminError?.message
          });
          
          if (adminError || !adminData) {
            console.log('❌ [ADMIN PAGE] فشل في التحقق من صلاحيات الأدمن');
            toast.error('ليس لديك صلاحيات للوصول إلى لوحة الأدمن');
            router.push('/dashboard');
            return;
          }
        }

        console.log('✅ [ADMIN PAGE] المستخدم أدمن منصة - عرض لوحة الأدمن');
        setIsAdmin(true);
        await loadStats();
      } catch (error) {
        console.error('❌ [ADMIN PAGE] خطأ في فحص وصول الأدمن:', error);
        toast.error('حدث خطأ في التحقق من الصلاحيات');
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router, supabase]);

  const loadStats = async () => {
    try {
      console.log('📊 [ADMIN PAGE] تحميل الإحصائيات...');
      
      // إحصائيات المتاجر
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, active');

      // إحصائيات المستخدمين (تقريبية)
      const { data: members, error: membersError } = await supabase
        .from('store_members')
        .select('user_id');

      if (!storesError && stores) {
        console.log('📊 [ADMIN PAGE] إحصائيات المتاجر:', stores.length);
        setStats(prev => ({
          ...prev,
          totalStores: stores.length,
          activeSubscriptions: stores.filter((s: { active: boolean }) => s.active).length,
        }));
      }

      if (!membersError && members) {
        const uniqueUsers = new Set(members.map(m => m.user_id));
        console.log('📊 [ADMIN PAGE] إحصائيات المستخدمين:', uniqueUsers.size);
        setStats(prev => ({
          ...prev,
          totalUsers: uniqueUsers.size,
        }));
      }
    } catch (error) {
      console.error('❌ [ADMIN PAGE] خطأ في تحميل الإحصائيات:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 [ADMIN PAGE] تسجيل الخروج...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [ADMIN PAGE] خطأ في تسجيل الخروج:', error);
      toast.error('خطأ في تسجيل الخروج');
    } else {
      console.log('✅ [ADMIN PAGE] تم تسجيل الخروج بنجاح');
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جار التحقق من صلاحيات الأدمن...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">ليس لديك صلاحيات</h1>
          <p className="text-gray-600 mb-4">ليس لديك صلاحيات للوصول إلى لوحة الأدمن</p>
          <Button onClick={() => router.push('/dashboard')}>
            العودة إلى لوحة التحكم
          </Button>
        </div>
      </div>
    );
  }
          toast.error('ليس لديك صلاحيات للوصول إلى لوحة الأدمن');
          router.push('/dashboard');
          return;
        }

        console.log('✅ المستخدم أدمن منصة - عرض لوحة الأدمن');
        setIsAdmin(true);
        await loadStats();
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router, supabase]);

  const loadStats = async () => {
    try {
      // إحصائيات المتاجر
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, active');

      // إحصائيات المستخدمين (تقريبية)
      const { data: members, error: membersError } = await supabase
        .from('store_members')
        .select('user_id');

      if (!storesError && stores) {
        setStats(prev => ({
          ...prev,
          totalStores: stores.length,
          activeSubscriptions: stores.filter((s: { active: boolean }) => s.active).length,
        }));
      }

      if (!membersError && members) {
        const uniqueUsers = new Set(members.map(m => m.user_id));
        setStats(prev => ({
          ...prev,
          totalUsers: uniqueUsers.size,
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('خطأ في تسجيل الخروج');
    } else {
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const adminStats = [
    {
      title: 'إجمالي المتاجر',
      value: stats.totalStores.toString(),
      icon: <Store className="h-5 w-5 text-blue-600" />,
      color: 'text-blue-600',
    },
    {
      title: 'المستخدمين النشطين',
      value: stats.totalUsers.toString(),
      icon: <Users className="h-5 w-5 text-green-600" />,
      color: 'text-green-600',
    },
    {
      title: 'الاشتراكات النشطة',
      value: stats.activeSubscriptions.toString(),
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الأدمن</h1>
              <p className="text-gray-600 mt-1">
                مرحباً {user?.email} - أدمن المنصة
              </p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                أدمن منصة
              </Badge>
              <Button variant="outline">
                <Settings className="h-4 w-4 ml-2" />
                إعدادات المنصة
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {adminStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المتاجر</CardTitle>
              <CardDescription>
                عرض وإدارة جميع المتاجر في المنصة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                عرض جميع المتاجر
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
              <CardDescription>
                عرض وإدارة حسابات المستخدمين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                عرض جميع المستخدمين
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات الخطط</CardTitle>
              <CardDescription>
                إدارة خطط الاشتراك والأسعار
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                إدارة الخطط
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>التقارير المالية</CardTitle>
              <CardDescription>
                عرض تقارير الإيرادات والمبيعات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                عرض التقارير
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}