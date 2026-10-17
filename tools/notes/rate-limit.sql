-- Optional spam brake for the notes wall. Run once in Supabase → SQL Editor, after setup.sql.
-- Blocks new notes when more than 10 arrived in the last 10 minutes,
-- or when more than 50 notes are still waiting for approval.

create or replace function public.notes_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.notes where created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'Too many notes right now, try again later' using errcode = 'P0001';
  end if;
  if (select count(*) from public.notes where approved = false) >= 50 then
    raise exception 'The wall is full until I have read the new notes' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.notes_rate_limit() from public, anon, authenticated;

drop trigger if exists notes_rate_limit on public.notes;
create trigger notes_rate_limit
  before insert on public.notes
  for each row execute function public.notes_rate_limit();
