// ─── MÓDULO YOUTUBE RSS ──────────────────────────────────────────────────────
// YouTube ofrece RSS oficial y gratuito para cualquier canal:
// https://www.youtube.com/feeds/videos.xml?channel_id=UCXXXXXXXX

const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const { detectCity, detectCategory, cityLabel } = require('./classifier');

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EcuaNews-Bot/1.0)' },
  customFields: {
    item: [['media:group', 'mediaGroup']],
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ─── CANALES DE YOUTUBE A MONITOREAR ──────────────────────────────────────────
const YOUTUBE_CHANNELS = [
  // Medios tradicionales
  { id: 'UCRUV3nUNSc-xpBrTwQOCQQg', name: 'Ecuavisa',       ciudad_base: 'guayaquil' },
  { id: 'UCx6TdW_j_WKafftaMM-Ttzg', name: 'Ecuavisa Noticieros', ciudad_base: 'guayaquil' },
  { id: 'UCCwRtme3lumNRQXMO2EvCvw', name: 'Teleamazonas',   ciudad_base: 'quito' },
  { id: 'UCe6Gi8_PZp9gcEZb5hTCPdQ', name: 'Primicias',      ciudad_base: null },
  { id: 'UCLwBAR1YA6bQRNVCLYOM6Sg', name: 'El Universo',    ciudad_base: null },
  { id: 'UCfXVS_zw_XmAx8iIiia1IkA', name: 'Ecuador TV',     ciudad_base: null },
  // Periodismo independiente / análisis
  { id: 'UCLCCMz3exOqYc59IN0VOLlA', name: 'Andersson Boscán', ciudad_base: null },
  { id: 'UCz8FnLDbCO0tFAMRM72cMkQ', name: 'La Posta',         ciudad_base: null },
];

function makeId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'yt_' + Math.abs(hash).toString(36);
}

function extractThumbnail(item) {
  // YouTube RSS incluye media:group > media:thumbnail
  if (item.mediaGroup?.['media:thumbnail']?.[0]?.$.url) {
    return item.mediaGroup['media:thumbnail'][0].$.url;
  }
  // Fallback: construir desde el video ID
  const videoId = item.id?.split(':').pop();
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

async function processChannel(channel) {
  const result = { channel: channel.name, ok: false, count: 0 };

  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
    console.log(`  Fetching YouTube: ${channel.name}...`);

    const feed = await parser.parseURL(url);
    const items = (feed.items || []).slice(0, 8); // últimos 8 videos
    const noticias = [];

    for (const item of items) {
      const titulo = item.title?.trim();
      if (!titulo || titulo.length < 5) continue;

      const link = item.link;
      const pubDate = item.pubDate || item.isoDate;
      const ts = pubDate ? new Date(pubDate).getTime() : Date.now();

      // Solo videos de los últimos 3 días (para no llenar de contenido viejo)
      if (Date.now() - ts > 3 * 24 * 60 * 60 * 1000) continue;

      const resumen = (item.contentSnippet || item['media:group']?.['media:description']?.[0] || '')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);

      const imgUrl = extractThumbnail(item);

      const ciudad = detectCity(titulo, resumen, channel.ciudad_base);
      const categoria = detectCategory(titulo, resumen);

      noticias.push({
        id: makeId(link),
        titulo: `📺 ${titulo}`,
        resumen: resumen || titulo,
        url: link,
        fuente_id: `youtube_${channel.name.toLowerCase().replace(/\s+/g, '_')}`,
        fuente_nombre: channel.name,
        tipo: 'youtube',
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
    console.log(`  ✅ ${channel.name}: ${noticias.length} videos`);

  } catch (err) {
    console.error(`  ❌ ${channel.name}: ${err.message}`);
  }

  return result;
}

async function fetchAllYoutube() {
  console.log('\n📺 YouTube RSS');
  console.log('─'.repeat(40));

  const results = await Promise.allSettled(YOUTUBE_CHANNELS.map(processChannel));
  const processed = results.map(r => r.value || {});

  const ok = processed.filter(r => r.ok).length;
  const total = processed.reduce((s, r) => s + (r.count || 0), 0);
  console.log(`📺 YouTube: ${ok}/${YOUTUBE_CHANNELS.length} canales · ${total} videos`);

  return { ok, total };
}

module.exports = { fetchAllYoutube };
