'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Store, TrendingUp, Settings, LogOut, Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface CustomerStore {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  created_at: string;
}

interface CustomerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total_cents: number;
  created_at: string;
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [customerStore, setCustomerStore] = useState<CustomerStore | null>(null);
  const [stats, setStats] = useState<CustomerStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      console.log('🔍 [CUSTOMER DASHBOARD] فحص المستخدم...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('❌ [CUSTOMER DASHBOARD] المستخدم غير مسجل دخول');
        window.location.href = '/auth/signin';
        return;
      }

      console.log('✅ [CUSTOMER DASHBOARD] المستخدم مسجل دخول:', user.email);
      setUser(user);

      // التحقق من صلاحيات الأدمن - إذا كان أدمن، توجيهه لصفحة الأدمن
      try {
        const { data: isAdmin, error: adminError } = await supabase
          .rpc('check_platform_admin', { user_id: user.id });

        if (!adminError && isAdmin) {
          console.log('🔄 [CUSTOMER DASHBOARD] المستخدم أدمن منصة، توجيه إلى /admin');
          window.location.href = '/admin';
          return;
        }
      } catch (adminCheckError) {
        console.log('⚠️ [CUSTOMER DASHBOARD] تعذر فحص صلاحيات الأدمن، متابعة كعميل عادي');
      }

      // تحميل بيانات متجر العميل
      await loadCustomerStore(user.id);
      
    } catch (error) {
      console.error('❌ [CUSTOMER DASHBOARD] خطأ في فحص المستخدم:', error);
      setLoading(false);
    }
  };

  const loadCustomerStore = async (userId: string) => {
    try {
      console.log('🏪 [CUSTOMER DASHBOARD] تحميل متجر العميل...');
      
      // البحث عن متجر العميل
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_user_id', userId)
        .single();

      if (storeError || !storeData) {
        console.log('⚠️ [CUSTOMER DASHBOARD] العميل ليس له متجر');
        setCustomerStore(null);
        setLoading(false);
        return;
      }

      console.log('✅ [CUSTOMER DASHBOARD] تم العثور على متجر العميل:', storeData.name);
      setCustomerStore(storeData);

      // تحميل إحصائيات متجر العميل فقط
      await loadCustomerStats(storeData.id);
      await loadRecentOrders(storeData.id);

    } catch (error) {
      console.error('❌ [CUSTOMER DASHBOARD] خطأ في تحميل متجر العميل:', error);
      setCustomerStore(null);
      setLoading(false);
    }
  };

  const loadCustomerStats = async (storeId: string) => {
    try {
      console.log('📊 [CUSTOMER DASHBOARD] تحميل إحصائيات متجر العميل...');
      
      // جلب منتجات المتجر
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId);

      // جلب طلبات المتجر
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_cents')
        .eq('store_id', storeId);

      if (productsError || ordersError) {
        console.log('⚠️ [CUSTOMER DASHBOARD] خطأ في تحميل الإحصائيات، استخدام قيم افتراضية');
        setStats({
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
        });
        return;
      }

      // حساب الإحصائيات من بيانات متجر العميل فقط
      const totalProducts = products?.length || 0;
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total_cents || 0), 0) / 100;
      const pendingOrders = orders?.filter(o => ['new', 'processing'].includes(o.status)).length || 0;

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
      });

      console.log('✅ [CUSTOMER DASHBOARD] إحصائيات متجر العميل:', {
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
      });

    } catch (error) {
      console.error('❌ [CUSTOMER DASHBOARD] خطأ في تحميل الإحصائيات:', error);
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
      });
    }
  };

  const loadRecentOrders = async (storeId: string) => {
    try {
      console.log('📋 [CUSTOMER DASHBOARD] تحميل الطلبات الأخيرة...');
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_name, customer_email, status, total_cents, created_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.log('⚠️ [CUSTOMER DASHBOARD] خطأ في تحميل الطلبات:', error);
        setRecentOrders([]);
        return;
      }

      setRecentOrders(orders || []);
      console.log('✅ [CUSTOMER DASHBOARD] تم تحميل الطلبات الأخيرة:', orders?.length || 0);

    } catch (error) {
      console.error('❌ [CUSTOMER DASHBOARD] خطأ في تحميل الطلبات:', error);
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 [CUSTOMER DASHBOARD] تسجيل الخروج...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [CUSTOMER DASHBOARD] خطأ في تسجيل الخروج:', error);
      toast.error('خطأ في تسجيل الخروج');
    } else {
      console.log('✅ [CUSTOMER DASHBOARD] تم تسجيل الخروج بنجاح');
      toast.success('تم تسجيل الخروج بنجاح');
      window.location.href = '/';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'new': { label: 'جديد', color: 'bg-blue-100 text-blue-800' },
      'processing': { label: 'قيد المعالجة', color: 'bg-yellow-100 text-yellow-800' },
      'shipped': { label: 'تم الشحن', color: 'bg-purple-100 text-purple-800' },
      'completed': { label: 'مكتمل', color: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-800' },
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap['new'];
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

  // إذا لم يكن للعميل متجر
  if (!customerStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            مرحباً {user?.email}
          </h1>
          <p className="text-gray-600 mb-6">
            ليس لديك متجر حتى الآن. ابدأ رحلتك التجارية بإنشاء متجرك الأول!
          </p>
          <div className="space-y-3">
            <Link href="/pricing">
              <Button className="w-full">
                <Store className="h-4 w-4 ml-2" />
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

  // إذا كان المتجر غير نشط
  if (!customerStore.active) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">متجر {customerStore.name}</h1>
                <p className="text-gray-600 mt-1">
                  مرحباً {user?.email}
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>

        {/* Inactive Store Notice */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center space-x-3 space-x-reverse">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <CardTitle className="text-orange-900">متجرك غير نشط حالياً</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-orange-800 mb-4">
                متجرك قيد المراجعة من قبل فريق الإدارة. ستتمكن من الوصول لجميع الوظائف بمجرد تفعيل متجرك.
              </p>
              <div className="flex items-center space-x-4 space-x-reverse">
                <Badge className="bg-orange-100 text-orange-800">
                  الخطة: {getPlanName(customerStore.plan)}
                </Badge>
                <Badge className="bg-red-100 text-red-800">
                  غير نشط
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const customerDashboardStats = [
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
      icon: <ShoppingCart className="h-5 w-5 text-green-600" />,
      color: 'text-green-600',
      href: '/dashboard/orders',
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.totalRevenue.toFixed(2)} ر.س`,
      icon: <DollarSign className="h-5 w-5 text-purple-600" />,
      color: 'text-purple-600',
      href: '/dashboard/analytics',
    },
    {
      title: 'الطلبات المعلقة',
      value: stats.pendingOrders.toString(),
      icon: <TrendingUp className="h-5 w-5 text-orange-600" />,
      color: 'text-orange-600',
      href: '/dashboard/orders',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">متجر {customerStore.name}</h1>
              <p className="text-gray-600 mt-1">
                مرحباً {user?.email} - صاحب المتجر
              </p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Badge className="bg-green-100 text-green-800">
                الخطة: {getPlanName(customerStore.plan)}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                نشط
              </Badge>
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
        {/* Store Info */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {customerStore.name}
                </h2>
                <p className="text-gray-600">
                  رابط المتجر: <span className="font-mono text-blue-600">{customerStore.slug}.saasy.com</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  تم الإنشاء: {new Date(customerStore.created_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-green-100 text-green-800 mb-2">
                  متجر نشط
                </Badge>
                <p className="text-sm text-gray-600">
                  الخطة: {getPlanName(customerStore.plan)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {customerDashboardStats.map((stat, index) => (
            <Link key={index} href={stat.href}>
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
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

        {/* Recent Orders */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>الطلبات الأخيرة</CardTitle>
              <Link href="/dashboard/orders">
                <Button variant="outline" size="sm">
                  عرض جميع الطلبات
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const statusInfo = getStatusBadge(order.status);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-sm text-gray-600">{order.customer_email}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {(order.total_cents / 100).toFixed(2)} ر.س
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد طلبات حتى الآن</p>
                <p className="text-sm text-gray-500">ستظهر طلبات العملاء هنا</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/products">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span>إدارة المنتجات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  أضف وأدر منتجات متجرك
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/orders">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span>إدارة الطلبات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  تتبع وإدارة طلبات العملاء
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/analytics">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span>التحليلات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  تقارير المبيعات والأداء
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/settings">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Settings className="h-5 w-5 text-orange-600" />
                  <span>إعدادات المتجر</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  إعدادات وتخصيص المتجر
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}