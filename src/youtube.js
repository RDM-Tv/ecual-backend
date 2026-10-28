// ─── MÓDULO YOUTUBE (API oficial) ────────────────────────────────────────────
// YouTube bloquea el feed RSS desde servidores (404/500), así que usamos la API
// oficial de YouTube Data v3. Es gratis: este módulo gasta ~300 de las 10.000
// unidades diarias. Requiere la variable YOUTUBE_API_KEY en Render.
// Cada canal se identifica por su @usuario (handle); el ID se resuelve solo.

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { detectCity, detectCategory, cityLabel } = require('./classifier');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const YOUTUBE_CHANNELS = [
  { handle: 'Ecuavisa',                  name: 'Ecuavisa',      ciudad_base: 'guayaquil', categoria_fija: null },
  { handle: 'TeleamazonasEcuadorOficial', name: 'Teleamazonas', ciudad_base: 'quito',     categoria_fija: null },
  { handle: 'TcTelevision10',            name: 'TC Televisión', ciudad_base: 'guayaquil', categoria_fija: null },
];

const API = 'https://www.googleapis.com/youtube/v3';
const uploadsCache = new Map(); // handle -> playlist de subidas (se resuelve una vez)

function makeId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'yt_' + Math.abs(hash).toString(36);
}

function apiError(e) {
  return e.response?.data?.error?.message || e.message;
}

async function getUploadsPlaylist(channel) {
  if (uploadsCache.has(channel.handle)) return uploadsCache.get(channel.handle);
  const { data } = await axios.get(`${API}/channels`, {
    timeout: 12000,
    params: { part: 'contentDetails', forHandle: '@' + channel.handle, key: process.env.YOUTUBE_API_KEY },
  });
  const uploads = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error(`no se encontró el canal @${channel.handle}`);
  uploadsCache.set(channel.handle, uploads);
  return uploads;
}

async function processChannel(channel) {
  const result = { channel: channel.name, ok: false, count: 0 };
  try {
    console.log(`  Fetching YouTube: ${channel.name}...`);
    const playlistId = await getUploadsPlaylist(channel);
    const { data } = await axios.get(`${API}/playlistItems`, {
      timeout: 12000,
      params: { part: 'snippet', maxResults: 8, playlistId, key: process.env.YOUTUBE_API_KEY },
    });

    const noticias = [];
    for (const it of data.items || []) {
      const sn = it.snippet;
      const titulo = sn.title?.trim();
      if (!titulo || titulo.length < 5 || sn.title === 'Private video' || sn.title === 'Deleted video') continue;

      const ts = sn.publishedAt ? new Date(sn.publishedAt).getTime() : Date.now();
      if (Date.now() - ts > 3 * 24 * 60 * 60 * 1000) continue; // solo últimos 3 días

      const videoId = sn.resourceId.videoId;
      const link = `https://www.youtube.com/watch?v=${videoId}`;
      const resumen = (sn.description || '').replace(/\s+/g, ' ').trim().slice(0, 300);
      const ciudad = detectCity(titulo, resumen, channel.ciudad_base);
      const categoria = channel.categoria_fija || detectCategory(titulo, resumen);

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
        img_url: sn.thumbnails?.high?.url || sn.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publicado_en: new Date(ts).toISOString(),
        creado_en: new Date().toISOString(),
      });
    }

    if (noticias.length > 0) {
      const { error } = await supabase.from('noticias').upsert(noticias, { onConflict: 'id', ignoreDuplicates: false });
      if (error) throw new Error(`Supabase: ${error.message}`);
    }
    result.ok = true;
    result.count = noticias.length;
    console.log(`  ✅ ${channel.name}: ${noticias.length} videos`);
  } catch (err) {
    console.error(`  ❌ ${channel.name}: ${apiError(err)}`);
  }
  return result;
}

async function fetchAllYoutube() {
  console.log('\n📺 YouTube');
  console.log('─'.repeat(40));
  if (!process.env.YOUTUBE_API_KEY) {
    console.log('  ⚠️ YOUTUBE_API_KEY no está configurada en Render: YouTube omitido');
    return { ok: 0, total: 0 };
  }
  const results = await Promise.allSettled(YOUTUBE_CHANNELS.map(processChannel));
  const processed = results.map(r => r.value || {});
  const ok = processed.filter(r => r.ok).length;
  const total = processed.reduce((s, r) => s + (r.count || 0), 0);
  console.log(`📺 YouTube: ${ok}/${YOUTUBE_CHANNELS.length} canales · ${total} videos`);
  return { ok, total };
}

module.exports = { fetchAllYoutube, YOUTUBE_CHANNELS };
