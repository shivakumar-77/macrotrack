-- Run this in Supabase SQL Editor

-- Create avatars storage bucket (run in Supabase Dashboard > Storage)
-- Bucket name: avatars
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/*

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  dob date,
  age int,
  gender text default 'male',
  phone_number text,
  photo_url text,
  height numeric(5,2),
  goal text default 'lose',
  cal_target int default 1700,
  protein_target int default 167,
  carb_target int default 144,
  fat_target int default 60,
  fiber_target int default 25,
  weight_goal numeric(5,2) default 72,
  water_goal int default 2000,
  reminder_times text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists food_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  logged_at date default current_date,
  name text not null,
  qty numeric(8,2) default 100,
  unit text default 'g',
  cal numeric(8,2) default 0,
  protein numeric(8,2) default 0,
  carb numeric(8,2) default 0,
  fat numeric(8,2) default 0,
  fiber numeric(8,2) default 0,
  meal_type text default 'other',
  created_at timestamptz default now()
);

create table if not exists weight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  logged_at date default current_date,
  weight_kg numeric(5,2) not null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table food_logs enable row level security;
alter table weight_logs enable row level security;

drop policy if exists "own profile" on profiles;
drop policy if exists "own food logs" on food_logs;
drop policy if exists "own weight logs" on weight_logs;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own food logs" on food_logs for all using (auth.uid() = user_id);
create policy "own weight logs" on weight_logs for all using (auth.uid() = user_id);

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
