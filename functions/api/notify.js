// functions/api/notify.js
// Called by Cloudflare Cron Triggers to send email reminders
// Set up two cron triggers in Cloudflare dashboard:
//   - "0 9 1 6 *"  → June 1 at 9am (Window 1 opens)
//   - "0 9 6 6 *"  → June 6 at 9am (Window 1 closes)
//   - "0 9 1 7 *"  → July 1 at 9am (Window 2 opens)
//   - "0 9 6 7 *"  → July 6 at 9am (Window 2 closes)
//   - "0 14 * * 1" → Every Monday at 2pm (weekly digest)

const SE_EMAILS = [
  'riley.finger@verkada.com',
  'michael.cieslak@verkada.com',
  'adam.kissee@verkada.com',
  'shaun.benson@verkada.com',
  'eric.lorenzo@verkada.com',
  'katherine.morales@verkada.com',
  'brandon.quach@verkada.com',
  'david.blagaila@verkada.com',
  'karthik.pradeep@verkada.com',
  'katherine.peppler@verkada.com',
  'mikinzi.strykul@verkada.com',
  'rohan.sahoo@verkada.com'
];

async function sendEmail(env, to, subject, html) {
  // Uses Mailchannels (free with Cloudflare Workers) or your own SMTP
  // To use Mailchannels, no API key needed — just POST to their API
  const payload = {
    personalizations: [{ to: Array.isArray(to) ? to.map(e => ({ email: e })) : [{ email: to }] }],
    from: { email: env.FROM_EMAIL || 'spiff@verkada.com', name: 'Verkada SPIFF' },
    subject,
    content: [{ type: 'text/html', value: html }]
  };
  return fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

function windowOpenEmail() {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0e17;padding:2rem;border-radius:8px;">
      <img src="https://atx-phx-q2fy27-spiff.andeezy.com/Verkada-Icon-Logo-White-RGB.png" width="40" style="margin-bottom:1rem;"/>
      <h2 style="color:#5DCAA5;font-size:20px;letter-spacing:2px;text-transform:uppercase;">🟢 Reassignment Window is OPEN</h2>
      <p style="color:#c8d6e5;line-height:1.7;margin:1rem 0;">Your token reassignment window is now open and will close in <strong style="color:#027DAD">5 days</strong>.</p>
      <div style="background:#0d1524;border:1px solid #1e2d42;border-radius:6px;padding:1rem;margin:1rem 0;">
        <p style="color:#EF9F27;font-family:monospace;margin:0;">Cost: $100,000 per reassignment</p>
        <p style="color:#EF9F27;font-family:monospace;margin:4px 0;">Max: 2 reassignments per token</p>
        <p style="color:#EF9F27;font-family:monospace;margin:0;">Burned tokens (on closed deals) cannot be reassigned</p>
      </div>
      <p style="color:#c8d6e5;">Log in at <a href="https://atx-phx-q2fy27-spiff.andeezy.com/" style="color:#027DAD;">your SPIFF dashboard</a> to reassign your tokens before the window closes.</p>
      <p style="color:#4a6280;font-size:12px;margin-top:2rem;">ATX+PHX MMSE SPIFF · Q2 FY27</p>
    </div>`;
}

function windowCloseEmail() {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0e17;padding:2rem;border-radius:8px;">
      <img src="https://atx-phx-q2fy27-spiff.andeezy.com/Verkada-Icon-Logo-White-RGB.png" width="40" style="margin-bottom:1rem;"/>
      <h2 style="color:#e24b4a;font-size:20px;letter-spacing:2px;text-transform:uppercase;">🔴 Reassignment Window is CLOSED</h2>
      <p style="color:#c8d6e5;line-height:1.7;margin:1rem 0;">The token reassignment window has closed. Token assignments are now locked until the next window (if any).</p>
      <p style="color:#c8d6e5;">Check the <a href="https://atx-phx-q2fy27-spiff.andeezy.com/" style="color:#027DAD;">SPIFF dashboard</a> for the current standings.</p>
      <p style="color:#4a6280;font-size:12px;margin-top:2rem;">ATX+PHX MMSE SPIFF · Q2 FY27</p>
    </div>`;
}

async function weeklyDigestEmail(env) {
  // Fetch current state from D1
  let leaderboardHtml = '<p style="color:#4a6280;">Could not load standings.</p>';
  try {
    const result = await env.DB.prepare('SELECT value FROM spiff_state WHERE key = ?').bind('main').first();
    if (result && result.value) {
      const data = JSON.parse(result.value);
      const { state } = data;
      const scores = state.ses.map(se => {
        let closedWonRev = 0, closedLostRisk = 0;
        se.tokens.forEach(tok => {
          if (tok.oppId !== null) {
            const opp = state.opps.find(o => o.id === tok.oppId);
            if (opp) {
              if (opp.stage === 'closed_won') closedWonRev += opp.value * tok.num;
              else if (opp.stage === 'closed_lost') closedLostRisk += opp.value;
            }
          }
        });
        return { name: se.name, bank: se.bank + closedWonRev - closedLostRisk };
      }).sort((a, b) => b.bank - a.bank);

      const fmt = n => '$' + Math.round(n).toLocaleString();
      const rows = scores.map((se, i) => `
        <tr style="border-bottom:1px solid #1e2d42;">
          <td style="padding:8px;color:${i===0?'#EF9F27':i===1?'#85B7EB':i===2?'#5DCAA5':'#c8d6e5'}">${i+1}</td>
          <td style="padding:8px;color:#e8f4f8;font-weight:600">${se.name}</td>
          <td style="padding:8px;color:${se.bank>=100000?'#5DCAA5':'#e24b4a'};font-family:monospace">${fmt(se.bank)}</td>
        </tr>`).join('');

      leaderboardHtml = `
        <table style="width:100%;border-collapse:collapse;font-family:sans-serif;">
          <thead><tr style="border-bottom:1px solid #1e2d42;">
            <th style="padding:8px;text-align:left;color:#4a6280;font-size:11px">Rank</th>
            <th style="padding:8px;text-align:left;color:#4a6280;font-size:11px">SE</th>
            <th style="padding:8px;text-align:left;color:#4a6280;font-size:11px">Bank Balance</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }
  } catch (e) { console.error('Digest error:', e); }

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0e17;padding:2rem;border-radius:8px;">
      <img src="https://YOUR_DOMAIN/Verkada-Icon-Logo-White-RGB.png" width="40" style="margin-bottom:1rem;"/>
      <h2 style="color:#027DAD;font-size:20px;letter-spacing:2px;text-transform:uppercase;">📊 Weekly SPIFF Update</h2>
      <p style="color:#c8d6e5;margin-bottom:1rem;">Here are the current standings as of ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}:</p>
      <div style="background:#0d1524;border:1px solid #1e2d42;border-radius:6px;padding:1rem;margin-bottom:1rem;">
        ${leaderboardHtml}
      </div>
      <p style="color:#c8d6e5;">View the full dashboard at <a href="https://YOUR_DOMAIN" style="color:#027DAD;">your SPIFF dashboard</a>.</p>
      <p style="color:#4a6280;font-size:12px;margin-top:2rem;">ATX+PHX MMSE SPIFF · Q2 FY27</p>
    </div>`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const pass = request.headers.get('x-admin-pass');
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'spiff2025';
  if (pass !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { type } = body;
  const allEmails = [...SE_EMAILS, env.ADMIN_EMAIL || 'admin@verkada.com'];

  let subject, html;
  if (type === 'window_open') {
    subject = '🟢 SPIFF Token Reassignment Window is OPEN — Act now!';
    html = windowOpenEmail();
  } else if (type === 'window_close') {
    subject = '🔴 SPIFF Reassignment Window Closed';
    html = windowCloseEmail();
  } else if (type === 'digest') {
    subject = `📊 Weekly SPIFF Update — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    html = await weeklyDigestEmail(env);
  } else {
    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  await sendEmail(env, allEmails, subject, html);
  return new Response(JSON.stringify({ ok: true, sent: allEmails.length }), { headers: { 'Content-Type': 'application/json' } });
}
