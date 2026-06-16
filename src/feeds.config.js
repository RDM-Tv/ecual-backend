const FEEDS = [
  // ── NACIONALES ──────────────────────────────────────────────────────────────
  { id:'eluniverso',   name:'El Universo',    url:'https://www.eluniverso.com/arc/outboundfeeds/rss/?outputType=xml', ciudad_base:null,        tipo:'rss', activo:true },
  { id:'elcomercio',   name:'El Comercio',    url:'https://www.elcomercio.com/feed',                                  ciudad_base:'quito',     tipo:'rss', activo:true },
  { id:'primicias',    name:'Primicias',       url:'https://www.primicias.ec/feed/',                                   ciudad_base:null,        tipo:'rss', activo:true },
  { id:'lahora',       name:'La Hora',         url:'https://www.lahora.com.ec/feed/',                                  ciudad_base:null,        tipo:'rss', activo:true },
  { id:'expreso',      name:'Expreso',         url:'https://www.expreso.ec/rss.xml',                                   ciudad_base:'guayaquil', tipo:'rss', activo:true },
  { id:'extra',        name:'Diario Extra',    url:'https://www.extra.ec/feed/',                                       ciudad_base:'guayaquil', tipo:'rss', activo:true },
  { id:'metroec',      name:'Metro Ecuador',   url:'https://www.metroecuador.com.ec/feed/',                            ciudad_base:null,        tipo:'rss', activo:true },
  { id:'confirmado',   name:'Confirmado',      url:'https://confirmado.com.ec/feed/',                                  ciudad_base:null,        tipo:'rss', activo:true },
  { id:'ecuavisa',     name:'Ecuavisa',        url:'https://www.ecuavisa.com/rss.xml',                                 ciudad_base:'guayaquil', tipo:'rss', activo:true },
  { id:'tc',           name:'TC Televisión',   url:'https://www.tctelevision.com/feed',                                ciudad_base:'guayaquil', tipo:'rss', activo:true },
  { id:'teleamazonas', name:'Teleamazonas',    url:'https://www.teleamazonas.com/feed/',                               ciudad_base:'quito',     tipo:'rss', activo:true },
  { id:'larepublica',  name:'La República EC', url:'https://www.larepublica.ec/feed/',                                 ciudad_base:null,        tipo:'rss', activo:true },
  { id:'elnorte',      name:'El Norte',        url:'https://www.elnorte.ec/feed/',                                     ciudad_base:'ibarra',    tipo:'rss', activo:true },
  { id:'elmercurio',   name:'El Mercurio',     url:'https://elmercurio.com.ec/feed/',                                  ciudad_base:'cuenca',    tipo:'rss', activo:true },
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
