-- Enable required extension
create extension if not exists pgcrypto;

create table if not exists public.school_profiles (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null unique references auth.users(id) on delete cascade,
  name text,
  class_count integer,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_profiles(id) on delete cascade,
  name text not null,
  device_token text not null unique,
  is_device_online boolean not null default false,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  full_name text not null,
  roll_number text not null,
  card_uid text not null,
  portal_username text not null unique,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique(class_id, card_uid),
  unique(class_id, roll_number)
);

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('Present')),
  card_uid text not null,
  scanned_at timestamptz not null default timezone('utc', now())
);

alter table public.school_profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.attendance_logs enable row level security;

create policy "school admin manage profile"
on public.school_profiles
for all
using (admin_id = auth.uid())
with check (admin_id = auth.uid());

create policy "school admin manage classes"
on public.classes
for all
using (
  exists (
    select 1
    from public.school_profiles sp
    where sp.id = classes.school_id
      and sp.admin_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.school_profiles sp
    where sp.id = classes.school_id
      and sp.admin_id = auth.uid()
  )
);

create policy "school admin and student read students"
on public.students
for select
using (
  auth_user_id = auth.uid()
  or exists (
    select 1
    from public.school_profiles sp
    where sp.id = students.school_id
      and sp.admin_id = auth.uid()
  )
);

create policy "school admin insert update students"
on public.students
for all
using (
  exists (
    select 1
    from public.school_profiles sp
    where sp.id = students.school_id
      and sp.admin_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.school_profiles sp
    where sp.id = students.school_id
      and sp.admin_id = auth.uid()
  )
);

create policy "admin and student read attendance"
on public.attendance_logs
for select
using (
  exists (
    select 1
    from public.students s
    where s.id = attendance_logs.student_id
      and s.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.school_profiles sp
    where sp.id = (
      select school_id
      from public.classes c
      where c.id = attendance_logs.class_id
    )
      and sp.admin_id = auth.uid()
  )
);

create policy "admin write attendance"
on public.attendance_logs
for insert
with check (
  exists (
    select 1
    from public.school_profiles sp
    where sp.id = (
      select school_id
      from public.classes c
      where c.id = attendance_logs.class_id
    )
      and sp.admin_id = auth.uid()
  )
);
