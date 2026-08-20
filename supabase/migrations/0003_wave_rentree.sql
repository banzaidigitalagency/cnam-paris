-- Vague « rentrée » (2608) : cnam_dashboard_payload prend un 3e paramètre
-- p_wave pour servir l'une des deux vagues de CNAM Paris — Inscriptions.
--   p_wave = 'juin' (défaut, rétro-compatible avec les appels à 2 arguments) :
--     Meta     120245082260010757  CNAM PARIS - 2606 - INSCRIPTIONS
--     LinkedIn 1116100353          groupe de campagnes 2606
--     DV360    56983506            CNAM - 2606 - VAGUE INSCRIPTIONS
--   p_wave = 'rentree' (24/08 → 30/09/2026, ligne YouTube dès le 23/08) :
--     Meta     120247939091800757  CNAM PARIS - 2608 - RENTREE
--     LinkedIn 1174118013          groupe de campagnes 2608 RENTRÉE
--     DV360    57200003            CNAM PARIS - 2608 - RENTREE (lignes IAB/Interstitiel + YouTube, pas d'Outstream)
-- cnam_block est inchangé (il reçoit des UUID de campagnes).
-- Toute valeur de p_wave autre que 'rentree' retombe sur la vague juin.

drop function if exists cnam_dashboard_payload(date, date);

create or replace function cnam_dashboard_payload(p_start date, p_end date, p_wave text default 'juin')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wave text;
  v_meta_pid text; v_li_pid text; v_dv_pid text;
  v_meta uuid; v_li uuid; v_dv uuid;
  v_present uuid[];
  res jsonb;
begin
  if p_wave = 'rentree' then
    v_wave := 'rentree';
    v_meta_pid := '120247939091800757';
    v_li_pid   := '1174118013';
    v_dv_pid   := '57200003';
  else
    v_wave := 'juin';
    v_meta_pid := '120245082260010757';
    v_li_pid   := '1116100353';
    v_dv_pid   := '56983506';
  end if;

  select id into v_meta from campaigns where platform_campaign_id = v_meta_pid limit 1;
  select id into v_li   from campaigns where platform_campaign_id = v_li_pid   limit 1;
  select id into v_dv   from campaigns where platform_campaign_id = v_dv_pid   limit 1;

  v_present := array_remove(array[v_meta, v_li, v_dv], null);

  res := jsonb_build_object(
    'meta_info', jsonb_build_object(
       'wave', v_wave,
       'min_date', p_start,
       'max_date', p_end,
       'last_sync', (
          select max(sl.completed_at) from sync_log sl
          where sl.ad_account_id in (select ad_account_id from campaigns where id = any(v_present))
       ),
       'platforms_present', jsonb_build_object(
          'meta', v_meta is not null, 'linkedin', v_li is not null, 'dv360', v_dv is not null)
    ),
    'global',   cnam_block(v_present, p_start, p_end),
    'meta',     case when v_meta is null then null else cnam_block(array[v_meta], p_start, p_end) end,
    'linkedin', case when v_li   is null then null else cnam_block(array[v_li],   p_start, p_end) end,
    'dv360',    case when v_dv   is null then null else cnam_block(array[v_dv],   p_start, p_end) end
  );
  return res;
end;
$$;

revoke all on function cnam_dashboard_payload(date, date, text) from public, anon, authenticated;
grant execute on function cnam_dashboard_payload(date, date, text) to service_role;
