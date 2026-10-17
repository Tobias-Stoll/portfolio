-- Notes wall for the portfolio. Run once in Supabase → SQL Editor.
-- Visitors (anon) may only add a note and read approved notes. Approving happens in the Table Editor.

create table if not exists public.notes (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text check (name is null or char_length(name) between 1 and 40),
  message     text not null check (char_length(btrim(message)) between 1 and 280),
  approved    boolean not null default false
);

alter table public.notes enable row level security;

-- Grants: visitors may write name and message only, and read the public columns
revoke all on public.notes from anon, authenticated;
grant insert (name, message) on public.notes to anon;
grant select (id, name, message, created_at, approved) on public.notes to anon;

-- Policies
drop policy if exists "visitors can pin a note" on public.notes;
create policy "visitors can pin a note" on public.notes
  for insert to anon with check (approved = false);

drop policy if exists "visitors read approved notes" on public.notes;
create policy "visitors read approved notes" on public.notes
  for select to anon using (approved = true);

-- Newest first, approved only
create index if not exists notes_approved_created_idx on public.notes (approved, created_at desc);
