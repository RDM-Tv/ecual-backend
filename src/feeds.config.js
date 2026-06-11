// ─── FUENTES DE NOTICIAS ECUADOR ─────────────────────────────────────────────
// Agregar o quitar fuentes aquí. El sistema las procesará automáticamente.

const FEEDS = [
  // ── MEDIOS NACIONALES GRANDES ────────────────────────────────────────────
  {
    id: 'eluniverso',
    name: 'El Universo',
    url: 'https://www.eluniverso.com/arc/outboundfeeds/rss/?outputType=xml',
    ciudad_base: null, // nacional
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'elcomercio',
    name: 'El Comercio',
    url: 'https://www.elcomercio.com/feed',
    ciudad_base: 'quito',
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'primicias',
    name: 'Primicias',
    url: 'https://www.primicias.ec/feed/',
    ciudad_base: null,
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'lahora',
    name: 'La Hora',
    url: 'https://www.lahora.com.ec/feed/',
    ciudad_base: null,
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'expreso',
    name: 'Expreso',
    url: 'https://www.expreso.ec/rss.xml',
    ciudad_base: 'guayaquil',
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'extra',
    name: 'Diario Extra',
    url: 'https://www.extra.ec/feed/',
    ciudad_base: 'guayaquil',
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'metroec',
    name: 'Metro Ecuador',
    url: 'https://www.metroecuador.com.ec/feed/',
    ciudad_base: null,
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'confirmado',
    name: 'Confirmado',
    url: 'https://confirmado.com.ec/feed/',
    ciudad_base: null,
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'ecuavisa',
    name: 'Ecuavisa',
    url: 'https://www.ecuavisa.com/rss.xml',
    ciudad_base: 'guayaquil',
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'tc',
    name: 'TC Televisión',
    url: 'https://www.tctelevision.com/feed',
    ciudad_base: 'guayaquil',
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'teleamazonas',
    name: 'Teleamazonas',
    url: 'https://www.teleamazonas.com/feed/',
    ciudad_base: 'quito',
    tipo: 'rss',
    activo: true,
  },
  // ── MEDIOS REGIONALES ────────────────────────────────────────────────────
  {
    id: 'larepublica',
    name: 'La República',
    url: 'https://www.larepublica.ec/feed/',
    ciudad_base: null,
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'elproducciones',
    name: 'El Producción',
    url: 'https://elproducciones.com/feed/',
    ciudad_base: 'manta',
    tipo: 'rss',
    activo: true,
  },
  {
    id: 'elnorte',
    name: 'El Norte',
    url: 'https://www.elnorte.ec/feed/',
    ciudad_base: 'ibarra',
    tipo: 'rss',
    activo: true,
  },
  // ── PARA AGREGAR EN FASE 2 (requieren API de pago o scraping) ────────────
  // { id: 'alertaec',   name: '@AlertaEcuador', tipo: 'twitter', activo: false },
  // { id: 'minutomedio',name: '@MinutoMedio',    tipo: 'twitter', activo: false },
  // { id: 'cupototal',  name: '@CupoTotal',      tipo: 'twitter', activo: false },
];

// ─── KEYWORDS DE CIUDADES ─────────────────────────────────────────────────
const CITY_KEYWORDS = {
  quito: [
    'quito', 'pichincha', 'el panecillo', 'guamaní', 'calderón', 'tumbaco',
    'cumbayá', 'sangolquí', 'norte de quito', 'sur de quito', 'quitumbe',
    'la carolina', 'solanda', 'cotocollao', 'conocoto', 'carapungo',
  ],
  guayaquil: [
    'guayaquil', 'guayas', 'samborondón', 'daule', 'milagro', 'durán',
    'urdesa', 'alborada', 'kennedy', 'mapasingue', 'sauces', 'bastión popular',
    'flor de bastion', 'monte sinaí', 'isla trinitaria', 'fertisa', 'morro',
  ],
  manta: [
    'manta', 'manabí', 'chone', 'bahía de caráquez', 'jipijapa', 'montecristi',
    'tarqui', 'barbasquillo', 'los esteros', 'portoviejo', 'el carmen',
    'pedernales', 'rocafuerte',
  ],
  cuenca: [
    'cuenca', 'azuay', 'el cajas', 'yanuncay', 'totoracocha', 'gualaceo',
    'chordeleg', 'paute', 'girón',
  ],
  ambato: [
    'ambato', 'tungurahua', 'baños', 'patate', 'mocha', 'cevallos', 'tisaleo',
    'quero', 'pillaro',
  ],
  loja: [
    'loja', 'vilcabamba', 'catamayo', 'zamora', 'macará', 'cariamanga',
    'saraguro',
  ],
  esmeraldas: [
    'esmeraldas', 'atacames', 'sua', 'muisne', 'quinindé', 'eloy alfaro',
    'san lorenzo', 'la tola',
  ],
  'santo domingo': [
    'santo domingo', 'tsáchilas', 'tsachilas', 'la concordia', 'el carmen',
  ],
  machala: [
    'machala', 'el oro', 'huaquillas', 'pasaje', 'zaruma', 'piñas', 'arenillas',
    'sta. rosa', 'santa rosa de el oro',
  ],
  ibarra: [
    'ibarra', 'imbabura', 'otavalo', 'cotacachi', 'atuntaqui', 'pimampiro',
  ],
  riobamba: [
    'riobamba', 'chimborazo', 'alausí', 'colta', 'chambo', 'guano',
  ],
  nacional: [],
};

