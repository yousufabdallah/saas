'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, ShoppingBag, Eye, Package, Truck, CheckCircle } from 'lucide-react';
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
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // استخدام بيانات افتراضية مؤقتاً
      const demoOrders = [
        {
          id: 'ORD-001',
          customer_name: 'أحمد محمد علي',
          customer_email: 'ahmed@example.com',
          customer_phone: '+966501234567',
          status: 'completed',
          total_cents: 450000,
          notes: 'طلب عاجل - يرجى الشحن السريع',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          items: [
            {
              id: '1',
              title: 'جهاز لابتوب Dell XPS 13',
              quantity: 1,
              unit_price_cents: 450000,
              total_cents: 450000,
            }
          ]
        },
        {
          id: 'ORD-002',
          customer_name: 'فاطمة أحمد',
          customer_email: 'fatima@example.com',
          customer_phone: '+966507654321',
          status: 'shipped',
          total_cents: 300000,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          items: [
            {
              id: '2',
              title: 'سماعات Sony WH-1000XM4',
              quantity: 1,
              unit_price_cents: 120000,
              total_cents: 120000,
            },
            {
              id: '3',
              title: 'ساعة Apple Watch Series 9',
              quantity: 1,
              unit_price_cents: 180000,
              total_cents: 180000,
            }
          ]
        },
        {
          id: 'ORD-003',
          customer_name: 'محمد عبدالله',
          customer_email: 'mohammed@example.com',
          status: 'processing',
          total_cents: 550000,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          items: [
            {
              id: '4',
              title: 'هاتف iPhone 15 Pro',
              quantity: 1,
              unit_price_cents: 550000,
              total_cents: 550000,
            }
          ]
        },
        {
          id: 'ORD-004',
          customer_name: 'نورا سالم',
          customer_email: 'nora@example.com',
          status: 'new',
          total_cents: 120000,
          created_at: new Date().toISOString(),
          items: [
            {
              id: '5',
              title: 'سماعات Sony WH-1000XM4',
              quantity: 1,
              unit_price_cents: 120000,
              total_cents: 120000,
            }
          ]
        },
      ];
      
      setOrders(demoOrders);
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error);
      toast.error('حدث خطأ في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
      toast.success('تم تحديث حالة الطلب بنجاح');
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
      toast.error('حدث خطأ في تحديث حالة الطلب');
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'new':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
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
                <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
                <p className="text-gray-600 mt-1">
                  تتبع وإدارة طلبات العملاء
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
                مكتمل: {orders.filter(o => o.status === 'completed').length}
              </Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                قيد المعالجة: {orders.filter(o => o.status === 'processing').length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusIcon(order.status)}
                      <CardTitle className="text-lg">{order.id}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusName(order.status)}
                    </Badge>
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold text-green-600">
                      {(order.total_cents / 100).toFixed(2)} ر.س
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
                <CardDescription>
                  العميل: {order.customer_name} • {order.customer_email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">عناصر الطلب:</h4>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                            <div>
                              <span className="font-medium">{item.title}</span>
                              <span className="text-gray-600 mr-2">× {item.quantity}</span>
                            </div>
                            <span className="font-medium">
                              {(item.total_cents / 100).toFixed(2)} ر.س
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">البريد الإلكتروني:</span>
                      <span className="font-medium mr-2">{order.customer_email}</span>
                    </div>
                    {order.customer_phone && (
                      <div>
                        <span className="text-gray-600">رقم الهاتف:</span>
                        <span className="font-medium mr-2">{order.customer_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div>
                      <span className="text-gray-600 text-sm">ملاحظات:</span>
                      <p className="text-sm bg-yellow-50 p-2 rounded mt-1">{order.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 space-x-reverse pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      عرض التفاصيل
                    </Button>
                    
                    {order.status === 'new' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'processing')}
                      >
                        بدء المعالجة
                      </Button>
                    )}
                    
                    {order.status === 'processing' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                      >
                        تم الشحن
                      </Button>
                    )}
                    
                    {order.status === 'shipped' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                      >
                        تم التسليم
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد طلبات
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'لم يتم العثور على طلبات تطابق البحث' : 'لم تتلق أي طلبات بعد'}
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>تفاصيل الطلب {selectedOrder.id}</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Order Status */}
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="mr-2">{getStatusName(selectedOrder.status)}</span>
                  </Badge>
                  <div className="text-2xl font-bold text-green-600">
                    {(selectedOrder.total_cents / 100).toFixed(2)} ر.س
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="font-medium mb-3">معلومات العميل</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">الاسم:</span>
                      <span className="font-medium">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">البريد الإلكتروني:</span>
                      <span className="font-medium">{selectedOrder.customer_email}</span>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم الهاتف:</span>
                        <span className="font-medium">{selectedOrder.customer_phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاريخ الطلب:</span>
                      <span className="font-medium">
                        {new Date(selectedOrder.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">عناصر الطلب</h3>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-gray-600">
                              الكمية: {item.quantity} × {(item.unit_price_cents / 100).toFixed(2)} ر.س
                            </div>
                          </div>
                          <div className="font-bold">
                            {(item.total_cents / 100).toFixed(2)} ر.س
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-medium mb-2">ملاحظات</h3>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}