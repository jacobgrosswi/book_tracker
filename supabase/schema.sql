-- Book Tracker schema for Supabase
create extension if not exists pg_trgm;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null,
  author text not null,
  status text not null check (status in ('Want to Read','Reading','Finished','Abandoned')),
  completed_at timestamptz,
  rating int check (rating between 1 and 5),
  note text,
  genres text[] not null default '{}',
  google_volume_id text,
  openlibrary_work_id text,
  openlibrary_edition_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_owner_status_idx on public.books (owner_id, status);
create index if not exists books_owner_completed_idx on public.books (owner_id, completed_at desc);
create index if not exists books_genres_gin on public.books using gin (genres);
create index if not exists books_title_trgm on public.books using gin (title gin_trgm_ops);
create index if not exists books_author_trgm on public.books using gin (author gin_trgm_ops);

create unique index if not exists books_owner_google_volume_unique
  on public.books (owner_id, google_volume_id)
  where google_volume_id is not null;

create unique index if not exists books_owner_openlibrary_work_unique
  on public.books (owner_id, openlibrary_work_id)
  where openlibrary_work_id is not null;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.enforce_completed_at()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'Finished' and new.completed_at is null then
      new.completed_at = now();
    elsif new.status <> 'Finished' then
      new.completed_at = null;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status = 'Finished' and old.status <> 'Finished' then
      new.completed_at = now();
    elsif old.status = 'Finished' and new.status <> 'Finished' then
      new.completed_at = null;
    elsif new.status <> 'Finished' then
      new.completed_at = null;
    end if;
    return new;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

create trigger books_enforce_completed_at
  before insert or update on public.books
  for each row execute function public.enforce_completed_at();

alter table public.books enable row level security;

create policy "Books are viewable by owner" on public.books
  for select using (auth.uid() = owner_id);

create policy "Books can be inserted by owner" on public.books
  for insert with check (auth.uid() = owner_id);

create policy "Books can be updated by owner" on public.books
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Books can be deleted by owner" on public.books
  for delete using (auth.uid() = owner_id);
