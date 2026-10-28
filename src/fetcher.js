// ─── FETCHER PRINCIPAL ────────────────────────────────────────────────────────
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { FEEDS } = require('./feeds.config');
const { detectCity, detectCategory, cityLabel } = require('./classifier');
const { fetchAllYoutube } = require('./youtube');
const { postToTelegram } = require('./telegram');

const { fetchFeed } = require('./http');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function extractImage(item) {
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

async function processFeed(feed) {
  const result = { feed: feed.id, ok: false, count: 0, error: null };
  try {
    console.log(`  Fetching: ${feed.name}...`);
    // Orden: RSS propio → alternos → Google News. Se usa el primero que traiga noticias.
    const fuentes = [feed.url, ...(feed.alt || []), feed.gnews].filter(Boolean);
    let parsed = null, via = null, ultimoError = null;
    for (const u of fuentes) {
      try {
        const p = await fetchFeed(u);
        if ((p.items || []).length > 0) { parsed = p; via = u; break; }
        ultimoError = new Error('feed sin noticias');
      } catch (e) { ultimoError = e; }
    }
    if (!parsed) throw ultimoError || new Error('sin fuentes disponibles');
    const viaGN = via === feed.gnews;
    const items = (parsed.items || []).slice(0, 20);
    const noticias = [];

    for (const item of items) {
      let titulo = item.title?.trim();
      if (viaGN && titulo) titulo = titulo.replace(/\s+-\s+[^-]+$/, '').trim(); // quita " - Fuente" de Google News
      if (!titulo || titulo.length < 10) continue;

      const link = item.link || item.guid || feed.url;
      const resumen = stripHtml(item.contentSnippet || item.summary || item.content || '').slice(0, 400);
      const pubDate = item.pubDate || item.isoDate;
      const ts = pubDate ? new Date(pubDate).getTime() : Date.now();
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
    console.log(`  ✅ ${feed.name}: ${noticias.length} noticias${viaGN ? ' (vía Google News)' : ''}`);
  } catch (err) {
    result.error = err.message;
    console.error(`  ❌ ${feed.name}: ${err.message}`);
  }
  return result;
}

async function cleanOldNews() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase.from('noticias').delete().lt('publicado_en', sevenDaysAgo);
  if (count) console.log(`🗑️  Limpieza: ${count} noticias antiguas eliminadas`);
}

async function fetchAll() {
  console.log(`\n🇪🇨 EcuaNews Fetcher — ${new Date().toLocaleString('es-EC')}`);
  console.log('━'.repeat(50));

  const feedsActivos = FEEDS.filter(f => f.activo);
  console.log(`📡 RSS: ${feedsActivos.length} fuentes | 📺 YouTube: 13 canales\n`);

  // ── 1. Feeds RSS ────────────────────────────────────────────────
  const rssResults = [];
  const chunkSize = 4;
  for (let i = 0; i < feedsActivos.length; i += chunkSize) {
    const chunk = feedsActivos.slice(i, i + chunkSize);
    const res = await Promise.allSettled(chunk.map(processFeed));
    rssResults.push(...res.map(r => r.value || r.reason));
  }

  // ── 2. YouTube RSS ───────────────────────────────────────────────
  const youtubeResult = await fetchAllYoutube();

  // ── 3. Limpieza ─────────────────────────────────────────────────
  await postToTelegram().catch(e => console.error('Telegram:', e.message));

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

module.exports = { fetchAll };
