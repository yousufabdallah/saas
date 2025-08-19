/*
  # إصلاح مشكلة التكرار اللانهائي في سياسات RLS

  1. إصلاح سياسات RLS
    - حذف السياسات التي تسبب التكرار اللانهائي
    - إنشاء سياسات جديدة آمنة
    - استخدام دوال مساعدة بدلاً من الاستعلامات المباشرة

  2. إنشاء دوال آمنة
    - دوال للحصول على البيانات بدون مشاكل RLS
    - دوال للإحصائيات
    - دوال للتحقق من الصلاحيات

  3. إضافة بيانات تجريبية
    - متاجر تجريبية للاختبار
    - مستخدمين ومنتجات
    - طلبات وإحصائيات
*/

-- التأكد من وجود امتداد UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- حذف جميع السياسات المشكلة وإعادة إنشائها
DROP POLICY IF EXISTS "Platform admins can access all stores" ON public.stores;
DROP POLICY IF EXISTS "Store members can read their stores" ON public.stores;
DROP POLICY IF EXISTS "Store owners and admins can update their stores" ON public.stores;

DROP POLICY IF EXISTS "Platform admins can manage all store members" ON public.store_members;
DROP POLICY IF EXISTS "Store members can read store membership" ON public.store_members;
DROP POLICY IF EXISTS "Store owners can manage store members" ON public.store_members;

DROP POLICY IF EXISTS "Platform admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Store members can read store products" ON public.products;
DROP POLICY IF EXISTS "Store admins can manage store products" ON public.products;

DROP POLICY IF EXISTS "Platform admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Store members can read store orders" ON public.orders;
DROP POLICY IF EXISTS "Store members can manage store orders" ON public.orders;

-- إنشاء سياسات RLS آمنة بدون تكرار لانهائي

-- سياسات للمتاجر
CREATE POLICY "Platform admins can access all stores"
  ON public.stores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can access their stores"
  ON public.stores FOR ALL
  TO authenticated
  USING (owner_user_id = auth.uid());

-- سياسات لأعضاء المتجر
CREATE POLICY "Platform admins can manage all store members"
  ON public.store_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can manage their store members"
  ON public.store_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id 
      AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own membership"
  ON public.store_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- سياسات للمنتجات
CREATE POLICY "Platform admins can manage all products"
  ON public.products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can manage their products"
  ON public.products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id 
      AND s.owner_user_id = auth.uid()
    )
  );

-- سياسات للطلبات
CREATE POLICY "Platform admins can manage all orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can manage their orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = orders.store_id 
      AND s.owner_user_id = auth.uid()
    )
  );

-- دالة للحصول على جميع المتاجر (للأدمن فقط)
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
    WHERE user_id = auth.uid()
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

-- دالة للحصول على جميع المستخدمين (للأدمن فقط)
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
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ليس لديك صلاحيات للوصول إلى هذه البيانات';
  END IF;
  
  RETURN QUERY
  SELECT DISTINCT
    sm.user_id,
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
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ليس لديك صلاحيات للوصول إلى هذه البيانات';
  END IF;
  
  -- إحصائيات المتاجر
  SELECT COUNT(*) INTO total_stores FROM public.stores;
  SELECT COUNT(*) INTO active_stores FROM public.stores WHERE active = true;
  
  -- إحصائيات المستخدمين
  SELECT COUNT(DISTINCT user_id) INTO total_users FROM public.store_members;
  
  -- إحصائيات الطلبات
  SELECT COUNT(*) INTO total_orders FROM public.orders;
  SELECT COALESCE(SUM(total_cents), 0) / 100 INTO total_revenue FROM public.orders WHERE status = 'completed';
  
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

