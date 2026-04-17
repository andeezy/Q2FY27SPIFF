// functions/api/state.js
// GET  /api/state      — returns current state (public, no auth needed for read)
// POST /api/state      — saves state (requires x-admin-pass header)

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const result = await env.DB.prepare(
      'SELECT value FROM spiff_state WHERE key = ?'
    ).bind('main').first();

    if (!result) {
      return new Response(JSON.stringify(null), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(result.value, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'spiff2025';

  const pass = request.headers.get('x-admin-pass');
  if (pass !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await request.text();

  try {
    await env.DB.prepare(
      'INSERT INTO spiff_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    ).bind('main', body, new Date().toISOString()).run();

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
