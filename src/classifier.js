// ─── CLASIFICADOR AUTOMÁTICO DE NOTICIAS ─────────────────────────────────────
// Detecta ciudad y categoría leyendo el texto de cada noticia

const { CITY_KEYWORDS, CAT_KEYWORDS } = require('./feeds.config');

/**
 * Detecta la ciudad más probable a partir del texto de la noticia.
 * Retorna el key de ciudad o 'nacional'.
 */
function detectCity(text, ciudadBase = null) {
  const t = (text || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quitar tildes para matching

  let bestCity = null;
  let bestScore = 0;

  for (const [city, keywords] of Object.entries(CITY_KEYWORDS)) {
    if (city === 'nacional' || keywords.length === 0) continue;

    let score = 0;
    for (const kw of keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      // Más puntos si aparece en el título (primeros 200 chars) vs cuerpo
      const inTitle = t.slice(0, 200).includes(kwNorm);
      const inBody  = t.includes(kwNorm);
      if (inTitle) score += 3;
      else if (inBody) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCity = city;
    }
  }

  // Si el medio tiene ciudad base y no encontramos nada concreto, usar la base
  if (!bestCity && ciudadBase) return ciudadBase;

  return bestCity || 'nacional';
}

/**
 * Detecta la categoría más probable a partir del texto.
 * Retorna el key de categoría o 'general'.
 */
function detectCategory(text) {
  const t = (text || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let bestCat = null;
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CAT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const inTitle = t.slice(0, 200).includes(kwNorm);
      const inBody  = t.includes(kwNorm);
      if (inTitle) score += 3;
      else if (inBody) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }

  return bestCat || 'general';
}

/**
 * Labels legibles para el frontend
 */
const CITY_LABELS = {
  quito: 'Quito',
  guayaquil: 'Guayaquil',
  manta: 'Manta',
  cuenca: 'Cuenca',
  ambato: 'Ambato',
  loja: 'Loja',
  esmeraldas: 'Esmeraldas',
  'santo domingo': 'Sto. Domingo',
  machala: 'Machala',
  ibarra: 'Ibarra',
  riobamba: 'Riobamba',
  nacional: 'Nacional',
};

function cityLabel(cityKey) {
  return CITY_LABELS[cityKey] || 'Nacional';
}

module.exports = { detectCity, detectCategory, cityLabel };
