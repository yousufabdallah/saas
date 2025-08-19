# SaaSy - منصة المتاجر الإلكترونية

منصة شاملة لإنشاء وإدارة المتاجر الإلكترونية بأحدث التقنيات.

## 🚀 إعداد المشروع

### ⚠️ خطوة مهمة جداً: تفعيل المصادقة بالبريد الإلكتروني

**يجب تفعيل المصادقة بالبريد الإلكتروني في Supabase قبل استخدام التطبيق:**

1. **اذهب إلى لوحة تحكم Supabase**
2. **انتقل إلى Authentication → Providers**
3. **ابحث عن "Email" في قائمة المزودين**
4. **قم بتفعيله (Toggle ON)**
5. **احفظ التغييرات**
6. **اختياري**: يمكنك إلغاء تفعيل "Confirm email" للتطوير

**بدون هذه الخطوة ستحصل على خطأ "Email signups are disabled"**

### 1. إعداد Supabase

1. **إنشاء مشروع جديد**:
   - اذهب إلى [supabase.com](https://supabase.com)
   - أنشئ حساب جديد أو سجل دخول
   - اضغط "New Project"
   - اختر اسم المشروع وكلمة مرور قاعدة البيانات

2. **الحصول على مفاتيح API**:
   - انتقل إلى Settings > API في لوحة تحكم Supabase
   - انسخ القيم التالية:
     - `Project URL`
     - `anon public key`
     - `service_role key` (من Service Role)

### 2. إعداد متغيرات البيئة

1. **تحديث ملف `.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. إعداد قاعدة البيانات

1. **في Supabase SQL Editor**:
   - انسخ محتوى ملف `supabase/migrations/setup_complete_database.sql`
   - الصقه في SQL Editor
   - اضغط "Run" لتشغيل الكود

### 4. إنشاء حساب الأدمن

1. **تسجيل الحساب**:
   - شغل المشروع: `npm run dev`
   - اذهب إلى `/auth/signin`
   - اضغط "إنشاء حساب جديد"
   - استخدم البيانات التالية:
     - البريد الإلكتروني: `yousufalbahlouli@hotmail.com`
     - كلمة المرور: `96327566`

2. **إضافة صلاحيات الأدمن**:
   - بعد التسجيل، اذهب إلى Supabase SQL Editor
   - شغل الكود التالي:
```sql
INSERT INTO public.platform_admins (user_id) 
SELECT id FROM auth.users WHERE email = 'yousufalbahlouli@hotmail.com';
```

### 5. تشغيل المشروع

```bash
npm install
npm run dev
```

## 🎯 الوصول للوحة الأدمن

بعد تسجيل الدخول بحساب الأدمن، ستتم إعادة توجيهك تلقائياً إلى `/admin`

## ✨ المميزات

- ✅ **نظام مصادقة متكامل** مع Supabase
- ✅ **لوحة تحكم أدمن شاملة** مع إحصائيات المنصة
- ✅ **إدارة المتاجر والمستخدمين** متعددة المستأجرين
- ✅ **نظام اشتراكات** مع Stripe (اختياري)
- ✅ **واجهة عربية كاملة** مع تصميم احترافي
- ✅ **تصميم متجاوب** يعمل على جميع الأجهزة
- ✅ **أمان متقدم** مع Row Level Security

## 🛠️ التقنيات المستخدمة

- **Frontend**: Next.js 13, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (اختياري)
- **Deployment**: Vercel/Netlify

## 📁 هيكل المشروع

```
├── app/                    # صفحات Next.js
│   ├── admin/             # لوحة تحكم الأدمن
│   ├── auth/              # صفحات المصادقة
│   ├── dashboard/         # لوحة تحكم المستخدم
│   └── pricing/           # صفحة الأسعار
├── components/            # مكونات React
├── lib/                   # مكتبات ووظائف مساعدة
├── supabase/             # ملفات قاعدة البيانات
│   └── migrations/       # ملفات Migration
└── .env.local            # متغيرات البيئة
```

## 🔧 استكشاف الأخطاء

### مشكلة "Supabase not configured"
- تأكد من إعداد متغيرات البيئة في `.env.local`
- تأكد من أن القيم ليست القيم الافتراضية

### مشكلة "No tables created yet"
- شغل ملف Migration في Supabase SQL Editor
- تأكد من تشغيل جميع الأوامر بنجاح

### مشكلة صلاحيات الأدمن
- تأكد من إضافة المستخدم إلى جدول `platform_admins`
- تحقق من البريد الإلكتروني المستخدم

## 📞 الدعم الفني

للمساعدة في الإعداد أو حل المشاكل:
- تحقق من ملف README
- راجع ملفات Migration في مجلد `supabase/migrations/`
- تأكد من إعداد متغيرات البيئة بشكل صحيح

## 🚀 النشر

1. **Vercel**:
   - ربط المشروع بـ GitHub
   - إضافة متغيرات البيئة في Vercel Dashboard
   - النشر التلقائي

2. **Netlify**:
   - رفع المشروع أو ربطه بـ Git
   - إضافة متغيرات البيئة
   - تشغيل `npm run build`

---

**ملاحظة**: تأكد من إعداد Supabase أولاً قبل تشغيل المشروع للحصول على أفضل تجربة.