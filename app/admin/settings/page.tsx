'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Settings, Shield, Mail, Globe } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface PlatformSettings {
  platform_name: string;
  support_email: string;
  allow_registration: boolean;
  require_email_verification: boolean;
  max_stores_per_user: number;
  default_plan: string;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: 'SaaSy',
    support_email: 'support@saasy.com',
    allow_registration: true,
    require_email_verification: false,
    max_stores_per_user: 1,
    default_plan: 'basic',
    maintenance_mode: false,
    maintenance_message: 'المنصة قيد الصيانة، سنعود قريباً',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAdminAndLoadSettings();
  }, []);

  const checkAdminAndLoadSettings = async () => {
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

      await loadSettings();
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحيات:', error);
      toast.error('حدث خطأ في التحقق من الصلاحيات');
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // في التطبيق الحقيقي، ستكون هذه الإعدادات محفوظة في قاعدة البيانات
      // هنا نستخدم القيم الافتراضية
      setSettings({
        platform_name: 'SaaSy',
        support_email: 'support@saasy.com',
        allow_registration: true,
        require_email_verification: false,
        max_stores_per_user: 1,
        default_plan: 'basic',
        maintenance_mode: false,
        maintenance_message: 'المنصة قيد الصيانة، سنعود قريباً',
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

  const handleInputChange = (field: keyof PlatformSettings, value: any) => {
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
              <Button variant="ghost" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إعدادات المنصة</h1>
                <p className="text-gray-600 mt-1">
                  إدارة الإعدادات العامة للمنصة
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
          {/* General Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Settings className="h-5 w-5 text-blue-600" />
                <CardTitle>الإعدادات العامة</CardTitle>
              </div>
              <CardDescription>
                إعدادات أساسية للمنصة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="platform_name">اسم المنصة</Label>
                <Input
                  id="platform_name"
                  value={settings.platform_name}
                  onChange={(e) => handleInputChange('platform_name', e.target.value)}
                  placeholder="SaaSy"
                />
              </div>
              
              <div>
                <Label htmlFor="support_email">بريد الدعم الفني</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => handleInputChange('support_email', e.target.value)}
                  placeholder="support@saasy.com"
                />
              </div>

              <div>
                <Label htmlFor="default_plan">الخطة الافتراضية</Label>
                <select
                  id="default_plan"
                  value={settings.default_plan}
                  onChange={(e) => handleInputChange('default_plan', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="basic">أساسية</option>
                  <option value="pro">احترافية</option>
                  <option value="enterprise">مؤسسية</option>
                </select>
              </div>

              <div>
                <Label htmlFor="max_stores">الحد الأقصى للمتاجر لكل مستخدم</Label>
                <Input
                  id="max_stores"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.max_stores_per_user}
                  onChange={(e) => handleInputChange('max_stores_per_user', parseInt(e.target.value) || 1)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle>إعدادات الأمان</CardTitle>
              </div>
              <CardDescription>
                إعدادات التسجيل والمصادقة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow_registration">السماح بالتسجيل الجديد</Label>
                  <p className="text-sm text-gray-600">
                    السماح للمستخدمين الجدد بإنشاء حسابات
                  </p>
                </div>
                <Switch
                  id="allow_registration"
                  checked={settings.allow_registration}
                  onCheckedChange={(checked) => handleInputChange('allow_registration', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require_email_verification">تأكيد البريد الإلكتروني</Label>
                  <p className="text-sm text-gray-600">
                    طلب تأكيد البريد الإلكتروني عند التسجيل
                  </p>
                </div>
                <Switch
                  id="require_email_verification"
                  checked={settings.require_email_verification}
                  onCheckedChange={(checked) => handleInputChange('require_email_verification', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Globe className="h-5 w-5 text-orange-600" />
                <CardTitle>إعدادات الصيانة</CardTitle>
              </div>
              <CardDescription>
                إدارة وضع الصيانة للمنصة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance_mode">وضع الصيانة</Label>
                  <p className="text-sm text-gray-600">
                    تفعيل وضع الصيانة لجميع المستخدمين
                  </p>
                </div>
                <Switch
                  id="maintenance_mode"
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
                />
              </div>

              {settings.maintenance_mode && (
                <div>
                  <Label htmlFor="maintenance_message">رسالة الصيانة</Label>
                  <Input
                    id="maintenance_message"
                    value={settings.maintenance_message}
                    onChange={(e) => handleInputChange('maintenance_message', e.target.value)}
                    placeholder="المنصة قيد الصيانة، سنعود قريباً"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Mail className="h-5 w-5 text-purple-600" />
                <CardTitle>إعدادات البريد الإلكتروني</CardTitle>
              </div>
              <CardDescription>
                إعدادات إرسال الإشعارات والرسائل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>ملاحظة:</strong> إعدادات البريد الإلكتروني تتم من خلال Supabase Dashboard.
                  يرجى الرجوع إلى وثائق Supabase لتكوين SMTP.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}