-- Shinobi no Sho: retratos das fichas saem de dentro do jsonb e vão para o Storage.
-- Antes cada ficha carregava a imagem em base64 (~150 KB), e abrir a lista baixava todas de novo.
-- Agora a ficha guarda só o endereço e o navegador guarda a imagem em cache.
-- Aplicado automaticamente no deploy, depois da 0004.

/* ------------------------------------------------------------------ bucket */

-- Público para leitura: o endereço vai direto num <img> e fica em cache (CDN e navegador).
-- Cada arquivo tem nome aleatório (uuid) dentro da pasta da conta, e só o dono da ficha conhece o
-- endereço; listar a pasta de outra pessoa não é permitido (políticas abaixo).
-- Limite de 256 KB e só WebP/JPEG: é o que o navegador gera em lib/retrato.ts (~110 KB no máximo).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('retratos', 'retratos', true, 262144, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

/* ------------------------------------------------------------------ quem mexe nos arquivos */

-- Cada conta só envia, vê e apaga na própria pasta: retratos/<id da conta>/<uuid>.webp
-- Não há política de update: um retrato novo é sempre um arquivo novo (por isso o cache longo é seguro).
create policy "retratos: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'retratos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "retratos: dono lista" on storage.objects
  for select to authenticated
  using (bucket_id = 'retratos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "retratos: dono apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'retratos' and (storage.foldername(name))[1] = (select auth.uid())::text);
