-- Boutique 514 : installation complète de la base.
-- À coller dans Supabase > SQL Editor > New query, puis cliquer sur Run.
-- Peut être relancé sans risque (ne modifie pas les tarifs déjà saisis).


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

-- Fin de promo (compte à rebours) : à cette date le produit revient au prix barré.
alter table products add column if not exists promo_ends_at timestamptz;

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

-- Wilayas et tarifs de livraison par défaut (modifiables ensuite dans l'admin).
insert into shipping_rates (code, name_fr, name_ar, price_home, price_desk) values
  (1, 'Adrar', 'أدرار', 1000, 700),
  (2, 'Chlef', 'الشلف', 600, 400),
  (3, 'Laghouat', 'الأغواط', 800, 500),
  (4, 'Oum El Bouaghi', 'أم البواقي', 600, 400),
  (5, 'Batna', 'باتنة', 600, 400),
  (6, 'Béjaïa', 'بجاية', 600, 400),
  (7, 'Biskra', 'بسكرة', 600, 400),
  (8, 'Béchar', 'بشار', 1000, 700),
  (9, 'Blida', 'البليدة', 600, 400),
  (10, 'Bouira', 'البويرة', 600, 400),
  (11, 'Tamanrasset', 'تمنراست', 1000, 700),
  (12, 'Tébessa', 'تبسة', 600, 400),
  (13, 'Tlemcen', 'تلمسان', 600, 400),
  (14, 'Tiaret', 'تيارت', 600, 400),
  (15, 'Tizi Ouzou', 'تيزي وزو', 600, 400),
  (16, 'Alger', 'الجزائر', 400, 300),
  (17, 'Djelfa', 'الجلفة', 800, 500),
  (18, 'Jijel', 'جيجل', 600, 400),
  (19, 'Sétif', 'سطيف', 600, 400),
  (20, 'Saïda', 'سعيدة', 600, 400),
  (21, 'Skikda', 'سكيكدة', 600, 400),
  (22, 'Sidi Bel Abbès', 'سيدي بلعباس', 600, 400),
  (23, 'Annaba', 'عنابة', 600, 400),
  (24, 'Guelma', 'قالمة', 600, 400),
  (25, 'Constantine', 'قسنطينة', 600, 400),
  (26, 'Médéa', 'المدية', 600, 400),
  (27, 'Mostaganem', 'مستغانم', 600, 400),
  (28, 'M''Sila', 'المسيلة', 600, 400),
  (29, 'Mascara', 'معسكر', 600, 400),
  (30, 'Ouargla', 'ورقلة', 1000, 700),
  (31, 'Oran', 'وهران', 600, 400),
  (32, 'El Bayadh', 'البيض', 800, 500),
  (33, 'Illizi', 'إليزي', 1000, 700),
  (34, 'Bordj Bou Arréridj', 'برج بوعريريج', 600, 400),
  (35, 'Boumerdès', 'بومرداس', 600, 400),
  (36, 'El Tarf', 'الطارف', 600, 400),
  (37, 'Tindouf', 'تندوف', 1000, 700),
  (38, 'Tissemsilt', 'تيسمسيلت', 600, 400),
  (39, 'El Oued', 'الوادي', 1000, 700),
  (40, 'Khenchela', 'خنشلة', 600, 400),
  (41, 'Souk Ahras', 'سوق أهراس', 600, 400),
  (42, 'Tipaza', 'تيبازة', 600, 400),
  (43, 'Mila', 'ميلة', 600, 400),
  (44, 'Aïn Defla', 'عين الدفلى', 600, 400),
  (45, 'Naâma', 'النعامة', 800, 500),
  (46, 'Aïn Témouchent', 'عين تموشنت', 600, 400),
  (47, 'Ghardaïa', 'غرداية', 1000, 700),
  (48, 'Relizane', 'غليزان', 600, 400),
  (49, 'Timimoun', 'تيميمون', 1000, 700),
  (50, 'Bordj Badji Mokhtar', 'برج باجي مختار', 1000, 700),
  (51, 'Ouled Djellal', 'أولاد جلال', 800, 500),
  (52, 'Béni Abbès', 'بني عباس', 1000, 700),
  (53, 'In Salah', 'عين صالح', 1000, 700),
  (54, 'In Guezzam', 'عين قزام', 1000, 700),
  (55, 'Touggourt', 'تقرت', 1000, 700),
  (56, 'Djanet', 'جانت', 1000, 700),
  (57, 'El M''Ghair', 'المغير', 1000, 700),
  (58, 'El Meniaa', 'المنيعة', 1000, 700)
on conflict (code) do nothing;

-- Espace de stockage public pour les photos des produits.
insert into storage.buckets (id, name, public) values ('produits', 'produits', true)
on conflict (id) do nothing;
