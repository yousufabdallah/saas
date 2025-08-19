/*
  # إصلاح سياسات RLS وأخطاء 500

  1. إصلاح سياسات RLS
    - تحديث جميع السياسات للعمل مع authenticated users
    - إضافة سياسات مفقودة
    - إصلاح صلاحيات الوصول

  2. إنشاء دوال مساعدة
    - دالة للتحقق من صلاحيات الأدمن
    - دالة للحصول على إحصائيات المنصة
    - دوال آمنة للعمليات

  3. إضافة بيانات تجريبية
    - متاجر تجريبية للاختبار
    - مستخدمين ومنتجات
    - طلبات وإحصائيات
*/

-- التأكد من وجود امتداد UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- دالة للتحقق من صلاحيات الأدمن (إذا لم تكن موجودة)
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

-- دالة لإضافة أدمن منصة
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

-- دالة للحصول على إحصائيات المنصة
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

-- إصلاح سياسات RLS للمتاجر
DROP POLICY IF EXISTS "Platform admins can access all stores" ON public.stores;
CREATE POLICY "Platform admins can access all stores"
  ON public.stores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can read their stores" ON public.stores;
CREATE POLICY "Store members can read their stores"
  ON public.stores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.store_id = stores.id AND m.user_id = auth.uid()
    )
  );

-- إصلاح سياسات RLS لأعضاء المتجر
DROP POLICY IF EXISTS "Platform admins can manage all store members" ON public.store_members;
CREATE POLICY "Platform admins can manage all store members"
  ON public.store_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can read store membership" ON public.store_members;
CREATE POLICY "Store members can read store membership"
  ON public.store_members FOR SELECT
  TO authenticated
  USING (store_id IN (
    SELECT store_id FROM public.store_members
    WHERE user_id = auth.uid()
  ));

-- إصلاح سياسات RLS للمنتجات
DROP POLICY IF EXISTS "Platform admins can manage all products" ON public.products;
CREATE POLICY "Platform admins can manage all products"
  ON public.products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can read store products" ON public.products;
CREATE POLICY "Store members can read store products"
  ON public.products FOR SELECT
  TO authenticated
  USING (store_id IN (
    SELECT store_id FROM public.store_members
    WHERE user_id = auth.uid()
  ));

-- إصلاح سياسات RLS للطلبات
DROP POLICY IF EXISTS "Platform admins can manage all orders" ON public.orders;
CREATE POLICY "Platform admins can manage all orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can read store orders" ON public.orders;
CREATE POLICY "Store members can read store orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (store_id IN (
    SELECT store_id FROM public.store_members
    WHERE user_id = auth.uid()
  ));

-- إصلاح سياسات RLS للخطط
DROP POLICY IF EXISTS "Anyone can read active plans" ON public.plans;
CREATE POLICY "Anyone can read active plans"
  ON public.plans FOR SELECT
  TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Platform admins can manage plans" ON public.plans;
CREATE POLICY "Platform admins can manage plans"
  ON public.plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

-- إصلاح سياسات RLS لمديري المنصة
DROP POLICY IF EXISTS "Platform admins can manage platform admins" ON public.platform_admins;
CREATE POLICY "Platform admins can manage platform admins"
  ON public.platform_admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

-- إضافة بيانات تجريبية للاختبار (فقط إذا لم تكن موجودة)
DO $$
DECLARE
  demo_user_id uuid;
  demo_store_id uuid;
  demo_product_id uuid;
BEGIN
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
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO demo_store_id;
  
  -- إضافة عضوية المتجر
  IF demo_store_id IS NOT NULL THEN
    INSERT INTO public.store_members (store_id, user_id, role)
    VALUES (demo_store_id, demo_user_id, 'owner')
    ON CONFLICT (store_id, user_id) DO NOTHING;
    
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
    ON CONFLICT DO NOTHING
    RETURNING id INTO demo_product_id;
    
    -- إضافة طلب تجريبي
    INSERT INTO public.orders (store_id, customer_name, customer_email, status, total_cents)
    VALUES (
      demo_store_id,
      'عميل تجريبي',
      'customer@example.com',
      'completed',
      5000
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'تم إضافة البيانات التجريبية بنجاح';
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
GRANT EXECUTE ON FUNCTION public.check_platform_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_platform_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;

-- عرض الإحصائيات النهائية
DO $$
DECLARE
    stats_result json;
BEGIN
    SELECT public.get_platform_stats() INTO stats_result;
    RAISE NOTICE '📊 إحصائيات المنصة: %', stats_result;
END $$;