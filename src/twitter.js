// ─── MÓDULO TWITTER/X VÍA NITTER RSS ─────────────────────────────────────────
// Lee cuentas de X gratis usando instancias públicas de Nitter

const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const { detectCity, detectCategory, cityLabel } = require('./classifier');

const parser = new Parser({
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; EcuaNews-Bot/1.0)',
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ─── INSTANCIAS NITTER (se prueban en orden hasta encontrar una que funcione) ─
const NITTER_INSTANCES = [
  'nitter.privacydev.net',
  'nitter.poast.org',
  'nitter.catsarch.com',
  'nitter.net',
  'xcancel.com',
  'nitter.rawbit.ninja',
  'nitter.tiekoetter.com',
];

// ─── CUENTAS DE X A MONITOREAR ────────────────────────────────────────────────
const TWITTER_ACCOUNTS = [
  // Medios nacionales
  { user: 'eluniversocom',    name: 'El Universo',     ciudad_base: null },
  { user: 'elcomerciocom',    name: 'El Comercio',     ciudad_base: 'quito' },
  { user: 'Primicias_ec',     name: 'Primicias',       ciudad_base: null },
  { user: 'ecuavisa',         name: 'Ecuavisa',        ciudad_base: 'guayaquil' },
  { user: 'TCTelevision',     name: 'TC Televisión',   ciudad_base: 'guayaquil' },
  { user: 'Teleamazonas',     name: 'Teleamazonas',    ciudad_base: 'quito' },
  { user: 'LaHoraEcuador',    name: 'La Hora',         ciudad_base: null },
  // Alertas y noticias rápidas
  { user: 'AlertaEcuador',    name: 'Alerta Ecuador',  ciudad_base: null },
  { user: 'MinutoMedio',      name: 'Minuto Medio',    ciudad_base: null },
  { user: 'La_Posta_Ec',      name: 'La Posta',        ciudad_base: null },
  { user: 'LaPosta_Ecu',      name: 'La Posta Ecu',    ciudad_base: null },
  { user: 'ladataec',         name: 'La Data Ec',      ciudad_base: null },
  { user: 'lahistoriaec',     name: 'La Historia Ec',  ciudad_base: null },
  // Guayaquil
  { user: 'CupoTotal',        name: 'Cupo Total',      ciudad_base: 'guayaquil' },
  { user: 'ExpresoBuenasManos', name: 'Expreso',       ciudad_base: 'guayaquil' },
  // Quito
  { user: 'Metro_Ecuador',    name: 'Metro Ecuador',   ciudad_base: 'quito' },
  // Manabí / Manta
  { user: 'ElDiarioEc',       name: 'El Diario',       ciudad_base: 'portoviejo' },
  { user: 'manta_alcaldia',   name: 'Alcaldía Manta',  ciudad_base: 'manta' },
  { user: 'oromartv',         name: 'Oromar TV',       ciudad_base: 'manta' },
  { user: 'GoberManabi',      name: 'Gob. Manabí',     ciudad_base: 'portoviejo' },
  { user: 'HRZManta',         name: 'Hospital Manta',  ciudad_base: 'manta' },
  { user: 'InformatManabi',   name: 'Informat Manabí', ciudad_base: 'portoviejo' },
  { user: 'UPortoviejo',      name: 'U. Portoviejo',   ciudad_base: 'portoviejo' },
  // Instituciones nacionales
  { user: 'PoliciaEcuador',   name: 'Policía Ecuador', ciudad_base: null },
  { user: 'AnderssonBoscan',  name: 'Andersson Boscán',ciudad_base: null },
  { user: 'Presidencia_Ec',   name: 'Presidencia EC',  ciudad_base: null },
  { user: 'BiessEcuador',     name: 'BIESS',           ciudad_base: null },
  { user: 'RegistroCivilec',  name: 'Registro Civil',  ciudad_base: null },
  { user: 'cnegobec',         name: 'CNE Ecuador',     ciudad_base: null },
  { user: 'BancoCentral_Ec',  name: 'Banco Central',   ciudad_base: null },
  { user: 'superbancosEC',    name: 'Superbancos',     ciudad_base: null },
  { user: 'IESSec',           name: 'IESS',            ciudad_base: null },
];

// ─── BUSCAR INSTANCIA NITTER FUNCIONAL (con caché) ──────────────────────────
let lastWorkingInstance = null;

async function findWorkingInstance(username) {
  // Probar primero la última instancia que funcionó
  const ordered = lastWorkingInstance
    ? [lastWorkingInstance, ...NITTER_INSTANCES.filter(i => i !== lastWorkingInstance)]
    : NITTER_INSTANCES;

  for (const instance of ordered) {
    try {
      const url = `https://${instance}/${username}/rss`;
      const feed = await parser.parseURL(url);
      if (feed && feed.items && feed.items.length > 0) {
        lastWorkingInstance = instance;
        return { instance, feed };
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

// ─── LIMPIAR TEXTO DE TWEET ───────────────────────────────────────────────────
function cleanTweet(text = '') {
  return text
    .replace(/<[^>]+>/g, ' ')   // quitar HTML
    .replace(/https?:\/\/\S+/g, '') // quitar URLs
    .replace(/RT @\w+:/g, '')   // quitar RT
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

// ─── HASH SIMPLE PARA ID ÚNICO ────────────────────────────────────────────────
function makeId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'tw_' + Math.abs(hash).toString(36);
}

// ─── PROCESAR UNA CUENTA ─────────────────────────────────────────────────────
async function processAccount(account) {
  const result = { user: account.user, ok: false, count: 0 };

  try {
    console.log(`  Fetching @${account.user}...`);
    const found = await findWorkingInstance(account.user);

    if (!found) {
      console.log(`  ⚠️  @${account.user}: ninguna instancia Nitter respondió`);
      return result;
    }

    const tweets = (found.feed.items || []).slice(0, 10);
    const noticias = [];

    for (const item of tweets) {
      const titulo = cleanTweet(item.title || item.contentSnippet || '');
      if (titulo.length < 20) continue; // ignorar tweets muy cortos

      const link = item.link?.replace(found.instance, 'x.com') || `https://x.com/${account.user}`;
      const pubDate = item.pubDate || item.isoDate;
      const ts = pubDate ? new Date(pubDate).getTime() : Date.now();

      // Solo tweets de las últimas 24 horas
      if (Date.now() - ts > 24 * 60 * 60 * 1000) continue;

      const ciudad = detectCity(titulo, '', account.ciudad_base);
      const categoria = detectCategory(titulo, '');

      noticias.push({
        id: makeId(link + ts),
        titulo,
        resumen: titulo, // los tweets son cortos, título = resumen
        url: link,
        fuente_id: `twitter_${account.user.toLowerCase()}`,
        fuente_nombre: account.name,
        tipo: 'twitter',
        ciudad,
        ciudad_label: cityLabel(ciudad),
        categoria,
        img_url: null,
        publicado_en: new Date(ts).toISOString(),
        creado_en: new Date().toISOString(),
      });
    }

    if (noticias.length > 0) {
      const { error } = await supabase
        .from('noticias')
        .upsert(noticias, { onConflict: 'id', ignoreDuplicates: true });

      if (error) throw new Error(`Supabase: ${error.message}`);
    }

    result.ok = true;
    result.count = noticias.length;
    console.log(`  ✅ @${account.user}: ${noticias.length} tweets guardados`);

  } catch (err) {
    console.error(`  ❌ @${account.user}: ${err.message}`);
  }

  return result;
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────
async function fetchAllTwitter() {
  console.log('\n🐦 Twitter/X via Nitter');
  console.log('─'.repeat(40));

  const results = [];

  // Procesar de 5 en 5 para no sobrecargar Nitter pero ser más rápido
  const chunkSize = 5;
  for (let i = 0; i < TWITTER_ACCOUNTS.length; i += chunkSize) {
    const chunk = TWITTER_ACCOUNTS.slice(i, i + chunkSize);
    const chunkResults = await Promise.allSettled(chunk.map(processAccount));
    results.push(...chunkResults.map(r => r.value || {}));
    // Pausa breve entre chunks
    await new Promise(r => setTimeout(r, 1500));
  }

  const ok = results.filter(r => r.ok).length;
  const total = results.reduce((s, r) => s + (r.count || 0), 0);
  console.log(`🐦 Twitter: ${ok}/${TWITTER_ACCOUNTS.length} cuentas · ${total} tweets`);

  return { ok, total };
}

module.exports = { fetchAllTwitter };
