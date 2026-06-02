import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const url = new URL(req.url)
    let start = url.searchParams.get('start')
    let end = url.searchParams.get('end')

    const today = new Date()
    if (!end) end = isoDate(today)
    if (!start) {
      const d = new Date(today)
      d.setDate(d.getDate() - 90)
      start = isoDate(d)
    }

    const re = /^\d{4}-\d{2}-\d{2}$/
    if (!re.test(start) || !re.test(end)) {
      return new Response(JSON.stringify({ error: 'invalid_date' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data, error } = await supabase.rpc('cnam_dashboard_payload', {
      p_start: start,
      p_end: end,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
