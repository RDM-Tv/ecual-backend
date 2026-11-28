// ─── Respaldo para sitios SIN RSS utilizable ─────────────────────────────────
// Lee la portada o el listado de "últimas noticias" del sitio, toma los titulares con su enlace
// y, solo para las notas que aún no están guardadas, lee del propio artículo el titular, la imagen
// y la descripción que el medio publica para las redes (etiquetas Open Graph). Siempre se enlaza a la nota original.

const axios = require('axios');
const { BROWSER_UA } = require('./http');

async function getHtml(url) {
  const r = await axios.get(url, {
    timeout: 15000, maxRedirects: 5, responseType: 'text', transformResponse: [d => d],
    headers: { 'User-Agent': BROWSER_UA, 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'es-EC,es;q=0.9' },
  });
  return String(r.data || '');
}

const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)));
const strip = s => decode(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

// Titulares con enlace: <h2><a href>…</a></h2>  o  <a href><h2>…</h2></a>
function listar(html, base, host, patron) {
  const out = [], vistos = new Set();
  const agregar = (href, titulo) => {
    let u;
    try { u = new URL(decode(href), base); } catch (e) { return; }
    u.hash = '';
    if (!u.hostname.replace(/^www\./, '').endsWith(host)) return;
    if (patron && !patron.test(u.pathname)) return;
    const t = strip(titulo);
    if (t.length < 25 || vistos.has(u.href)) return;
    vistos.add(u.href);
    out.push({ title: t, link: u.href });
  };
  let m;
  const r1 = /<h[1-4][^>]*>\s*<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = r1.exec(html))) agregar(m[1], m[2]);
  const r2 = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>\s*<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  while ((m = r2.exec(html))) agregar(m[1], m[2]);
  return out;
}

function meta(html, clave) {
  const k = clave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i').exec(html);
  if (a) return decode(a[1]).trim();
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i').exec(html);
  return b ? decode(b[1]).trim() : '';
}

async function detalle(link, base) {
  const html = await getHtml(link);
  let img = meta(html, 'og:image') || meta(html, 'twitter:image');
  try { if (img) img = new URL(img, base).href; } catch (e) { img = ''; }
  return {
    title: (meta(html, 'og:title') || '').replace(/\s+[|–—]\s+[^|–—]{2,40}$/, '').trim(),
    contentSnippet: meta(html, 'og:description') || meta(html, 'description') || '',
    pubDate: meta(html, 'article:published_time') || meta(html, 'og:updated_time') || '',
    htmlImage: img || null,
  };
}

// Devuelve { items: notas nuevas con detalle, existentes: cuántas ya estaban guardadas }
async function traerPorHtml(feed, supabase, makeId, maxNuevas = 12) {
  const cfg = feed.html;
  const host = cfg.host || feed.bing;
  const patron = cfg.patron ? new RegExp(cfg.patron) : null;
  const html = await getHtml(cfg.url);
  if (/^\s*<!doctype html/i.test(html) && /(just a moment|enable javascript|cf-chl|captcha)/i.test(html.slice(0, 4000)))
    throw new Error('el sitio pide verificación anti-bot');
  const lista = listar(html, cfg.url, host, patron).slice(0, 25);
  if (!lista.length) throw new Error('no se encontraron titulares en la página');

  const ids = lista.map(x => makeId(feed.id, x.link));
  const { data } = await supabase.from('noticias').select('id').in('id', ids);
  const ya = new Set((data || []).map(x => x.id));
  const nuevas = lista.filter((x, i) => !ya.has(ids[i])).slice(0, maxNuevas);

  const items = [];
  for (const n of nuevas) {
    let extra = {};
    try { extra = await detalle(n.link, cfg.url); } catch (e) { /* se guarda solo con el titular */ }
    items.push({ title: (extra.title && extra.title.length > 15 ? extra.title : n.title), link: n.link, contentSnippet: extra.contentSnippet || '', pubDate: extra.pubDate || '', htmlImage: extra.htmlImage || null });
  }
  return { items, existentes: ids.filter(i => ya.has(i)).length, total: lista.length };
}

module.exports = { traerPorHtml, listar, meta, getHtml };
