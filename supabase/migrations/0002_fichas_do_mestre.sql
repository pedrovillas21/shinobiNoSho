-- Shinobi no Sho: o mestre (adm) usa várias fichas na mesma sala e troca entre elas na hora.
-- Jogadores continuam com uma ficha só. Aplicado automaticamente no deploy, depois da 0001.
-- migrate:baseline-if to_regclass('public.room_characters') is not null

/* ------------------------------------------------------------------ fichas na sala */

-- Cada ficha usada na sala, com o próprio estado de jogo. Substitui room_plays (uma por pessoa).
-- room_members.character_id passa a ser a ficha ABERTA agora (a do jogador, ou a que o mestre escolheu).
create table public.room_characters (
  room_id uuid not null,
  user_id uuid not null,
  character_id uuid not null references public.characters (id) on delete cascade,
  play jsonb check (play is null or pg_column_size(play) < 1000000),
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, character_id),
  foreign key (room_id, user_id) references public.room_members (room_id, user_id) on delete cascade
);

create index room_characters_member_idx on public.room_characters (room_id, user_id, added_at);

create trigger room_characters_updated_at
  before update on public.room_characters
  for each row execute function public.set_updated_at();

-- O que já existia (uma ficha por pessoa) vem junto, com o estado de jogo.
insert into public.room_characters (room_id, user_id, character_id, play)
select m.room_id, m.user_id, m.character_id, rp.play
from public.room_members m
left join public.room_plays rp on rp.room_id = m.room_id and rp.user_id = m.user_id
where m.character_id is not null and m.status = 'active'
on conflict do nothing;

drop table public.room_plays;

-- As fichas do mestre (NPCs, inimigos) não aparecem no balão dos jogadores.
update public.room_members set summary = null where role = 'adm';

create or replace function public.is_room_admin(r uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = r and m.user_id = (select auth.uid()) and m.status = 'active' and m.role = 'adm'
  );
$$;

alter table public.room_characters enable row level security;
revoke all on public.room_characters from anon, authenticated;
grant select on public.room_characters to authenticated;
grant update (play) on public.room_characters to authenticated;

create policy "fichas na sala: só o próprio lê" on public.room_characters
  for select to authenticated
  using (user_id = (select auth.uid()) and public.is_room_member(room_id));

create policy "fichas na sala: só o próprio salva o jogo" on public.room_characters
  for update to authenticated
  using (user_id = (select auth.uid()) and public.is_room_member(room_id))
  with check (user_id = (select auth.uid()) and public.is_room_member(room_id));

-- Só jogador publica resumo de Vit/Chakra.
drop policy if exists "membros: atualiza o próprio resumo" on public.room_members;
create policy "membros: jogador atualiza o próprio resumo" on public.room_members
  for update to authenticated
  using (user_id = (select auth.uid()) and status = 'active' and role = 'player')
  with check (user_id = (select auth.uid()) and status = 'active' and role = 'player');

/* ------------------------------------------------------------------ funções */

-- Entrar: escolhe a ficha uma vez. Quem já está na sala não troca por aqui
-- (o mestre usa add_room_character; o jogador só escolhe de novo se a ficha dele foi apagada).
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
  if v_member.user_id is not null and (v_member.role = 'adm' or v_member.character_id is not null) then
    return v_room.id;
  end if;

  if p_character is null then raise exception 'character_required'; end if;
  if not exists (select 1 from public.characters c where c.id = p_character and c.owner_id = v_uid) then
    raise exception 'invalid_character';
  end if;

  if v_member.user_id is null then
    if (select count(*) from public.room_members m where m.room_id = v_room.id and m.status = 'active') >= 30 then
      raise exception 'room_full';
    end if;
    select p.username::text into v_user from public.profiles p where p.id = v_uid;
    insert into public.room_members (room_id, user_id, username, character_id)
    values (v_room.id, v_uid, v_user, p_character);
  else
    update public.room_members m set character_id = p_character, summary = null
    where m.room_id = v_room.id and m.user_id = v_uid;
  end if;

  insert into public.room_characters (room_id, user_id, character_id)
  values (v_room.id, v_uid, p_character)
  on conflict do nothing;

  return v_room.id;
end;
$$;

-- Mestre põe mais uma ficha dele na sala (e já abre ela).
create or replace function public.add_room_character(p_room uuid, p_character uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_room_admin(p_room) then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.characters c where c.id = p_character and c.owner_id = auth.uid()) then
    raise exception 'invalid_character';
  end if;
  if (select count(*) from public.room_characters rc where rc.room_id = p_room and rc.user_id = auth.uid()) >= 60 then
    raise exception 'too_many_characters';
  end if;

  insert into public.room_characters (room_id, user_id, character_id)
  values (p_room, auth.uid(), p_character)
  on conflict do nothing;
  update public.room_members m set character_id = p_character
  where m.room_id = p_room and m.user_id = auth.uid();
end;
$$;

-- Mestre troca a ficha aberta (null = só mestrar). Guardado para abrir na mesma ao voltar.
create or replace function public.set_active_character(p_room uuid, p_character uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_room_admin(p_room) then raise exception 'forbidden'; end if;
  if p_character is not null and not exists (
    select 1 from public.room_characters rc
    where rc.room_id = p_room and rc.character_id = p_character and rc.user_id = auth.uid()
  ) then
    raise exception 'invalid_character';
  end if;
  update public.room_members m set character_id = p_character
  where m.room_id = p_room and m.user_id = auth.uid();
end;
$$;

-- Mestre tira uma ficha dele da sala (o estado de jogo dela nesta sala é descartado).
create or replace function public.remove_room_character(p_room uuid, p_character uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_room_admin(p_room) then raise exception 'forbidden'; end if;
  delete from public.room_characters rc
  where rc.room_id = p_room and rc.character_id = p_character and rc.user_id = auth.uid();
  update public.room_members m set character_id = null
  where m.room_id = p_room and m.user_id = auth.uid() and m.character_id = p_character;
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

  delete from public.room_characters rc where rc.room_id = p_room and rc.user_id = p_user;
  update public.room_members m set status = 'kicked', summary = null, character_id = null
  where m.room_id = p_room and m.user_id = p_user;
end;
$$;

revoke execute on function public.is_room_admin(uuid) from public, anon;
revoke execute on function public.add_room_character(uuid, uuid) from public, anon;
revoke execute on function public.set_active_character(uuid, uuid) from public, anon;
revoke execute on function public.remove_room_character(uuid, uuid) from public, anon;
grant execute on function public.is_room_admin(uuid) to authenticated;
grant execute on function public.add_room_character(uuid, uuid) to authenticated;
grant execute on function public.set_active_character(uuid, uuid) to authenticated;
grant execute on function public.remove_room_character(uuid, uuid) to authenticated;
