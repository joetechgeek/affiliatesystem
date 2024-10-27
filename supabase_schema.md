create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  email text unique,
  phone_number text,
  coupon_code text unique not null
);

create table products (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  price numeric not null,
  stock integer not null,
  image_url text,
  alt_image text
);

create table orders (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  total_amount numeric not null,
  discount_applied numeric default 0,
  coupon_code text references profiles(coupon_code),
  issued_by uuid references profiles(id),
  commission_paid boolean default false
);

create table order_items (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id),
  product_id bigint references products(id),
  quantity integer not null,
  price numeric not null
);

create table commissions (
  id bigint generated always as identity primary key,
  issuer_id uuid references profiles(id),
  order_id bigint references orders(id),
  commission_amount numeric not null,
  paid boolean default false
);

