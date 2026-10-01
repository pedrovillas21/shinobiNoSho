-- Shinobi no Sho: gerar um novo código da sala libera a volta de quem foi expulso.
-- O código antigo deixa de existir, então só entra de novo quem receber o código novo do mestre.
-- Aplicado automaticamente no deploy, depois da 0003.

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
  -- Expulsos saem da lista: com o código novo, entram como qualquer jogador (escolhendo a ficha de novo).
  delete from public.room_members m where m.room_id = p_room and m.status = 'kicked';
  return v_code;
end;
$$;

revoke execute on function public.regenerate_room_code(uuid) from public, anon;
grant execute on function public.regenerate_room_code(uuid) to authenticated;
