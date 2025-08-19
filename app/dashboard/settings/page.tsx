'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Store, User, CreditCard, Globe } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface StoreSettings {
  name: string;
  description: string;
  slug: string;
  active: boolean;
  plan: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  currency: string;
  tax_rate: number;
  shipping_enabled: boolean;
  shipping_cost: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    name: 'متجري الإلكتروني',
    description: 'متجر إلكتروني متخصص في بيع الإلكترونيات والأجهزة الذكية',
    slug: 'my-store',
    active: true,
    plan: 'pro',
    contact_email: 'info@mystore.com',
    contact_phone: '+966501234567',
    address: 'الرياض، المملكة العربية السعودية',
    currency: 'SAR',
    tax_rate: 15,
    shipping_enabled: true,
    shipping_cost: 2500, // 25 ر.س
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // استخدام بيانات افتراضية مؤقتاً
      // في التطبيق الحقيقي، ستكون هذه البيانات محفوظة في قاعدة البيانات
      setSettings({
        name: 'متجري الإلكتروني',
        description: 'متجر إلكتروني متخصص في بيع الإلكترونيات والأجهزة الذكية',
        slug: 'my-store',
        active: true,
        plan: 'pro',
        contact_email: 'info@mystore.com',
        contact_phone: '+966501234567',
        address: 'الرياض، المملكة العربية السعودية',
        currency: 'SAR',
        tax_rate: 15,
        shipping_enabled: true,
        shipping_cost: 2500,
      });
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
      toast.error('حدث خطأ في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // في التطبيق الحقيقي، ستحفظ الإعدادات في قاعدة البيانات
      // هنا نحاكي عملية الحفظ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('تم حفظ الإعدادات بنجاح');
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
                <h1 className="text-3xl font-bold text-gray-900">إعدادات المتجر</h1>
                <p className="text-gray-600 mt-1">
                  إدارة إعدادات وتفاصيل متجرك
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
          {/* Store Information */}
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
                <Label htmlFor="name">اسم المتجر</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="اسم متجرك"
                />
              </div>
              
              <div>
                <Label htmlFor="description">وصف المتجر</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="وصف مختصر عن متجرك"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="slug">رابط المتجر</Label>
                <div className="flex items-center">
                  <Input
                    id="slug"
                    value={settings.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="my-store"
                    className="rounded-l-none"
                  />
                  <div className="bg-gray-100 px-3 py-2 border border-l-0 rounded-r-md text-sm text-gray-600">
                    .saasy.com
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="active"
                  checked={settings.active}
                  onCheckedChange={(checked) => handleInputChange('active', checked)}
                />
                <Label htmlFor="active">متجر نشط</Label>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <User className="h-5 w-5 text-green-600" />
                <CardTitle>معلومات التواصل</CardTitle>
              </div>
              <CardDescription>
                معلومات التواصل مع العملاء
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact_email">البريد الإلكتروني</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="info@mystore.com"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_phone">رقم الهاتف</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="+966501234567"
                />
              </div>

              <div>
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="عنوان متجرك"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment & Shipping */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <CardTitle>الدفع والشحن</CardTitle>
              </div>
              <CardDescription>
                إعدادات الدفع والشحن
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">العملة</Label>
                  <select
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="tax_rate">معدل الضريبة (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.tax_rate}
                    onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="shipping_enabled"
                  checked={settings.shipping_enabled}
                  onCheckedChange={(checked) => handleInputChange('shipping_enabled', checked)}
                />
                <Label htmlFor="shipping_enabled">تفعيل الشحن</Label>
              </div>

              {settings.shipping_enabled && (
                <div>
                  <Label htmlFor="shipping_cost">تكلفة الشحن (هللة)</Label>
                  <Input
                    id="shipping_cost"
                    type="number"
                    min="0"
                    value={settings.shipping_cost}
                    onChange={(e) => handleInputChange('shipping_cost', parseInt(e.target.value) || 0)}
                    placeholder="2500"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    التكلفة الحالية: {(settings.shipping_cost / 100).toFixed(2)} ر.س
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Globe className="h-5 w-5 text-orange-600" />
                <CardTitle>معلومات الاشتراك</CardTitle>
              </div>
              <CardDescription>
                تفاصيل خطة اشتراكك الحالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">الخطة الحالية</div>
                    <div className="text-sm text-gray-600">
                      {settings.plan === 'pro' ? 'الخطة الاحترافية' : 'الخطة الأساسية'}
                    </div>
                  </div>
                  <Badge className={
                    settings.plan === 'pro' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }>
                    {settings.plan === 'pro' ? 'احترافية' : 'أساسية'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">حالة المتجر</div>
                    <div className="text-sm text-gray-600">
                      {settings.active ? 'نشط ومتاح للعملاء' : 'غير نشط'}
                    </div>
                  </div>
                  <Badge className={
                    settings.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }>
                    {settings.active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>ملاحظة:</strong> لترقية خطتك أو تغيير إعدادات الفوترة، 
                    يرجى التواصل مع فريق الدعم أو استخدام لوحة تحكم Stripe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}