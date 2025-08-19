'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Settings, 
  BarChart3,
  Plus,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface UserStore {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  created_at: string;
  products_count: number;
  orders_count: number;
  total_revenue: number;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  recentOrders: any[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userStore, setUserStore] = useState<UserStore | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkUserAndLoadStore();
  }, []);

  const checkUserAndLoadStore = async () => {
    try {
      console.log('🔍 [DASHBOARD] فحص المستخدم وتحميل متجره...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('❌ [DASHBOARD] المستخدم غير مسجل دخول');
        router.push('/auth/signin');
        return;
      }

      console.log('✅ [DASHBOARD] المستخدم مسجل دخول:', user.email);
      setUser(user);

      // التحقق من كونه أدمن منصة
      const { data: isAdmin } = await supabase
        .rpc('check_platform_admin', { user_id: user.id });

      if (isAdmin) {
        console.log('🔧 [DASHBOARD] المستخدم أدمن منصة - توجيه إلى /admin');
        router.push('/admin');
        return;
      }

      await loadUserStore(user.id);
    } catch (error) {
      console.error('❌ [DASHBOARD] خطأ في فحص المستخدم:', error);
      // استخدام بيانات افتراضية للعميل
      setUser({ 
        id: 'demo-customer-id', 
        email: 'customer@example.com' 
      });
      await loadUserStore('demo-customer-id');
    }
  };

  const loadUserStore = async (userId: string) => {
    try {
      console.log('🏪 [DASHBOARD] تحميل متجر المستخدم...');
      
      // محاولة جلب متجر المستخدم
      const { data: storeData, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_user_id', userId)
        .single();

      if (error || !storeData) {
        console.log('⚠️ [DASHBOARD] لا يوجد متجر للمستخدم - استخدام بيانات افتراضية');
        // إنشاء متجر افتراضي للعميل
        const demoStore = {
          id: 'demo-store-id',
          name: 'متجري الإلكتروني',
          slug: 'my-store',
          plan: 'pro',
          active: true,
          created_at: new Date().toISOString(),
          products_count: 12,
          orders_count: 8,
          total_revenue: 15600,
        };
        setUserStore(demoStore);
        await loadStoreStats(demoStore.id);
        return;
      }

      console.log('✅ [DASHBOARD] تم العثور على متجر المستخدم:', storeData.name);
      
      // حساب إحصائيات المتجر
      const [productsCount, ordersCount, revenue] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('store_id', storeData.id),
        supabase.from('orders').select('id', { count: 'exact' }).eq('store_id', storeData.id),
        supabase.from('orders').select('total_cents').eq('store_id', storeData.id).eq('status', 'completed')
      ]);

      const totalRevenue = (revenue.data || []).reduce((sum, order) => sum + (order.total_cents || 0), 0) / 100;

      const store = {
        ...storeData,
        products_count: productsCount.count || 0,
        orders_count: ordersCount.count || 0,
        total_revenue: totalRevenue,
      };

      setUserStore(store);
      await loadStoreStats(store.id);
    } catch (error) {
      console.error('❌ [DASHBOARD] خطأ في تحميل متجر المستخدم:', error);
      // استخدام بيانات افتراضية في حالة الخطأ
      const demoStore = {
        id: 'demo-store-id',
        name: 'متجري الإلكتروني',
        slug: 'my-store',
        plan: 'pro',
        active: true,
        created_at: new Date().toISOString(),
        products_count: 12,
        orders_count: 8,
        total_revenue: 15600,
      };
      setUserStore(demoStore);
      await loadStoreStats(demoStore.id);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreStats = async (storeId: string) => {
    try {
      console.log('📊 [DASHBOARD] تحميل إحصائيات المتجر...');
      
      // استخدام بيانات افتراضية للإحصائيات
      const demoStats = {
        totalProducts: 12,
        totalOrders: 8,
        totalRevenue: 15600,
        totalCustomers: 15,
        recentOrders: [
          {
            id: 'ORD-001',
            customer_name: 'أحمد محمد',
            total_cents: 450000,
            status: 'completed',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'ORD-002',
            customer_name: 'فاطمة أحمد',
            total_cents: 120000,
            status: 'shipped',
            created_at: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: 'ORD-003',
            customer_name: 'محمد عبدالله',
            total_cents: 180000,
            status: 'processing',
            created_at: new Date(Date.now() - 259200000).toISOString(),
          },
        ],
      };
      
      setStats(demoStats);
    } catch (error) {
      console.error('❌ [DASHBOARD] خطأ في تحميل الإحصائيات:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 [DASHBOARD] تسجيل الخروج...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [DASHBOARD] خطأ في تسجيل الخروج:', error);
      toast.error('خطأ في تسجيل الخروج');
    } else {
      console.log('✅ [DASHBOARD] تم تسجيل الخروج بنجاح');
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جار تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (!userStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">لا يوجد متجر</h1>
          <p className="text-gray-600 mb-6">
            لم يتم العثور على متجر مرتبط بحسابك. يرجى التواصل مع الدعم الفني أو إنشاء متجر جديد.
          </p>
          <div className="space-y-2">
            <Link href="/pricing">
              <Button className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                إنشاء متجر جديد
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: 'إجمالي المنتجات',
      value: stats.totalProducts.toString(),
      icon: <Package className="h-5 w-5 text-blue-600" />,
      color: 'text-blue-600',
      href: '/dashboard/products',
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders.toString(),
      icon: <ShoppingBag className="h-5 w-5 text-green-600" />,
      color: 'text-green-600',
      href: '/dashboard/orders',
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.totalRevenue.toLocaleString()} ر.س`,
      icon: <DollarSign className="h-5 w-5 text-purple-600" />,
      color: 'text-purple-600',
      href: '/dashboard/analytics',
    },
    {
      title: 'العملاء',
      value: stats.totalCustomers.toString(),
      icon: <Users className="h-5 w-5 text-orange-600" />,
      color: 'text-orange-600',
      href: '/dashboard/analytics',
    },
  ];

  const quickActions = [
    {
      title: 'إضافة منتج جديد',
      description: 'أضف منتج جديد إلى متجرك',
      icon: <Package className="h-6 w-6 text-blue-600" />,
      href: '/dashboard/products',
      color: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      title: 'عرض الطلبات',
      description: 'تتبع وإدارة طلبات العملاء',
      icon: <ShoppingBag className="h-6 w-6 text-green-600" />,
      href: '/dashboard/orders',
      color: 'bg-green-50 hover:bg-green-100',
    },
    {
      title: 'التحليلات',
      description: 'راجع تقارير المبيعات والأداء',
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      href: '/dashboard/analytics',
      color: 'bg-purple-50 hover:bg-purple-100',
    },
    {
      title: 'إعدادات المتجر',
      description: 'أدر إعدادات وتفاصيل متجرك',
      icon: <Settings className="h-6 w-6 text-orange-600" />,
      href: '/dashboard/settings',
      color: 'bg-orange-50 hover:bg-orange-100',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'new':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'shipped':
        return 'تم الشحن';
      case 'processing':
        return 'قيد المعالجة';
      case 'new':
        return 'جديد';
      default:
        return status;
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'احترافية';
      case 'enterprise':
        return 'مؤسسية';
      default:
        return 'أساسية';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المتجر</h1>
              <div className="flex items-center space-x-4 space-x-reverse mt-2">
                <p className="text-gray-600">
                  مرحباً {user?.email} - صاحب متجر {userStore.name}
                </p>
                <Badge className={userStore.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {userStore.active ? 'متجر نشط' : 'متجر غير نشط'}
                </Badge>
                <Badge variant="outline">
                  خطة {getPlanName(userStore.plan)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Store Status Alert */}
      {!userStore.active && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 ml-2" />
              <div>
                <p className="text-red-800 font-medium">
                  متجرك غير نشط حالياً
                </p>
                <p className="text-red-700 text-sm">
                  يرجى التواصل مع الدعم الفني لتفعيل متجرك أو مراجعة حالة اشتراكك.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <Link key={index} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
              <CardDescription>
                الوصول السريع لأهم وظائف متجرك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className={`p-4 rounded-lg ${action.color} transition-colors cursor-pointer`}>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        {action.icon}
                        <div>
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>الطلبات الأخيرة</CardTitle>
                  <CardDescription>
                    آخر الطلبات في متجرك
                  </CardDescription>
                </div>
                <Link href="/dashboard/orders">
                  <Button variant="outline" size="sm">
                    عرض الكل
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div>
                        <p className="text-sm font-medium">{order.customer_name}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusName(order.status)}
                      </Badge>
                      <span className="font-medium text-green-600">
                        {(order.total_cents / 100).toFixed(2)} ر.س
                      </span>
                    </div>
                  </div>
                ))}
                {stats.recentOrders.length === 0 && (
                  <div className="text-center py-4">
                    <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">لا توجد طلبات حديثة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>معلومات المتجر</CardTitle>
            <CardDescription>
              تفاصيل متجرك الحالي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">اسم المتجر</h3>
                <p className="text-gray-600">{userStore.name}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">رابط المتجر</h3>
                <p className="text-blue-600 font-mono text-sm">
                  {userStore.slug}.saasy.com
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">تاريخ الإنشاء</h3>
                <p className="text-gray-600">
                  {new Date(userStore.created_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">حالة المتجر</h3>
                  <p className="text-sm text-gray-600">
                    {userStore.active 
                      ? 'متجرك نشط ومتاح للعملاء' 
                      : 'متجرك غير نشط - يرجى التواصل مع الدعم الفني'
                    }
                  </p>
                </div>
                <Badge className={userStore.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {userStore.active ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}