create table if not exists public.admin_credentials (
  singleton boolean primary key default true check (singleton),
  username text not null check (char_length(username) between 3 and 120),
  password_salt text not null,
  password_hash text not null,
  credential_version text not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_credentials enable row level security;
revoke all on table public.admin_credentials from anon, authenticated;
grant all on table public.admin_credentials to service_role;
