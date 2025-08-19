/*
  # تشخيص وإصلاح إعداد الأدمن

  1. التحقق من وجود المستخدم
    - البحث عن المستخدم في جدول auth.users
    - عرض معلومات المستخدم

  2. إضافة المستخدم كأدمن
    - إضافة المستخدم إلى جدول platform_admins
    - التحقق من النتيجة

  3. التشخيص
    - عرض جميع الأدمن الحاليين
    - التحقق من صلاحيات RLS
*/

-- عرض جميع المستخدمين المسجلين
DO $$
DECLARE
    user_record RECORD;
    admin_count INTEGER;
BEGIN
    RAISE NOTICE '=== تشخيص إعداد الأدمن ===';
    
    -- عرض جميع المستخدمين
    RAISE NOTICE 'المستخدمين المسجلين:';
    FOR user_record IN 
        SELECT id, email, created_at, email_confirmed_at 
        FROM auth.users 
        ORDER BY created_at DESC
    LOOP
        RAISE NOTICE 'المستخدم: % | البريد: % | تاريخ التسجيل: % | تأكيد البريد: %', 
            user_record.id, 
            user_record.email, 
            user_record.created_at,
            CASE WHEN user_record.email_confirmed_at IS NOT NULL THEN 'مؤكد' ELSE 'غير مؤكد' END;
    END LOOP;
    
    -- البحث عن المستخدم المطلوب
    SELECT COUNT(*) INTO admin_count 
    FROM auth.users 
    WHERE email = 'yousufalbahlouli@hotmail.com';
    
    IF admin_count > 0 THEN
        RAISE NOTICE '✅ تم العثور على المستخدم yousufalbahlouli@hotmail.com';
        
        -- إضافة المستخدم كأدمن منصة
        INSERT INTO public.platform_admins (user_id) 
        SELECT id FROM auth.users WHERE email = 'yousufalbahlouli@hotmail.com'
        ON CONFLICT (user_id) DO NOTHING;
        
        -- التحقق من النتيجة
        SELECT COUNT(*) INTO admin_count
        FROM public.platform_admins pa
        JOIN auth.users u ON pa.user_id = u.id
        WHERE u.email = 'yousufalbahlouli@hotmail.com';
        
        IF admin_count > 0 THEN
            RAISE NOTICE '✅ تم إضافة المستخدم كأدمن منصة بنجاح';
        ELSE
            RAISE NOTICE '❌ فشل في إضافة المستخدم كأدمن منصة';
        END IF;
    ELSE
        RAISE NOTICE '❌ لم يتم العثور على المستخدم yousufalbahlouli@hotmail.com';
        RAISE NOTICE 'يرجى التأكد من تسجيل الدخول مرة واحدة على الأقل بهذا البريد الإلكتروني';
    END IF;
    
    -- عرض جميع أدمن المنصة الحاليين
    RAISE NOTICE '=== أدمن المنصة الحاليين ===';
    FOR user_record IN 
        SELECT u.id, u.email, pa.created_at as admin_since
        FROM public.platform_admins pa
        JOIN auth.users u ON pa.user_id = u.id
        ORDER BY pa.created_at
    LOOP
        RAISE NOTICE 'أدمن: % | البريد: % | منذ: %', 
            user_record.id, 
            user_record.email, 
            user_record.admin_since;
    END LOOP;
    
    -- التحقق من سياسات RLS
    RAISE NOTICE '=== فحص سياسات RLS ===';
    
    -- فحص سياسة platform_admins
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'platform_admins' 
        AND policyname = 'Platform admins can manage platform admins'
    ) THEN
        RAISE NOTICE '✅ سياسة RLS لجدول platform_admins موجودة';
    ELSE
        RAISE NOTICE '❌ سياسة RLS لجدول platform_admins مفقودة';
    END IF;
    
    RAISE NOTICE '=== انتهاء التشخيص ===';
END $$;