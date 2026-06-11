// â”€â”€â”€ FETCHER DE RSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Lee todos los feeds configurados, los parsea y los guarda en Supabase

require('dotenv').config();
const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const { FEEDS } = require('./feeds.config');
const { detectCity, detectCategory, cityLabel } = require('./classifier');

const parser = new Parser({
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; ECUAL-Bot/1.0; +https://ecual.ec)',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

// â”€â”€â”€ SUPABASE CLIENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// â”€â”€â”€ EXTRAER IMAGEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function extractImage(item) {
  // Intentar diferentes campos donde puede venir la imagen
  if (item.mediaContent?.$.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) return item.enclosure.url;

  // Buscar en el contenido HTML
  const html = item['content:encoded'] || item.content || item.summary || '';
  const match = html.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)/i);
  if (match) return match[1];

  return null;
}

// â”€â”€â”€ LIMPIAR HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function stripHtml(str = '') {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// â”€â”€â”€ GENERAR ID ÃšNICO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function makeId(feedId, link) {
  // Hash simple del link para evitar duplicados
  let hash = 0;
  const str = feedId + link;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// â”€â”€â”€ PROCESAR UN FEED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function processFeed(feed) {
  const result = { feed: feed.id, ok: false, count: 0, error: null };

  try {
    console.log(`  Fetching: ${feed.name}...`);
    const parsed = await parser.parseURL(feed.url);

    const items = (parsed.items || []).slice(0, 20); // mÃ¡x 20 por feed
    const noticias = [];

    for (const item of items) {
      const titulo = item.title?.trim();
      if (!titulo || titulo.length < 10) continue;

      const link = item.link || item.guid || feed.url;
      const resumen = stripHtml(item.contentSnippet || item.summary || item.content || '').slice(0, 400);
      const pubDate = item.pubDate || item.isoDate;
      const ts = pubDate ? new Date(pubDate).getTime() : Date.now();
      const imgUrl = extractImage(item);

      const textoCompleto = `${titulo} ${resumen}`;
      const ciudad = detectCity(textoCompleto, feed.ciudad_base);
      const categoria = detectCategory(textoCompleto);

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

    // â”€â”€â”€ GUARDAR EN SUPABASE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (noticias.length > 0) {
      const { error } = await supabase
        .from('noticias')
        .upsert(noticias, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (error) throw new Error(`Supabase: ${error.message}`);
    }

    result.ok = true;
    result.count = noticias.length;
    console.log(`  âœ… ${feed.name}: ${noticias.length} noticias guardadas`);

  } catch (err) {
    result.error = err.message;
    console.error(`  âŒ ${feed.name}: ${err.message}`);
  }

  return result;
}

// â”€â”€â”€ LIMPIAR NOTICIAS VIEJAS (> 7 dÃ­as) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function cleanOldNews() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from('noticias')
    .delete()
    .lt('publicado_en', sevenDaysAgo);

  if (!error) console.log(`ðŸ—‘ï¸  Limpieza: ${count || 0} noticias antiguas eliminadas`);
}

// â”€â”€â”€ FUNCIÃ“N PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchAll() {
  console.log(`\nðŸ‡ªðŸ‡¨ ECUAL Fetcher â€” ${new Date().toLocaleString('es-EC')}`);
  console.log('â”'.repeat(50));

  const feedsActivos = FEEDS.filter(f => f.activo);
  console.log(`ðŸ“¡ Procesando ${feedsActivos.length} fuentes...\n`);

  const results = [];

  // Procesar en paralelo (mÃ¡x 4 simultÃ¡neos para no sobrecargar)
  const chunkSize = 4;
  for (let i = 0; i < feedsActivos.length; i += chunkSize) {
    const chunk = feedsActivos.slice(i, i + chunkSize);
    const chunkResults = await Promise.allSettled(chunk.map(processFeed));
    results.push(...chunkResults.map(r => r.value || r.reason));
  }

  // â”€â”€â”€ RESUMEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const ok = results.filter(r => r?.ok).length;
  const total = results.reduce((sum, r) => sum + (r?.count || 0), 0);

  console.log('\n' + 'â”'.repeat(50));
  console.log(`âœ… Fuentes exitosas: ${ok}/${feedsActivos.length}`);
  console.log(`ðŸ“° Noticias procesadas: ${total}`);

  // Limpiar noticias viejas cada vez que fetcheamos
  await cleanOldNews();

  return { ok, total, results };
}

// â”€â”€â”€ Ejecutar directamente si se llama como script â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if (require.main === module) {
  fetchAll()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { fetchAll };
