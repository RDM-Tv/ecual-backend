const FEEDS = [
  // ── NACIONALES ──────────────────────────────────────────────────────────
  { id:'eluniverso',   name:'El Universo',    url:'https://www.eluniverso.com/arc/outboundfeeds/rss/?outputType=xml', ciudad_base:null,         tipo:'rss', activo:true },
  { id:'elcomercio',   name:'El Comercio',    url:'https://www.elcomercio.com/feed',                                  ciudad_base:'quito',       tipo:'rss', activo:true },
  { id:'primicias',    name:'Primicias',       url:'https://www.primicias.ec/feed/',                                   ciudad_base:null,         tipo:'rss', activo:true },
  { id:'lahora',       name:'La Hora',         url:'https://www.lahora.com.ec/feed/',                                  ciudad_base:null,         tipo:'rss', activo:true },
  { id:'expreso',      name:'Expreso',         url:'https://www.expreso.ec/rss.xml',                                   ciudad_base:'guayaquil',   tipo:'rss', activo:true },
  { id:'extra',        name:'Diario Extra',    url:'https://www.extra.ec/feed/',                                       ciudad_base:'guayaquil',   tipo:'rss', activo:true },
  { id:'metroec',      name:'Metro Ecuador',   url:'https://www.metroecuador.com.ec/feed/',                            ciudad_base:null,         tipo:'rss', activo:true },
  { id:'confirmado',   name:'Confirmado',      url:'https://confirmado.com.ec/feed/',                                  ciudad_base:null,         tipo:'rss', activo:true },
  { id:'ecuavisa',     name:'Ecuavisa',        url:'https://www.ecuavisa.com/rss.xml',                                 ciudad_base:'guayaquil',   tipo:'rss', activo:true },
  { id:'tc',           name:'TC Televisión',   url:'https://www.tctelevision.com/feed',                                ciudad_base:'guayaquil',   tipo:'rss', activo:true },
  { id:'teleamazonas', name:'Teleamazonas',    url:'https://www.teleamazonas.com/feed/',                               ciudad_base:'quito',       tipo:'rss', activo:true },
  { id:'larepublica',  name:'La República EC', url:'https://www.larepublica.ec/feed/',                                 ciudad_base:null,         tipo:'rss', activo:true },
  { id:'elnorte',      name:'El Norte',        url:'https://www.elnorte.ec/feed/',                                     ciudad_base:'ibarra',      tipo:'rss', activo:true },
  // ── MANABÍ / MANTA ──────────────────────────────────────────────────────
  { id:'olamanta',     name:'Ola Manta',       url:'https://olamanta.com/feed/',                                       ciudad_base:'manta',       tipo:'rss', activo:true },
  { id:'notimanta',    name:'NotiManta',        url:'https://notimanta.com/feed/',                                      ciudad_base:'manta',       tipo:'rss', activo:true },
  { id:'poderinfo',    name:'Poder Informativo',url:'https://poderinformativo.com.ec/feed/',                            ciudad_base:'manta',       tipo:'rss', activo:true },
  { id:'infomanta',    name:'InfoManta',        url:'https://infomanta.com/feed/',                                      ciudad_base:'manta',       tipo:'rss', activo:true },
  { id:'laprimicia',   name:'La Primicia',      url:'https://laprimicia.ec/feed/',                                      ciudad_base:'manta',       tipo:'rss', activo:true },
  { id:'lamarea',      name:'La Marea',         url:'https://lamareadigital.com/feed/',                                 ciudad_base:'manta',       tipo:'rss', activo:true },
  { id:'eldiario',     name:'El Diario',        url:'https://www.eldiario.ec/feed/',                                    ciudad_base:'portoviejo',  tipo:'rss', activo:true },
];

const CITY_KEYWORDS = {
  quito:['quito','pichincha','el panecillo','guamaní','calderón','tumbaco','cumbayá','sangolquí','quitumbe','la carolina','solanda','cotocollao','conocoto','carapungo'],
  guayaquil:['guayaquil','guayas','samborondón','daule','milagro','durán','urdesa','alborada','kennedy','mapasingue','sauces','bastión popular','monte sinaí','isla trinitaria'],
  manta:['manta','tarqui','barbasquillo','los esteros','manta centro','el murciélago','manta ec'],
  portoviejo:['portoviejo','manabí','chone','bahía de caráquez','jipijapa','montecristi','el carmen','pedernales','rocafuerte','calceta','tosagua'],
  cuenca:['cuenca','azuay','el cajas','yanuncay','totoracocha','gualaceo','chordeleg','paute','girón'],
  ambato:['ambato','tungurahua','baños','patate','mocha','cevallos','tisaleo','quero','pillaro'],
  loja:['loja','vilcabamba','catamayo','zamora','macará','cariamanga','saraguro'],
  esmeraldas:['esmeraldas','atacames','sua','muisne','quinindé','eloy alfaro','san lorenzo'],
  'santo domingo':['santo domingo','tsáchilas','tsachilas','la concordia'],
  machala:['machala','el oro','huaquillas','pasaje','zaruma','piñas','arenillas','santa rosa de el oro'],
  ibarra:['ibarra','imbabura','otavalo','cotacachi','atuntaqui','pimampiro'],
  riobamba:['riobamba','chimborazo','alausí','colta','chambo','guano'],
  nacional:[],
};

const CAT_KEYWORDS = {
  seguridad:['policía','detenido','detenidos','robo','crimen','sicario','asesinato','asesinado','explosivo','secuestro','banda','narco','narcotráfico','herido','muerto','fallecido','disparo','balacera','extorsión','violencia','preso','capturado','operativo','delito','homicidio','femicidio','alerta','emergencia','terrorismo','ffaa','detonación','bomba'],
  politica:['gobierno','presidente','asamblea','ministerio','decreto','ley','elecciones','partido','alcalde','prefecto','municipio','noboa','candidato','votación','política','congreso','constitución','reforma','gabinete','ministro','consulta popular','referéndum','cne','corte constitucional'],
  economia:['economía','precio','inflación','dólar','petróleo','exportación','importación','empresa','banco','inversión','presupuesto','deuda','impuesto','sueldo','salario','mercado','comercio','petroecuador','industria','producción','finanzas','pib','empleo','desempleo','bce','banco central','fmi'],
  transito:['tránsito','tráfico','accidente','vial','carretera','vía','autopista','bloqueo','cierre vial','desvío','congestionamiento','atm','bus','choque','volcamiento','colapso vial','siniestro vial','peatón atropellado','transporte público','deslizamiento'],
  salud:['salud','hospital','médico','vacuna','enfermedad','dengue','covid','virus','iess','ministerio de salud','epidemia','pandemia','paciente','medicamento','clínica','brote','contagio','msp','gripe'],
  deportes:['fútbol','liga','barcelona sc','emelec','deportivo quito','aucas','independiente','partido','gol','campeonato','deportes','selección','mundial','la tri','ldu','liga de quito','delfín','orense','olmedo'],
  tecnologia:['tecnología','internet','aplicación','app','startup','digital','inteligencia artificial','ia','ciberseguridad','hackeo','innovación','software','red 5g','telecomunicaciones'],
};

module.exports = { FEEDS, CITY_KEYWORDS, CAT_KEYWORDS };
