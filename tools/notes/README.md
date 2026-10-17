# Notes wall: setup and moderation

The "Leave a note" form on the landing page saves notes to Supabase. New notes stay hidden until you approve them.

## Setup (once, about 10 minutes)

1. Create a free account and a new project at supabase.com (region: Frankfurt, eu-central-1).
2. Open **SQL Editor**, paste `setup.sql` from this folder and click **Run**.
3. Open **Project Settings → API Keys** and copy the **publishable key** (`sb_publishable_…`).
4. Open **Project Settings → Data API** and copy the **Project URL** (`https://xxxx.supabase.co`).
5. Put both into `assets/home.js` under `NOTES` (`url` and `anonKey`). Both are public by design: the table grants and policies decide what visitors can do.

## Approving a note

1. Supabase → **Table Editor → notes**.
2. Set `approved` to `true` for the notes you want to show. Delete spam rows.
3. The note appears on the site on the next page load.

## What visitors can and cannot do

- Can: add a note with a name (optional, max 40 characters) and a message (max 280 characters).
- Can: read approved notes.
- Cannot: approve, edit or delete notes, or read unapproved ones.
- A hidden honeypot field in the form drops simple bots.

## Get a push message for every new note

1. Install the free **ntfy** app (iOS or Android) and subscribe to a topic with a long, random name. Keep it private.
2. Open `notify.sql`, replace `YOUR-TOPIC` with that name (only in the SQL Editor, never commit it), and run it in Supabase → SQL Editor.
3. Every new note now arrives as a push message. Tapping it opens the Supabase table, where you approve it.
