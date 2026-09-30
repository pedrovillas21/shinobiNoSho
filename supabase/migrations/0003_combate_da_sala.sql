-- Shinobi no Sho: o combate é da sala. Só o mestre inicia, passa a rodada e encerra;
-- as fichas de todos acompanham ao vivo. Aplicado automaticamente no deploy, depois da 0002.
-- migrate:baseline-if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rooms' and column_name = 'round')

/* ------------------------------------------------------------------ rodada da sala */

-- round: 0 = fora de combate. round_rev sobe a cada mudança, para o app ignorar avisos atrasados.
alter table public.rooms
  add column round int not null default 0 check (round between 0 and 100000),
  add column round_rev int not null default 0;

-- Mestre muda o combate: 'next' inicia (0 → 1) ou passa a rodada; 'end' encerra.
create or replace function public.set_room_round(p_room uuid, p_action text)
returns table (new_round int, new_rev int)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_room_admin(p_room) then raise exception 'forbidden'; end if;
  if p_action is null or p_action not in ('next', 'end') then raise exception 'invalid_action'; end if;

  return query
  update public.rooms r
  set round = case when p_action = 'next' then r.round + 1 else 0 end,
      round_rev = r.round_rev + 1
  where r.id = p_room
  returning r.round, r.round_rev;
end;
$$;

revoke execute on function public.set_room_round(uuid, text) from public, anon;
grant execute on function public.set_room_round(uuid, text) to authenticated;

/* ------------------------------------------------------------------ tempo real */

-- As mesas escutam a rodada da sala (a RLS "salas: membros veem" vale também no tempo real).
alter publication supabase_realtime add table public.rooms;
