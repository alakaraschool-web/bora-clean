-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('super_admin', 'admin', 'teacher', 'student')) default 'student',
  school_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Schools Table
create table public.schools (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Teachers Table
create table public.teachers (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade
);

-- 5. Students Table
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  admission_number text not null
);

-- 6. Exams Table
create table public.exams (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  created_by uuid references public.profiles(id),
  title text not null,
  date timestamp with time zone not null
);

-- 7. Exam Results Table
create table public.exam_results (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.students(id) on delete cascade,
  exam_id uuid references public.exams(id) on delete cascade,
  score numeric not null
);

-- 8. Automations (Trigger Function)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case 
      when new.email = 'bahatisolomon.bs@gmail.com' then 'super_admin'
      else 'student'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. RLS Policies
alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.exams enable row level security;
alter table public.exam_results enable row level security;

-- Helper function
create or replace function is_super_admin() returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$ language sql security definer;

-- Profiles: Users read/update own, Super Admin reads all
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Super Admin can view all" on public.profiles for select using (is_super_admin());

-- Schools: Super Admin creates, Admins view their own
create policy "Super Admin can create schools" on public.schools for insert with check (is_super_admin());
create policy "Admins can view their school" on public.schools for select using (exists (select 1 from public.profiles where id = auth.uid() and school_id = schools.id));
