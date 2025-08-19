'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, DollarSign, CheckCircle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  description: string;
  stripe_price_id: string;
  price_cents: number;
  features: string[];
  active: boolean;
  created_at: string;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    stripe_price_id: '',
    price_cents: 0,
    features: [''],
    active: true,
  });

  useEffect(() => {
    checkAdminAndLoadPlans();
  }, []);

  const checkAdminAndLoadPlans = async () => {
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

      await loadPlans();
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحيات:', error);
      toast.error('حدث خطأ في التحقق من الصلاحيات');
    }
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      
      // محاولة استخدام الدالة الآمنة أولاً
      const { data, error } = await supabase.rpc('get_all_plans');

      if (error) {
        console.error('خطأ في تحميل الخطط:', error);
        // استخدام بيانات افتراضية في حالة الخطأ
        setPlans([
          {
            id: 'basic',
            name: 'الخطة الأساسية',
            description: 'مثالية للمتاجر الناشئة',
            stripe_price_id: 'price_basic_placeholder',
            price_cents: 2900,
            features: ['حتى 100 منتج', 'دعم عبر البريد الإلكتروني', 'تخزين 1GB للصور', 'تقارير أساسية'],
            active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'pro',
            name: 'الخطة الاحترافية',
            description: 'للمتاجر المتنامية',
            stripe_price_id: 'price_pro_placeholder',
            price_cents: 7900,
            features: ['منتجات غير محدودة', 'دعم عبر الهاتف والبريد', 'تخزين 10GB للصور', 'تقارير متقدمة', 'خصومات وكوبونات'],
            active: true,
            created_at: new Date().toISOString(),
          }
        ]);
        return;
      }

      setPlans(data || []);
    } catch (error) {
      console.error('خطأ في تحميل الخطط:', error);
      toast.error('حدث خطأ في تحميل الخطط');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const planData = {
        ...formData,
        features: JSON.stringify(formData.features.filter(f => f.trim() !== '')),
      };

      if (editingPlan) {
        // تحديث خطة موجودة
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('تم تحديث الخطة بنجاح');
      } else {
        // إضافة خطة جديدة
        const { error } = await supabase
          .from('plans')
          .insert(planData);

        if (error) throw error;
        toast.success('تم إضافة الخطة بنجاح');
      }

      resetForm();
      await loadPlans();
    } catch (error) {
      console.error('خطأ في حفظ الخطة:', error);
      toast.error('حدث خطأ في حفظ الخطة');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      stripe_price_id: plan.stripe_price_id,
      price_cents: plan.price_cents,
      features: Array.isArray(plan.features) ? plan.features : [],
      active: plan.active,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      
      toast.success('تم حذف الخطة بنجاح');
      await loadPlans();
    } catch (error) {
      console.error('خطأ في حذف الخطة:', error);
      toast.error('حدث خطأ في حذف الخطة');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      stripe_price_id: '',
      price_cents: 0,
      features: [''],
      active: true,
    });
    setEditingPlan(null);
    setShowAddForm(false);
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جار تحميل الخطط...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">إعدادات الخطط</h1>
                <p className="text-gray-600 mt-1">
                  إدارة خطط الاشتراك والأسعار
                </p>
              </div>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة خطة جديدة
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
                {editingPlan ? 'تعديل الخطة' : 'إضافة خطة جديدة'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id">معرف الخطة</Label>
                    <Input
                      id="id"
                      value={formData.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="basic, pro, enterprise"
                      required
                      disabled={!!editingPlan}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">اسم الخطة</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="الخطة الأساسية"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">وصف الخطة</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="مثالية للمتاجر الناشئة"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stripe_price_id">معرف السعر في Stripe</Label>
                    <Input
                      id="stripe_price_id"
                      value={formData.stripe_price_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, stripe_price_id: e.target.value }))}
                      placeholder="price_1234567890"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_cents">السعر (بالهللة)</Label>
                    <Input
                      id="price_cents"
                      type="number"
                      value={formData.price_cents}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_cents: parseInt(e.target.value) || 0 }))}
                      placeholder="2900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>المميزات</Label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 space-x-reverse">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="ميزة جديدة"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addFeature}>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة ميزة
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">خطة نشطة</Label>
                </div>

                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button type="submit">
                    {editingPlan ? 'تحديث الخطة' : 'إضافة الخطة'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <Badge className={plan.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {plan.active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">
                    {(plan.price_cents / 100).toFixed(2)} ر.س
                  </span>
                  <span className="text-gray-600">/شهر</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">المميزات:</h4>
                    <ul className="space-y-1">
                      {(Array.isArray(plan.features) ? plan.features : []).map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 space-x-reverse text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex items-center space-x-2 space-x-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
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

        {plans.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد خطط
            </h3>
            <p className="text-gray-600 mb-4">
              ابدأ بإضافة خطة اشتراك جديدة
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة خطة جديدة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}