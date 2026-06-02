-- Scope the dashboard to the "2606 - Inscriptions" campaign on each platform,
-- instead of the whole ad account (which holds 40+ unrelated campaigns).
--   Meta     platform_campaign_id 120245082260010757
--   LinkedIn platform_campaign_id 1116100353
--   DV360    platform_campaign_id 56983506  (CNAM - 2606 - VAGUE INSCRIPTIONS)
-- cnam_block keeps its signature (p_accs uuid[]) but the array now holds CAMPAIGN
-- UUIDs and it filters campaign_insights.campaign_id / ad_groups.campaign_id.

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
  where cins.campaign_id = any(p_accs)
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
  join ad_groups ag on ag.id = agi.ad_group_id, params
  where ag.campaign_id = any(p_accs) and agi.date between params.s and params.e
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
  join ad_groups ag on ag.id = ad.ad_group_id, params
  where ag.campaign_id = any(p_accs) and ai.date between params.s and params.e
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
  select id into v_meta from campaigns where platform_campaign_id = '120245082260010757' limit 1;
  select id into v_li   from campaigns where platform_campaign_id = '1116100353' limit 1;
  select id into v_dv   from campaigns where platform_campaign_id = '56983506' limit 1;

  v_present := array_remove(array[v_meta, v_li, v_dv], null);

  res := jsonb_build_object(
    'meta_info', jsonb_build_object(
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

revoke all on function cnam_block(uuid[], date, date) from public, anon, authenticated;
revoke all on function cnam_dashboard_payload(date, date) from public, anon, authenticated;
grant execute on function cnam_block(uuid[], date, date) to service_role;
grant execute on function cnam_dashboard_payload(date, date) to service_role;
