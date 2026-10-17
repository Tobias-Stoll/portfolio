-- Push notification for every new note, via ntfy (free app for iOS and Android).
-- 1. Install the ntfy app and subscribe to your topic (keep the topic name private, it works like a password).
-- 2. Replace YOUR-TOPIC below, then run this once in Supabase → SQL Editor.

create extension if not exists pg_net with schema extensions;

create or replace function public.notes_notify()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://ntfy.sh/',
    body := jsonb_build_object(
      'topic',   'YOUR-TOPIC',
      'title',   'New note from ' || coalesce(new.name, 'Anonymous'),
      'message', left(new.message, 280),
      'tags',    jsonb_build_array('pushpin'),
      'click',   'https://supabase.com/dashboard/project/paaocbyjevitxiugvdar/editor'
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
end;
$$;

revoke all on function public.notes_notify() from public, anon, authenticated;

drop trigger if exists notes_notify on public.notes;
create trigger notes_notify
  after insert on public.notes
  for each row execute function public.notes_notify();
