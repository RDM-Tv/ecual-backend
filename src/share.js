// ─── PÁGINA DE COMPARTIR  /n/:id ─────────────────────────────────────────────
// Cuando alguien comparte una noticia en WhatsApp, Facebook, X o Telegram, el enlace apunta aquí.
// Esta página trae las etiquetas "Open Graph", así las redes muestran la IMAGEN y el TITULAR de la
// noticia; al abrirla, la persona ve la nota, publicidad y un botón para entrar a EcuaNews.
//
// Variable opcional en Render:  FRONTEND_URL  (por defecto https://rdm-tv.github.io/EcuaNews/)

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const FRONT = () => (process.env.FRONTEND_URL || 'https://rdm-tv.github.io/EcuaNews/').replace(/\/?$/, '/');
const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const corta = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };

function hace(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'hace un momento';
  if (m < 60) return `hace ${m} min`;
  if (m < 1440) return `hace ${Math.round(m / 60)} h`;
  return `hace ${Math.round(m / 1440)} d`;
}

function pagina({ n, selfUrl, apiOrigin }) {
  const f = FRONT();
  const titulo = n ? n.titulo : 'EcuaNews — Noticias de Ecuador';
  const desc = n ? corta(n.resumen || `Noticia de ${n.fuente_nombre} en EcuaNews`, 200) : 'Todas las noticias de Ecuador en un solo lugar, en tiempo real.';
  const imagen = n && n.img_url ? n.img_url : f + 'og-ecuanews.png';
  const meta = n ? `${esc(n.fuente_nombre)} · ${esc(n.ciudad_label || 'Nacional')} · ${hace(n.publicado_en)}` : '';
  const data = JSON.stringify({ api: apiOrigin + '/api', front: f, id: n ? n.id : null }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)} — EcuaNews</title>
