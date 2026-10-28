// ─── HTTP + XML ROBUSTO ──────────────────────────────────────────────────────
// Muchos sitios bloquean user-agents de bots (devuelven 404 o una página HTML
// en vez del RSS). Aquí pedimos el feed como un navegador normal, validamos que
// sea XML de verdad y reparamos los errores de XML más comunes.

const axios = require('axios');
const Parser = require('rss-parser');

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:group', 'mediaGroup'],
      ['enclosure', 'enclosure'],
    ],
  },
});

async function getText(url, extraHeaders = {}) {
  const res = await axios.get(url, {
    timeout: 15000,
    maxRedirects: 5,
    responseType: 'text',
    transformResponse: [d => d],
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept': 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5',
      'Accept-Language': 'es-EC,es;q=0.9,en;q=0.7',
      ...extraHeaders,
    },
  });
  return String(res.data || '').replace(/^\uFEFF/, '').trim();
}

function limpiarXml(xml) {
  return xml
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

async function fetchFeed(url, extraHeaders = {}) {
  const xml = await getText(url, extraHeaders);
  if (!xml) throw new Error('respuesta vacía');
  if (/^<!doctype html|^<html/i.test(xml) || !xml.startsWith('<')) {
    throw new Error('el sitio devolvió HTML (bloqueo anti-bot), no un RSS');
  }
  try {
    return await parser.parseString(xml);
  } catch (e) {
    return await parser.parseString(limpiarXml(xml)); // segundo intento con XML reparado
  }
}

module.exports = { fetchFeed, BROWSER_UA };
