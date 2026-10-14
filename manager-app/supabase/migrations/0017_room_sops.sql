-- ============================================================================
-- AI MIDDLE MANAGER — room types, rooms, and per-area turnover SOPs
-- ADDITIVE. Loads the housekeeping turnover SOPs (5 room types) as per-photo-area
-- SOP rows the Quality Check screen can score one photo against. Adds reference
-- tables room_types + rooms, and two nullable columns on sops. The existing
-- generic sop-room-turnover row is left untouched.
-- Criteria are OBSERVABLE-ONLY: [[CONFIRM]] count/par values are omitted until
-- management sets them. Run AFTER 0016.
-- ============================================================================

-- ── room types ──────────────────────────────────────────────────────────────
create table if not exists public.room_types (
  code        text primary key,
  org_id      uuid not null references public.orgs(id) on delete cascade,
  name        text not null,
  bed_config  text,
  max_guests  int,
  size_m2     int,
  feature     text,
  created_at  timestamptz not null default now()
);

insert into public.room_types (code, org_id, name, bed_config, max_guests, size_m2, feature) values
  ('standard-queen',      '00000000-0000-0000-0000-000000000001', 'Standard Queen',          '1 queen',                    2, 23, null),
  ('deluxe-queen',        '00000000-0000-0000-0000-000000000001', 'Deluxe Queen',            '1 queen (+ optional sofa bed)', 2, 28, 'Lounge / dining area'),
  ('family-room',         '00000000-0000-0000-0000-000000000001', 'Family Room',             '1 queen + 2 twin',           4, 40, 'Separate bedroom + kitchenette/lounge'),
  ('three-bed-apartment', '00000000-0000-0000-0000-000000000001', 'Three-Bedroom Apartment', '1 double + 3 twin',          6, 68, '3 bedrooms + full kitchenette'),
  ('spa-king',            '00000000-0000-0000-0000-000000000001', 'Spa King',                '1 queen',                    2, 25, 'Double spa bath')
on conflict (code) do nothing;

-- ── sops: tag which room type + photo area each SOP is for (additive) ────────
alter table public.sops add column if not exists room_type_code text references public.room_types(code);
alter table public.sops add column if not exists area text;

-- ── rooms (101–126 → room type) ─────────────────────────────────────────────
create table if not exists public.rooms (
  id              text primary key,                       -- room number, e.g. '118A'
  org_id          uuid not null references public.orgs(id) on delete cascade,
  room_type_code  text not null references public.room_types(code),
  created_at      timestamptz not null default now()
);

insert into public.rooms (id, org_id, room_type_code) values
  ('101','00000000-0000-0000-0000-000000000001','standard-queen'),
  ('102','00000000-0000-0000-0000-000000000001','standard-queen'),
  ('103','00000000-0000-0000-0000-000000000001','standard-queen'),
  ('104','00000000-0000-0000-0000-000000000001','standard-queen'),
  ('105','00000000-0000-0000-0000-000000000001','standard-queen'),
  ('106','00000000-0000-0000-0000-000000000001','standard-queen'),
  ('107','00000000-0000-0000-0000-000000000001','standard-queen'),
  ('108','00000000-0000-0000-0000-000000000001','deluxe-queen'),
  ('109','00000000-0000-0000-0000-000000000001','deluxe-queen'),
  ('110','00000000-0000-0000-0000-000000000001','deluxe-queen'),
  ('111','00000000-0000-0000-0000-000000000001','deluxe-queen'),
  ('112','00000000-0000-0000-0000-000000000001','deluxe-queen'),
  ('114','00000000-0000-0000-0000-000000000001','deluxe-queen'),
  ('118A','00000000-0000-0000-0000-000000000001','deluxe-queen'),
  ('122A','00000000-0000-0000-0000-000000000001','deluxe-queen'),
  ('115','00000000-0000-0000-0000-000000000001','family-room'),
  ('116','00000000-0000-0000-0000-000000000001','family-room'),
  ('117','00000000-0000-0000-0000-000000000001','family-room'),
  ('118','00000000-0000-0000-0000-000000000001','family-room'),
  ('119','00000000-0000-0000-0000-000000000001','family-room'),
  ('120','00000000-0000-0000-0000-000000000001','family-room'),
  ('121','00000000-0000-0000-0000-000000000001','family-room'),
  ('122','00000000-0000-0000-0000-000000000001','family-room'),
  ('123','00000000-0000-0000-0000-000000000001','family-room'),
  ('124','00000000-0000-0000-0000-000000000001','family-room'),
  ('125','00000000-0000-0000-0000-000000000001','three-bed-apartment'),
  ('126','00000000-0000-0000-0000-000000000001','spa-king')
