const Security = {
  sanitize(str){
    const d = document.createElement('div');
    d.textContent = String(str||'');
    return d.innerHTML;
  },
  isEmail(str){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str); },
  isSafeId(str){ return /^[a-zA-Z0-9_-]+$/.test(str); },
  _rl:{},
  rateLimit(key, max=5, ms=60000){
    const now = Date.now();
    if(!this._rl[key]) this._rl[key]=[];
    this._rl[key] = this._rl[key].filter(t => now-t < ms);
    if(this._rl[key].length >= max) return false;
    this._rl[key].push(now);
    return true;
  }
};

// Rate limiting is built into doLogin directly

// ============================================================ BACKEND SQL SCHEMA
/* Run in project SQL editor -- Dashboard > SQL Editor

-- FACILITIES
create table public.facilities (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  loc            text not null,
  dept           text not null,
  contact        text not null,
  email          text not null unique,
  since          text,
  active         boolean default true,
  system_id      uuid references public.hospital_systems(id) on delete set null,
  deactivated_at timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table public.facilities enable row level security;
create policy "facilities_master_all" on public.facilities for all
  to authenticated
  using (auth.jwt()->>'role' = 'master_admin')
  with check (auth.jwt()->>'role' = 'master_admin');
create policy "facilities_staff_admin_select" on public.facilities for select
  to authenticated
  using (
    auth.jwt()->>'role' = 'staff_admin' and
    id = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  );
create policy "facilities_hospital_select" on public.facilities for select
  to authenticated
  using (id = (auth.jwt()->>'facility_id')::uuid);
create policy "facilities_system_admin_select" on public.facilities for select
  to authenticated
  using (
    auth.jwt()->>'role' = 'system_admin' and
    system_id = (auth.jwt()->>'system_id')::uuid
  );

-- USER PROFILES
create table public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  role          text not null check (role in ('master_admin','staff_admin','hospital','facility_admin','system_admin','staff_member')),
  fid           uuid references public.facilities(id) on delete set null,
  system_id     uuid,
  assigned_fids uuid[] default '{}',
