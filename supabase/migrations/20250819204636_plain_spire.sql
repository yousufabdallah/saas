/*
  # إصلاح مشكلة جدول الخطط وأخطاء 500

  1. إصلاح جدول الخطط
    - التأكد من وجود الجدول
    - إصلاح سياسات RLS
    - إضافة بيانات افتراضية

  2. إصلاح سياسات الأمان
    - تحديث سياسات الوصول
    - إضافة صلاحيات مناسبة

  3. إضافة دوال مساعدة
    - دوال آمنة للعمليات
    - معالجة الأخطاء
*/

-- التأكد من وجود امتداد UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- إنشاء جدول الخطط إذا لم يكن موجود
CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  stripe_price_id text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  features jsonb NOT NULL DEFAULT '[]',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- تفعيل RLS على جدول الخطط
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة وإنشاء جديدة
DROP POLICY IF EXISTS "Anyone can read active plans" ON public.plans;
DROP POLICY IF EXISTS "Platform admins can manage plans" ON public.plans;

-- سياسة للقراءة العامة للخطط النشطة
CREATE POLICY "Anyone can read active plans"
  ON public.plans FOR SELECT
  TO authenticated
  USING (active = true);

-- سياسة لمديري المنصة لإدارة الخطط
CREATE POLICY "Platform admins can manage plans"
  ON public.plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

-- إدراج الخطط الافتراضية
INSERT INTO public.plans (id, name, description, stripe_price_id, price_cents, features) 
VALUES
(
  'basic', 
  'الخطة الأساسية', 
  'مثالية للمتاجر الناشئة', 
  'price_basic_placeholder', 
  2900, 
  '["حتى 100 منتج", "دعم عبر البريد الإلكتروني", "تخزين 1GB للصور", "تقارير أساسية"]'::jsonb
),
(
  'pro', 
  'الخطة الاحترافية', 
  'للمتاجر المتنامية', 
  'price_pro_placeholder', 
  7900, 
  '["منتجات غير محدودة", "دعم عبر الهاتف والبريد", "تخزين 10GB للصور", "تقارير متقدمة", "خصومات وكوبونات"]'::jsonb
),
(
  'enterprise', 
  'الخطة المؤسسية', 
  'للشركات الكبيرة', 
  'price_enterprise_placeholder', 
  15900, 
  '["منتجات غير محدودة", "دعم مخصص 24/7", "تخزين غير محدود", "تقارير متقدمة", "API مخصص", "تكامل مخصص"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  stripe_price_id = EXCLUDED.stripe_price_id,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features,
  active = EXCLUDED.active;

-- دالة للحصول على جميع الخطط (للأدمن)
CREATE OR REPLACE FUNCTION public.get_all_plans()
RETURNS TABLE (
  id text,
  name text,
  description text,
  stripe_price_id text,
  price_cents integer,
  features jsonb,
  active boolean,
  created_at timestamptz
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
  SELECT p.id, p.name, p.description, p.stripe_price_id, 
         p.price_cents, p.features, p.active, p.created_at
  FROM public.plans p
  ORDER BY p.price_cents ASC;
END;
$$;

-- دالة لإضافة خطة جديدة
CREATE OR REPLACE FUNCTION public.add_plan(
  plan_id text,
  plan_name text,
  plan_description text,
  stripe_price_id text,
  price_cents integer,
  features jsonb,
  is_active boolean DEFAULT true
)
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
    RAISE EXCEPTION 'ليس لديك صلاحيات لإضافة خطط جديدة';
  END IF;
  
  -- إدراج الخطة الجديدة
  INSERT INTO public.plans (id, name, description, stripe_price_id, price_cents, features, active)
  VALUES (plan_id, plan_name, plan_description, stripe_price_id, price_cents, features, is_active);
  
  result := json_build_object(
    'success', true,
    'message', 'تم إضافة الخطة بنجاح',
    'plan_id', plan_id
  );
  
  RETURN result;
EXCEPTION
  WHEN unique_violation THEN
    result := json_build_object(
      'success', false,
      'message', 'الخطة موجودة بالفعل'
    );
    RETURN result;
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'message', 'حدث خطأ في إضافة الخطة: ' || SQLERRM
    );
    RETURN result;
END;
$$;

-- دالة لتحديث خطة موجودة
CREATE OR REPLACE FUNCTION public.update_plan(
  plan_id text,
  plan_name text,
  plan_description text,
  stripe_price_id text,
  price_cents integer,
  features jsonb,
  is_active boolean
)
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
    RAISE EXCEPTION 'ليس لديك صلاحيات لتحديث الخطط';
  END IF;
  
  -- تحديث الخطة
  UPDATE public.plans 
  SET 
    name = plan_name,
    description = plan_description,
    stripe_price_id = stripe_price_id,
    price_cents = price_cents,
    features = features,
    active = is_active
  WHERE id = plan_id;
  
  IF FOUND THEN
    result := json_build_object(
      'success', true,
      'message', 'تم تحديث الخطة بنجاح'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'الخطة غير موجودة'
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'message', 'حدث خطأ في تحديث الخطة: ' || SQLERRM
    );
    RETURN result;
END;
$$;

-- دالة لحذف خطة
CREATE OR REPLACE FUNCTION public.delete_plan(plan_id text)
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
    RAISE EXCEPTION 'ليس لديك صلاحيات لحذف الخطط';
  END IF;
  
  -- حذف الخطة
  DELETE FROM public.plans WHERE id = plan_id;
  
  IF FOUND THEN
    result := json_build_object(
      'success', true,
      'message', 'تم حذف الخطة بنجاح'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'الخطة غير موجودة'
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'message', 'حدث خطأ في حذف الخطة: ' || SQLERRM
    );
    RETURN result;
END;
$$;

-- منح الصلاحيات للدوال
GRANT EXECUTE ON FUNCTION public.get_all_plans() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_plan(text, text, text, text, integer, jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_plan(text, text, text, text, integer, jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_plan(text) TO authenticated;

-- التحقق من النتائج
DO $$
DECLARE
    plans_count integer;
BEGIN
    SELECT COUNT(*) INTO plans_count FROM public.plans;
    RAISE NOTICE '✅ عدد الخطط المتاحة: %', plans_count;
    
    -- عرض الخطط
    FOR plans_count IN 
        SELECT 1 FROM public.plans ORDER BY price_cents
    LOOP
        RAISE NOTICE '📋 خطة متاحة';
    END LOOP;
    
    RAISE NOTICE '🎯 تم إصلاح جدول الخطط بنجاح';
END $$;