on conflict (id) do nothing;

-- ── per-area SOPs (observable-only checklists) ───────────────────────────────
insert into public.sops (id, org_id, title, category, room_type_code, area, checklist) values

-- Standard Queen
('sop-standard-queen-bed','00000000-0000-0000-0000-000000000001','Standard Queen — Bed','Housekeeping','standard-queen','bed','[
  {"key":"taut","label":"Bedding pulled taut — no visible wrinkles or creases","critical":true},
  {"key":"overhang","label":"Even overhang on both sides","critical":false},
  {"key":"pillows","label":"Pillows upright against the headboard, evenly placed","critical":false},
  {"key":"clean","label":"No stains, hairs or debris on the bedding","critical":true},
  {"key":"clear","label":"Nothing left on the bed","critical":false}
]'::jsonb),
('sop-standard-queen-bath','00000000-0000-0000-0000-000000000001','Standard Queen — Bathroom','Housekeeping','standard-queen','bath','[
  {"key":"mirror","label":"Mirror streak-free, no spots","critical":true},
  {"key":"basin","label":"Basin and tap dry and shining, no water marks","critical":true},
  {"key":"toilet","label":"Toilet bowl clean, no marks","critical":true},
  {"key":"shower","label":"Shower glass clear — no soap scum, water spots or hair","critical":true},
  {"key":"towels","label":"Full towel set present, folded or hung to standard","critical":false},
  {"key":"toiletries","label":"Toiletries present and aligned; toilet paper stocked","critical":false},
  {"key":"floor","label":"Floor dry, no hair","critical":true}
]'::jsonb),
('sop-standard-queen-overview','00000000-0000-0000-0000-000000000001','Standard Queen — Room overview','Housekeeping','standard-queen','overview','[
  {"key":"surfaces","label":"All surfaces clear and dust-free","critical":false},
  {"key":"tea","label":"Tea/coffee station stocked and tidy, cups clean","critical":false},
  {"key":"bin","label":"Bin empty with a fresh liner","critical":false},
  {"key":"curtains","label":"Curtains even and set","critical":false},
  {"key":"clutter","label":"No rubbish, used items or clutter anywhere","critical":true}
]'::jsonb),

-- Deluxe Queen
('sop-deluxe-queen-bed','00000000-0000-0000-0000-000000000001','Deluxe Queen — Bed','Housekeeping','deluxe-queen','bed','[
  {"key":"taut","label":"Bedding pulled taut — no visible wrinkles or creases","critical":true},
  {"key":"overhang","label":"Even overhang on both sides","critical":false},
  {"key":"pillows","label":"Pillows upright against the headboard, evenly placed","critical":false},
  {"key":"clean","label":"No stains, hairs or debris on the bedding","critical":true},
  {"key":"clear","label":"Nothing left on the bed","critical":false}
]'::jsonb),
('sop-deluxe-queen-bath','00000000-0000-0000-0000-000000000001','Deluxe Queen — Bathroom','Housekeeping','deluxe-queen','bath','[
  {"key":"mirror","label":"Mirror streak-free, no spots","critical":true},
  {"key":"basin","label":"Basin and tap dry and shining, no water marks","critical":true},
  {"key":"toilet","label":"Toilet bowl clean, no marks","critical":true},
  {"key":"shower","label":"Shower glass clear — no soap scum, water spots or hair","critical":true},
  {"key":"towels","label":"Full towel set present, folded or hung to standard","critical":false},
  {"key":"toiletries","label":"Toiletries present and aligned; toilet paper stocked","critical":false},
  {"key":"floor","label":"Floor dry, no hair","critical":true}
]'::jsonb),
('sop-deluxe-queen-lounge','00000000-0000-0000-0000-000000000001','Deluxe Queen — Lounge & dining','Housekeeping','deluxe-queen','lounge','[
  {"key":"chairs","label":"Tub chairs and coffee table clean and squared","critical":false},
  {"key":"dining","label":"Dining table wiped, chairs tidy","critical":false},
  {"key":"sofabed","label":"Sofa bed stowed and cushions aligned, or freshly made if used","critical":false}
]'::jsonb),
('sop-deluxe-queen-overview','00000000-0000-0000-0000-000000000001','Deluxe Queen — Room overview','Housekeeping','deluxe-queen','overview','[
  {"key":"surfaces","label":"All surfaces clear and dust-free","critical":false},
  {"key":"tea","label":"Tea/coffee station stocked and tidy, cups clean","critical":false},
  {"key":"bin","label":"Bin empty with a fresh liner","critical":false},
  {"key":"curtains","label":"Curtains even and set","critical":false},
  {"key":"clutter","label":"No rubbish, used items or clutter anywhere","critical":true}
]'::jsonb),

