// Cada fuente intenta, en orden:
//   1) su RSS propio (url)   2) RSS alternos (alt)   3) Bing News filtrado por su sitio (bing: 'dominio.com')
// Bing devuelve la dirección REAL de la nota (Google News no: sus enlaces se rompen).
// Si una fuente falla seguido, el servidor la reintenta con menos frecuencia (ver fetcher.js).
// El panel /admin.html muestra cuáles funcionan y por qué fallan.

const FEEDS = [
  // ── NACIONALES ──────────────────────────────────────────────────────────────
  { id:'eluniverso',   name:'El Universo',    url:'https://www.eluniverso.com/arc/outboundfeeds/rss/?outputType=xml', alt:[], bing:'eluniverso.com',   ciudad_base:null,        tipo:'rss', activo:true },
  { id:'elcomercio',   name:'El Comercio',    url:'https://www.elcomercio.com/feed/',      alt:[], bing:'elcomercio.com',   ciudad_base:'quito',     tipo:'rss', activo:true },
  { id:'primicias',    name:'Primicias',      url:'https://www.primicias.ec/feed/',        alt:['https://www.primicias.ec/arc/outboundfeeds/rss/?outputType=xml'], bing:'primicias.ec', ciudad_base:null, tipo:'rss', activo:true },
  { id:'lahora',       name:'La Hora',        url:'https://www.lahora.com.ec/feed/',       alt:[], bing:'lahora.com.ec',    ciudad_base:null,        tipo:'rss', activo:true },
  { id:'expreso',      name:'Expreso',        url:'https://www.expreso.ec/rss.xml',        alt:['https://www.expreso.ec/arc/outboundfeeds/rss/?outputType=xml','https://www.expreso.ec/feed/'], bing:'expreso.ec', html:{ url:'https://www.expreso.ec/ultimas-noticias-expreso/', host:'expreso.ec', patron:'-\\d{5,7}\\.html$' }, ciudad_base:'guayaquil', tipo:'rss', activo:true },
  { id:'extra',        name:'Diario Extra',   url:'https://www.extra.ec/feed/',            alt:['https://www.extra.ec/arc/outboundfeeds/rss/?outputType=xml'], bing:'extra.ec', ciudad_base:'guayaquil', tipo:'rss', activo:true },
  { id:'metroec',      name:'Metro Ecuador',  url:'https://www.metroecuador.com.ec/feed/', alt:['https://www.metroecuador.com.ec/rss.xml'], bing:'metroecuador.com.ec', ciudad_base:null, tipo:'rss', activo:true },
  { id:'ecuavisa',     name:'Ecuavisa',       url:'https://www.ecuavisa.com/rss.xml',      alt:['https://www.ecuavisa.com/arc/outboundfeeds/rss/?outputType=xml','https://www.ecuavisa.com/feed/'], bing:'ecuavisa.com', ciudad_base:'guayaquil', tipo:'rss', activo:true },
  { id:'tc',           name:'TC Televisión',  url:'https://www.tctelevision.com/feed',     alt:[], bing:'tctelevision.com', ciudad_base:'guayaquil', tipo:'rss', activo:true },
  { id:'teleamazonas', name:'Teleamazonas',   url:'https://www.teleamazonas.com/feed/',    alt:['https://www.teleamazonas.com/arc/outboundfeeds/rss/?outputType=xml','https://www.teleamazonas.com/rss.xml'], bing:'teleamazonas.com', ciudad_base:'quito', tipo:'rss', activo:true },
  { id:'eltelegrafo',  name:'El Telégrafo',   url:'https://www.eltelegrafo.com.ec/rss',    alt:['https://www.eltelegrafo.com.ec/arc/outboundfeeds/rss/?outputType=xml','https://www.eltelegrafo.com.ec/feed','https://www.eltelegrafo.com.ec/rss.xml'], bing:'eltelegrafo.com.ec', html:{ url:'https://www.eltelegrafo.com.ec/', host:'eltelegrafo.com.ec' }, ciudad_base:null, tipo:'rss', activo:true },
  { id:'vistazo',      name:'Vistazo',        url:'https://www.vistazo.com/feed',          alt:['https://www.vistazo.com/rss.xml'], bing:'vistazo.com', ciudad_base:'guayaquil', tipo:'rss', activo:true },
  { id:'larepublica',  name:'La República EC',url:'https://www.larepublica.ec/feed/',      alt:[], bing:'larepublica.ec',   ciudad_base:null,        tipo:'rss', activo:true },
  { id:'planv',        name:'Plan V',         url:'https://www.planv.com.ec/feed',         alt:[], bing:'planv.com.ec',     ciudad_base:null,        tipo:'rss', activo:true },
  { id:'gk',           name:'GK',             url:'https://gk.city/feed',                  alt:[], bing:'gk.city',          ciudad_base:null,        tipo:'rss', activo:true },
  { id:'codigovidrio', name:'Código Vidrio',  url:'https://www.codigovidrio.com/feed',     alt:['https://www.codigovidrio.com/feed/','https://www.codigovidrio.com/?feed=rss2','https://codigovidrio.com/feed/'], bing:'codigovidrio.com', html:{ url:'https://www.codigovidrio.com/', host:'codigovidrio.com' }, ciudad_base:null,        tipo:'rss', activo:false },   // desactivada: el sitio bloquea los accesos automáticos (reactivar con activo:true)
  { id:'ecuadorchequea', name:'Ecuador Chequea', url:'https://ecuadorchequea.com/feed/',   alt:[], bing:'ecuadorchequea.com', ciudad_base:null,      tipo:'rss', activo:true },
  { id:'ecuadortimes', name:'Ecuador Times',  url:'https://www.ecuadortimes.net/feed/',    alt:[], bing:'ecuadortimes.net', ciudad_base:null,        tipo:'rss', activo:true },
  { id:'lanacion',     name:'La Nación',      url:'https://lanacion.com.ec/feed/',         alt:[], bing:'lanacion.com.ec',  ciudad_base:null,        tipo:'rss', activo:false },   // desactivada: el sitio bloquea los accesos automáticos (reactivar con activo:true)
  // ── REGIONALES ──────────────────────────────────────────────────────────────
  { id:'eldiario',     name:'El Diario (Manabí)', url:'https://www.eldiario.ec/feed/',     alt:[], bing:'eldiario.ec',      ciudad_base:'portoviejo', tipo:'rss', activo:true },
  { id:'notimanta',    name:'Noti Manta',     url:'https://noti-manta.com/feed/', alt:['https://www.noti-manta.com/feed/','https://noti-manta.com/?feed=rss2','https://noti-manta.com/rss'], bing:'noti-manta.com', html:{ url:'https://noti-manta.com/', host:'noti-manta.com' }, ciudad_base:'manta', tipo:'rss', activo:true },
  { id:'olamanta',     name:'OlaManta TV',    url:'https://olamanta.tv/feed/',    alt:['https://www.olamanta.tv/feed/','https://olamanta.tv/?feed=rss2','https://olamanta.tv/rss'],       bing:'olamanta.tv',    html:{ url:'https://olamanta.tv/',    host:'olamanta.tv' },    ciudad_base:'manta', tipo:'rss', activo:true },
  { id:'elnorte',      name:'El Norte',       url:'https://elnorte.ec/feed/',              alt:['https://www.elnorte.ec/feed/'], bing:'elnorte.ec', ciudad_base:'ibarra', tipo:'rss', activo:true },
  { id:'elmercurio',   name:'El Mercurio',    url:'https://elmercurio.com.ec/feed/',       alt:[], bing:'elmercurio.com.ec', ciudad_base:'cuenca',   tipo:'rss', activo:true },
  { id:'cronica',      name:'Crónica',        url:'https://cronica.com.ec/feed/',          alt:[], bing:'cronica.com.ec',   ciudad_base:null,        tipo:'rss', activo:true },
  { id:'lagaceta',     name:'La Gaceta',      url:'https://lagaceta.com.ec/feed/',         alt:[], bing:'lagaceta.com.ec',  ciudad_base:null,        tipo:'rss', activo:true },
  { id:'ppelverdadero',name:'PP El Verdadero',url:'https://www.ppelverdadero.com.ec/feeds/posts/default', alt:[], bing:'ppelverdadero.com.ec', ciudad_base:null, tipo:'rss', activo:true },
];

