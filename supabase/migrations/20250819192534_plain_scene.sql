/*
  # إنشاء دالة للتحقق من صلاحيات الأدمن

  1. إنشاء دالة RPC للتحقق من الأدمن
    - دالة `check_platform_admin` للتحقق من صلاحيات المستخدم
    - دالة `add_platform_admin` لإضافة أدمن جديد

  2. إضافة المستخدم الأدمن
    - التحقق من وجود المستخدم
    - إضافته كأدمن منصة

  3. تشخيص شامل
    - عرض جميع المعلومات المطلوبة
*/

-- إنشاء دالة للتحقق من صلاحيات الأدمن
CREATE OR REPLACE FUNCTION public.check_platform_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE platform_admins.user_id = check_platform_admin.user_id
  );
END;
$$;

-- إنشاء دالة لإضافة أدمن منصة
CREATE OR REPLACE FUNCTION public.add_platform_admin(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  result json;
BEGIN
  -- البحث عن المستخدم
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  -- التحقق من وجود المستخدم
  IF target_user_id IS NULL THEN
    result := json_build_object(
      'success', false,
      'message', 'المستخدم غير موجود',
      'user_email', user_email
    );
    RETURN result;
  END IF;
  
  -- إضافة المستخدم كأدمن
  INSERT INTO public.platform_admins (user_id) 
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- إرجاع النتيجة
  result := json_build_object(
    'success', true,
    'message', 'تم إضافة المستخدم كأدمن منصة بنجاح',
    'user_id', target_user_id,
    'user_email', user_email
  );
  
  RETURN result;
END;
$$;

-- تشخيص شامل وإضافة الأدمن
DO $$
DECLARE
    target_email TEXT := 'yousufalbahlouli@hotmail.com';
    user_record RECORD;
    admin_count INTEGER;
    result_json JSON;
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
        
        -- 2. استخدام الدالة لإضافة الأدمن
        SELECT public.add_platform_admin(target_email) INTO result_json;
        RAISE NOTICE '📊 نتيجة إضافة الأدمن: %', result_json;
        
        -- 3. التحقق النهائي
        SELECT COUNT(*) INTO admin_count
        FROM public.platform_admins
        WHERE user_id = user_record.id;
        
        RAISE NOTICE '🎯 النتيجة النهائية: %', 
            CASE WHEN admin_count > 0 THEN 'المستخدم أدمن منصة ✅' ELSE 'فشل في الإعداد ❌' END;
            
        -- 4. اختبار دالة التحقق
        RAISE NOTICE '🧪 اختبار دالة التحقق: %',
            CASE WHEN public.check_platform_admin(user_record.id) THEN 'نجح ✅' ELSE 'فشل ❌' END;
            
    ELSE
        RAISE NOTICE '❌ لم يتم العثور على المستخدم: %', target_email;
        RAISE NOTICE '💡 تأكد من:';
        RAISE NOTICE '   1. تسجيل الدخول مرة واحدة على الأقل بهذا البريد';
        RAISE NOTICE '   2. تفعيل المصادقة بالبريد الإلكتروني في Supabase';
        RAISE NOTICE '   3. إلغاء تفعيل تأكيد البريد الإلكتروني';
    END IF;
    
    -- 5. عرض جميع أدمن المنصة
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

-- منح الصلاحيات للدوال
GRANT EXECUTE ON FUNCTION public.check_platform_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_platform_admin(text) TO authenticated;