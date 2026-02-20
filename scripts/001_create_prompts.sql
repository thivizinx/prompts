-- Create prompts table
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  content text not null,
  category text default 'General',
  created_by text default 'Anonymous',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.prompts enable row level security;

-- Drop existing policies if they exist
drop policy if exists "prompts_select_all" on public.prompts;
drop policy if exists "prompts_insert_auth" on public.prompts;
drop policy if exists "prompts_update_auth" on public.prompts;
drop policy if exists "prompts_delete_auth" on public.prompts;

-- Allow all authenticated users to view all prompts (shared/collaborative)
create policy "prompts_select_all" on public.prompts
  for select to authenticated
  using (true);

-- Allow all authenticated users to insert prompts
create policy "prompts_insert_auth" on public.prompts
  for insert to authenticated
  with check (true);

-- Allow all authenticated users to update any prompt (collaborative editing)
create policy "prompts_update_auth" on public.prompts
  for update to authenticated
  using (true);

-- Allow all authenticated users to delete any prompt (collaborative)
create policy "prompts_delete_auth" on public.prompts
  for delete to authenticated
  using (true);
