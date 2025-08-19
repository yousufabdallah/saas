/*
  # إصلاح عرض المستخدمين الحقيقيين وتفعيل التسجيل المجاني

  1. دالة جديدة للمستخدمين الحقيقيين
    - الوصول المباشر لجدول auth.users
    - عرض جميع المستخدمين المسجلين
    - معلومات حقيقية بدون بيانات وهمية

  2. تفعيل التسجيل المجاني
    - إنشاء متجر تلقائي عند التسجيل
    - بدون دفع أو تفعيل
    - متجر نشط فوراً

  3. دوال محسنة
    - دالة لإنشاء متجر مجاني
    - دالة لعرض المستخدمين الحقيقيين
    - معالجة أفضل للأخطاء
*/

-- دالة محدثة للحصول على جميع المستخدمين الحقيقيين
CREATE OR REPLACE FUNCTION public.get_all_real_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  is_platform_admin boolean,
  has_store boolean,
  store_name text,
  store_active boolean,
  store_plan text,
  last_activity timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من صلاحيات الأدمن
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE platform_admins.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ليس لديك صلاحيات للوصول إلى هذه البيانات';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    EXISTS (
      SELECT 1 FROM public.platform_admins pa 
      WHERE pa.user_id = u.id
    ) as is_platform_admin,
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.owner_user_id = u.id
    ) as has_store,
    s.name as store_name,
    s.active as store_active,
    s.plan as store_plan,
    (
      SELECT MAX(al.created_at) 
      FROM public.user_activity_logs al 
      WHERE al.user_id = u.id
    ) as last_activity
  FROM auth.users u
  LEFT JOIN public.stores s ON s.owner_user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- دالة لإنشاء متجر مجاني للعميل
CREATE OR REPLACE FUNCTION public.create_free_store_for_user(
  customer_email text,
  store_name text,
  store_plan text DEFAULT 'basic'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
  customer_user_id uuid;
  new_store_id uuid;
  store_slug text;
  result json;
BEGIN
  -- التحقق من صلاحيات الأدمن
  admin_user_id := auth.uid();
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE user_id = admin_user_id
  ) THEN
    RAISE EXCEPTION 'ليس لديك صلاحيات لإنشاء متاجر';
  END IF;
  
  -- البحث عن العميل في auth.users
  SELECT id INTO customer_user_id 
  FROM auth.users 
  WHERE email = customer_email;
  
  IF customer_user_id IS NULL THEN
    result := json_build_object(
      'success', false,
      'message', 'العميل غير موجود. يجب على العميل تسجيل حساب أولاً'
    );
    RETURN result;
  END IF;
  
  -- التحقق من عدم وجود متجر للعميل
  IF EXISTS (
    SELECT 1 FROM public.stores 
    WHERE owner_user_id = customer_user_id
  ) THEN
    result := json_build_object(
      'success', false,
      'message', 'العميل لديه متجر بالفعل'
    );
    RETURN result;
  END IF;
  
  -- إنشاء slug فريد للمتجر
  store_slug := lower(regexp_replace(store_name, '[^a-zA-Z0-9\u0600-\u06FF]', '-', 'g')) 
                || '-' || substr(md5(random()::text), 1, 6);
  
  -- إنشاء المتجر (نشط ومجاني)
  INSERT INTO public.stores (
    id, name, slug, owner_user_id, plan, active
  ) VALUES (
    uuid_generate_v4(), store_name, store_slug, customer_user_id, store_plan, true
  ) RETURNING id INTO new_store_id;
  
  -- إضافة العميل كمالك للمتجر
  INSERT INTO public.store_members (store_id, user_id, role)
  VALUES (new_store_id, customer_user_id, 'owner');
  
  -- تسجيل العملية في جدول المتاجر المنشأة من الأدمن
  INSERT INTO public.admin_created_stores (
    store_id, admin_user_id, customer_user_id, notes
  ) VALUES (
    new_store_id, admin_user_id, customer_user_id, 'متجر مجاني من الأدمن'
  );
  
  -- تسجيل النشاط
  INSERT INTO public.user_activity_logs (
    user_id, activity_type, description, metadata
  ) VALUES (
    customer_user_id, 
    'store_created', 
    'تم إنشاء متجر مجاني من قبل الأدمن: ' || store_name,
    json_build_object(
      'store_id', new_store_id,
      'admin_user_id', admin_user_id,
      'plan', store_plan,
      'free_store', true
    )
  );
  
  result := json_build_object(
    'success', true,
    'message', 'تم إنشاء المتجر المجاني بنجاح',
    'store_id', new_store_id,
    'store_name', store_name,
    'store_slug', store_slug
  );
  
  RETURN result;
END;
$$;

-- دالة لتفعيل التسجيل المجاني التلقائي
CREATE OR REPLACE FUNCTION public.auto_create_free_store()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_store_id uuid;
  store_slug text;
  store_name text;
BEGIN
  -- إنشاء اسم وslug للمتجر
  store_name := 'متجر ' || split_part(NEW.email, '@', 1);
  store_slug := lower(split_part(NEW.email, '@', 1)) || '-' || substr(md5(random()::text), 1, 6);
  
  -- إنشاء المتجر تلقائياً
  INSERT INTO public.stores (
    id, name, slug, owner_user_id, plan, active
  ) VALUES (
    uuid_generate_v4(), store_name, store_slug, NEW.id, 'basic', true
  ) RETURNING id INTO new_store_id;
  
  -- إضافة المستخدم كمالك للمتجر
  INSERT INTO public.store_members (store_id, user_id, role)
  VALUES (new_store_id, NEW.id, 'owner');
  
  -- تسجيل النشاط
  INSERT INTO public.user_activity_logs (
    user_id, activity_type, description, metadata
  ) VALUES (
    NEW.id, 
    'store_created', 
    'تم إنشاء متجر مجاني تلقائياً عند التسجيل',
    json_build_object(
      'store_id', new_store_id,
      'auto_created', true,
      'plan', 'basic'
    )
  );
  
  RETURN NEW;
END;
$$;

-- تفعيل إنشاء المتجر التلقائي عند التسجيل (اختياري)
-- DROP TRIGGER IF EXISTS auto_create_store_trigger ON auth.users;
-- CREATE TRIGGER auto_create_store_trigger
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.auto_create_free_store();

-- منح الصلاحيات للدوال الجديدة
GRANT EXECUTE ON FUNCTION public.get_all_real_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_free_store_for_user(text, text, text) TO authenticated;

-- اختبار الدالة الجديدة
DO $$
DECLARE
    users_count integer;
    admin_email text := 'yousufalbahlouli@hotmail.com';
BEGIN
    -- فحص عدد المستخدمين الحقيقيين
    SELECT COUNT(*) INTO users_count FROM auth.users;
    
    RAISE NOTICE '📊 عدد المستخدمين الحقيقيين في auth.users: %', users_count;
    
    -- التأكد من وجود الأدمن
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        RAISE NOTICE '✅ الأدمن % موجود في النظام', admin_email;
    ELSE
        RAISE NOTICE '⚠️ الأدمن % غير موجود، يرجى تسجيل الدخول أولاً', admin_email;
    END IF;
    
    RAISE NOTICE '🎯 الدالة الجديدة get_all_real_users() جاهزة للاستخدام';
END $$;