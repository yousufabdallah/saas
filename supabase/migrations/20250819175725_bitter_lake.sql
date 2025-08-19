/*
  # إعداد قاعدة البيانات الكاملة لمنصة SaaSy

  1. الجداول الجديدة
    - `stores` - معلومات المتاجر وتفاصيل الاشتراك
    - `store_members` - عضوية المستخدمين في المتاجر
    - `products` - منتجات المتاجر مع الأسعار
    - `inventory` - تتبع المخزون
    - `orders` - طلبات العملاء
    - `order_items` - عناصر الطلبات
    - `plans` - خطط الاشتراك المتاحة
    - `platform_admins` - مديري المنصة

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - إضافة سياسات للتحكم في الوصول متعدد المستأجرين
    - مديري المنصة لديهم وصول لجميع البيانات
    - أعضاء المتجر يصلون فقط لبيانات متجرهم

  3. التغييرات
    - مفاتيح UUID الأساسية للأمان الأفضل
    - علاقات المفاتيح الخارجية المناسبة
    - فهارس للأداء
    - إضافة المستخدم الأدمن الرئيسي
*/

-- تفعيل امتداد UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- جدول المتاجر
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  owner_user_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- إنشاء فهارس للمتاجر
CREATE UNIQUE INDEX IF NOT EXISTS stores_slug_idx ON public.stores (slug);
CREATE INDEX IF NOT EXISTS stores_owner_idx ON public.stores (owner_user_id);

-- جدول أعضاء المتجر
CREATE TABLE IF NOT EXISTS public.store_members (
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, user_id)
);

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  sku text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- إنشاء فهارس للمنتجات
CREATE INDEX IF NOT EXISTS products_store_idx ON public.products (store_id);
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_store_idx ON public.products (store_id, sku) WHERE sku IS NOT NULL;

-- جدول المخزون
CREATE TABLE IF NOT EXISTS public.inventory (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity integer NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- إنشاء فهارس للطلبات
CREATE INDEX IF NOT EXISTS orders_store_idx ON public.orders (store_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders (created_at DESC);

-- جدول عناصر الطلبات
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  title text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0)
);

-- إنشاء فهرس لعناصر الطلبات
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);

-- جدول الخطط
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

-- جدول مديري المنصة
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمتاجر
DROP POLICY IF EXISTS "Platform admins can access all stores" ON public.stores;
CREATE POLICY "Platform admins can access all stores"
  ON public.stores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can read their stores" ON public.stores;
CREATE POLICY "Store members can read their stores"
  ON public.stores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.store_id = stores.id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners and admins can update their stores" ON public.stores;
CREATE POLICY "Store owners and admins can update their stores"
  ON public.stores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.store_id = stores.id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('owner', 'admin')
    )
  );

-- سياسات RLS لأعضاء المتجر
DROP POLICY IF EXISTS "Platform admins can manage all store members" ON public.store_members;
CREATE POLICY "Platform admins can manage all store members"
  ON public.store_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can read store membership" ON public.store_members;
CREATE POLICY "Store members can read store membership"
  ON public.store_members FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM public.store_members
    WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Store owners can manage store members" ON public.store_members;
CREATE POLICY "Store owners can manage store members"
  ON public.store_members FOR ALL
  USING (store_id IN (
    SELECT store_id FROM public.store_members
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- سياسات RLS للمنتجات
DROP POLICY IF EXISTS "Platform admins can manage all products" ON public.products;
CREATE POLICY "Platform admins can manage all products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can read store products" ON public.products;
CREATE POLICY "Store members can read store products"
  ON public.products FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM public.store_members
    WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Store admins can manage store products" ON public.products;
CREATE POLICY "Store admins can manage store products"
  ON public.products FOR ALL
  USING (store_id IN (
    SELECT store_id FROM public.store_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- سياسات RLS للمخزون
DROP POLICY IF EXISTS "Platform admins can manage all inventory" ON public.inventory;
CREATE POLICY "Platform admins can manage all inventory"
  ON public.inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can read store inventory" ON public.inventory;
CREATE POLICY "Store members can read store inventory"
  ON public.inventory FOR SELECT
  USING (product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.store_members m ON p.store_id = m.store_id
    WHERE m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Store admins can manage store inventory" ON public.inventory;
CREATE POLICY "Store admins can manage store inventory"
  ON public.inventory FOR ALL
  USING (product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.store_members m ON p.store_id = m.store_id
    WHERE m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
  ));

-- سياسات RLS للطلبات
DROP POLICY IF EXISTS "Platform admins can manage all orders" ON public.orders;
CREATE POLICY "Platform admins can manage all orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can read store orders" ON public.orders;
CREATE POLICY "Store members can read store orders"
  ON public.orders FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM public.store_members
    WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Store members can manage store orders" ON public.orders;
CREATE POLICY "Store members can manage store orders"
  ON public.orders FOR ALL
  USING (store_id IN (
    SELECT store_id FROM public.store_members
    WHERE user_id = auth.uid()
  ));

-- سياسات RLS لعناصر الطلبات
DROP POLICY IF EXISTS "Platform admins can manage all order items" ON public.order_items;
CREATE POLICY "Platform admins can manage all order items"
  ON public.order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store members can access their order items" ON public.order_items;
CREATE POLICY "Store members can access their order items"
  ON public.order_items FOR ALL
  USING (order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.store_members m ON o.store_id = m.store_id
    WHERE m.user_id = auth.uid()
  ));

-- سياسات RLS للخطط (قراءة عامة، كتابة للأدمن فقط)
DROP POLICY IF EXISTS "Anyone can read active plans" ON public.plans;
CREATE POLICY "Anyone can read active plans"
  ON public.plans FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Platform admins can manage plans" ON public.plans;
CREATE POLICY "Platform admins can manage plans"
  ON public.plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

-- سياسات RLS لمديري المنصة (فقط مديري المنصة يمكنهم الوصول)
DROP POLICY IF EXISTS "Platform admins can manage platform admins" ON public.platform_admins;
CREATE POLICY "Platform admins can manage platform admins"
  ON public.platform_admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins 
      WHERE user_id = auth.uid()
    )
  );

-- إدراج الخطط الافتراضية
INSERT INTO public.plans (id, name, description, stripe_price_id, price_cents, features) 
VALUES
('basic', 'الخطة الأساسية', 'مثالية للمتاجر الناشئة', 'price_basic_placeholder', 2900, '["حتى 100 منتج", "دعم عبر البريد الإلكتروني", "تخزين 1GB للصور", "تقارير أساسية"]'),
('pro', 'الخطة الاحترافية', 'للمتاجر المتنامية', 'price_pro_placeholder', 7900, '["منتجات غير محدودة", "دعم عبر الهاتف والبريد", "تخزين 10GB للصور", "تقارير متقدمة", "خصومات وكوبونات"]')
ON CONFLICT (id) DO NOTHING;

-- دوال لتحديث updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة triggers لـ updated_at
DROP TRIGGER IF EXISTS handle_stores_updated_at ON public.stores;
CREATE TRIGGER handle_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_products_updated_at ON public.products;
CREATE TRIGGER handle_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_inventory_updated_at ON public.inventory;
CREATE TRIGGER handle_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_orders_updated_at ON public.orders;
CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- إضافة المستخدم الأدمن الرئيسي
-- ملاحظة: يجب إنشاء المستخدم في Supabase Auth أولاً
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