/*
  # إصلاح مشكلة العمود الغامض في دالة get_all_users

  1. إصلاح الدوال
    - إصلاح دالة get_all_users لحل مشكلة العمود الغامض
    - تحديد أسماء الجداول بوضوح في الاستعلامات
    - إضافة aliases للجداول

  2. تحسين الأداء
    - استخدام استعلامات محسنة
    - تقليل التعقيد في الدوال

  3. إضافة بيانات تجريبية
    - متاجر ومستخدمين للاختبار
*/

-- التأكد من وجود امتداد UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- إصلاح دالة get_all_users لحل مشكلة العمود الغامض
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  is_platform_admin boolean,
  stores_count bigint
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
  SELECT DISTINCT
    sm.user_id as user_id,
    COALESCE('user-' || substr(sm.user_id::text, 1, 8) || '@example.com', 'unknown@example.com') as email,
    MIN(sm.created_at) as created_at,
    EXISTS (
      SELECT 1 FROM public.platform_admins pa 
      WHERE pa.user_id = sm.user_id
    ) as is_platform_admin,
    COUNT(sm.store_id) as stores_count
  FROM public.store_members sm
  GROUP BY sm.user_id
  ORDER BY created_at DESC;
END;
$$;

-- إصلاح دالة get_all_stores لتجنب أي مشاكل مشابهة
CREATE OR REPLACE FUNCTION public.get_all_stores()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  plan text,
  active boolean,
  created_at timestamptz,
  owner_user_id uuid,
  members_count bigint,
  products_count bigint
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
    s.id,
    s.name,
    s.slug,
    s.plan,
    s.active,
    s.created_at,
    s.owner_user_id,
    COALESCE(sm.members_count, 0) as members_count,
    COALESCE(p.products_count, 0) as products_count
  FROM public.stores s
  LEFT JOIN (
    SELECT store_id, COUNT(*) as members_count
    FROM public.store_members
    GROUP BY store_id
  ) sm ON s.id = sm.store_id
  LEFT JOIN (
    SELECT store_id, COUNT(*) as products_count
    FROM public.products
    GROUP BY store_id
  ) p ON s.id = p.store_id
  ORDER BY s.created_at DESC;
END;
$$;

-- دالة محدثة للحصول على إحصائيات المنصة
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_stores integer;
  active_stores integer;
  total_users integer;
  total_orders integer;
  total_revenue numeric;
  result json;
BEGIN
  -- التحقق من صلاحيات الأدمن
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE platform_admins.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ليس لديك صلاحيات للوصول إلى هذه البيانات';
  END IF;
  
  -- إحصائيات المتاجر
  SELECT COUNT(*) INTO total_stores FROM public.stores;
  SELECT COUNT(*) INTO active_stores FROM public.stores WHERE active = true;
  
  -- إحصائيات المستخدمين
  SELECT COUNT(DISTINCT sm.user_id) INTO total_users FROM public.store_members sm;
  
  -- إحصائيات الطلبات
  SELECT COUNT(*) INTO total_orders FROM public.orders;
  SELECT COALESCE(SUM(o.total_cents), 0) / 100 INTO total_revenue 
  FROM public.orders o 
  WHERE o.status = 'completed';
  
  result := json_build_object(
    'total_stores', total_stores,
    'active_stores', active_stores,
    'total_users', total_users,
    'total_orders', total_orders,
    'total_revenue', total_revenue
  );
  
  RETURN result;
END;
$$;

-- إضافة بيانات تجريبية للاختبار (فقط إذا لم تكن موجودة)
DO $$
DECLARE
  demo_user_id uuid;
  demo_store_id uuid;
  demo_product_id uuid;
  stores_count integer;
