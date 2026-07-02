-- Row-level security policy for public lead submissions
-- Use this when the form is submitted by anonymous visitors through the public client.

alter table public.leads enable row level security;

-- Remove any older conflicting policy names if they exist.
drop policy if exists "Allow anon insert leads" on public.leads;
drop policy if exists "Allow authenticated read leads" on public.leads;

-- Allow anonymous users to insert a lead only when the access code exists and is still unused.
create policy "Allow anon insert leads"
on public.leads
for insert
to anon
with check (
  access_code is not null
  and exists (
    select 1
    from public.access_codes ac
    where ac.code = access_code
      and ac.used = false
  )
);

-- Keep lead data readable only to authenticated admins.
create policy "Allow authenticated read leads"
on public.leads
for select
to authenticated
using (true);
