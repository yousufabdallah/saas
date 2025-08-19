import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Star, Users, ShoppingBag, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const features = [
    {
      icon: <ShoppingBag className="h-8 w-8 text-blue-600" />,
      title: 'إدارة المنتجات',
      description: 'أضف وأدر منتجاتك بسهولة مع إدارة مخزون ذكية',
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: 'تحليلات متقدمة',
      description: 'راقب مبيعاتك وتحليلات العملاء بتقارير مفصلة',
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: 'إدارة العملاء',
      description: 'تتبع طلبات العملاء وإدارة علاقاتك معهم بفعالية',
    },
  ];

  const testimonials = [
    {
      name: 'أحمد محمد',
      role: 'صاحب متجر الكتروني',
      content: 'منصة رائعة سهلت علي إدارة متجري بشكل كامل',
      rating: 5,
    },
    {
      name: 'سارة أحمد',
      role: 'رائدة أعمال',
      content: 'أفضل استثمار قمت به لتطوير تجارتي الإلكترونية',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SaaSy
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8 space-x-reverse">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              المميزات
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              الأسعار
            </Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
              آراء العملاء
            </Link>
          </nav>
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link href="/auth/signin">
              <Button variant="ghost">تسجيل الدخول</Button>
            </Link>
            <Link href="/pricing">
              <Button>ابدأ الآن</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            🎉 عرض خاص: شهر مجاني للمشتركين الجدد
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">
            أنشئ متجرك الإلكتروني
            <br />
            في دقائق
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            منصة شاملة لإنشاء وإدارة متجرك الإلكتروني بأحدث التقنيات وأسهل الطرق.
            ابدأ بيع منتجاتك اليوم!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/pricing">
              <Button size="lg" className="text-lg px-8 py-4">
                ابدأ مجاناً
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              شاهد العرض التوضيحي
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">متجر نشط</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">50M+</div>
              <div className="text-gray-600">ريال مبيعات</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-gray-600">وقت التشغيل</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              مميزات تجعل متجرك يتميز
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              كل ما تحتاجه لإنشاء متجر إلكتروني ناجح في مكان واحد
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ماذا يقول عملاؤنا
            </h2>
            <p className="text-xl text-gray-600">
              آراء حقيقية من أصحاب متاجر نشطة على منصتنا
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            جاهز لبناء متجرك؟
          </h2>
          <p className="text-xl mb-8 opacity-90">
            انضم إلى آلاف التجار الذين يثقون بمنصتنا لنمو أعمالهم
          </p>
          <Link href="/pricing">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              ابدأ رحلتك اليوم
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 space-x-reverse mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
                <h3 className="text-xl font-bold">SaaSy</h3>
              </div>
              <p className="text-gray-400">
                منصة المتاجر الإلكترونية الرائدة في المنطقة
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">المنتج</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">المميزات</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">الأسعار</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">الأمان</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">الدعم</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">المساعدة</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">التوثيق</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">التواصل</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">الشركة</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">عن SaaSy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">المدونة</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">الوظائف</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SaaSy. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}