// ─── KEYWORDS DE CATEGORÍAS ──────────────────────────────────────────────
const CAT_KEYWORDS = {
  seguridad: [
    'policía', 'detenido', 'detenidos', 'robo', 'crimen', 'sicario', 'asesinato',
    'asesinado', 'explosivo', 'secuestro', 'banda', 'narco', 'narcotráfico',
    'herido', 'muerto', 'fallecido', 'disparo', 'balacera', 'extorsión',
    'violencia', 'preso', 'capturado', 'operativo', 'delito', 'homicidio',
    'femicidio', 'alerta', 'emergencia', 'conflicto', 'terrorismo', 'subversivo',
    'fuerzas armadas', 'ffaa', 'policía nacional', 'detonación', 'bomba',
  ],
  politica: [
    'gobierno', 'presidente', 'asamblea', 'ministerio', 'decreto', 'ley',
    'elecciones', 'partido', 'alcalde', 'prefecto', 'diputado', 'municipio',
    'noboa', 'candidato', 'votación', 'política', 'congreso', 'estado',
    'constitución', 'reforma', 'gabinete', 'ministro', 'correa', 'revolución',
    'consulta popular', 'referéndum', 'cne', 'tribunal', 'corte constitucional',
  ],
  economia: [
    'economía', 'precio', 'inflación', 'dólar', 'petróleo', 'exportación',
    'importación', 'empresa', 'banco', 'inversión', 'presupuesto', 'deuda',
    'impuesto', 'sueldo', 'salario', 'mercado', 'comercio', 'petroecuador',
    'industria', 'producción', 'finanzas', 'crecimiento', 'pib', 'empleo',
    'desempleo', 'bce', 'banco central', 'préstamo', 'fondo monetario', 'fmi',
  ],
  transito: [
    'tránsito', 'tráfico', 'accidente', 'vial', 'carretera', 'vía',
    'autopista', 'bloqueo', 'cierre vial', 'desvío', 'congestionamiento',
    'atm', 'bus', 'choque', 'volcamiento', 'colapso vial', 'ruta',
    'siniestro vial', 'ciclista', 'peatón atropellado', 'motociclista',
    'transporte público', 'corte de vía', 'deslizamiento',
  ],
  salud: [
    'salud', 'hospital', 'médico', 'vacuna', 'enfermedad', 'dengue', 'covid',
    'virus', 'iess', 'ministerio de salud', 'epidemia', 'pandemia', 'paciente',
    'medicamento', 'clínica', 'brote', 'contagio', 'msp', 'gripe', 'zika',
    'leptospirosis', 'cólera', 'tuberculosis', 'cáncer', 'emergencia sanitaria',
  ],
  deportes: [
    'fútbol', 'liga', 'barcelona sc', 'emelec', 'deportivo quito', 'aucas',
    'independiente', 'partido', 'gol', 'campeonato', 'deportes', 'selección',
    'mundial', 'olympics', 'atletismo', 'natación', 'ciclismo', 'la tri',
    'serie a del ecuador', 'ldu', 'liga de quito', 'delfín', 'orense',
    'olmedo', 'técnico universitario', 'macará', 'deportivo cuenca',
  ],
  tecnologia: [
    'tecnología', 'internet', 'aplicación', 'app', 'startup', 'digital',
    'inteligencia artificial', 'ia', 'ciberseguridad', 'hackeo', 'innovación',
    'software', 'hardware', 'red 5g', 'telecomunicaciones', 'datos',
  ],
};

module.exports = { FEEDS, CITY_KEYWORDS, CAT_KEYWORDS };
