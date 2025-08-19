'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, TrendingUp, Users, Plus, Settings, LogOut } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/signin');
        return;
      }
      
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router, supabase.auth]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('خطأ في تسجيل الخروج');
    } else {
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/');
    }
  };

  const stats = [
    {
      title: 'إجمالي المبيعات',
      value: '12,450 ر.س',
      change: '+12.5%',
      changeType: 'positive',
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
    },
    {
      title: 'عدد الطلبات',
      value: '89',
      change: '+8.2%',
      changeType: 'positive',
      icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,
    },
    {
      title: 'المنتجات',
      value: '24',
      change: '+3',
      changeType: 'neutral',
      icon: <Package className="h-5 w-5 text-purple-600" />,
    },
    {
      title: 'العملاء',
      value: '156',
      change: '+18%',
      changeType: 'positive',
      icon: <Users className="h-5 w-5 text-orange-600" />,
    },
  ];

  const recentOrders = [
    {
      id: '#1234',
      customer: 'أحمد محمد',
      total: '245 ر.س',
      status: 'مكتمل',
      date: '2024-01-15',
    },
    {
      id: '#1233',
      customer: 'سارة أحمد',
      total: '189 ر.س',
      status: 'قيد الشحن',
      date: '2024-01-14',
    },
    {
      id: '#1232',
      customer: 'محمد علي',
      total: '320 ر.س',
      status: 'جديد',
      date: '2024-01-14',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مكتمل':
        return 'bg-green-100 text-green-800';
      case 'قيد الشحن':
        return 'bg-blue-100 text-blue-800';
      case 'جديد':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
              <p className="text-gray-600 mt-1">
                مرحباً بك {user?.email} في متجرك الإلكتروني
              </p>
            </div>
            <div className="flex space-x-4 space-x-reverse">
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 ml-2" />
                الإعدادات
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className={`text-sm ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600' 
                    : stat.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {stat.change} من الشهر الماضي
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>الطلبات الأخيرة</CardTitle>
                <CardDescription>آخر الطلبات في متجرك</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                عرض الكل
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{order.total}</p>
                      <p className="text-sm text-gray-600">{order.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}