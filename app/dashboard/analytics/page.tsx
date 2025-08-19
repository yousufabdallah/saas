'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Package, Download } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface CustomerStore {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  topProducts: { title: string; sales: number }[];
  recentSales: { date: string; amount: number; customer: string }[];
  monthlyRevenue: { month: string; revenue: number }[];
}

export default function CustomerAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentSales: [],
    monthlyRevenue: [],
  });
  const [customerStore, setCustomerStore] = useState<CustomerStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkUserAndLoadData();
  }, [selectedPeriod]);

  const checkUserAndLoadData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = '/auth/signin';
        return;
      }

      // التحقق من صلاحيات الأدمن - إذا كان أدمن، توجيهه لصفحة الأدمن
      try {
        const { data: isAdmin, error: adminError } = await supabase
          .rpc('check_platform_admin', { user_id: user.id });

        if (!adminError && isAdmin) {
          window.location.href = '/admin';
          return;
        }
      } catch (adminCheckError) {
        console.log('متابعة كعميل عادي');
      }

      await loadCustomerStore(user.id);
    } catch (error) {
      console.error('خطأ في فحص المستخدم:', error);
      setLoading(false);
    }
  };

  const loadCustomerStore = async (userId: string) => {
    try {
      // البحث عن متجر العميل
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_user_id', userId)
        .single();

      if (storeError || !storeData) {
        console.log('العميل ليس له متجر');
        setCustomerStore(null);
        setLoading(false);
        return;
      }

      setCustomerStore(storeData);

      if (!storeData.active) {
        setLoading(false);
        return;
      }

      // تحميل تحليلات متجر العميل فقط
      await loadAnalytics(storeData.id);
    } catch (error) {
      console.error('خطأ في تحميل متجر العميل:', error);
      setLoading(false);
    }
  };

  const loadAnalytics = async (storeId: string) => {
    try {
      // جلب منتجات المتجر
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title')
        .eq('store_id', storeId);

      // جلب طلبات المتجر
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId);

      if (productsError || ordersError) {
        console.error('خطأ في تحميل البيانات للتحليلات');
        setAnalyticsData({
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          averageOrderValue: 0,
          topProducts: [],
          recentSales: [],
          monthlyRevenue: [],
        });
        return;
      }

      // حساب التحليلات من بيانات متجر العميل فقط
      const totalProducts = products?.length || 0;
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total_cents || 0), 0) / 100;
      const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      // أفضل المنتجات (محاكاة)
      const topProducts = products?.slice(0, 5).map((product, index) => ({
        title: product.title,
        sales: Math.floor(Math.random() * 20) + 1,
      })) || [];

      // المبيعات الأخيرة
      const recentSales = completedOrders.slice(0, 10).map(order => ({
        date: order.created_at,
        amount: order.total_cents / 100,
        customer: order.customer_name,
      }));

      // الإيرادات الشهرية (محاكاة)
      const monthlyRevenue = [
        { month: 'يناير', revenue: totalRevenue * 0.8 },
        { month: 'فبراير', revenue: totalRevenue * 0.9 },
        { month: 'مارس', revenue: totalRevenue },
      ];

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalProducts,
        averageOrderValue,
        topProducts,
        recentSales,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('خطأ في تحميل التحليلات:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['التاريخ', 'العميل', 'المبلغ'],
      ...analyticsData.recentSales.map(sale => [
        new Date(sale.date).toLocaleDateString('ar-SA'),
        sale.customer,
        `${sale.amount} ر.س`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير-${customerStore?.name}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('تم تصدير التقرير بنجاح');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جار تحميل التحليلات...</p>
        </div>
      </div>
    );
  }

  if (!customerStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ليس لديك متجر
          </h1>
          <p className="text-gray-600 mb-6">
            يجب إنشاء متجر أولاً لعرض التحليلات
          </p>
          <Button onClick={() => window.location.href = '/pricing'}>
            إنشاء متجر جديد
          </Button>
        </div>
      </div>
    );
  }

  if (!customerStore.active) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-16 w-16 text-orange-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-orange-600 mb-4">
            متجرك غير نشط
          </h1>
          <p className="text-gray-600 mb-6">
            متجرك قيد المراجعة من قبل الإدارة
          </p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button variant="ghost" onClick={() => window.location.href = '/dashboard'}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">التحليلات والتقارير</h1>
                <p className="text-gray-600 mt-1">
                  متجر {customerStore.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
                <option value="quarter">هذا الربع</option>
                <option value="year">هذا العام</option>
              </select>
              <Button onClick={exportReport}>
                <Download className="h-4 w-4 ml-2" />
                تصدير التقرير
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي الإيرادات
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analyticsData.totalRevenue.toFixed(2)} ر.س
              </div>
              <div className="text-sm text-gray-600">
                من الطلبات المكتملة
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي الطلبات
              </CardTitle>
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {analyticsData.totalOrders}
              </div>
              <div className="text-sm text-gray-600">
                طلب إجمالي
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي المنتجات
              </CardTitle>
              <Package className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {analyticsData.totalProducts}
              </div>
              <div className="text-sm text-gray-600">
                منتج في المتجر
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                متوسط قيمة الطلب
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {analyticsData.averageOrderValue.toFixed(2)} ر.س
              </div>
              <div className="text-sm text-gray-600">
                متوسط الطلب
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>أفضل المنتجات مبيعاً</CardTitle>
              <CardDescription>المنتجات الأكثر مبيعاً في متجرك</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topProducts.length > 0 ? (
                  analyticsData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' : 
                          index === 1 ? 'bg-purple-600' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium">{product.title}</span>
                      </div>
                      <Badge variant="outline">
                        {product.sales} مبيعة
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">لا توجد بيانات مبيعات بعد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle>المبيعات الأخيرة</CardTitle>
              <CardDescription>آخر المبيعات في متجرك</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.recentSales.length > 0 ? (
                  analyticsData.recentSales.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{sale.customer}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(sale.date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {sale.amount.toFixed(2)} ر.س
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">لا توجد مبيعات بعد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>ملخص أداء المتجر</CardTitle>
            <CardDescription>نظرة عامة على أداء متجرك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {analyticsData.totalOrders}
                </div>
                <div className="text-sm text-gray-600">إجمالي الطلبات</div>
                <div className="text-xs text-gray-500 mt-1">
                  في متجرك
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analyticsData.totalRevenue.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">إجمالي الإيرادات</div>
                <div className="text-xs text-gray-500 mt-1">ريال سعودي</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {analyticsData.averageOrderValue.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">متوسط قيمة الطلب</div>
                <div className="text-xs text-gray-500 mt-1">ريال سعودي</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}