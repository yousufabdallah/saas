'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, Package, Search, DollarSign } from 'lucide-react';
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // استخدام بيانات افتراضية مؤقتاً
      const demoProducts = [
        {
          id: '1',
          title: 'جهاز لابتوب Dell XPS 13',
          description: 'جهاز لابتوب عالي الأداء مع معالج Intel Core i7',
          price_cents: 450000,
          sku: 'DELL-XPS-13',
          active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'سماعات Sony WH-1000XM4',
          description: 'سماعات لاسلكية مع إلغاء الضوضاء',
          price_cents: 120000,
          sku: 'SONY-WH1000XM4',
          active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'هاتف iPhone 15 Pro',
          description: 'أحدث هاتف من Apple مع كاميرا متطورة',
          price_cents: 550000,
          sku: 'IPHONE-15-PRO',
          active: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '4',
          title: 'ساعة Apple Watch Series 9',
          description: 'ساعة ذكية مع مراقبة الصحة',
          price_cents: 180000,
          sku: 'APPLE-WATCH-S9',
          active: true,
          created_at: new Date().toISOString(),
        },
      ];
      
      setProducts(demoProducts);
    } catch (error) {
      console.error('خطأ في تحميل المنتجات:', error);
      toast.error('حدث خطأ في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        // تحديث منتج موجود
        setProducts(prev => prev.map(product => 
          product.id === editingProduct.id 
            ? { ...product, ...formData }
            : product
        ));
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        // إضافة منتج جديد
        const newProduct = {
          id: Date.now().toString(),
          ...formData,
          created_at: new Date().toISOString(),
        };
        setProducts(prev => [newProduct, ...prev]);
        toast.success('تم إضافة المنتج بنجاح');
      }

      resetForm();
    } catch (error) {
      console.error('خطأ في حفظ المنتج:', error);
      toast.error('حدث خطأ في حفظ المنتج');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price_cents: product.price_cents,
      sku: product.sku,
      active: product.active,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      setProducts(prev => prev.filter(product => product.id !== productId));
      toast.success('تم حذف المنتج بنجاح');
    } catch (error) {
      console.error('خطأ في حذف المنتج:', error);
      toast.error('حدث خطأ في حذف المنتج');
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, active: !currentStatus }
          : product
      ));
      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} المنتج بنجاح`);
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
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className="text-3xl font-bold text-gray-900">إدارة المنتجات</h1>
                <p className="text-gray-600 mt-1">
                  أضف وأدر منتجات متجرك
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
                      placeholder="PROD-001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">وصف المنتج</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف تفصيلي للمنتج"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="price">السعر (ريال سعودي)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price_cents / 100}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      price_cents: Math.round(parseFloat(e.target.value || '0') * 100)
                    }))}
                    placeholder="99.99"
                    required
                  />
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
                <CardDescription>
                  {product.sku && `SKU: ${product.sku}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-bold text-green-600">
                      {(product.price_cents / 100).toFixed(2)} ر.س
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>تاريخ الإضافة</span>
                    <span>{new Date(product.created_at).toLocaleDateString('ar-SA')}</span>
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
                      variant={product.active ? "secondary" : "default"}
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
                      <Trash2 className="h-4 w-4" />
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
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}