-- Family Room
('sop-family-room-beds','00000000-0000-0000-0000-000000000001','Family Room — Beds','Housekeeping','family-room','beds','[
  {"key":"beds_made","label":"All beds made to the same standard — taut, smooth, even overhang","critical":true},
  {"key":"beds_pillows","label":"Fresh pillows upright on every bed","critical":false},
  {"key":"beds_clean","label":"No stains, hairs or debris on any bed","critical":true},
  {"key":"beds_present","label":"All beds in the room are made (queen + two twins)","critical":false}
]'::jsonb),
('sop-family-room-bath','00000000-0000-0000-0000-000000000001','Family Room — Bathroom','Housekeeping','family-room','bath','[
  {"key":"mirror","label":"Mirror streak-free, no spots","critical":true},
  {"key":"basin","label":"Basin and tap dry and shining, no water marks","critical":true},
  {"key":"toilet","label":"Toilet bowl clean, no marks","critical":true},
  {"key":"shower","label":"Shower glass clear — no soap scum, water spots or hair","critical":true},
  {"key":"towels","label":"Full towel set present, folded or hung to standard","critical":false},
  {"key":"toiletries","label":"Toiletries present and aligned; toilet paper stocked","critical":false},
  {"key":"floor","label":"Floor dry, no hair","critical":true}
]'::jsonb),
('sop-family-room-kitchenette','00000000-0000-0000-0000-000000000001','Family Room — Kitchenette & lounge','Housekeeping','family-room','kitchenette','[
  {"key":"bench","label":"Benchtop and sink clean and dry; fridge clean and cold","critical":true},
  {"key":"crockery","label":"All crockery and cutlery washed and put away","critical":false},
  {"key":"dining","label":"Dining table wiped, chairs and lounge seating tidy","critical":false},
  {"key":"bin","label":"Bin empty with a fresh liner","critical":false}
]'::jsonb),
('sop-family-room-overview','00000000-0000-0000-0000-000000000001','Family Room — Room overview','Housekeeping','family-room','overview','[
  {"key":"surfaces","label":"All surfaces clear and dust-free","critical":false},
  {"key":"tea","label":"Tea/coffee station stocked and tidy, cups clean","critical":false},
  {"key":"bin","label":"Bin empty with a fresh liner","critical":false},
  {"key":"curtains","label":"Curtains even and set","critical":false},
  {"key":"clutter","label":"No rubbish, used items or clutter anywhere","critical":true}
]'::jsonb),

-- Three-Bedroom Apartment
('sop-3br-beds','00000000-0000-0000-0000-000000000001','Three-Bedroom — Beds','Housekeeping','three-bed-apartment','beds','[
  {"key":"beds_made","label":"All four beds made to the same standard — taut, smooth, even overhang","critical":true},
  {"key":"beds_pillows","label":"Fresh pillows upright on every bed","critical":false},
  {"key":"beds_clean","label":"No stains, hairs or debris in any bedroom","critical":true},
  {"key":"beds_present","label":"All beds across the three bedrooms are made (double + three twins)","critical":false}
]'::jsonb),
('sop-3br-kitchen','00000000-0000-0000-0000-000000000001','Three-Bedroom — Kitchen','Housekeeping','three-bed-apartment','kitchen','[
  {"key":"bench","label":"Benchtops and sink clean and dry; fridge clean and cold","critical":true},
  {"key":"appliances","label":"Microwave, toaster and kettle clean; crumb tray empty","critical":false},
  {"key":"kitchenware","label":"All kitchenware and crockery washed and put away","critical":false},
  {"key":"bin","label":"Kitchen bin empty with a fresh liner","critical":false}
]'::jsonb),
('sop-3br-bath','00000000-0000-0000-0000-000000000001','Three-Bedroom — Bathroom','Housekeeping','three-bed-apartment','bath','[
  {"key":"mirror","label":"Mirror streak-free, no spots","critical":true},
  {"key":"basin","label":"Basin and tap dry and shining, no water marks","critical":true},
  {"key":"toilet","label":"Toilet bowl clean, no marks","critical":true},
  {"key":"shower","label":"Shower glass clear — no soap scum, water spots or hair","critical":true},
  {"key":"towels","label":"Full towel set present, folded or hung to standard","critical":false},
  {"key":"toiletries","label":"Toiletries present and aligned; toilet paper stocked","critical":false},
  {"key":"floor","label":"Floor dry, no hair","critical":true}
]'::jsonb),
('sop-3br-overview','00000000-0000-0000-0000-000000000001','Three-Bedroom — Lounge & overview','Housekeeping','three-bed-apartment','overview','[
  {"key":"sofa","label":"Sofa and seating clean and tidy; dining table wiped","critical":false},
  {"key":"surfaces","label":"All surfaces clear and dust-free","critical":false},
  {"key":"curtains","label":"Curtains even and set","critical":false},
  {"key":"clutter","label":"No rubbish, used items or clutter anywhere","critical":true}
]'::jsonb),

