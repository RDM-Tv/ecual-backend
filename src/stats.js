// ─── ESTADÍSTICAS + PANEL DE ADMINISTRACIÓN ──────────────────────────────────
// • POST /api/track          → recibe eventos anónimos de la web (visitas, clics, anuncios, compartidos)
// • GET  /api/admin/*        → datos para /admin.html (protegidos con la clave ADMIN_TOKEN)
//
// Requiere en Render:  SUPABASE_SERVICE_KEY  (clave secreta "service_role" de Supabase)
//                      ADMIN_TOKEN           (la contraseña que tú elijas para entrar al panel)
// Sin SUPABASE_SERVICE_KEY el sitio funciona igual; solo se desactivan las estadísticas.
// Privacidad: NO se guarda la IP ni datos personales; solo un identificador aleatorio anónimo.

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const sa = process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

// Qué tipo de clave se puso en SUPABASE_SERVICE_KEY (para avisar si se pegó la equivocada)
function tipoDeClave(k) {
  if (!k) return 'ninguna';
  if (/^sb_publishable_/.test(k)) return 'publishable (clave pública: es la equivocada)';
  if (/^sb_secret_/.test(k)) return 'secret (correcta)';
  try {
    const rol = JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString()).role;
    return rol === 'service_role' ? 'service_role (correcta)' : rol === 'anon' ? 'anon (clave pública: es la equivocada)' : String(rol || 'desconocida');
  } catch (e) { return 'no reconocida (¿pegaste la clave completa y en una sola línea?)'; }
}
const CLAVE_TIPO = tipoDeClave(process.env.SUPABASE_SERVICE_KEY || '');
const CLAVE_MALA = /equivocada|no reconocida/.test(CLAVE_TIPO);
if (process.env.SUPABASE_SERVICE_KEY) console.log('📊 Clave SUPABASE_SERVICE_KEY:', CLAVE_TIPO);

const TIPOS = new Set(['visita', 'clic_noticia', 'clic_anuncio', 'vista_anuncio', 'compartir', 'landing', 'landing_original', 'landing_ecuanews', 'landing_anuncio']);
const CLAVES = ['ref', 'nuevo', 'pwa', 'fuente', 'cat', 'ciudad', 'anuncio', 'formato', 'red', 'tema'];

function clasificarUA(ua = '') {
  const disp = /iPad|Tablet|Tab /i.test(ua) ? 'tablet' : /Mobi|Android|iPhone|iPod/i.test(ua) ? 'movil' : 'escritorio';
  const nav = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Otro';
  const os = /Windows NT 6\.1/.test(ua) ? 'Windows 7' : /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Otro';
  return { disp, nav, os };
}

// Límite simple por IP (en memoria) para que nadie inunde la base de datos
const cubetas = new Map();
function limite(ip, max, ventanaMs) {
  const ahora = Date.now();
  const c = cubetas.get(ip) || { n: 0, desde: ahora };
  if (ahora - c.desde > ventanaMs) { c.n = 0; c.desde = ahora; }
  c.n++;
  cubetas.set(ip, c);
  if (cubetas.size > 5000) cubetas.clear();
  return c.n <= max;
}

function limpiarDato(d) {
  const out = {};
  if (d && typeof d === 'object') {
    for (const k of CLAVES) {
      if (d[k] === undefined || d[k] === null) continue;
      out[k] = String(d[k]).slice(0, 80);
    }
  }
  return out;
}

async function registrarCiclo(filas) {
  if (!sa || !filas.length) return;
  const { error } = await sa.from('fuentes_ciclos').insert(filas);
  if (error) console.error('📊 fuentes_ciclos:', error.message);
}

async function limpiarAntiguos() {
  if (!sa) return;
  const hoy = new Date();
  const d = n => new Date(hoy.getTime() - n * 86400000).toISOString().slice(0, 10);
  await sa.from('eventos').delete().lt('dia', d(120));
  await sa.from('fuentes_ciclos').delete().lt('dia', d(30));
}

