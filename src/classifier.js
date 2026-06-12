// ─── CLASIFICADOR AUTOMÁTICO DE NOTICIAS ────────────────────────────────────
const { CITY_KEYWORDS, CAT_KEYWORDS } = require('./feeds.config');

function normalize(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Detecta la ciudad leyendo título y resumen.
 * El título pesa 5x más que el cuerpo.
 */
function detectCity(titulo = '', resumen = '', ciudadBase = null) {
  const tituloNorm = normalize(titulo);
  const resumenNorm = normalize(resumen);

  let bestCity = null;
  let bestScore = 0;

  for (const [city, keywords] of Object.entries(CITY_KEYWORDS)) {
    if (city === 'nacional' || !keywords.length) continue;

    let score = 0;
    for (const kw of keywords) {
      const kwNorm = normalize(kw);
      if (tituloNorm.includes(kwNorm)) score += 5;  // título: peso 5
      else if (resumenNorm.includes(kwNorm)) score += 1; // resumen: peso 1
    }

    if (score > bestScore) {
      bestScore = score;
      bestCity = city;
    }
  }

  // Si no encontró nada concreto, usar ciudad base del medio
  if (!bestCity && ciudadBase) return ciudadBase;
  return bestCity || 'nacional';
}

/**
 * Detecta la categoría leyendo título y resumen.
 */
function detectCategory(titulo = '', resumen = '') {
  const tituloNorm = normalize(titulo);
  const resumenNorm = normalize(resumen);

  let bestCat = null;
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CAT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      const kwNorm = normalize(kw);
      if (tituloNorm.includes(kwNorm)) score += 5;
      else if (resumenNorm.includes(kwNorm)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }

  return bestCat || 'general';
}

const CITY_LABELS = {
  quito: 'Quito',
  guayaquil: 'Guayaquil',
  manta: 'Manta',
  portoviejo: 'Portoviejo / Manabí',
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
