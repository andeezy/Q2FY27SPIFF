export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const ADMIN_PASSWORD  = env.ADMIN_PASSWORD  || 'spiff2025';
  const VIEWER_PASSWORD = env.VIEWER_PASSWORD || 'verkada';

  if (body.role === 'admin' && body.password === ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ ok: true, role: 'admin' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (body.role === 'viewer' && body.password === VIEWER_PASSWORD) {
    return new Response(JSON.stringify({ ok: true, role: 'viewer' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
