// ─── PUBLICACIÓN AUTOMÁTICA EN TELEGRAM ──────────────────────────────────────
// Cada vez que el backend encuentra noticias nuevas, las publica solo en los
// canales de Telegram que configures. Es gratis y usa la API oficial (bots).
//
// CONFIGURACIÓN (una sola vez):
//  1) En Telegram habla con @BotFather → /newbot → copia el token.
//  2) Crea tus canales PÚBLICOS (ej: EcuaNews Manta) y ponles un @usuario.
//  3) En cada canal: Administradores → Añadir administrador → tu bot.
//  4) Escribe abajo el @usuario de cada canal (deja '' los que no uses).
//  5) En Render agrega UNA variable: TELEGRAM_BOT_TOKEN = el token del bot.

const { createClient } = require('@supabase/supabase-js');

const CHANNELS = {
  todas: '',       // ej: '@ecuanews_ec'  ← recibe noticias de todo el país
  quito: '',       // ej: '@ecuanews_quito'
  guayaquil: '',
  manta: '',
  portoviejo: '',
  cuenca: '',
  ambato: '',
  loja: '',
  esmeraldas: '',
  machala: '',
  ibarra: '',
  'santo domingo': '',
};

const MAX_POR_CICLO = 5;   // máximo de noticias por canal cada 15 min
const VENTANA_HORAS = 3;   // solo noticias publicadas en las últimas 3 horas

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const vistas = new Set();  // ids ya procesados (en memoria)
let primed = false;

const esc = t => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function enviar(chat, n) {
  const titulo = esc(n.titulo);
  const texto = `<b>${titulo}</b>\n📍 ${esc(n.ciudad_label || 'Nacional')} · ${esc(n.fuente_nombre)}\n${n.url}\n\n🦅 Más noticias en EcuaNews: https://rdm-tv.github.io/EcuaNews/`;
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: texto, parse_mode: 'HTML' }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram ${res.status}: ${body.slice(0, 150)}`);
  }
}

async function postToTelegram() {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;               // sin token = no hace nada
  const activos = Object.entries(CHANNELS).filter(([, c]) => c);
  if (!activos.length) return;                                // sin canales = no hace nada

  const desde = new Date(Date.now() - VENTANA_HORAS * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from('noticias')
    .select('id,titulo,url,ciudad,ciudad_label,fuente_nombre,publicado_en')
    .gte('publicado_en', desde)
    .order('publicado_en', { ascending: false })
    .limit(300);
  if (error) { console.error('Telegram/Supabase:', error.message); return; }

  const nuevas = (data || []).filter(n => !vistas.has(n.id));
  nuevas.forEach(n => vistas.add(n.id));

  // Primer ciclo tras arrancar: solo memoriza lo existente (evita inundar los canales)
  if (!primed) { primed = true; console.log(`📨 Telegram listo (${nuevas.length} noticias memorizadas)`); return; }
  if (!nuevas.length) return;

  let enviadas = 0;
  for (const [ciudad, chat] of activos) {
    const lista = nuevas
      .filter(n => ciudad === 'todas' ? true : n.ciudad === ciudad)
      .slice(0, MAX_POR_CICLO)
      .reverse();                                             // la más antigua primero
    for (const n of lista) {
      try { await enviar(chat, n); enviadas++; await sleep(1500); }
      catch (e) { console.error(`📨 ${chat}: ${e.message}`); }
    }
  }
  console.log(`📨 Telegram: ${enviadas} publicaciones`);
}

module.exports = { postToTelegram };