-- Spa King
('sop-spa-king-bed','00000000-0000-0000-0000-000000000001','Spa King — Bed','Housekeeping','spa-king','bed','[
  {"key":"taut","label":"Bedding pulled taut — no visible wrinkles or creases","critical":true},
  {"key":"overhang","label":"Even overhang on both sides","critical":false},
  {"key":"pillows","label":"Pillows upright against the headboard, evenly placed","critical":false},
  {"key":"clean","label":"No stains, hairs or debris on the bedding","critical":true},
  {"key":"clear","label":"Nothing left on the bed","critical":false}
]'::jsonb),
('sop-spa-king-spa','00000000-0000-0000-0000-000000000001','Spa King — Spa bath','Housekeeping','spa-king','spa','[
  {"key":"shell","label":"Spa shell clean and dry — no water line, scum or residue","critical":true},
  {"key":"jets","label":"Jets and surround wiped, no buildup","critical":true},
  {"key":"tap","label":"Tap and spout descaled and shining","critical":false},
  {"key":"empty","label":"Spa empty and dry, ready for the next guest","critical":true}
]'::jsonb),
('sop-spa-king-bath','00000000-0000-0000-0000-000000000001','Spa King — Bathroom','Housekeeping','spa-king','bath','[
  {"key":"mirror","label":"Mirror streak-free, no spots","critical":true},
  {"key":"basin","label":"Basin and tap dry and shining, no water marks","critical":true},
  {"key":"toilet","label":"Toilet bowl clean, no marks","critical":true},
  {"key":"shower","label":"Shower glass clear — no soap scum, water spots or hair","critical":true},
  {"key":"towels","label":"Full towel set present, folded or hung to standard","critical":false},
  {"key":"toiletries","label":"Toiletries present and aligned; toilet paper stocked","critical":false},
  {"key":"floor","label":"Floor dry, no hair","critical":true}
]'::jsonb),
('sop-spa-king-overview','00000000-0000-0000-0000-000000000001','Spa King — Room overview','Housekeeping','spa-king','overview','[
  {"key":"surfaces","label":"All surfaces clear and dust-free","critical":false},
  {"key":"tea","label":"Tea/coffee station stocked and tidy, cups clean","critical":false},
  {"key":"bin","label":"Bin empty with a fresh liner","critical":false},
  {"key":"curtains","label":"Curtains even and set","critical":false},
  {"key":"clutter","label":"No rubbish, used items or clutter anywhere","critical":true}
]'::jsonb)

on conflict (id) do nothing;

-- ── RLS on the new reference tables (mirror existing pattern) ────────────────
alter table public.room_types enable row level security;
alter table public.rooms      enable row level security;

drop policy if exists room_types_select on public.room_types;
create policy room_types_select on public.room_types
  for select to authenticated using (org_id = public.current_org_id());
drop policy if exists test_anon_room_types_sel on public.room_types;
create policy test_anon_room_types_sel on public.room_types
  for select to anon using (org_id = '00000000-0000-0000-0000-000000000001');

drop policy if exists rooms_select on public.rooms;
create policy rooms_select on public.rooms
  for select to authenticated using (org_id = public.current_org_id());
drop policy if exists test_anon_rooms_sel on public.rooms;
create policy test_anon_rooms_sel on public.rooms
  for select to anon using (org_id = '00000000-0000-0000-0000-000000000001');
