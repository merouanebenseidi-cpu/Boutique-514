-- Schéma Boutique 514. Exécuté par `npm run db:setup` (idempotent : peut être relancé).

create table if not exists products (
  id               serial primary key,
  name_fr          text not null,
  name_ar          text not null default '',
  description_fr   text not null default '',
  description_ar   text not null default '',
  category         text not null,
  price            integer not null check (price >= 0),          -- en DA
  compare_at_price integer check (compare_at_price >= 0),        -- prix barré (promo)
  stock            integer not null default 0 check (stock >= 0),
  image_url        text not null default '',
  active           boolean not null default true,
  featured         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists products_active_category_idx on products (active, category);

-- Wilayas et tarifs de livraison (modifiables depuis l'admin).
create table if not exists shipping_rates (
  code        integer primary key,
  name_fr     text not null,
  name_ar     text not null,
  price_home  integer not null check (price_home >= 0),  -- livraison à domicile
  price_desk  integer not null check (price_desk >= 0),  -- retrait au bureau (stop desk)
  active      boolean not null default true
);

create table if not exists orders (
  id              serial primary key,
  number          text not null unique,
  status          text not null default 'nouvelle'
                  check (status in ('nouvelle','confirmee','expediee','livree','annulee','retour')),
  customer_name   text not null,
  phone           text not null,
  wilaya_code     integer not null references shipping_rates(code),
  commune         text not null,
  address         text not null default '',
  delivery_type   text not null check (delivery_type in ('home','desk')),
  shipping_price  integer not null,
  subtotal        integer not null,
  total           integer not null,
  payment_method  text not null default 'cod'
                  check (payment_method in ('cod','cib_edahabia','card_intl')),
  payment_status  text not null default 'pending'
                  check (payment_status in ('pending','paid','failed','refunded')),
  -- Option « offrir depuis l'étranger » : l'acheteur paie, le destinataire est le client ci-dessus.
  is_gift         boolean not null default false,
  sender_name     text,
  sender_email    text,
  sender_country  text,
  gift_message    text,
  note            text not null default '',
  lang            text not null default 'fr',
  created_at      timestamptz not null default now()
);
create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);

create table if not exists order_items (
  id          serial primary key,
  order_id    integer not null references orders(id) on delete cascade,
  product_id  integer references products(id) on delete set null,
  name        text not null,
  unit_price  integer not null,
  quantity    integer not null check (quantity > 0)
);
create index if not exists order_items_order_idx on order_items (order_id);

create sequence if not exists order_number_seq start 1001;

-- Sur Supabase, bloque l'accès public via l'API REST : le site passe uniquement
-- par la connexion directe à la base (propriétaire des tables, non concerné par RLS).
alter table products       enable row level security;
alter table shipping_rates enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
