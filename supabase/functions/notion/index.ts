// Puente entre la app y la API de Notion, que no acepta llamadas directas desde el navegador.
// Solo atiende a personas con sesión en la cuenta (JWT de Supabase) y reenvía la petición a Notion
// con el token de integración que viene en la cabecera x-notion-token (vive en el teléfono, no aquí).
// Despliegue: Supabase → Edge Functions → Deploy a new function → via Editor → nombre «notion» → pegar este archivo.
const ORIGENES = ['https://gads4532.github.io', 'http://localhost:8769'];

Deno.serve(async (req) => {
  const origen = req.headers.get('origin') || '';
  const cors = {
    'Access-Control-Allow-Origin': ORIGENES.includes(origen) ? origen : ORIGENES[0],
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-notion-token, x-notion-path',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Vary': 'Origin',
  };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const user = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, { headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '', Authorization: 'Bearer ' + jwt } });
  if (!user.ok) return json({ error: 'sin sesión' }, 401);

  const token = req.headers.get('x-notion-token') || '', path = req.headers.get('x-notion-path') || '';
  if (!token || !/^[\w\-\/]+(\?[\w\-=&.%]*)?$/.test(path)) return json({ error: 'petición incompleta' }, 400);

  const r = await fetch('https://api.notion.com/v1/' + path, {
    method: req.method,
    headers: { Authorization: 'Bearer ' + token, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: req.method === 'GET' ? undefined : await req.text(),
  });
  return new Response(await r.text(), { status: r.status, headers: { ...cors, 'content-type': 'application/json' } });
});