// ─── KEYWORDS DE CIUDADES (más completo) ────────────────────────────────────
const CITY_KEYWORDS = {
  quito: [
    'quito', 'pichincha', 'el panecillo', 'guamaní', 'calderón', 'tumbaco',
    'cumbayá', 'sangolquí', 'quitumbe', 'la carolina', 'solanda', 'cotocollao',
    'conocoto', 'carapungo', 'norte de quito', 'sur de quito', 'centro histórico quito',
    'mitad del mundo', 'pomasqui', 'nayón', 'zámbiza', 'llano chico',
    'asamblea nacional', 'carondelet', 'municipio de quito',
  ],
  guayaquil: [
    'guayaquil', 'guayas', 'samborondón', 'daule', 'milagro', 'durán',
    'urdesa', 'alborada', 'kennedy', 'mapasingue', 'sauces', 'bastión popular',
    'monte sinaí', 'isla trinitaria', 'fertisa', 'el morro', 'playas',
    'suburbio', 'cdla kennedy', 'puerto santa ana', 'malecón guayaquil',
    'municipio de guayaquil', 'alcaldía guayaquil', 'prefectura guayas',
    'noboa guayaquil', 'puerto marítimo guayaquil',
  ],
  manta: [
    'manta', 'tarqui', 'barbasquillo', 'los esteros', 'manta centro',
    'el murciélago', 'jocay', 'circunvalación manta', 'urbirrios',
    'jaramijó', 'montecristi', 'municipio de manta', 'alcaldía manta',
    'puerto de manta', 'aeropuerto manta', 'epam', 'concejo manta',
  ],
  portoviejo: [
    'portoviejo', 'manabí', 'chone', 'bahía de caráquez', 'jipijapa',
    'el carmen manabí', 'pedernales', 'rocafuerte', 'calceta', 'tosagua',
    'sucre manabí', 'pajan', 'bolívar manabí', 'flavio alfaro',
    'municipio portoviejo', 'gobernación manabí', 'prefectura manabí',
    'avenida manabí', 'universidad técnica manabí',
  ],
  cuenca: [
    'cuenca', 'azuay', 'el cajas', 'yanuncay', 'totoracocha', 'gualaceo',
    'chordeleg', 'paute', 'girón', 'municipio de cuenca', 'alcaldía cuenca',
    'universidad de cuenca', 'feria de cuenca',
  ],
  ambato: [
    'ambato', 'tungurahua', 'baños', 'patate', 'mocha', 'cevallos',
    'tisaleo', 'quero', 'pillaro', 'municipio ambato', 'mercado ambato',
  ],
  loja: [
    'loja', 'vilcabamba', 'catamayo', 'zamora', 'macará', 'cariamanga',
    'saraguro', 'municipio loja', 'universidad nacional loja',
  ],
  esmeraldas: [
    'esmeraldas', 'atacames', 'sua', 'muisne', 'quinindé', 'eloy alfaro esmeraldas',
    'san lorenzo', 'la tola', 'borbón', 'municipio esmeraldas',
  ],
  'santo domingo': [
    'santo domingo', 'tsáchilas', 'tsachilas', 'la concordia',
    'municipio santo domingo', 'universidad uniandes',
  ],
  machala: [
    'machala', 'el oro', 'huaquillas', 'pasaje', 'zaruma', 'piñas',
    'arenillas', 'santa rosa de el oro', 'municipio machala', 'prefectura el oro',
  ],
  ibarra: [
    'ibarra', 'imbabura', 'otavalo', 'cotacachi', 'atuntaqui', 'pimampiro',
    'municipio ibarra',
  ],
  riobamba: [
    'riobamba', 'chimborazo', 'alausí', 'colta', 'chambo', 'guano chimborazo',
    'municipio riobamba',
  ],
  nacional: [],
};

