-- Shinobi no Sho: contas, fichas e salas.
-- Aplicado automaticamente no deploy (scripts/migrate.mjs). Banco montado à mão antes disso é só registrado:
-- migrate:baseline-if to_regclass('public.profiles') is not null
-- Segurança: RLS em todas as tabelas; o que não é permitido direto na tabela passa por
-- funções `security definer` que conferem auth.uid(). O app usa só a chave pública (anon).

create extension if not exists citext with schema extensions;

/* ------------------------------------------------------------------ utilidades */

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

/* ------------------------------------------------------------------ perfis */

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique check (username::text ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create policy "perfil: ler o próprio" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- O cadastro manda o nome de usuário em raw_user_meta_data; o perfil nasce junto com a conta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(new.raw_user_meta_data ->> 'username'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/* ------------------------------------------------------------------ fichas */

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 120),
  nc int not null default 4 check (nc between 1 and 99),
  data jsonb not null check (pg_column_size(data) < 2000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index characters_owner_idx on public.characters (owner_id, updated_at desc);

create trigger characters_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();

alter table public.characters enable row level security;
revoke all on public.characters from anon, authenticated;
grant select, insert, update, delete on public.characters to authenticated;

create policy "fichas: só o dono" on public.characters
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

/* ------------------------------------------------------------------ salas */

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  -- 6 caracteres sem I, O, 0 e 1 (fáceis de confundir ao ditar).
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  name text not null check (char_length(name) between 1 and 60),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index rooms_owner_idx on public.rooms (owner_id);

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null,
  role text not null default 'player' check (role in ('adm', 'player')),
  status text not null default 'active' check (status in ('active', 'kicked')),
  character_id uuid references public.characters (id) on delete set null,
  -- Resumo que os outros veem no balão: {name, kanji, origin, nc, vit, vitMax, chk, chkMax}.
  summary jsonb check (summary is null or pg_column_size(summary) < 4096),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index room_members_user_idx on public.room_members (user_id);

create trigger room_members_updated_at
  before update on public.room_members
  for each row execute function public.set_updated_at();

-- Estado de jogo (vida, chakra, condições, histórico) de cada jogador na sala. Só o próprio lê.
create table public.room_plays (
  room_id uuid not null,
  user_id uuid not null default auth.uid(),
  play jsonb not null check (pg_column_size(play) < 1000000),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id),
  foreign key (room_id, user_id) references public.room_members (room_id, user_id) on delete cascade
);

create trigger room_plays_updated_at
  before update on public.room_plays
  for each row execute function public.set_updated_at();

-- Evita recursão de RLS ao consultar room_members dentro das próprias políticas.
create or replace function public.is_room_member(r uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = r and m.user_id = (select auth.uid()) and m.status = 'active'
  );
$$;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_plays enable row level security;

revoke all on public.rooms from anon, authenticated;
revoke all on public.room_members from anon, authenticated;
revoke all on public.room_plays from anon, authenticated;

grant select, delete on public.rooms to authenticated;
grant select, delete on public.room_members to authenticated;
grant update (summary) on public.room_members to authenticated;
grant select, insert, update, delete on public.room_plays to authenticated;

create policy "salas: membros veem" on public.rooms
  for select to authenticated
  using (public.is_room_member(id));

create policy "salas: dono apaga" on public.rooms
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- A própria linha fica visível mesmo depois de expulso, para o app avisar.
create policy "membros: quem está na sala vê" on public.room_members
  for select to authenticated
  using (public.is_room_member(room_id) or user_id = (select auth.uid()));

create policy "membros: atualiza o próprio resumo" on public.room_members
  for update to authenticated
  using (user_id = (select auth.uid()) and status = 'active')
  with check (user_id = (select auth.uid()) and status = 'active');

-- Jogador sai da sala; o adm apaga a sala inteira. Expulso não consegue apagar o bloqueio.
create policy "membros: jogador sai" on public.room_members
  for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'active' and role = 'player');

create policy "estado: só o próprio" on public.room_plays
  for all to authenticated
  using (user_id = (select auth.uid()) and public.is_room_member(room_id))
  with check (user_id = (select auth.uid()) and public.is_room_member(room_id));

/* ------------------------------------------------------------------ funções das salas */

create or replace function public.gen_room_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := uuid_send(gen_random_uuid());
  out text := '';
begin
  -- 32 letras: cada byte aleatório vira uma letra sem viés (256 é múltiplo de 32).
  for i in 0..5 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return out;
end;
$$;

