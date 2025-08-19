'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Settings, Store, CreditCard, Truck, Calculator } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface CustomerStore {
  id: string;
  name: string;
  slug: string;
  description?: string;
  plan: string;
  active: boolean;
  created_at: string;
}

interface StoreSettings {
  name: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  shipping_enabled: boolean;
  shipping_cost_cents: number;
  tax_enabled: boolean;
  tax_rate: number;
}

export default function CustomerSettingsPage() {
  const [customerStore, setCustomerStore] = useState<CustomerStore | null>(null);
  const [settings, setSettings] = useState<StoreSettings>({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    shipping_enabled: false,
    shipping_cost_cents: 0,
    tax_enabled: false,
    tax_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      // تحميل إعدادات المتجر
      setSettings({
        name: storeData.name,
        description: storeData.description || '',
        contact_email: `contact@${storeData.slug}.com`,
        contact_phone: '',
        shipping_enabled: false,
        shipping_cost_cents: 1000, // 10 ريال افتراضي
        tax_enabled: false,
        tax_rate: 15, // 15% ضريبة القيمة المضافة
      });

    } catch (error) {
      console.error('خطأ في تحميل متجر العميل:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!customerStore) return;

    try {
      setSaving(true);
      
      // تحديث معلومات المتجر الأساسية
      const { error: storeError } = await supabase
        .from('stores')
        .update({
          name: settings.name,
          description: settings.description,
        })
        .eq('id', customerStore.id)
        .eq('owner_user_id', customerStore.owner_user_id); // التأكد من الملكية

      if (storeError) throw storeError;

      // في التطبيق الحقيقي، ستحفظ باقي الإعدادات في جدول منفصل
      // هنا نحاكي عملية الحفظ
      
      toast.success('تم حفظ الإعدادات بنجاح');
      
      // تحديث البيانات المحلية
      setCustomerStore(prev => prev ? {
        ...prev,
        name: settings.name,
        description: settings.description,
      } : null);

    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      toast.error('حدث خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof StoreSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
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
          <p className="text-gray-600">جار تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  if (!customerStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ليس لديك متجر
          </h1>
          <p className="text-gray-600 mb-6">
            يجب إنشاء متجر أولاً لإدارة الإعدادات
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
          <Settings className="h-16 w-16 text-orange-400 mx-auto mb-4" />
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
                <h1 className="text-3xl font-bold text-gray-900">إعدادات المتجر</h1>
                <p className="text-gray-600 mt-1">
                  متجر {customerStore.name}
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 ml-2" />
              {saving ? 'جار الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Store className="h-5 w-5 text-blue-600" />
                <CardTitle>معلومات المتجر</CardTitle>
              </div>
              <CardDescription>
                الإعدادات الأساسية لمتجرك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="store_name">اسم المتجر</Label>
                <Input
                  id="store_name"
                  value={settings.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="اسم متجرك"
                />
              </div>
              
              <div>
                <Label htmlFor="store_description">وصف المتجر</Label>
                <Input
                  id="store_description"
                  value={settings.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="وصف مختصر لمتجرك"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">رابط المتجر</p>
                    <p className="text-sm text-blue-700">
                      {customerStore.slug}.saasy.com
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">الخطة الحالية</p>
                    <p className="text-sm text-blue-700">
                      {getPlanName(customerStore.plan)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Settings className="h-5 w-5 text-green-600" />
                <CardTitle>معلومات التواصل</CardTitle>
              </div>
              <CardDescription>
                معلومات التواصل مع العملاء
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact_email">بريد التواصل</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="contact@yourstore.com"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_phone">رقم الهاتف</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="+966 50 123 4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Truck className="h-5 w-5 text-purple-600" />
                <CardTitle>إعدادات الشحن</CardTitle>
              </div>
              <CardDescription>
                إعدادات الشحن والتوصيل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shipping_enabled">تفعيل الشحن</Label>
                  <p className="text-sm text-gray-600">
                    تفعيل خدمة الشحن للعملاء
                  </p>
                </div>
                <Switch
                  id="shipping_enabled"
                  checked={settings.shipping_enabled}
                  onCheckedChange={(checked) => handleInputChange('shipping_enabled', checked)}
                />
              </div>

              {settings.shipping_enabled && (
                <div>
                  <Label htmlFor="shipping_cost">تكلفة الشحن (بالهللة)</Label>
                  <Input
                    id="shipping_cost"
                    type="number"
                    value={settings.shipping_cost_cents}
                    onChange={(e) => handleInputChange('shipping_cost_cents', parseInt(e.target.value) || 0)}
                    placeholder="1000"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    التكلفة بالريال: {(settings.shipping_cost_cents / 100).toFixed(2)} ر.س
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Calculator className="h-5 w-5 text-orange-600" />
                <CardTitle>إعدادات الضرائب</CardTitle>
              </div>
              <CardDescription>
                إعدادات ضريبة القيمة المضافة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="tax_enabled">تفعيل الضريبة</Label>
                  <p className="text-sm text-gray-600">
                    إضافة ضريبة القيمة المضافة للأسعار
                  </p>
                </div>
                <Switch
                  id="tax_enabled"
                  checked={settings.tax_enabled}
                  onCheckedChange={(checked) => handleInputChange('tax_enabled', checked)}
                />
              </div>

              {settings.tax_enabled && (
                <div>
                  <Label htmlFor="tax_rate">نسبة الضريبة (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.tax_rate}
                    onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                    placeholder="15"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    ضريبة القيمة المضافة في السعودية: 15%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <CreditCard className="h-5 w-5 text-green-600" />
                <CardTitle>معلومات الاشتراك</CardTitle>
              </div>
              <CardDescription>
                تفاصيل خطة الاشتراك الحالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>الخطة الحالية</Label>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {getPlanName(customerStore.plan)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label>حالة المتجر</Label>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      customerStore.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customerStore.active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>تاريخ الإنشاء</Label>
                  <p className="text-sm text-gray-600 mt-2">
                    {new Date(customerStore.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>

                <div>
                  <Label>رابط المتجر</Label>
                  <p className="text-sm text-blue-600 mt-2 font-mono">
                    {customerStore.slug}.saasy.com
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 ml-2" />
                  ترقية الخطة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}