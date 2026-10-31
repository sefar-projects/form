-- Adds Freemium tier support to access codes and leads.
-- Run this once against your Supabase project (SQL editor or CLI migration).

alter table public.access_codes
  add column if not exists tier text not null default 'full';

alter table public.access_codes
  drop constraint if exists access_codes_tier_check;

alter table public.access_codes
  add constraint access_codes_tier_check check (tier in ('free', 'full'));

alter table public.leads
  add column if not exists tier text not null default 'full';

alter table public.leads
  drop constraint if exists leads_tier_check;

alter table public.leads
  add constraint leads_tier_check check (tier in ('free', 'full'));