<meta name="robots" content="noindex">
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="EcuaNews">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(imagen)}"><meta property="og:url" content="${esc(selfUrl)}"><meta property="og:locale" content="es_EC">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(imagen)}">
<link rel="icon" href="${esc(f)}favicon-32.png">
<style>
*{box-sizing:border-box;margin:0}body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#EEF1F6;color:#0B1120;line-height:1.5}
header{background:#0B1120;border-bottom:3px solid #F5C800}
.hi{max-width:760px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.logo{color:#F7F8FA;text-decoration:none;font-weight:800;font-size:22px}.logo b{color:#F5C800}
.go{background:#F5C800;color:#0B1120;text-decoration:none;font-weight:700;font-size:13px;padding:8px 14px;border-radius:8px;white-space:nowrap}
main{max-width:760px;margin:0 auto;padding:16px}
.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(11,17,32,.1)}
.card img{display:block;width:100%;max-height:420px;object-fit:cover;background:#dde4f2}
.cb{padding:20px}.meta{font-size:12.5px;color:#5A6782;font-weight:600;margin-bottom:8px}
h1{font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.2;margin-bottom:10px}
.sum{color:#2b3550;font-size:15.5px;margin-bottom:18px}
.btns{display:flex;flex-wrap:wrap;gap:10px}
.btn{display:inline-block;text-decoration:none;font-weight:700;font-size:14.5px;padding:12px 20px;border-radius:10px;text-align:center}
.b1{background:#F5C800;color:#0B1120}.b2{background:#0B1120;color:#F5C800}
#promo{margin:18px 0}
.lbl{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#7b8594;text-align:center;margin-bottom:3px}
.cta{margin-top:18px;background:linear-gradient(135deg,#1E3A6E,#0B1120);color:#fff;border-radius:16px;padding:20px;text-align:center}
.cta h2{font-size:19px;color:#F5C800;margin-bottom:6px}.cta p{font-size:14px;color:#C5CDDB;margin-bottom:14px}
footer{text-align:center;color:#5A6782;font-size:11.5px;padding:18px}
/* banners con plantilla */
.bn{display:flex;position:relative;background:#fff;border:1px solid #dcdcdc;border-radius:8px;overflow:hidden;text-decoration:none;color:#222;--bn:#0056b3;box-shadow:0 4px 12px rgba(0,0,0,.06)}
.bn-ad{position:absolute;top:5px;right:8px;font-size:8.5px;letter-spacing:.8px;text-transform:uppercase;color:#9aa3b2;font-weight:600}
.bn-bar{position:absolute;top:0;bottom:0;left:0;width:6px;background:linear-gradient(180deg,var(--bn),var(--bn2,var(--bn)))}
.bn.inline{flex-direction:row;align-items:center;justify-content:space-between;gap:12px;padding:10px 18px 10px 22px;min-height:90px;width:100%}
.bn-l{display:flex;align-items:center;gap:14px;min-width:0}
.bn-logo{width:64px;height:64px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.bn-logo img{width:100%;height:100%;object-fit:contain;border-radius:0}
.bn-logo.pic img{border-radius:50%}
.bn-ini{width:100%;height:100%;border-radius:50%;background:var(--bn);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:28px}
.bn-t{color:var(--bn);font-weight:700;font-size:17px;line-height:1.25}.bn-s{font-size:12px;color:#666;margin-top:2px}
.bn-cta{background:var(--bn);color:#fff;font-weight:700;font-size:14px;border-radius:6px;padding:10px 18px;white-space:nowrap}
a.adimg{display:block}a.adimg img{display:block;width:auto;max-width:100%;margin:0 auto;border-radius:10px}
@media(max-width:560px){.bn.inline{flex-wrap:wrap;justify-content:center;text-align:center}.bn-cta{width:100%;text-align:center}h1{font-size:23px}}
</style></head><body>
<header><div class="hi"><a class="logo" href="${esc(f)}" data-ev="landing_ecuanews">Ecua<b>News</b></a><a class="go" href="${esc(f)}" data-ev="landing_ecuanews">Ver todas las noticias</a></div></header>
<main>
${n ? `<article class="card">${n.img_url ? `<img src="${esc(n.img_url)}" alt="" referrerpolicy="no-referrer">` : ''}
<div class="cb"><div class="meta">${meta}</div><h1>${esc(n.titulo)}</h1>${n.resumen ? `<p class="sum">${esc(corta(n.resumen, 320))}</p>` : ''}
<div class="btns"><a class="btn b1" href="${esc(n.url)}" target="_blank" rel="noopener" data-ev="landing_original">Leer la noticia completa en ${esc(n.fuente_nombre)}</a><a class="btn b2" href="${esc(f)}" data-ev="landing_ecuanews">Más noticias en EcuaNews</a></div></div></article>`
: `<div class="card"><div class="cb"><h1>Esta noticia ya no está disponible</h1><p class="sum">Pero tienes todas las noticias de Ecuador, en tiempo real, en EcuaNews.</p><div class="btns"><a class="btn b1" href="${esc(f)}" data-ev="landing_ecuanews">Ir a EcuaNews</a></div></div></div>`}
<div id="promo"></div>
<section class="cta"><h2>Todas las noticias de Ecuador en un solo lugar</h2><p>Ciudades, categorías, alertas de última hora y el resumen del día en 60 segundos.</p><a class="btn b1" href="${esc(f)}" data-ev="landing_ecuanews">Entrar a EcuaNews</a></section>
</main>
<footer>EcuaNews agrega y enlaza noticias de distintos medios. El contenido pertenece a cada medio.</footer>
<script id="cfg" type="application/json">${data}</script>
<script>
(function(){
  var C=JSON.parse(document.getElementById('cfg').textContent);
  var sid='l'+Math.random().toString(36).slice(2,12);
  function ev(t,d){try{fetch(C.api+'/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sid:sid,eventos:[{t:t,d:d||{}}]}),keepalive:true});}catch(e){}}
  ev('landing',{ref:document.referrer?new URL(document.referrer).hostname:''});
  document.addEventListener('click',function(e){var a=e.target.closest('[data-ev]');if(a)ev(a.getAttribute('data-ev'));});
  // publicidad: usa los mismos anuncios de EcuaNews (archivo promos.js del sitio)
  function X(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function pick(list){var seq=[];var max=1;list.forEach(function(a){max=Math.max(max,a.peso||1);});for(var p=1;p<=max;p++)list.forEach(function(a){if((a.peso||1)>=p)seq.push(a);});return seq[Math.floor(Math.random()*seq.length)];}
  function draw(a){
    var url=X(a.url);
    if(a.inlineImg)return '<a class="adimg" href="'+url+'" target="_blank" rel="sponsored noopener" data-ev="landing_anuncio"><img src="'+X(C.front+a.inlineImg)+'" alt="'+X(a.nombre)+'"></a>';
    var sp=a.inline;if(!sp)return '';
    var ini=X((a.nombre||'?').charAt(0).toUpperCase());
    var vis=a.imagen||a.logo;var pic=a.imagen?' pic':'';
    var logo=vis?'<img src="'+X(C.front+vis)+'" alt="" onerror="this.parentNode.innerHTML=\\'<span class=bn-ini>'+ini+'</span>\\'">':'<span class="bn-ini">'+ini+'</span>';
    var st='--bn:'+(/^#[0-9a-f]{3,8}$/i.test(a.color||'')?a.color:'#0056b3')+(/^#[0-9a-f]{3,8}$/i.test(a.color2||'')?';--bn2:'+a.color2:'');
    return '<a class="bn inline" style="'+st+'" href="'+url+'" target="_blank" rel="sponsored noopener" data-ev="landing_anuncio"><span class="bn-ad">Publicidad</span>'+(a.color2?'<span class="bn-bar"></span>':'')+'<div class="bn-l"><div class="bn-logo'+pic+'">'+logo+'</div><div><div class="bn-t">'+X(sp.titulo||a.nombre).replace(/\\n/g,'<br>')+'</div>'+(sp.subtitulo?'<div class="bn-s">'+X(sp.subtitulo)+'</div>':'')+'</div></div><span class="bn-cta">'+X(sp.boton||'Ver más')+'</span></a>';
  }
  var s=document.createElement('script');s.src=C.front+'promos.js';
  s.onload=function(){var l=(window.ADS_CASA||[]).filter(function(a){return a.inlineImg||a.inline;});if(!l.length)return;var h=draw(pick(l));if(h)document.getElementById('promo').innerHTML='<div class="lbl">Publicidad</div>'+h;};
  document.head.appendChild(s);
})();
</script>
</body></html>`;
}

function registrarRutas(app) {
  app.set('trust proxy', true);
  app.get('/n/:id', async (req, res) => {
    const apiOrigin = `${req.protocol}://${req.get('host')}`;
    const selfUrl = `${apiOrigin}${req.originalUrl}`;
    let n = null;
    try {
      const id = String(req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
      const { data } = await supabase.from('noticias').select('id,titulo,resumen,url,img_url,fuente_nombre,ciudad_label,publicado_en').eq('id', id).maybeSingle();
      n = data || null;
    } catch (e) { /* se muestra la página genérica */ }
    res.status(n ? 200 : 404).set('Content-Type', 'text/html; charset=utf-8').set('Cache-Control', 'public, max-age=300').send(pagina({ n, selfUrl, apiOrigin }));
  });
}

module.exports = { registrarRutas };
