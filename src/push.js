// ─── ALERTAS DE ÚLTIMA HORA (Web Push) ──────────────────────────────────────
// Envía notificaciones push a quienes activaron 🔔 en la web/app.
// Una noticia es "última hora" si:
//   A) su titular contiene una palabra clave de emergencia (sismo, apagón, cierre vial…), o
//   B) 3 o más medios distintos publican sobre el mismo hecho (titulares parecidos).
// Cada hecho se avisa UNA sola vez. Máximo 3 alertas por ciclo (cada 15 min).
//
// CONFIGURACIÓN: variable en Render  VAPID_PRIVATE_KEY  (la clave pública va aquí abajo).

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BLng9s1ZuhpVkUXWzg8_XlLzbZHE3_dSUTK36Q3MPUjvsSp8wnpTdk7G0Y2_H5StAlWaAHOBJyi2tmJ0lY96osM';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const activo = !!process.env.VAPID_PRIVATE_KEY;
if (activo) webpush.setVapidDetails('https://rdm-tv.github.io/EcuaNews/', VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

const VENTANA_HORAS = 3;
const MAX_ALERTAS_POR_CICLO = 3;
const MIN_MEDIOS = 3;

// ── Criterios ────────────────────────────────────────────────────────────────
const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

const KEYWORDS = new RegExp('\\b(' + [
  'sismo', 'sismos', 'temblor', 'terremoto', 'tsunami', 'erupcion', 'alerta', 'emergencia',
  'cierre vial', 'via cerrada', 'vias cerradas', 'cierran la via', 'apagon', 'apagones',
  'corte de luz', 'cortes de luz', 'incendio', 'deslave', 'derrumbe', 'inundacion', 'desbordamiento',
  'evacuacion', 'evacuan', 'explosion', 'atentado', 'balacera', 'estado de excepcion', 'toque de queda', 'paro nacional',
].join('|') + ')\\b');

const STOP = new Set('para como esta este esto estos estas desde hasta entre sobre tras segun luego aunque porque cuando donde tambien tiene tienen sera seran fue fueron han hay ante bajo cada otro otra otros otras mas menos muy ecuador ecuatoriano ecuatoriana'.split(' '));
const tokens = t => new Set(norm(t).split(' ').filter(w => w.length >= 4 && !STOP.has(w)));

function similares(a, b) {
  let comunes = 0;
  for (const w of a) if (b.has(w)) comunes++;
  return comunes >= 3 && comunes / Math.min(a.size, b.size) >= 0.5;
}

function esClaveUrgente(titulo) { return KEYWORDS.test(norm(titulo)); }

// Agrupa noticias que hablan del mismo hecho
function agrupar(noticias) {
  const grupos = [];
  for (const n of noticias) {
    const tk = tokens(n.titulo);
    const g = grupos.find(g => g.miembros.some(m => similares(tk, m.tk)));
    if (g) g.miembros.push({ n, tk });
    else grupos.push({ miembros: [{ n, tk }] });
  }
  return grupos.map(g => g.miembros.map(m => m.n));
}

// Decide qué grupos merecen alerta (ignora los que ya se avisaron)
function evaluar(noticias, notificadas) {
  const alertas = [];
  for (const grupo of agrupar(noticias)) {
    if (grupo.some(n => notificadas.has(n.id))) continue;               // ya avisado
    const medios = new Set(grupo.map(n => n.fuente_id)).size;
    const clave = grupo.find(n => esClaveUrgente(n.titulo));
    if (!clave && medios < MIN_MEDIOS) continue;
    const rep = clave || grupo[0];
    alertas.push({ rep, grupo, medios, motivo: clave ? 'palabra clave' : `${medios} medios` });
  }
  return alertas;
}

// ── Envío ────────────────────────────────────────────────────────────────────
const notificadas = new Set();
let primed = false;

async function enviarA(sub, payload) {
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload));
    return true;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) {
      await supabase.from('push_subs').delete().eq('endpoint', sub.endpoint);   // suscripción caducada
    } else {
      console.error('🔔 push:', e.statusCode || '', (e.body || e.message || '').toString().slice(0, 120));
    }
    return false;
  }
}

