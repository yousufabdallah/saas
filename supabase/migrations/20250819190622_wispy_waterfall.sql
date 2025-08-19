/*
  # إعداد نهائي لأدمن المنصة مع تشخيص شامل

  1. التشخيص الشامل
    - فحص وجود المستخدم
    - فحص حالة أدمن المنصة
    - فحص سياسات RLS

  2. الإصلاح
    - إضافة المستخدم كأدمن منصة
    - التأكد من صحة السياسات

  3. التحقق النهائي
    - عرض النتائج النهائية
*/

DO $$
DECLARE
    target_email TEXT := 'yousufalbahlouli@hotmail.com';
    user_record RECORD;
    admin_count INTEGER;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=== 🔍 تشخيص شامل لإعداد أدمن المنصة ===';
    RAISE NOTICE 'البحث عن المستخدم: %', target_email;
    
    -- 1. البحث عن المستخدم
    SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
    INTO user_record
    FROM auth.users 
    WHERE email = target_email;
    
    IF user_record.id IS NOT NULL THEN
        RAISE NOTICE '✅ تم العثور على المستخدم:';
        RAISE NOTICE '   - ID: %', user_record.id;
        RAISE NOTICE '   - البريد: %', user_record.email;
        RAISE NOTICE '   - تاريخ التسجيل: %', user_record.created_at;
        RAISE NOTICE '   - تأكيد البريد: %', 
            CASE WHEN user_record.email_confirmed_at IS NOT NULL THEN 'مؤكد' ELSE 'غير مؤكد' END;
        RAISE NOTICE '   - آخر تسجيل دخول: %', 
            COALESCE(user_record.last_sign_in_at::TEXT, 'لم يسجل دخول بعد');
        
        -- 2. فحص حالة أدمن المنصة
        SELECT COUNT(*) INTO admin_count
        FROM public.platform_admins
        WHERE user_id = user_record.id;
        
        RAISE NOTICE '📊 حالة أدمن المنصة: %', 
            CASE WHEN admin_count > 0 THEN 'موجود' ELSE 'غير موجود' END;
        
        -- 3. إضافة المستخدم كأدمن إذا لم يكن موجود
        IF admin_count = 0 THEN
            RAISE NOTICE '🔧 إضافة المستخدم كأدمن منصة...';
            
            INSERT INTO public.platform_admins (user_id) 
            VALUES (user_record.id)
            ON CONFLICT (user_id) DO NOTHING;
            
            RAISE NOTICE '✅ تم إضافة المستخدم كأدمن منصة بنجاح!';
        ELSE
            RAISE NOTICE '✅ المستخدم موجود بالفعل كأدمن منصة';
        END IF;
        
        -- 4. التحقق النهائي
        SELECT COUNT(*) INTO admin_count
        FROM public.platform_admins
        WHERE user_id = user_record.id;
        
        RAISE NOTICE '🎯 النتيجة النهائية: %', 
            CASE WHEN admin_count > 0 THEN 'المستخدم أدمن منصة ✅' ELSE 'فشل في الإعداد ❌' END;
            
    ELSE
        RAISE NOTICE '❌ لم يتم العثور على المستخدم: %', target_email;
        RAISE NOTICE '💡 تأكد من:';
        RAISE NOTICE '   1. تسجيل الدخول مرة واحدة على الأقل بهذا البريد';
        RAISE NOTICE '   2. تفعيل المصادقة بالبريد الإلكتروني في Supabase';
        RAISE NOTICE '   3. إلغاء تفعيل تأكيد البريد الإلكتروني';
    END IF;
    
    -- 5. فحص سياسات RLS
    RAISE NOTICE '=== 🛡️ فحص سياسات RLS ===';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'platform_admins' 
    AND policyname = 'Platform admins can manage platform admins';
    
    RAISE NOTICE 'سياسة platform_admins: %', 
        CASE WHEN policy_count > 0 THEN 'موجودة ✅' ELSE 'مفقودة ❌' END;
    
    -- 6. عرض جميع أدمن المنصة
    RAISE NOTICE '=== 👥 جميع أدمن المنصة ===';
    
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
    
    RAISE NOTICE '=== ✅ انتهاء التشخيص ===';
    
END $$;