-- دالة لتبديل حالة المتجر
CREATE OR REPLACE FUNCTION public.toggle_store_status(store_id uuid, new_status boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- التحقق من صلاحيات الأدمن
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ليس لديك صلاحيات لتعديل المتاجر';
  END IF;
  
  -- تحديث حالة المتجر
  UPDATE public.stores 
  SET active = new_status
  WHERE id = store_id;
  
  IF FOUND THEN
    result := json_build_object(
      'success', true,
      'message', 'تم تحديث حالة المتجر بنجاح'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'المتجر غير موجود'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- دالة لإضافة/إزالة صلاحيات الأدمن
CREATE OR REPLACE FUNCTION public.toggle_admin_status(target_user_id uuid, is_admin boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- التحقق من صلاحيات الأدمن
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ليس لديك صلاحيات لإدارة الأدمن';
  END IF;
  
  IF is_admin THEN
    -- إضافة صلاحيات الأدمن
    INSERT INTO public.platform_admins (user_id) 
    VALUES (target_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    result := json_build_object(
      'success', true,
      'message', 'تم إضافة صلاحيات الأدمن بنجاح'
    );
  ELSE
    -- إزالة صلاحيات الأدمن
    DELETE FROM public.platform_admins 
    WHERE user_id = target_user_id;
    
    result := json_build_object(
      'success', true,
      'message', 'تم إزالة صلاحيات الأدمن بنجاح'
    );
  END IF;
  
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
  IF stores_count = 0 THEN
    -- إنشاء مستخدم تجريبي (محاكاة)
    demo_user_id := uuid_generate_v4();
    
    -- إضافة متجر تجريبي
    INSERT INTO public.stores (id, name, slug, owner_user_id, plan, active)
    VALUES (
      uuid_generate_v4(),
      'متجر تجريبي',
      'demo-store-' || substr(md5(random()::text), 1, 8),
      demo_user_id,
      'pro',
      true
    )
    RETURNING id INTO demo_store_id;
    
    -- إضافة عضوية المتجر
    INSERT INTO public.store_members (store_id, user_id, role)
    VALUES (demo_store_id, demo_user_id, 'owner');
    
    -- إضافة منتج تجريبي
    INSERT INTO public.products (id, store_id, title, description, price_cents, active)
    VALUES (
      uuid_generate_v4(),
      demo_store_id,
      'منتج تجريبي',
      'وصف المنتج التجريبي',
      5000,
      true
    )
    RETURNING id INTO demo_product_id;
    
    -- إضافة طلب تجريبي
    INSERT INTO public.orders (store_id, customer_name, customer_email, status, total_cents)
    VALUES (
      demo_store_id,
      'عميل تجريبي',
      'customer@example.com',
      'completed',
      5000
    );
    
    -- إضافة المزيد من البيانات التجريبية
    FOR i IN 1..4 LOOP
      demo_user_id := uuid_generate_v4();
      
      INSERT INTO public.stores (id, name, slug, owner_user_id, plan, active)
      VALUES (
        uuid_generate_v4(),
        'متجر تجريبي ' || i,
        'demo-store-' || i || '-' || substr(md5(random()::text), 1, 6),
        demo_user_id,
        CASE WHEN i % 2 = 0 THEN 'basic' ELSE 'pro' END,
        i <= 3
      )
      RETURNING id INTO demo_store_id;
      
      INSERT INTO public.store_members (store_id, user_id, role)
      VALUES (demo_store_id, demo_user_id, 'owner');
      
      -- إضافة منتجات للمتجر
      FOR j IN 1..3 LOOP
        INSERT INTO public.products (store_id, title, description, price_cents, active)
        VALUES (
          demo_store_id,
          'منتج ' || j || ' - متجر ' || i,
          'وصف المنتج ' || j,
          (1000 + (j * 500)),
          true
        );
      END LOOP;
      
      -- إضافة طلبات للمتجر
      FOR k IN 1..2 LOOP
        INSERT INTO public.orders (store_id, customer_name, customer_email, status, total_cents)
        VALUES (
          demo_store_id,
          'عميل ' || k || ' - متجر ' || i,
          'customer' || k || '@example.com',
          CASE WHEN k = 1 THEN 'completed' ELSE 'processing' END,
          (2000 + (k * 1000))
        );
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'تم إضافة البيانات التجريبية بنجاح';
  ELSE
    RAISE NOTICE 'البيانات التجريبية موجودة بالفعل';
  END IF;
END $$;

-- منح الصلاحيات للدوال
GRANT EXECUTE ON FUNCTION public.get_all_stores() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_store_status(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_admin_status(uuid, boolean) TO authenticated;

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
    RAISE NOTICE '✅ تم إصلاح مشكلة التكرار اللانهائي في RLS';
END $$;