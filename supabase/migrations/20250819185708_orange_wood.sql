/*
  # إضافة المستخدم كأدمن منصة

  1. إضافة المستخدم
    - إضافة yousufalbahlouli@hotmail.com كأدمن منصة
    - التحقق من وجود المستخدم أولاً

  2. الأمان
    - استخدام سياسات RLS الموجودة
    - التأكد من صلاحيات الأدمن الكاملة
*/

-- إضافة المستخدم كأدمن منصة
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- البحث عن المستخدم بالبريد الإلكتروني
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'yousufalbahlouli@hotmail.com';
    
    -- التحقق من وجود المستخدم
    IF admin_user_id IS NOT NULL THEN
        -- إضافة المستخدم كأدمن منصة
        INSERT INTO public.platform_admins (user_id) 
        VALUES (admin_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'تم إضافة المستخدم % كأدمن منصة بنجاح', admin_user_id;
    ELSE
        RAISE NOTICE 'المستخدم yousufalbahlouli@hotmail.com غير موجود في جدول auth.users';
        RAISE NOTICE 'يرجى التأكد من تسجيل المستخدم أولاً من خلال واجهة التطبيق';
    END IF;
END $$;

-- التحقق من النتيجة
DO $$
DECLARE
    admin_count integer;
BEGIN
    SELECT COUNT(*) INTO admin_count 
    FROM public.platform_admins pa
    JOIN auth.users u ON pa.user_id = u.id
    WHERE u.email = 'yousufalbahlouli@hotmail.com';
    
    RAISE NOTICE 'عدد الأدمن المسجلين للبريد yousufalbahlouli@hotmail.com: %', admin_count;
END $$;