BEGIN
  -- التحقق من وجود متاجر
  SELECT COUNT(*) INTO stores_count FROM public.stores;
  
  -- إضافة بيانات تجريبية فقط إذا لم تكن موجودة
  IF stores_count < 3 THEN
    -- إضافة المزيد من البيانات التجريبية
    FOR i IN 1..5 LOOP
      demo_user_id := uuid_generate_v4();
      
      INSERT INTO public.stores (id, name, slug, owner_user_id, plan, active)
      VALUES (
        uuid_generate_v4(),
        'متجر تجريبي ' || i,
        'demo-store-' || i || '-' || substr(md5(random()::text), 1, 6),
        demo_user_id,
        CASE 
          WHEN i % 3 = 0 THEN 'enterprise'
          WHEN i % 2 = 0 THEN 'pro' 
          ELSE 'basic' 
        END,
        i <= 4 -- آخر متجر غير نشط
      )
      RETURNING id INTO demo_store_id;
      
      INSERT INTO public.store_members (store_id, user_id, role)
      VALUES (demo_store_id, demo_user_id, 'owner');
      
      -- إضافة منتجات للمتجر
      FOR j IN 1..CASE WHEN i <= 2 THEN 5 ELSE 3 END LOOP
        INSERT INTO public.products (store_id, title, description, price_cents, active)
        VALUES (
          demo_store_id,
          'منتج ' || j || ' - متجر ' || i,
          'وصف المنتج ' || j || ' في المتجر ' || i,
          (1000 + (j * 500) + (i * 200)),
          true
        );
      END LOOP;
      
      -- إضافة طلبات للمتجر
      FOR k IN 1..CASE WHEN i <= 2 THEN 4 ELSE 2 END LOOP
        INSERT INTO public.orders (store_id, customer_name, customer_email, status, total_cents)
        VALUES (
          demo_store_id,
          'عميل ' || k || ' - متجر ' || i,
          'customer' || k || 'store' || i || '@example.com',
          CASE 
            WHEN k = 1 THEN 'completed'
            WHEN k = 2 THEN 'processing'
            ELSE 'new'
          END,
          (2000 + (k * 1000) + (i * 300))
        );
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'تم إضافة البيانات التجريبية بنجاح';
  ELSE
    RAISE NOTICE 'البيانات التجريبية موجودة بالفعل';
  END IF;
END $$;

-- إضافة المستخدم الأدمن الرئيسي
DO $$
DECLARE
    target_email TEXT := 'yousufalbahlouli@hotmail.com';
    admin_user_id uuid;
    admin_count integer;
BEGIN
    -- البحث عن المستخدم
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = target_email;
    
    IF admin_user_id IS NOT NULL THEN
        -- إضافة المستخدم كأدمن منصة
        INSERT INTO public.platform_admins (user_id) 
        VALUES (admin_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        
        -- التحقق من النتيجة
        SELECT COUNT(*) INTO admin_count
        FROM public.platform_admins
        WHERE user_id = admin_user_id;
        
        IF admin_count > 0 THEN
            RAISE NOTICE '✅ المستخدم % موجود كأدمن منصة', target_email;
        ELSE
            RAISE NOTICE '❌ فشل في إضافة المستخدم كأدمن منصة';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ المستخدم % غير موجود. يرجى تسجيل الدخول أولاً', target_email;
    END IF;
END $$;

-- منح الصلاحيات للدوال
GRANT EXECUTE ON FUNCTION public.get_all_stores() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;

-- عرض الإحصائيات النهائية
DO $$
DECLARE
    stores_count integer;
    users_count integer;
    admins_count integer;
BEGIN
    SELECT COUNT(*) INTO stores_count FROM public.stores;
    SELECT COUNT(DISTINCT user_id) INTO users_count FROM public.store_members;
    SELECT COUNT(*) INTO admins_count FROM public.platform_admins;
    
    RAISE NOTICE '📊 إحصائيات المنصة النهائية:';
    RAISE NOTICE '   - المتاجر: %', stores_count;
    RAISE NOTICE '   - المستخدمين: %', users_count;
    RAISE NOTICE '   - أدمن المنصة: %', admins_count;
    RAISE NOTICE '✅ تم إصلاح مشكلة العمود الغامض';
END $$;