create or replace function public.create_room(p_name text)
returns table (id uuid, code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_user text;
  v_code text;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if char_length(v_name) < 1 or char_length(v_name) > 60 then raise exception 'invalid_name'; end if;
  if (select count(*) from public.rooms r where r.owner_id = v_uid) >= 30 then raise exception 'too_many_rooms'; end if;

  select p.username::text into v_user from public.profiles p where p.id = v_uid;
  if v_user is null then raise exception 'no_profile'; end if;

  loop
    v_code := public.gen_room_code();
    begin
      insert into public.rooms (code, name, owner_id) values (v_code, v_name, v_uid) returning rooms.id into v_id;
      exit;
    exception when unique_violation then
      -- código repetido: sorteia outro
    end;
  end loop;

  insert into public.room_members (room_id, user_id, username, role) values (v_id, v_uid, v_user, 'adm');
  return query select v_id, v_code;
end;
$$;

-- O que dá para mostrar antes de entrar: nome da sala, mestre e a situação de quem pergunta.
create or replace function public.room_preview(p_code text)
returns table (id uuid, code text, name text, owner_username text, my_role text, my_status text, my_character uuid)
language sql
security definer
stable
set search_path = ''
as $$
  select r.id, r.code, r.name, o.username::text, m.role, m.status, m.character_id
  from public.rooms r
  join public.profiles o on o.id = r.owner_id
  left join public.room_members m on m.room_id = r.id and m.user_id = (select auth.uid())
  where (select auth.uid()) is not null and r.code = upper(btrim(p_code));
$$;

create or replace function public.join_room(p_code text, p_character uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms;
  v_member public.room_members;
  v_user text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_room from public.rooms r where r.code = upper(btrim(p_code));
  if v_room.id is null then raise exception 'room_not_found'; end if;

  select * into v_member from public.room_members m where m.room_id = v_room.id and m.user_id = v_uid;
  if v_member.status = 'kicked' then raise exception 'kicked'; end if;

  if p_character is null then
    if v_member.role is distinct from 'adm' then raise exception 'character_required'; end if;
  elsif not exists (select 1 from public.characters c where c.id = p_character and c.owner_id = v_uid) then
    raise exception 'invalid_character';
  end if;

  if v_member.user_id is null then
    if (select count(*) from public.room_members m where m.room_id = v_room.id and m.status = 'active') >= 30 then
      raise exception 'room_full';
    end if;
    select p.username::text into v_user from public.profiles p where p.id = v_uid;
    insert into public.room_members (room_id, user_id, username, character_id)
    values (v_room.id, v_uid, v_user, p_character);
  elsif v_member.character_id is distinct from p_character then
    -- Trocou de ficha: o estado de jogo da ficha anterior nesta sala é descartado.
    delete from public.room_plays rp where rp.room_id = v_room.id and rp.user_id = v_uid;
    update public.room_members m set character_id = p_character, summary = null
    where m.room_id = v_room.id and m.user_id = v_uid;
  end if;

  return v_room.id;
end;
$$;

create or replace function public.kick_member(p_room uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.rooms r where r.id = p_room and r.owner_id = auth.uid()) then
    raise exception 'forbidden';
  end if;
  if p_user = auth.uid() then raise exception 'cannot_kick_self'; end if;

  delete from public.room_plays rp where rp.room_id = p_room and rp.user_id = p_user;
  update public.room_members m set status = 'kicked', summary = null
  where m.room_id = p_room and m.user_id = p_user;
end;
$$;

create or replace function public.regenerate_room_code(p_room uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.rooms r where r.id = p_room and r.owner_id = auth.uid()) then
    raise exception 'forbidden';
  end if;
  loop
    v_code := public.gen_room_code();
    begin
      update public.rooms r set code = v_code where r.id = p_room;
      exit;
    exception when unique_violation then
    end;
  end loop;
  return v_code;
end;
$$;

-- Funções internas não ficam expostas pela API; as de sala só para quem está logado.
revoke execute on function public.gen_room_code() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.is_room_member(uuid) from public, anon;
revoke execute on function public.create_room(text) from public, anon;
revoke execute on function public.room_preview(text) from public, anon;
revoke execute on function public.join_room(text, uuid) from public, anon;
revoke execute on function public.kick_member(uuid, uuid) from public, anon;
revoke execute on function public.regenerate_room_code(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.create_room(text) to authenticated;
grant execute on function public.room_preview(text) to authenticated;
grant execute on function public.join_room(text, uuid) to authenticated;
grant execute on function public.kick_member(uuid, uuid) to authenticated;
grant execute on function public.regenerate_room_code(uuid) to authenticated;

/* ------------------------------------------------------------------ tempo real */

-- O balão escuta mudanças em room_members (a RLS vale também no tempo real).
alter publication supabase_realtime add table public.room_members;
