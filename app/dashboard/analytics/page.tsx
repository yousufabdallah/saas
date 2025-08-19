'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Download } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  topProducts: { name: string; sales: number; revenue: number }[];
  recentSales: { date: string; amount: number; customer: string }[];
  salesByMonth: { month: string; sales: number; revenue: number }[];
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0,
    topProducts: [],
    recentSales: [],
    salesByMonth: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // استخدام بيانات افتراضية مؤقتاً
      const demoAnalytics = {
        totalRevenue: 1420000 / 100, // 14,200 ر.س
        totalOrders: 89,
        totalCustomers: 156,
        averageOrderValue: 159.55,
        monthlyGrowth: 12.5,
        topProducts: [
          { name: 'جهاز لابتوب Dell XPS 13', sales: 15, revenue: 67500 },
          { name: 'سماعات Sony WH-1000XM4', sales: 25, revenue: 30000 },
          { name: 'هاتف iPhone 15 Pro', sales: 8, revenue: 44000 },
          { name: 'ساعة Apple Watch Series 9', sales: 12, revenue: 21600 },
          { name: 'تابلت iPad Pro', sales: 6, revenue: 18000 },
        ],
        recentSales: [
          { date: '2024-01-20', amount: 4500, customer: 'أحمد محمد' },
          { date: '2024-01-19', amount: 1200, customer: 'فاطمة أحمد' },
          { date: '2024-01-19', amount: 5500, customer: 'محمد عبدالله' },
          { date: '2024-01-18', amount: 1800, customer: 'نورا سالم' },
          { date: '2024-01-18', amount: 3200, customer: 'خالد يوسف' },
        ],
        salesByMonth: [
          { month: 'يناير', sales: 89, revenue: 14200 },
          { month: 'ديسمبر', sales: 76, revenue: 12100 },
          { month: 'نوفمبر', sales: 65, revenue: 10800 },
          { month: 'أكتوبر', sales: 58, revenue: 9500 },
          { month: 'سبتمبر', sales: 52, revenue: 8900 },
          { month: 'أغسطس', sales: 48, revenue: 8200 },
        ],
      };
      
      setAnalyticsData(demoAnalytics);
    } catch (error) {
      console.error('خطأ في تحميل التحليلات:', error);
      toast.error('حدث خطأ في تحميل التحليلات');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['التاريخ', 'العميل', 'المبلغ'],
      ...analyticsData.recentSales.map(sale => [
        sale.date,
        sale.customer,
        `${sale.amount} ر.س`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير-المبيعات-${new Date().toISOString().split('T')[0]}.csv`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">التحليلات والتقارير</h1>
                <p className="text-gray-600 mt-1">
                  تحليل أداء متجرك ومبيعاتك
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
                {analyticsData.totalRevenue.toLocaleString()} ر.س
              </div>
              <div className="text-sm text-green-600">
                +{analyticsData.monthlyGrowth}% من الشهر الماضي
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي الطلبات
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {analyticsData.totalOrders}
              </div>
              <div className="text-sm text-gray-600">
                طلب هذا الشهر
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                العملاء
              </CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {analyticsData.totalCustomers}
              </div>
              <div className="text-sm text-gray-600">
                عميل نشط
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
                لكل طلب
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>أفضل المنتجات</CardTitle>
              <CardDescription>المنتجات الأكثر مبيعاً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-600' : 
                        index === 1 ? 'bg-purple-600' : 
                        index === 2 ? 'bg-green-600' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.sales} مبيعة</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {product.revenue.toLocaleString()} ر.س
                    </Badge>
                  </div>
                ))}
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
                {analyticsData.recentSales.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{sale.customer}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(sale.date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {sale.amount.toLocaleString()} ر.س
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Sales Chart */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>المبيعات الشهرية</CardTitle>
            <CardDescription>تطور المبيعات والإيرادات خلال الأشهر الماضية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.salesByMonth.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="text-lg font-medium">{month.month}</div>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">الطلبات</div>
                      <div className="font-bold">{month.sales}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">الإيرادات</div>
                      <div className="font-bold text-green-600">
                        {month.revenue.toLocaleString()} ر.س
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>ملخص الأداء</CardTitle>
            <CardDescription>نظرة عامة على أداء متجرك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {((analyticsData.totalOrders / analyticsData.totalCustomers) || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">متوسط الطلبات لكل عميل</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analyticsData.monthlyGrowth.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">نمو شهري</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {analyticsData.topProducts.length}
                </div>
                <div className="text-sm text-gray-600">منتجات نشطة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}