create table
  public.profiles (
    id uuid not null,
    first_name text not null,
    last_name text not null,
    email text null,
    phone_number text null,
    coupon_code text not null,
    constraint profiles_pkey primary key (id),
    constraint profiles_coupon_code_key unique (coupon_code),
    constraint profiles_email_key unique (email),
    constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

  create table
  public.products (
    id bigint generated always as identity not null,
    name text not null,
    description text null,
    price numeric not null,
    stock integer not null,
    image_url text null,
    alt_image text null,
    constraint products_pkey primary key (id)
  ) tablespace pg_default;

  create table
  public.orders (
    id bigint generated always as identity not null,
    user_id uuid null,
    total_amount numeric not null,
    discount_applied numeric null default 0,
    coupon_code text null,
    issued_by uuid null,
    commission_paid boolean null default false,
    stripe_payment_intent_id text null,
    status text null default 'pending'::text,
    payment_intent_id text null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    constraint orders_pkey primary key (id),
    constraint orders_coupon_code_fkey foreign key (coupon_code) references profiles (coupon_code),
    constraint orders_issued_by_fkey foreign key (issued_by) references profiles (id),
    constraint orders_user_id_fkey foreign key (user_id) references profiles (id)
  ) tablespace pg_default;

  create table
  public.order_items (
    id bigint generated always as identity not null,
    order_id bigint null,
    product_id bigint null,
    quantity integer not null,
    price numeric not null,
    constraint order_items_pkey primary key (id),
    constraint order_items_order_id_fkey foreign key (order_id) references orders (id),
    constraint order_items_product_id_fkey foreign key (product_id) references products (id)
  ) tablespace pg_default;

  create table
  public.coupons (
    id uuid not null default extensions.uuid_generate_v4 (),
    code text null,
    used boolean null default false,
    used_by uuid null,
    used_at timestamp with time zone null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    user_id uuid null,
    discount_amount numeric(5, 2) not null default 0.1,
    constraint coupons_pkey primary key (id),
    constraint coupons_code_key unique (code),
    constraint coupons_user_id_fkey foreign key (user_id) references auth.users (id)
  ) tablespace pg_default;

  create table
  public.commissions (
    id bigint generated always as identity not null,
    issuer_id uuid null,
    order_id bigint null,
    commission_amount numeric not null,
    paid boolean null default false,
    constraint commissions_pkey primary key (id),
    constraint commissions_issuer_id_fkey foreign key (issuer_id) references profiles (id),
    constraint commissions_order_id_fkey foreign key (order_id) references orders (id)
  ) tablespace pg_default;