async function enviarAlertasUrgentes() {
  if (!activo) return;
  const desde = new Date(Date.now() - VENTANA_HORAS * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from('noticias')
    .select('id,titulo,url,ciudad,ciudad_label,fuente_id,fuente_nombre,tipo,publicado_en')
    .gte('publicado_en', desde)
    .neq('tipo', 'youtube')
    .order('publicado_en', { ascending: false })
    .limit(300);
  if (error) { console.error('🔔 Supabase:', error.message); return; }
  const noticias = data || [];

  // Primer ciclo tras arrancar: solo memoriza lo existente
  if (!primed) {
    primed = true;
    noticias.forEach(n => notificadas.add(n.id));
    console.log(`🔔 Alertas listas (${noticias.length} noticias memorizadas)`);
    return;
  }

  const alertas = evaluar(noticias, notificadas).slice(0, MAX_ALERTAS_POR_CICLO);
  // Memoriza todo lo visto para no reevaluar; los grupos que aún no califican se reevalúan igual
  alertas.forEach(a => a.grupo.forEach(n => notificadas.add(n.id)));
  if (!alertas.length) return;

  const { data: subs, error: e2 } = await supabase.from('push_subs').select('endpoint,p256dh,auth,ciudades');
  if (e2) { console.error('🔔 push_subs:', e2.message); return; }
  if (!subs?.length) { console.log(`🔔 ${alertas.length} alertas, sin suscriptores`); return; }

  let enviadas = 0;
  for (const a of alertas) {
    const n = a.rep;
    const payload = {
      title: '🚨 Última hora — ' + (n.ciudad_label || 'Ecuador'),
      body: n.titulo,
      url: n.url,
      tag: 'ultima-hora-' + n.id,
    };
    const destino = subs.filter(s => !s.ciudades?.length || !n.ciudad || n.ciudad === 'nacional' || s.ciudades.includes(n.ciudad));
    const res = await Promise.all(destino.map(s => enviarA(s, payload)));
    enviadas += res.filter(Boolean).length;
    console.log(`🔔 Alerta (${a.motivo}): "${n.titulo.slice(0, 70)}" → ${destino.length} dispositivos`);
  }
  console.log(`🔔 Push: ${enviadas} notificaciones enviadas`);
}

// ── Rutas API ────────────────────────────────────────────────────────────────
function registrarRutas(app) {
  app.get('/api/push/key', (req, res) => res.json({ ok: true, publicKey: VAPID_PUBLIC_KEY, activo }));

  app.post('/api/push/subscribe', async (req, res) => {
    try {
      const { subscription, ciudades } = req.body || {};
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth)
        return res.status(400).json({ ok: false, error: 'Suscripción inválida' });
      const lista = Array.isArray(ciudades) ? ciudades.map(String).slice(0, 12) : [];
      const { error } = await supabase.from('push_subs').upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        ciudades: lista,
      }, { onConflict: 'endpoint' });
      if (error) return res.status(500).json({ ok: false, error: error.message });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post('/api/push/unsubscribe', async (req, res) => {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ ok: false });
    await supabase.from('push_subs').delete().eq('endpoint', endpoint);
    res.json({ ok: true });
  });

  // Envía una notificación de prueba SOLO al dispositivo que la pide
  app.post('/api/push/test', async (req, res) => {
    if (!activo) return res.status(503).json({ ok: false, error: 'VAPID_PRIVATE_KEY no configurada' });
    const { endpoint } = req.body || {};
    const { data } = await supabase.from('push_subs').select('endpoint,p256dh,auth').eq('endpoint', endpoint).single();
    if (!data) return res.status(404).json({ ok: false, error: 'Suscripción no encontrada' });
    const ok = await enviarA(data, { title: '✅ Alertas activadas', body: 'Recibirás las noticias de última hora de EcuaNews.', url: 'https://rdm-tv.github.io/EcuaNews/', tag: 'prueba' });
    res.json({ ok });
  });
}

module.exports = { enviarAlertasUrgentes, registrarRutas, evaluar, agrupar, esClaveUrgente };
