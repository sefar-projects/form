-- Row-level security policy for public lead submissions
-- Use this when the form is submitted by anonymous visitors through the public client.

alter table public.access_codes enable row level security;
alter table public.leads enable row level security;

-- Remove older conflicting policy names if they exist.
drop policy if exists "Allow anon read access_codes" on public.access_codes;
drop policy if exists "Allow anon consume access_codes" on public.access_codes;
drop policy if exists "Allow authenticated read access_codes" on public.access_codes;
drop policy if exists "Allow authenticated insert access_codes" on public.access_codes;
drop policy if exists "Allow authenticated update access_codes" on public.access_codes;

-- Remove any older conflicting policy names if they exist.
drop policy if exists "Allow anon insert leads" on public.leads;
drop policy if exists "Allow authenticated read leads" on public.leads;

-- Anonymous users may read only unused access codes so the public form can verify a code before submission.
create policy "Allow anon read access_codes"
on public.access_codes
for select
to anon
using (used = false);

-- Anonymous users may mark an unused code as used when submitting the form.
create policy "Allow anon consume access_codes"
on public.access_codes
for update
to anon
using (used = false)
with check (used = true);

-- Authenticated admins can manage access codes from the dashboard.
create policy "Allow authenticated read access_codes"
on public.access_codes
for select
to authenticated
using (true);

create policy "Allow authenticated insert access_codes"
on public.access_codes
for insert
to authenticated
with check (true);

create policy "Allow authenticated update access_codes"
on public.access_codes
for update
to authenticated
using (true)
with check (true);

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
