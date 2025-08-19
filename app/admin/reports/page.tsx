'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, DollarSign, Users, Store, Calendar, Download } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface ReportData {
  totalRevenue: number;
  totalStores: number;
  totalUsers: number;
  activeSubscriptions: number;
  monthlyGrowth: number;
  topPlans: { plan: string; count: number }[];
  recentActivity: { date: string; description: string; amount?: number }[];
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalStores: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyGrowth: 0,
    topPlans: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAdminAndLoadReports();
  }, [selectedPeriod]);

  const checkAdminAndLoadReports = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/signin');
        return;
      }

      // التحقق من صلاحيات الأدمن
      const { data: isAdmin } = await supabase
        .rpc('check_platform_admin', { user_id: user.id });

      if (!isAdmin) {
        toast.error('ليس لديك صلاحيات للوصول إلى هذه الصفحة');
        router.push('/dashboard');
        return;
      }

      await loadReports();
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحيات:', error);
      toast.error('حدث خطأ في التحقق من الصلاحيات');
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // جلب إحصائيات المتاجر
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, plan, active, created_at');

      if (storesError) throw storesError;

      // جلب إحصائيات المستخدمين
      const { data: members, error: membersError } = await supabase
        .from('store_members')
        .select('user_id, created_at');

      if (membersError) throw membersError;

      // جلب إحصائيات الطلبات (للإيرادات التقديرية)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_cents, created_at, status');

      if (ordersError) throw ordersError;

      // حساب الإحصائيات
      const totalStores = stores?.length || 0;
      const activeSubscriptions = stores?.filter(s => s.active).length || 0;
      const uniqueUsers = new Set(members?.map(m => m.user_id) || []).size;
      
      // حساب الإيرادات التقديرية
      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total_cents || 0), 0) / 100;

      // حساب النمو الشهري (تقديري)
      const currentMonth = new Date().getMonth();
      const currentMonthStores = stores?.filter(s => 
        new Date(s.created_at).getMonth() === currentMonth
      ).length || 0;
      const lastMonthStores = stores?.filter(s => 
        new Date(s.created_at).getMonth() === currentMonth - 1
      ).length || 0;
      const monthlyGrowth = lastMonthStores > 0 ? ((currentMonthStores - lastMonthStores) / lastMonthStores) * 100 : 0;

      // أفضل الخطط
      const planCounts = stores?.reduce((acc, store) => {
        acc[store.plan] = (acc[store.plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topPlans = Object.entries(planCounts)
        .map(([plan, count]) => ({ plan, count }))
        .sort((a, b) => b.count - a.count);

      // النشاط الأخير
      const recentActivity = [
        ...stores?.slice(-5).map(store => ({
          date: store.created_at,
          description: `متجر جديد: ${store.id.slice(0, 8)}`,
        })) || [],
        ...completedOrders.slice(-5).map(order => ({
          date: order.created_at,
          description: `طلب مكتمل`,
          amount: order.total_cents / 100,
        })) || [],
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      setReportData({
        totalRevenue,
        totalStores,
        totalUsers: uniqueUsers,
        activeSubscriptions,
        monthlyGrowth,
        topPlans,
        recentActivity,
      });
    } catch (error) {
      console.error('خطأ في تحميل التقارير:', error);
      toast.error('حدث خطأ في تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['التاريخ', 'النوع', 'الوصف', 'المبلغ'],
      ...reportData.recentActivity.map(activity => [
        new Date(activity.date).toLocaleDateString('ar-SA'),
        activity.amount ? 'إيراد' : 'نشاط',
        activity.description,
        activity.amount ? `${activity.amount} ر.س` : '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير-المنصة-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('تم تصدير التقرير بنجاح');
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
          <p className="text-gray-600">جار تحميل التقارير...</p>
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
              <Button variant="ghost" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">التقارير المالية</h1>
                <p className="text-gray-600 mt-1">
                  عرض تقارير الإيرادات والمبيعات
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
                {reportData.totalRevenue.toLocaleString()} ر.س
              </div>
              <div className="text-sm text-gray-600">
                من الطلبات المكتملة
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي المتاجر
              </CardTitle>
              <Store className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {reportData.totalStores}
              </div>
              <div className="text-sm text-gray-600">
                متجر مسجل
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                المستخدمين النشطين
              </CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {reportData.totalUsers}
              </div>
              <div className="text-sm text-gray-600">
                مستخدم نشط
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                النمو الشهري
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold mb-1 ${
                reportData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {reportData.monthlyGrowth >= 0 ? '+' : ''}{reportData.monthlyGrowth.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                مقارنة بالشهر الماضي
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Plans */}
          <Card>
            <CardHeader>
              <CardTitle>أفضل الخطط</CardTitle>
              <CardDescription>الخطط الأكثر شعبية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topPlans.map((planData, index) => (
                  <div key={planData.plan} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-600' : 
                        index === 1 ? 'bg-purple-600' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium">{getPlanName(planData.plan)}</span>
                    </div>
                    <Badge variant="outline">
                      {planData.count} متجر
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>النشاط الأخير</CardTitle>
              <CardDescription>آخر الأنشطة في المنصة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(activity.date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    {activity.amount && (
                      <Badge className="bg-green-100 text-green-800">
                        {activity.amount} ر.س
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>ملخص الأداء</CardTitle>
            <CardDescription>نظرة عامة على أداء المنصة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {reportData.activeSubscriptions}
                </div>
                <div className="text-sm text-gray-600">اشتراكات نشطة</div>
                <div className="text-xs text-gray-500 mt-1">
                  {((reportData.activeSubscriptions / reportData.totalStores) * 100).toFixed(1)}% من إجمالي المتاجر
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {(reportData.totalRevenue / reportData.totalStores || 0).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">متوسط الإيراد لكل متجر</div>
                <div className="text-xs text-gray-500 mt-1">ريال سعودي</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {(reportData.totalUsers / reportData.totalStores || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">متوسط المستخدمين لكل متجر</div>
                <div className="text-xs text-gray-500 mt-1">مستخدم</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}