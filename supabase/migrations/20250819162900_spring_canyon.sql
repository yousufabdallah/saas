/*
  # Initial Schema for Multi-tenant E-commerce SaaS

  1. New Tables
    - `stores`
      - Store information and subscription details
      - Links to Stripe customer and subscription
    - `store_members`
      - User membership and roles in stores
    - `products`
      - Store products with pricing
    - `inventory`
      - Product inventory tracking
    - `orders`
      - Customer orders
    - `order_items`
      - Individual items in orders
    - `plans`
      - Available subscription plans
    - `platform_admins`
      - Platform administrators

  2. Security
    - Enable RLS on all tables
    - Add policies for multi-tenant access control
    - Platform admins have access to all data
    - Store members only access their store data

  3. Changes
    - UUID primary keys for better security
    - Proper foreign key relationships
    - Indexes for performance
*/

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Stores table
create table public.stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  owner_user_id uuid not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'basic' check (plan in ('basic', 'pro', 'enterprise')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index stores_slug_idx on public.stores (slug);
create index stores_owner_idx on public.stores (owner_user_id);

-- Store members table
create table public.store_members (
  store_id uuid references public.stores(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

-- Products table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade,
  title text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  sku text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_store_idx on public.products (store_id);
create unique index products_sku_store_idx on public.products (store_id, sku) where sku is not null;

-- Inventory table
create table public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  updated_at timestamptz not null default now()
);

-- Orders table
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references public.stores(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  status text not null default 'new' check (status in ('new', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  total_cents integer not null default 0 check (total_cents >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_store_idx on public.orders (store_id);
create index orders_status_idx on public.orders (status);
create index orders_created_idx on public.orders (created_at desc);

-- Order items table
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  title text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0)
);

create index order_items_order_idx on public.order_items (order_id);

-- Plans table
create table public.plans (
  id text primary key,
  name text not null,
  description text,
  stripe_price_id text not null,
  price_cents integer not null check (price_cents >= 0),
  features jsonb not null default '[]',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Platform admins table
create table public.platform_admins (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.plans enable row level security;
alter table public.platform_admins enable row level security;

-- RLS Policies for stores
create policy "Platform admins can access all stores"
  on public.stores for all
  using (
    exists (
      select 1 from public.platform_admins 
      where user_id = auth.uid()
    )
  );

create policy "Store members can read their stores"
  on public.stores for select
  using (
    exists (
      select 1 from public.store_members m
      where m.store_id = stores.id and m.user_id = auth.uid()
    )
  );

create policy "Store owners and admins can update their stores"
  on public.stores for update
  using (
    exists (
      select 1 from public.store_members m
      where m.store_id = stores.id 
        and m.user_id = auth.uid() 
        and m.role in ('owner', 'admin')
    )
  );

-- RLS Policies for store_members
create policy "Platform admins can manage all store members"
  on public.store_members for all
  using (
    exists (
      select 1 from public.platform_admins 
      where user_id = auth.uid()
    )
  );

create policy "Store members can read store membership"
  on public.store_members for select
  using (store_id in (
    select store_id from public.store_members
    where user_id = auth.uid()
  ));

create policy "Store owners can manage store members"
  on public.store_members for all
  using (store_id in (
    select store_id from public.store_members
    where user_id = auth.uid() and role = 'owner'
  ));

-- RLS Policies for products
create policy "Platform admins can manage all products"
  on public.products for all
  using (
    exists (
      select 1 from public.platform_admins 
      where user_id = auth.uid()
    )
  );

create policy "Store members can read store products"
  on public.products for select
  using (store_id in (
    select store_id from public.store_members
    where user_id = auth.uid()
  ));

create policy "Store admins can manage store products"
  on public.products for all
  using (store_id in (
    select store_id from public.store_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- RLS Policies for inventory
create policy "Platform admins can manage all inventory"
  on public.inventory for all
  using (
    exists (
      select 1 from public.platform_admins 
      where user_id = auth.uid()
    )
  );

create policy "Store members can read store inventory"
  on public.inventory for select
  using (product_id in (
    select p.id from public.products p
    join public.store_members m on p.store_id = m.store_id
    where m.user_id = auth.uid()
  ));

create policy "Store admins can manage store inventory"
  on public.inventory for all
  using (product_id in (
    select p.id from public.products p
    join public.store_members m on p.store_id = m.store_id
    where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  ));

-- RLS Policies for orders
create policy "Platform admins can manage all orders"
  on public.orders for all
  using (
    exists (
      select 1 from public.platform_admins 
      where user_id = auth.uid()
    )
  );

create policy "Store members can read store orders"
  on public.orders for select
  using (store_id in (
    select store_id from public.store_members
    where user_id = auth.uid()
  ));

create policy "Store members can manage store orders"
  on public.orders for all
  using (store_id in (
    select store_id from public.store_members
    where user_id = auth.uid()
  ));

-- RLS Policies for order_items
create policy "Platform admins can manage all order items"
  on public.order_items for all
  using (
    exists (
      select 1 from public.platform_admins 
      where user_id = auth.uid()
    )
  );

create policy "Store members can access their order items"
  on public.order_items for all
  using (order_id in (
    select o.id from public.orders o
    join public.store_members m on o.store_id = m.store_id
    where m.user_id = auth.uid()
  ));

-- RLS Policies for plans (public read, platform admin write)
create policy "Anyone can read active plans"
  on public.plans for select
  using (active = true);

create policy "Platform admins can manage plans"
  on public.plans for all
  using (
    exists (
      select 1 from public.platform_admins 
      where user_id = auth.uid()
    )
  );

-- RLS Policies for platform_admins (only platform admins can access)
create policy "Platform admins can manage platform admins"
  on public.platform_admins for all
  using (
    exists (
      select 1 from public.platform_admins 
      where user_id = auth.uid()
    )
  );

-- Insert default plans
insert into public.plans (id, name, description, stripe_price_id, price_cents, features) values
('basic', 'الخطة الأساسية', 'مثالية للمتاجر الناشئة', 'price_basic_placeholder', 2900, '["حتى 100 منتج", "دعم عبر البريد الإلكتروني", "تخزين 1GB للصور", "تقارير أساسية"]'),
('pro', 'الخطة الاحترافية', 'للمتاجر المتنامية', 'price_pro_placeholder', 7900, '["منتجات غير محدودة", "دعم عبر الهاتف والبريد", "تخزين 10GB للصور", "تقارير متقدمة", "خصومات وكوبونات"]');

-- Functions for updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger handle_stores_updated_at
  before update on public.stores
  for each row execute procedure public.handle_updated_at();

create trigger handle_products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

create trigger handle_inventory_updated_at
  before update on public.inventory
  for each row execute procedure public.handle_updated_at();

create trigger handle_orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();