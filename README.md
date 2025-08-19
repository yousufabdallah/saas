# SaaSy - منصة المتاجر الإلكترونية

منصة شاملة لإنشاء وإدارة المتاجر الإلكترونية بأحدث التقنيات.

## إعداد المشروع

### 1. إعداد Supabase

1. قم بإنشاء مشروع جديد على [Supabase](https://supabase.com)
2. انتقل إلى Settings > API في لوحة تحكم Supabase
3. انسخ القيم التالية:
   - `Project URL`
   - `anon public key`
   - `service_role key` (من Service Role)

### 2. إعداد متغيرات البيئة

1. انسخ ملف `.env.local` وقم بتحديث القيم:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. تشغيل قاعدة البيانات

1. في لوحة تحكم Supabase، انتقل إلى SQL Editor
2. قم بتشغيل ملفات Migration الموجودة في مجلد `supabase/migrations/`
3. ابدأ بملف `20250819162900_spring_canyon.sql`
4. ثم ملف `20250819172551_plain_harbor.sql`
5. وأخيراً ملف `create_admin_user.sql`

### 4. إنشاء حساب الأدمن

1. قم بتسجيل حساب جديد باستخدام:
   - البريد الإلكتروني: `yousufalbahlouli@hotmail.com`
   - كلمة المرور: `96327566`

2. بعد التسجيل، قم بتشغيل SQL التالي في Supabase SQL Editor:

```sql
INSERT INTO public.platform_admins (user_id) 
SELECT id FROM auth.users WHERE email = 'yousufalbahlouli@hotmail.com';
```

### 5. تشغيل المشروع

```bash
npm install
npm run dev
```

## الوصول للوحة الأدمن

بعد تسجيل الدخول بحساب الأدمن، ستتم إعادة توجيهك تلقائياً إلى `/admin`

## المميزات

- ✅ نظام مصادقة متكامل
- ✅ لوحة تحكم أدمن شاملة
- ✅ إدارة المتاجر والمستخدمين
- ✅ نظام اشتراكات مع Stripe
- ✅ واجهة عربية كاملة
- ✅ تصميم متجاوب

## الدعم الفني

للمساعدة في الإعداد أو حل المشاكل، يرجى التواصل مع فريق الدعم.