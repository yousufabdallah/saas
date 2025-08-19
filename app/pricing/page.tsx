'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'basic',
      name: 'الخطة الأساسية',
      price: 29,
      description: 'مثالية للمتاجر الناشئة',
      features: [
        'حتى 100 منتج',
        'دعم عبر البريد الإلكتروني',
        'تخزين 1GB للصور',
        'تقارير أساسية',
        'دومين مجاني (.saasy.com)',
        'شهادة SSL مجانية',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'الخطة الاحترافية',
      price: 79,
      description: 'للمتاجر المتنامية',
      features: [
        'منتجات غير محدودة',
        'دعم عبر الهاتف والبريد',
        'تخزين 10GB للصور',
        'تقارير متقدمة وتحليلات',
        'دومين مخصص',
        'خصومات وكوبونات',
        'تكامل مع وسائل التواصل',
        'نسخ احتياطية يومية',
      ],
      popular: true,
    },
  ];

  async function handleSubscribe(planId: string) {
    setLoading(planId);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          email: 'user@example.com', // سيتم تعديلها لاحقاً للحصول على البيانات من المصادقة
        }),
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء جلسة الدفع');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('خطأ في الاشتراك:', error);
      toast.error('حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SaaSy
            </h1>
          </Link>
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link href="/auth/signin">
              <Button variant="ghost">تسجيل الدخول</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
              اختر الخطة المناسبة لك
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              ابدأ مجاناً واشترك في أي وقت. لا توجد رسوم إعداد أو التزامات طويلة المدى.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative hover:shadow-xl transition-all duration-300 ${
                  plan.popular ? 'border-2 border-blue-500 shadow-lg' : 'border shadow-md'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                    الأكثر شعبية
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600 mr-2">/شهر</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 ml-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    size="lg"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        جار المعالجة...
                      </div>
                    ) : (
                      <>
                        ابدأ الآن
                        <ArrowLeft className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              الأسئلة الشائعة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">هل يمكنني تغيير خطتي لاحقاً؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    نعم، يمكنك ترقية أو تخفيض خطتك في أي وقت من لوحة التحكم.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">هل هناك رسوم إضافية؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    لا توجد رسوم خفية. الأسعار المعروضة شاملة جميع المميزات المذكورة.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">ماذا يحدث عند إلغاء الاشتراك؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    يمكنك إلغاء اشتراكك في أي وقت. ستحتفظ بالوصول حتى نهاية فترة الفوترة الحالية.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">هل تقدمون دعماً فنياً؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    نعم، نقدم دعماً عبر البريد الإلكتروني لجميع الخطط، ودعماً هاتفياً للخطة الاحترافية.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}