function registrarRutas(app, getEstadoFuentes) {
  // ── Recepción de eventos ───────────────────────────────────────────────────
  app.post('/api/track', async (req, res) => {
    res.status(204).end();                                   // responder ya; guardar después
    try {
      if (!sa) return;
      const ip = req.ip || 'x';
      if (!limite(ip, 150, 60000)) return;
      const { sid, eventos } = req.body || {};
      if (!Array.isArray(eventos) || !eventos.length) return;
      const ua = clasificarUA(req.headers['user-agent'] || '');
      const idAnon = String(sid || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || null;
      const filas = [];
      for (const e of eventos.slice(0, 40)) {
        if (!e || !TIPOS.has(e.t)) continue;
        const dato = limpiarDato(e.d);
        if (e.t === 'visita' || e.t === 'landing') Object.assign(dato, ua);
        filas.push({ tipo: e.t, sid: idAnon, dato });
      }
      if (filas.length) {
        const { error } = await sa.from('eventos').insert(filas);
        if (error) console.error('📊 eventos:', error.message);
      }
    } catch (e) { console.error('📊 track:', e.message); }
  });

  // ── Acceso al panel ────────────────────────────────────────────────────────
  function auth(req, res, next) {
    const esperado = process.env.ADMIN_TOKEN || '';
    const ip = req.ip || 'x';
    if (!esperado) return res.status(503).json({ ok: false, error: 'ADMIN_TOKEN no está configurado en Render' });
    if (!limite('adm:' + ip, 12, 10 * 60000)) return res.status(429).json({ ok: false, error: 'Demasiados intentos. Espera unos minutos.' });
    const dado = String(req.headers['x-admin-token'] || '');
    const a = crypto.createHash('sha256').update(dado).digest();
    const b = crypto.createHash('sha256').update(esperado).digest();
    if (!crypto.timingSafeEqual(a, b)) return res.status(401).json({ ok: false, error: 'Clave incorrecta' });
    cubetas.delete('adm:' + ip);                              // acceso correcto: reinicia el contador
    next();
  }
  const dias = req => Math.min(90, Math.max(1, parseInt(req.query.dias, 10) || 30));

  app.get('/api/admin/ping', auth, (req, res) => {
    res.json({ ok: true, estadisticas: !!sa, clave: CLAVE_TIPO, clave_mala: CLAVE_MALA, fuentes_memoria: getEstadoFuentes().length });
  });

  app.get('/api/admin/resumen', auth, async (req, res) => {
    if (!sa) return res.json({ ok: false, error: 'sin-service-key' });
    const { data, error } = await sa.rpc('admin_resumen', { dias: dias(req) });
    if (error) return res.json({ ok: false, error: /permission denied/i.test(error.message) ? 'clave-sin-permisos' : error.message, clave: CLAVE_TIPO, detalle: error.message });
    res.json({ ok: true, ...data });
  });

  app.get('/api/admin/fuentes', auth, async (req, res) => {
    let hist = null, errorDb = null;
    if (sa) {
      const { data, error } = await sa.rpc('admin_fuentes', { dias: dias(req) });
      if (error) errorDb = /permission denied/i.test(error.message) ? 'clave-sin-permisos' : error.message; else hist = data;
    } else errorDb = 'sin-service-key';
    res.json({ ok: true, ahora: getEstadoFuentes(), historial: hist, error_db: errorDb });
  });

  app.get('/api/admin/exportar', auth, async (req, res) => {
    if (!sa) return res.status(503).send('sin-service-key');
    const { data, error } = await sa.rpc('admin_resumen', { dias: dias(req) });
    if (error) return res.status(500).send(error.message);
    const cols = ['dia', 'visitantes', 'vistas', 'nuevos', 'clics_noticia', 'vistas_anuncio', 'clics_anuncio', 'compartidos', 'landing'];
    const csv = [cols.join(',')].concat((data.diario || []).map(r => cols.map(c => r[c] ?? 0).join(','))).join('\n');
    res.set('Content-Type', 'text/csv; charset=utf-8').set('Content-Disposition', 'attachment; filename="ecuanews-estadisticas.csv"').send(csv);
  });
}

module.exports = { registrarRutas, registrarCiclo, limpiarAntiguos, clasificarUA, hayEstadisticas: () => !!sa };
