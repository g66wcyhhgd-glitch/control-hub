create table if not exists profiles (
  id uuid primary key,
  email text,
  full_name text,
  global_role text default 'viewer',
  status text default 'active',
  created_at timestamptz default now()
);
alter table profiles enable row level security;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  project_key text unique not null,
  name text not null,
  status text default 'active',
  owner_id uuid,
  created_at timestamptz default now()
);
alter table projects enable row level security;

create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid,
  role_in_project text default 'member',
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);
alter table project_members enable row level security;

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  actor_id uuid,
  action text,
  meta jsonb,
  created_at timestamptz default now()
);
alter table audit_log enable row level security;
