'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Search, Plus, Edit, Trash2, Package, DollarSign } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface Product {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  sku: string;
  active: boolean;
  created_at: string;
}

interface CustomerStore {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
}

export default function CustomerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customerStore, setCustomerStore] = useState<CustomerStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_cents: 0,
    sku: '',
    active: true,
  });

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

      // تحميل منتجات متجر العميل فقط
      await loadProducts(storeData.id);
    } catch (error) {
      console.error('خطأ في تحميل متجر العميل:', error);
      setLoading(false);
    }
  };

  const loadProducts = async (storeId: string) => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        setProducts([]);
      } else {
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('خطأ في تحميل المنتجات:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerStore) {
      toast.error('لا يمكن إضافة منتجات بدون متجر');
      return;
    }

    try {
      const productData = {
        ...formData,
        store_id: customerStore.id,
      };

      if (editingProduct) {
        // تحديث منتج موجود
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .eq('store_id', customerStore.id); // التأكد من أن المنتج ينتمي لمتجر العميل

        if (error) throw error;
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        // إضافة منتج جديد
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('تم إضافة المنتج بنجاح');
      }

      resetForm();
      await loadProducts(customerStore.id);
    } catch (error) {
      console.error('خطأ في حفظ المنتج:', error);
      toast.error('حدث خطأ في حفظ المنتج');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      price_cents: product.price_cents,
      sku: product.sku || '',
      active: product.active,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!customerStore) return;
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('store_id', customerStore.id); // التأكد من أن المنتج ينتمي لمتجر العميل

      if (error) throw error;
      
      toast.success('تم حذف المنتج بنجاح');
      await loadProducts(customerStore.id);
    } catch (error) {
      console.error('خطأ في حذف المنتج:', error);
      toast.error('حدث خطأ في حذف المنتج');
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    if (!customerStore) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !currentStatus })
        .eq('id', productId)
        .eq('store_id', customerStore.id); // التأكد من أن المنتج ينتمي لمتجر العميل

      if (error) throw error;
      
      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} المنتج بنجاح`);
      await loadProducts(customerStore.id);
    } catch (error) {
      console.error('خطأ في تغيير حالة المنتج:', error);
      toast.error('حدث خطأ في تغيير حالة المنتج');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price_cents: 0,
      sku: '',
      active: true,
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جار تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  if (!customerStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ليس لديك متجر
          </h1>
          <p className="text-gray-600 mb-6">
            يجب إنشاء متجر أولاً لإدارة المنتجات
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
          <Package className="h-16 w-16 text-orange-400 mx-auto mb-4" />
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
                <h1 className="text-3xl font-bold text-gray-900">إدارة المنتجات</h1>
                <p className="text-gray-600 mt-1">
                  متجر {customerStore.name}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">اسم المنتج</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="اسم المنتج"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">رمز المنتج (SKU)</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="SKU123"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">وصف المنتج</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف المنتج"
                  />
                </div>

                <div>
                  <Label htmlFor="price_cents">السعر (بالهللة)</Label>
                  <Input
                    id="price_cents"
                    type="number"
                    value={formData.price_cents}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_cents: parseInt(e.target.value) || 0 }))}
                    placeholder="5000"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    السعر بالريال: {(formData.price_cents / 100).toFixed(2)} ر.س
                  </p>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">منتج نشط</Label>
                </div>

                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button type="submit">
                    {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المنتجات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Badge variant="secondary">
                إجمالي المنتجات: {products.length}
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                نشط: {products.filter(p => p.active).length}
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                غير نشط: {products.filter(p => !p.active).length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{product.title}</CardTitle>
                  <Badge className={product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {product.active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
                {product.sku && (
                  <CardDescription>
                    SKU: {product.sku}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.description && (
                    <p className="text-sm text-gray-600">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-bold text-green-600">
                        {(product.price_cents / 100).toFixed(2)} ر.س
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    تم الإنشاء: {new Date(product.created_at).toLocaleDateString('ar-SA')}
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleProductStatus(product.id, product.active)}
                    >
                      {product.active ? 'إلغاء التفعيل' : 'تفعيل'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد منتجات
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'لم يتم العثور على منتجات تطابق البحث' : 'ابدأ بإضافة منتجك الأول'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج جديد
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}