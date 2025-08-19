'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, ShoppingCart, User, Calendar, DollarSign, Phone, Mail } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: string;
  total_cents: number;
  notes?: string;
  created_at: string;
}

interface CustomerStore {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerStore, setCustomerStore] = useState<CustomerStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

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

      // تحميل طلبات متجر العميل فقط
      await loadOrders(storeData.id);
    } catch (error) {
      console.error('خطأ في تحميل متجر العميل:', error);
      setLoading(false);
    }
  };

  const loadOrders = async (storeId: string) => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في تحميل الطلبات:', error);
        setOrders([]);
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!customerStore) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .eq('store_id', customerStore.id); // التأكد من أن الطلب ينتمي لمتجر العميل

      if (error) throw error;
      
      toast.success('تم تحديث حالة الطلب بنجاح');
      await loadOrders(customerStore.id);
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
      toast.error('حدث خطأ في تحديث حالة الطلب');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'new': { label: 'جديد', color: 'bg-blue-100 text-blue-800' },
      'paid': { label: 'مدفوع', color: 'bg-green-100 text-green-800' },
      'processing': { label: 'قيد المعالجة', color: 'bg-yellow-100 text-yellow-800' },
      'shipped': { label: 'تم الشحن', color: 'bg-purple-100 text-purple-800' },
      'completed': { label: 'مكتمل', color: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-800' },
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap['new'];
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'new': 'processing',
      'paid': 'processing',
      'processing': 'shipped',
      'shipped': 'completed',
    };
    
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جار تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  if (!customerStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ليس لديك متجر
          </h1>
          <p className="text-gray-600 mb-6">
            يجب إنشاء متجر أولاً لإدارة الطلبات
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
          <ShoppingCart className="h-16 w-16 text-orange-400 mx-auto mb-4" />
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
                <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
                <p className="text-gray-600 mt-1">
                  متجر {customerStore.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Badge variant="secondary">
                إجمالي الطلبات: {orders.length}
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                مكتملة: {orders.filter(o => o.status === 'completed').length}
              </Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                معلقة: {orders.filter(o => ['new', 'processing'].includes(o.status)).length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusBadge(order.status);
            const nextStatus = getNextStatus(order.status);
            
            return (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      طلب #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <CardDescription>
                    {new Date(order.created_at).toLocaleDateString('ar-SA')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{order.customer_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{order.customer_email}</span>
                    </div>

                    {order.customer_phone && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{order.customer_phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          {(order.total_cents / 100).toFixed(2)} ر.س
                        </span>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700">
                          <strong>ملاحظات:</strong> {order.notes}
                        </p>
                      </div>
                    )}

                    {nextStatus && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => updateOrderStatus(order.id, nextStatus)}
                        >
                          تحديث إلى: {getStatusBadge(nextStatus).label}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد طلبات
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'لم يتم العثور على طلبات تطابق البحث' : 'لم تتلق أي طلبات بعد'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}