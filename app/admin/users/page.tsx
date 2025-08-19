'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Store, Users, Calendar, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface RealStore {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  created_at: string;
  owner_user_id: string;
  owner_email: string;
  members_count: number;
  products_count: number;
  orders_count: number;
  total_revenue: number;
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<RealStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAdminAndLoadStores();
  }, []);

  const checkAdminAndLoadStores = async () => {
    try {
      console.log('🔍 [STORES PAGE] فحص المستخدم...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('❌ [STORES PAGE] المستخدم غير مسجل دخول');
      // تجاوز مؤقت لمشاكل RLS
      // استخدام بيانات افتراضية مؤقتاً
      console.log('⚠️ [STORES PAGE] استخدام بيانات افتراضية');
      const demoStores = [
        {
          id: '1',
          name: 'متجر الإلكترونيات',
          slug: 'electronics-store',
          plan: 'pro',
          active: true,
          created_at: new Date().toISOString(),
          owner_user_id: 'demo-user-1',
          members_count: 3,
          products_count: 25,
        },
        {
          id: '2',
          name: 'متجر الأزياء',
          slug: 'fashion-store',
          plan: 'basic',
          active: true,
          created_at: new Date().toISOString(),
          owner_user_id: 'demo-user-2',
          members_count: 1,
          products_count: 15,
        },
        {
          id: '3',
          name: 'متجر الكتب',
          slug: 'books-store',
          plan: 'enterprise',
          active: false,
          created_at: new Date().toISOString(),
          owner_user_id: 'demo-user-3',
          members_count: 2,
          products_count: 50,
        }
      ];
          store_active: null,
          store_plan: null,
          last_activity: null,
        }
      ]);
      toast.error('خطأ في تحميل البيانات - عرض بيانات تجريبية');
      setStores(demoStores);
        setStores([]);
        return;
      toast.error('تم تحميل بيانات تجريبية مؤقتاً');
    } finally {
      setLoading(false);
    }
  };

      const { data: result, error } = await supabase
        .rpc('create_free_store_for_user', {
      // محاكاة تغيير الحالة
      console.log('✅ [STORES PAGE] نتيجة تغيير الحالة:', result);

      if (result?.success) {
        toast.success(result.message);
        await loadRealUsers(); // إعادة تحميل القائمة
      } else {
        toast.error(result?.message || 'فشل في تغيير حالة المتجر');
      }
    } catch (error) {
      console.error('❌ [STORES PAGE] خطأ في تغيير حالة المتجر:', error);
      toast.error('حدث خطأ في تغيير حالة المتجر');
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جار تحميل المتاجر...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">إدارة المتاجر</h1>
                <p className="text-gray-600 mt-1">
                  جميع المتاجر النشطة في المنصة
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
                placeholder="البحث في المتاجر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Badge variant="secondary">
                إجمالي المتاجر: {stores.length}
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                نشط: {stores.filter(s => s.active).length}
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                غير نشط: {stores.filter(s => !s.active).length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Store className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                  </div>
                  <Badge className={getPlanBadgeColor(store.plan)}>
                    {getPlanName(store.plan)}
                  </Badge>
                </div>
                <CardDescription>
                  {store.slug}.saasy.com
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">صاحب المتجر:</span>
                    <span className="font-medium">{store.owner_email}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>الأعضاء</span>
                    </div>
                    <span className="font-medium">{store.members_count}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span>المنتجات</span>
                    </div>
                    <span className="font-medium">{store.products_count}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <ShoppingCart className="h-4 w-4 text-gray-500" />
                      <span>الطلبات</span>
                    </div>
                    <span className="font-medium">{store.orders_count}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>الإيرادات</span>
                    </div>
                    <span className="font-medium text-green-600">
                      {store.total_revenue.toFixed(2)} ر.س
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>تاريخ الإنشاء</span>
                    </div>
                    <span className="font-medium">
                      {new Date(store.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge 
                      className={store.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }
                    >
                      {store.active ? 'نشط' : 'غير نشط'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStoreStatus(store.id, store.active)}
                    >
                      {store.active ? 'إلغاء التفعيل' : 'تفعيل'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {stores.length === 0 ? 'لا توجد متاجر حقيقية' : 'لا توجد نتائج للبحث'}
            </h3>
            <p className="text-gray-600 mb-4">
              {stores.length === 0 
                ? 'لم يتم إنشاء أي متاجر حقيقية بعد. ستظهر المتاجر هنا عند تسجيل المستخدمين.'
                : 'لم يتم العثور على متاجر تطابق البحث'
              }
            </p>
            {stores.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  💡 نصائح:
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• المتاجر تُنشأ تلقائياً عند تسجيل المستخدمين</li>
                  <li>• يمكن إنشاء متاجر من صفحة إدارة المستخدمين</li>
                  <li>• جميع المتاجر مجانية ونشطة فوراً</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}