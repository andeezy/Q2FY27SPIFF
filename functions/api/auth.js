// functions/api/auth.js
// POST /api/auth — validates admin password
export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'spiff2025';

  if (body.password === ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