// ─── KEYWORDS DE CATEGORÍAS ─────────────────────────────────────────────────
const CAT_KEYWORDS = {
  seguridad: [
    'policía', 'detenido', 'detenidos', 'robo', 'crimen', 'sicario', 'asesinato',
    'asesinado', 'explosivo', 'secuestro', 'banda', 'narco', 'narcotráfico',
    'herido', 'muerto', 'fallecido', 'disparo', 'balacera', 'extorsión',
    'violencia', 'preso', 'capturado', 'operativo', 'delito', 'homicidio',
    'femicidio', 'alerta', 'emergencia', 'terrorismo', 'ffaa', 'detonación',
    'bomba', 'sicariato', 'ajuste de cuentas', 'cuerpo hallado', 'desmembramiento',
    'acribillado', 'rafagas', 'panfleto', 'crimen organizado',
  ],
  politica: [
    'gobierno', 'presidente', 'asamblea', 'ministerio', 'decreto', 'ley',
    'elecciones', 'partido', 'alcalde', 'prefecto', 'municipio', 'noboa',
    'candidato', 'votación', 'política', 'congreso', 'constitución', 'reforma',
    'gabinete', 'ministro', 'consulta popular', 'referéndum', 'cne',
    'corte constitucional', 'concejo municipal', 'sesión', 'ordenanza',
  ],
  economia: [
    'economía', 'precio', 'inflación', 'dólar', 'petróleo', 'exportación',
    'importación', 'empresa', 'banco', 'inversión', 'presupuesto', 'deuda',
    'impuesto', 'sueldo', 'salario', 'mercado', 'comercio', 'petroecuador',
    'industria', 'producción', 'finanzas', 'pib', 'empleo', 'desempleo',
    'bce', 'banco central', 'fmi', 'gasolina', 'combustible', 'tarifa',
    'pasaje', 'subsidio', 'bono', 'canasta básica',
  ],
  transito: [
    'tránsito', 'tráfico', 'accidente', 'vial', 'carretera', 'vía',
    'autopista', 'bloqueo', 'cierre vial', 'desvío', 'congestionamiento',
    'atm', 'bus', 'choque', 'volcamiento', 'colapso vial', 'siniestro vial',
    'peatón atropellado', 'transporte público', 'deslizamiento vial',
    'control de tránsito', 'portovial', 'agente de tránsito',
  ],
  salud: [
    'salud', 'hospital', 'médico', 'vacuna', 'enfermedad', 'dengue', 'covid',
    'virus', 'iess', 'ministerio de salud', 'epidemia', 'pandemia', 'paciente',
    'medicamento', 'clínica', 'brote', 'contagio', 'msp', 'gripe', 'zika',
    'leptospirosis', 'emergencia sanitaria', 'oleaje', 'aguaje',
  ],
  deportes: [
    'fútbol', 'liga', 'barcelona sc', 'emelec', 'deportivo quito', 'aucas',
    'independiente', 'partido', 'gol', 'campeonato', 'deportes', 'selección',
    'mundial', 'la tri', 'ldu', 'liga de quito', 'delfín', 'orense',
    'olmedo', 'técnico universitario', 'macará', 'deportivo cuenca',
    'atletismo', 'natación', 'ciclismo', 'boxeo', 'copa',
  ],
  tecnologia: [
    'tecnología', 'internet', 'aplicación', 'app', 'startup', 'digital',
    'inteligencia artificial', 'ia', 'ciberseguridad', 'hackeo', 'innovación',
    'software', 'red 5g', 'telecomunicaciones',
  ],
  farandula: [
    'farándula', 'farandula', 'famoso', 'celebridad', 'chisme', 'escándalo',
    'escandalo', 'novela', 'serie', 'película', 'pelicula', 'actor', 'actriz',
    'cantante', 'artista', 'show', 'espectáculo', 'espectaculo', 'romance',
    'boda', 'divorcio', 'embarazo', 'bebé', 'bebe', 'red carpet', 'alfombra roja',
    'reality', 'telenovela', 'pareja', 'ruptura', 'instagram', 'influencer',
    'shakira', 'taylor swift', 'bad bunny', 'karol g', 'maluma',
  ],
};

module.exports = { FEEDS, CITY_KEYWORDS, CAT_KEYWORDS };
