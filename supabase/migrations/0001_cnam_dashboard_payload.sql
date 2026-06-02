-- CNAM Paris dashboard payload. Reads the warehouse filtered to the 3 CNAM Paris
-- accounts (Meta act_312120810161701, LinkedIn 502420306, DV360 971169501).
-- Returns raw per-platform totals + adSets + creatives; the frontend derives the
-- A/B (ad copy), LinkedIn formats and DV360 line views. Absent account => null block.
--
-- Warehouse units: spend in EUR, ctr in %, conversions in `conversions` column.
-- Ad copy is encoded in ad_groups.name (Meta: AD COPY "<copy>"; LinkedIn: format + copy).
-- EXECUTE granted to service_role only; the public Edge Function calls it server-side.

create or replace function cnam_block(p_accs uuid[], p_start date, p_end date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with params as (
  select p_start s, p_end e, (p_start - ((p_end - p_start) + 1))::date ps, (p_start - 1)::date pe
),
ci as (
  select cins.date, cins.impressions imp, cins.clicks clk, cins.spend spend,
         coalesce(cins.conversions, 0) conv
  from campaign_insights cins
  join campaigns c on c.id = cins.campaign_id
  where c.ad_account_id = any(p_accs)
),
cur  as (select ci.* from ci, params where ci.date between params.s and params.e),
prev as (select ci.* from ci, params where ci.date between params.ps and params.pe),
daily as (
  select g.d::date date,
    coalesce(sum(cur.imp),0) imp, coalesce(sum(cur.clk),0) clk,
    coalesce(sum(cur.spend),0) spend, coalesce(sum(cur.conv),0) conv,
    case when sum(cur.imp) > 0 then round(100.0*sum(cur.clk)/sum(cur.imp),2) else 0 end ctr
  from params
  cross join lateral generate_series(params.s::timestamp, params.e::timestamp, interval '1 day') g(d)
  left join cur on cur.date = g.d::date
  group by g.d order by g.d
),
adsets as (
  select ag.name,
    sum(agi.impressions) imp, sum(agi.clicks) clk, sum(agi.spend) spend,
    coalesce(sum(agi.conversions),0) conv,
    case when sum(agi.impressions) > 0 then round(100.0*sum(agi.clicks)/sum(agi.impressions),2) else 0 end ctr
  from ad_group_insights agi
  join ad_groups ag on ag.id = agi.ad_group_id
  join campaigns c on c.id = ag.campaign_id, params
  where c.ad_account_id = any(p_accs) and agi.date between params.s and params.e
  group by ag.name having sum(agi.impressions) > 0
  order by sum(agi.clicks) desc
),
creatives as (
  select ad.name,
    sum(ai.impressions) imp, sum(ai.clicks) clk, sum(ai.spend) spend,
    coalesce(sum(ai.conversions),0) conv,
    case when sum(ai.impressions) > 0 then round(100.0*sum(ai.clicks)/sum(ai.impressions),2) else 0 end ctr
  from ad_insights ai
  join ads ad on ad.id = ai.ad_id
  join ad_groups ag on ag.id = ad.ad_group_id
  join campaigns c on c.id = ag.campaign_id, params
  where c.ad_account_id = any(p_accs) and ai.date between params.s and params.e
  group by ad.name having sum(ai.impressions) > 0
  order by sum(ai.clicks) desc limit 12
)
select jsonb_build_object(
  'current',  (select jsonb_build_object('imp',coalesce(sum(imp),0),'clk',coalesce(sum(clk),0),'spend',coalesce(sum(spend),0),'conv',coalesce(sum(conv),0)) from cur),
  'previous', (select jsonb_build_object('imp',coalesce(sum(imp),0),'clk',coalesce(sum(clk),0),'spend',coalesce(sum(spend),0),'conv',coalesce(sum(conv),0)) from prev),
  'daily',    coalesce((select jsonb_agg(to_jsonb(daily)) from daily), '[]'::jsonb),
  'adSets',   coalesce((select jsonb_agg(to_jsonb(adsets)) from adsets), '[]'::jsonb),
  'creatives',coalesce((select jsonb_agg(to_jsonb(creatives)) from creatives), '[]'::jsonb)
);
$$;

create or replace function cnam_dashboard_payload(p_start date, p_end date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta uuid; v_li uuid; v_dv uuid;
  v_present uuid[];
  res jsonb;
begin
  select id into v_meta from ad_accounts where platform_account_id = 'act_312120810161701' limit 1;
  select id into v_li   from ad_accounts where platform_account_id = '502420306' limit 1;
  select id into v_dv   from ad_accounts where platform_account_id = '971169501' limit 1;

  v_present := array_remove(array[v_meta, v_li, v_dv], null);

  res := jsonb_build_object(
    'meta_info', jsonb_build_object(
       'min_date', p_start,
       'max_date', p_end,
       'last_sync', (select max(completed_at) from sync_log where ad_account_id = any(v_present)),
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

revoke all on function cnam_block(uuid[], date, date) from public, anon, authenticated;
revoke all on function cnam_dashboard_payload(date, date) from public, anon, authenticated;
grant execute on function cnam_block(uuid[], date, date) to service_role;
grant execute on function cnam_dashboard_payload(date, date) to service_role;
