/*
  # إنشاء المستخدم الأدمن الرئيسي

  1. إعداد المستخدم الأدمن
    - إضافة المستخدم الأدمن الرئيسي إلى جدول platform_admins
    - البريد الإلكتروني: yousufalbahlouli@hotmail.com

  2. الأمان
    - تطبيق سياسات RLS الموجودة
    - التأكد من صلاحيات الأدمن الكاملة

  3. ملاحظات
    - يجب إنشاء المستخدم في Supabase Auth أولاً
    - ثم تشغيل هذا الملف لإضافته كأدمن منصة
*/

-- إدراج المستخدم الأدمن الرئيسي
-- ملاحظة: يجب استبدال 'USER_UUID_HERE' بـ UUID الفعلي للمستخدم بعد إنشائه في Supabase Auth
-- يمكن الحصول على UUID من جدول auth.users بعد تسجيل المستخدم

-- مثال على كيفية إضافة الأدمن (يجب تشغيله بعد إنشاء المستخدم):
-- INSERT INTO public.platform_admins (user_id) 
-- SELECT id FROM auth.users WHERE email = 'yousufalbahlouli@hotmail.com';

-- للتحقق من وجود المستخدم وإضافته كأدمن:
DO $$
BEGIN
  -- التحقق من وجود المستخدم وإضافته كأدمن منصة
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'yousufalbahlouli@hotmail.com') THEN
    INSERT INTO public.platform_admins (user_id) 
    SELECT id FROM auth.users WHERE email = 'yousufalbahlouli@hotmail.com'
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'تم إضافة المستخدم كأدمن منصة بنجاح';
  ELSE
    RAISE NOTICE 'المستخدم غير موجود. يجب إنشاء حساب أولاً من خلال واجهة التطبيق';
  END IF;
END $$;