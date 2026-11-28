// ─── FETCHER PRINCIPAL ────────────────────────────────────────────────────────
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { FEEDS } = require('./feeds.config');
const { detectCity, detectCategory, cityLabel } = require('./classifier');
const { fetchAllYoutube, YOUTUBE_CHANNELS } = require('./youtube');
const { postToTelegram } = require('./telegram');
const { enviarAlertasUrgentes } = require('./push');

const { fetchFeed, bingUrl, bingReal, bingImg } = require('./http');
const { registrarCiclo, limpiarAntiguos } = require('./stats');
const { traerPorHtml } = require('./html');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function extractImage(item) {
  if (item.htmlImage) return item.htmlImage;
  if (item.bingImage) { const v = typeof item.bingImage === 'string' ? item.bingImage : item.bingImage._; if (v) return bingImg(String(v).trim()); }
  if (item.mediaContent?.$.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) return item.enclosure.url;
  const html = item['content:encoded'] || item.content || item.summary || '';
  const match = html.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)/i);
  return match ? match[1] : null;
}

function stripHtml(str = '') {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeId(feedId, link) {
  let hash = 0;
  const str = feedId + link;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

const ESTADO = new Map();   // estado más reciente de cada fuente (lo lee el panel de administración)
let CICLO = 0;

// Titulares escritos TODO EN MAYÚSCULAS → formato normal (conservando siglas y nombres de lugares)
const SIGLAS = new Set(['cne','onu','iva','dea','fbi','ue','eeuu','ee.uu.','coe','gad','iess','msp','fifa','ecu','tv','pib','bce','mtop','ant','sri','cpccs','cidh','oea','ia','usd']);
const PROPIOS = new Set(['manta','portoviejo','manabí','manabi','montecristi','jaramijó','jaramijo','rocafuerte','sucre','bahía','bahia','chone','jipijapa','guayaquil','quito','cuenca','ambato','loja','esmeraldas','machala','ibarra','ecuador','guayas','pichincha','azuay','los','ríos','rios','santa','elena','santo','domingo','tsáchilas','tsachilas','perú','peru','colombia','venezuela','estados','unidos','china','españa','argentina','chile','méxico','mexico','brasil','petroecuador','noboa','lasso','correa','correos','flor','arteaga','donald','trump','biden']);
function normalizarTitulo(t) {
  t = String(t || '').trim();
  const letras = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  if (letras.length < 12) return t;
  const mayus = letras.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length;
  if (mayus / letras.length < 0.7) return t;                 // ya está en formato normal
  const pal = t.toLowerCase().split(/(\s+)/).map(w => {
    const k = w.replace(/[^a-záéíóúüñ.]/g, '');
    if (SIGLAS.has(k)) return w.toUpperCase();
    if (PROPIOS.has(k)) return w.charAt(0).toUpperCase() + w.slice(1);
    return w;
  }).join('');
  return pal.charAt(0).toUpperCase() + pal.slice(1).replace(/([.!?¿¡]\s+)([a-záéíóúñ])/g, (m, a, b) => a + b.toUpperCase());
}
// Filtros por sección del sitio: ruta (solo esa) y excluirRuta (todo menos esa)
function rutaOk(feed, link) {
  let p = '';
  try { p = new URL(link).pathname; } catch (e) { return true; }
  if (feed.ruta && !p.startsWith(feed.ruta)) return false;
  if (feed.excluirRuta && p.startsWith(feed.excluirRuta)) return false;
  return true;
}

function hostDe(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }

async function processFeed(feed) {
  const prev = ESTADO.get(feed.id) || { fails: 0 };
  const result = { feed: feed.id, name: feed.name, ok: false, count: 0, error: null, via: null };

  // Si una fuente lleva 8 fallos seguidos, se reintenta solo 1 de cada 8 ciclos (cada 2 horas)
  if (prev.fails >= 8 && CICLO % 8 !== 0) { result.skipped = true; result.error = prev.error; return result; }

  const intentosFallidos = [];
  try {
    console.log(`  Fetching: ${feed.name}...`);
    // Orden: RSS propio → alternos → Bing News (con la dirección real de cada nota)
    const intentos = [
      { via: 'directo', url: feed.url },
      ...(feed.alt || []).map(u => ({ via: 'alterno', url: u })),
      feed.bing ? { via: 'bing', url: bingUrl(feed.bingQ || feed.bing) } : null,
      feed.html ? { via: 'html', url: feed.html.url } : null,      // sitios sin RSS: lee su portada
    ].filter(t => t && t.url);

    let parsed = null, via = null, infoHtml = null;
    for (const t of intentos) {
      try {
        if (t.via === 'html') {
          const h = await traerPorHtml(feed, supabase, makeId);
          if (h.items.length > 0 || h.existentes > 0) { parsed = { items: h.items }; via = 'html'; infoHtml = `lectura de portada: ${h.total} titulares · ${h.items.length} nuevos · ${h.existentes} ya guardados`; break; }
          intentosFallidos.push('html: sin noticias');
          continue;
        }
        const p = await fetchFeed(t.url);
        let items = p.items || [];
        const total = items.length;
        if (t.via === 'bing') {
          items = items.map(it => ({ ...it, link: bingReal(it.link) }))
                       .filter(it => hostDe(it.link).endsWith(feed.bing));   // solo notas del sitio pedido
          if (!items.length) { intentosFallidos.push(`bing: ${total} resultados, 0 del sitio ${feed.bing}`); continue; }
        }
        if (items.length > 0) { parsed = { ...p, items }; via = t.via; break; }
        intentosFallidos.push(`${t.via}: sin noticias`);
      } catch (e) {
        intentosFallidos.push(`${t.via}: ${String(e.message).split('\n')[0].slice(0, 110)}`);
      }
    }
    if (!parsed) throw new Error(intentosFallidos.join(' | ') || 'sin fuentes disponibles');

    const items = (parsed.items || []).slice(0, 20);
    const noticias = [];

    for (const item of items) {
      const titulo = normalizarTitulo(item.title?.trim());
      if (!titulo || titulo.length < 10) continue;

      const link = item.link || item.guid || feed.url;
      if (/news\.google\.com/i.test(link)) continue;          // nunca guardar enlaces de redirección de Google
      if (!rutaOk(feed, link)) continue;                         // sección del sitio que no corresponde a esta fuente
      const resumen = stripHtml(item.contentSnippet || item.summary || item.content || '').slice(0, 400);
      const pubDate = item.pubDate || item.isoDate;
      let ts = pubDate ? new Date(pubDate).getTime() : Date.now();
      if (!Number.isFinite(ts)) ts = Date.now();                       // fecha ilegible → ahora
      if (Date.now() - ts > 7 * 24 * 3600 * 1000) continue;            // más de 7 días: se borraría en la limpieza
      const imgUrl = extractImage(item);

      const ciudad = detectCity(titulo, resumen, feed.ciudad_base);
      const categoria = detectCategory(titulo, resumen);

      noticias.push({
        id: makeId(feed.id, link),
        titulo,
        resumen,
        url: link,
        fuente_id: feed.id,
        fuente_nombre: feed.name,
        tipo: feed.tipo,
        ciudad,
        ciudad_label: cityLabel(ciudad),
        categoria,
        img_url: imgUrl,
        publicado_en: new Date(ts).toISOString(),
        creado_en: new Date().toISOString(),
      });
    }

    if (noticias.length > 0) {
      const { error } = await supabase
        .from('noticias')
        .upsert(noticias, { onConflict: 'id', ignoreDuplicates: false });
      if (error) throw new Error(`Supabase: ${error.message}`);
    }

    result.ok = true;
    result.count = noticias.length;
    result.via = via;
    ESTADO.set(feed.id, { fails: 0, ok: true, via, count: noticias.length, leidas: items.length, info: infoHtml, error: null, ts: Date.now(), lastOk: Date.now(), detalle: intentosFallidos });
    console.log(`  ✅ ${feed.name}: ${noticias.length} noticias${via !== 'directo' ? ` (vía ${via})` : ''}`);
  } catch (err) {
    result.error = err.message;
    ESTADO.set(feed.id, { fails: (prev.fails || 0) + 1, ok: false, via: null, count: 0, error: err.message, ts: Date.now(), lastOk: prev.lastOk || null, detalle: intentosFallidos });
    console.error(`  ❌ ${feed.name}: ${err.message}`);
  }
  return result;
}

// Estado actual de todas las fuentes (para el panel /admin.html)
function getEstado() {
  return FEEDS.filter(f => f.activo).map(f => ({
    id: f.id, nombre: f.name, sitio: f.bing || '', url: f.url,
    ...(ESTADO.get(f.id) || { ok: null, fails: 0, error: 'aún sin revisar' }),
  }));
}

async function cleanOldNews() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase.from('noticias').delete().lt('publicado_en', sevenDaysAgo);
  if (count) console.log(`🗑️  Limpieza: ${count} noticias antiguas eliminadas`);
}

async function fetchAll() {
  CICLO++;
  console.log(`\n🇪🇨 EcuaNews Fetcher — ${new Date().toLocaleString('es-EC')}`);
  console.log('━'.repeat(50));

  const feedsActivos = FEEDS.filter(f => f.activo);
  console.log(`📡 RSS: ${feedsActivos.length} fuentes | 📺 YouTube: ${YOUTUBE_CHANNELS.length} canales\n`);

  // ── 1. Feeds RSS ────────────────────────────────────────────────
  const rssResults = [];
  const chunkSize = 4;
  for (let i = 0; i < feedsActivos.length; i += chunkSize) {
    const chunk = feedsActivos.slice(i, i + chunkSize);
    const res = await Promise.allSettled(chunk.map(processFeed));
    rssResults.push(...res.map(r => r.value || r.reason));
  }
  // Historial por fuente para las estadísticas (no se guarda lo que se omitió por reintento espaciado)
  registrarCiclo(rssResults.filter(r => r && r.feed && !r.skipped).map(r => ({ fuente_id: r.feed, nombre: r.name, ok: !!r.ok, via: r.via, items: r.count || 0, error: r.error ? String(r.error).slice(0, 300) : null }))).catch(() => {});
  if (CICLO % 96 === 1) limpiarAntiguos().catch(() => {});

  // ── 2. YouTube RSS ───────────────────────────────────────────────
  const youtubeResult = await fetchAllYoutube();

  // ── 3. Limpieza ─────────────────────────────────────────────────
  await postToTelegram().catch(e => console.error('Telegram:', e.message));
  await enviarAlertasUrgentes().catch(e => console.error('Push:', e.message));

  await cleanOldNews();

  const okRss = rssResults.filter(r => r?.ok).length;
  const totalRss = rssResults.reduce((s, r) => s + (r?.count || 0), 0);

  console.log('\n' + '━'.repeat(50));
  console.log(`📰 RSS: ${okRss}/${feedsActivos.length} fuentes · ${totalRss} noticias`);
  console.log(`📺 YouTube: ${youtubeResult.total} videos`);
  console.log(`📊 Total: ${totalRss + youtubeResult.total} items procesados`);

  return { okRss, totalRss, youtubeResult };
}

if (require.main === module) {
  fetchAll().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { fetchAll, getEstado, normalizarTitulo, rutaOk };
