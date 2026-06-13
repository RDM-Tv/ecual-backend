// â”€â”€â”€ MÃ“DULO TWITTER/X VÃA NITTER RSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Lee cuentas de X gratis usando instancias pÃºblicas de Nitter

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

// â”€â”€â”€ INSTANCIAS NITTER (se prueban en orden hasta encontrar una que funcione) â”€
const NITTER_INSTANCES = [
  'nitter.privacydev.net',
  'nitter.poast.org',
  'nitter.catsarch.com',
  'nitter.net',
  'xcancel.com',
  'nitter.rawbit.ninja',
  'nitter.tiekoetter.com',
];

// â”€â”€â”€ CUENTAS DE X A MONITOREAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TWITTER_ACCOUNTS = [
  // Medios nacionales
  { user: 'eluniversocom',    name: 'El Universo',     ciudad_base: null },
  { user: 'elcomerciocom',    name: 'El Comercio',     ciudad_base: 'quito' },
  { user: 'Primicias_ec',     name: 'Primicias',       ciudad_base: null },
  { user: 'ecuavisa',         name: 'Ecuavisa',        ciudad_base: 'guayaquil' },
  { user: 'TCTelevision',     name: 'TC TelevisiÃ³n',   ciudad_base: 'guayaquil' },
  { user: 'Teleamazonas',     name: 'Teleamazonas',    ciudad_base: 'quito' },
  { user: 'LaHoraEcuador',    name: 'La Hora',         ciudad_base: null },
  // Alertas y noticias rÃ¡pidas
  { user: 'AlertaEcuador',    name: 'Alerta Ecuador',  ciudad_base: null },
  { user: 'MinutoMedio',      name: 'Minuto Medio',    ciudad_base: null },
  { user: 'La_Posta_Ec',      name: 'La Posta',        ciudad_base: null },
  // Guayaquil
  { user: 'CupoTotal',        name: 'Cupo Total',      ciudad_base: 'guayaquil' },
  { user: 'ExpresoBuenasManos', name: 'Expreso',       ciudad_base: 'guayaquil' },
  // Quito
  { user: 'Metro_Ecuador',    name: 'Metro Ecuador',   ciudad_base: 'quito' },
  // ManabÃ­ / Manta
  { user: 'ElDiarioEc',       name: 'El Diario',       ciudad_base: 'portoviejo' },
];

// â”€â”€â”€ BUSCAR INSTANCIA NITTER FUNCIONAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function findWorkingInstance(username) {
  for (const instance of NITTER_INSTANCES) {
    try {
      const url = `https://${instance}/${username}/rss`;
      const feed = await parser.parseURL(url);
      if (feed && feed.items && feed.items.length > 0) {
        console.log(`  âœ… Nitter OK: ${instance} para @${username}`);
        return { instance, feed };
      }
    } catch (e) {
      // Intentar con la siguiente
      continue;
    }
  }
  return null;
}

// â”€â”€â”€ LIMPIAR TEXTO DE TWEET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function cleanTweet(text = '') {
  return text
    .replace(/<[^>]+>/g, ' ')   // quitar HTML
    .replace(/https?:\/\/\S+/g, '') // quitar URLs
    .replace(/RT @\w+:/g, '')   // quitar RT
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

// â”€â”€â”€ HASH SIMPLE PARA ID ÃšNICO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function makeId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'tw_' + Math.abs(hash).toString(36);
}

// â”€â”€â”€ PROCESAR UNA CUENTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function processAccount(account) {
  const result = { user: account.user, ok: false, count: 0 };

  try {
    console.log(`  Fetching @${account.user}...`);
    const found = await findWorkingInstance(account.user);

    if (!found) {
      console.log(`  âš ï¸  @${account.user}: ninguna instancia Nitter respondiÃ³`);
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

      // Solo tweets de las Ãºltimas 24 horas
      if (Date.now() - ts > 24 * 60 * 60 * 1000) continue;

      const ciudad = detectCity(titulo, '', account.ciudad_base);
      const categoria = detectCategory(titulo, '');

      noticias.push({
        id: makeId(link + ts),
        titulo,
        resumen: titulo, // los tweets son cortos, tÃ­tulo = resumen
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
    console.log(`  âœ… @${account.user}: ${noticias.length} tweets guardados`);

  } catch (err) {
    console.error(`  âŒ @${account.user}: ${err.message}`);
  }

  return result;
}

// â”€â”€â”€ FUNCIÃ“N PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchAllTwitter() {
  console.log('\nðŸ¦ Twitter/X via Nitter');
  console.log('â”€'.repeat(40));

  const results = [];

  // Procesar de 3 en 3 para no sobrecargar Nitter
  const chunkSize = 3;
  for (let i = 0; i < TWITTER_ACCOUNTS.length; i += chunkSize) {
    const chunk = TWITTER_ACCOUNTS.slice(i, i + chunkSize);
    const chunkResults = await Promise.allSettled(chunk.map(processAccount));
    results.push(...chunkResults.map(r => r.value || {}));
    // Pausa entre chunks para no bloquear las instancias
    await new Promise(r => setTimeout(r, 2000));
  }

  const ok = results.filter(r => r.ok).length;
  const total = results.reduce((s, r) => s + (r.count || 0), 0);
  console.log(`ðŸ¦ Twitter: ${ok}/${TWITTER_ACCOUNTS.length} cuentas Â· ${total} tweets`);

  return { ok, total };
}

module.exports = { fetchAllTwitter };
