create table if not exists public.vocab_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic text not null default 'Bài tự tạo',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.vocab_lessons
add column if not exists position integer;

with ordered_lessons as (
  select
    id,
    row_number() over (partition by user_id order by created_at, id) as next_position
  from public.vocab_lessons
  where position is null or position = 0
)
update public.vocab_lessons
set position = ordered_lessons.next_position
from ordered_lessons
where vocab_lessons.id = ordered_lessons.id;

alter table public.vocab_lessons
alter column position set default 0;

alter table public.vocab_lessons
alter column position set not null;

create table if not exists public.vocab_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.vocab_lessons(id) on delete cascade,
  hanzi text not null,
  pinyin text not null,
  meaning text not null,
  example text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id, hanzi)
);

alter table public.vocab_items
add column if not exists example text not null default '';

create table if not exists public.vocab_review_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocab_item_id uuid not null references public.vocab_items(id) on delete cascade,
  answer text not null,
  is_correct boolean not null,
  updated_at timestamptz not null default now(),
  unique (user_id, vocab_item_id)
);

create table if not exists public.vocab_share_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_id uuid not null unique default gen_random_uuid(),
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.vocab_rules_notes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.vocab_opposite_pairs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  left_text text not null,
  right_text text not null,
  pinyin text not null,
  meaning text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, left_text, right_text)
);

alter table public.vocab_lessons enable row level security;
alter table public.vocab_items enable row level security;
alter table public.vocab_review_answers enable row level security;
alter table public.vocab_share_settings enable row level security;
alter table public.vocab_rules_notes enable row level security;
alter table public.vocab_opposite_pairs enable row level security;

drop policy if exists "Users manage own lessons" on public.vocab_lessons;
create policy "Users manage own lessons"
on public.vocab_lessons
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Anyone reads public lessons" on public.vocab_lessons;
create policy "Anyone reads public lessons"
on public.vocab_lessons
for select
using (
  exists (
    select 1
    from public.vocab_share_settings
    where vocab_share_settings.user_id = vocab_lessons.user_id
      and vocab_share_settings.is_public
  )
);

drop policy if exists "Users manage own vocab items" on public.vocab_items;
create policy "Users manage own vocab items"
on public.vocab_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Anyone reads public vocab items" on public.vocab_items;
create policy "Anyone reads public vocab items"
on public.vocab_items
for select
using (
  exists (
    select 1
    from public.vocab_share_settings
    where vocab_share_settings.user_id = vocab_items.user_id
      and vocab_share_settings.is_public
  )
);

drop policy if exists "Users manage own review answers" on public.vocab_review_answers;
create policy "Users manage own review answers"
on public.vocab_review_answers
for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.vocab_items
    where vocab_items.id = vocab_review_answers.vocab_item_id
      and vocab_items.user_id = auth.uid()
  )
);

drop policy if exists "Users manage own share settings" on public.vocab_share_settings;
create policy "Users manage own share settings"
on public.vocab_share_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Anyone reads public share settings" on public.vocab_share_settings;
create policy "Anyone reads public share settings"
on public.vocab_share_settings
for select
using (is_public);

drop policy if exists "Users manage own rules notes" on public.vocab_rules_notes;
create policy "Users manage own rules notes"
on public.vocab_rules_notes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own opposite pairs" on public.vocab_opposite_pairs;
create policy "Users manage own opposite pairs"
on public.vocab_opposite_pairs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Anyone reads public opposite pairs" on public.vocab_opposite_pairs;
create policy "Anyone reads public opposite pairs"
on public.vocab_opposite_pairs
for select
using (
  exists (
    select 1
    from public.vocab_share_settings
    where vocab_share_settings.user_id = vocab_opposite_pairs.user_id
      and vocab_share_settings.is_public
  )
);

create index if not exists vocab_lessons_user_created_idx
on public.vocab_lessons (user_id, created_at);

create index if not exists vocab_lessons_user_position_idx
on public.vocab_lessons (user_id, position, created_at);

create index if not exists vocab_items_lesson_position_idx
on public.vocab_items (lesson_id, position, created_at);

create index if not exists vocab_review_answers_user_item_idx
on public.vocab_review_answers (user_id, vocab_item_id);

create index if not exists vocab_share_settings_public_idx
on public.vocab_share_settings (public_id)
where is_public;

create index if not exists vocab_opposite_pairs_user_position_idx
on public.vocab_opposite_pairs (user_id, position, created_at);
