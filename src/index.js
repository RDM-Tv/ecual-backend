<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EcuaNews — Noticias Ecuador</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇪🇨</text></svg>">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Newsreader:opsz,wght@6..72,500;6..72,700&display=swap');
  :root{--am:#F5C800;--bg:#0B1120;--mid:#152040;--deep:#1E3A6E;--fg:#F7F8FA;--mute:#8A97AE;--red:#E8253A;--grn:#00C48C;--pink:#FF6B9D}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Sora',sans-serif;background:var(--bg);color:var(--fg);min-height:100vh}
  header{background:var(--bg);border-bottom:2px solid var(--am);padding:0 16px;position:sticky;top:0;z-index:100}
  .hi{max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:58px}
  .logo{text-decoration:none;display:flex;align-items:center;gap:10px}
  .logo-icon{font-size:28px}
  .logo-txt .name{font-weight:800;font-size:22px;letter-spacing:-0.5px;color:var(--fg)}
  .logo-txt .name span{color:var(--am)}
  .logo-txt .tag{font-size:9px;color:var(--mute);letter-spacing:1.5px;text-transform:uppercase}
  .hright{display:flex;align-items:center;gap:10px}
  .ldot{width:7px;height:7px;background:var(--red);border-radius:50%;animation:pulse 1.4s infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}
  .btnact{background:var(--am);color:var(--bg);border:none;border-radius:6px;padding:7px 14px;font-family:'Sora',sans-serif;font-weight:700;font-size:12px;cursor:pointer}
  .btnact:hover{opacity:.85}.btnact:disabled{opacity:.4;cursor:not-allowed}
  .citybar{background:var(--mid);border-bottom:1px solid rgba(255,255,255,.06);padding:0 16px;overflow-x:auto;scrollbar-width:none}
  .citybar::-webkit-scrollbar{display:none}
  .cbi{max-width:960px;margin:0 auto;display:flex;gap:4px;padding:10px 0}
  .cb{background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:5px 13px;color:var(--mute);font-family:'Sora',sans-serif;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s}
  .cb:hover{border-color:var(--am);color:var(--am)}.cb.on{background:var(--am);border-color:var(--am);color:var(--bg)}
  .catbar{background:var(--bg);padding:0 16px;border-bottom:1px solid rgba(255,255,255,.06);overflow-x:auto;scrollbar-width:none}
  .catbar::-webkit-scrollbar{display:none}
  .cati{max-width:960px;margin:0 auto;display:flex}
  .catb{background:transparent;border:none;border-bottom:2px solid transparent;padding:10px 13px;color:var(--mute);font-family:'Sora',sans-serif;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s}
  .catb:hover{color:var(--fg)}.catb.on{color:var(--am);border-bottom-color:var(--am)}
  .catb.fan{}.catb.fan.on{color:var(--pink);border-bottom-color:var(--pink)}
  .main{max-width:960px;margin:0 auto;padding:18px 16px}
  .srchwrap{position:relative;margin-bottom:14px}
  .srchinp{width:100%;background:var(--mid);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:11px 16px 11px 42px;color:var(--fg);font-family:'Sora',sans-serif;font-size:14px;outline:none;transition:border-color .15s}
  .srchinp:focus{border-color:var(--am)}.srchinp::placeholder{color:var(--mute)}
  .srchico{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--mute)}
  .statusbar{background:var(--mid);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .stchip{font-size:11px;font-weight:600;padding:3px 10px;border-radius:12px;display:flex;align-items:center;gap:5px}
  .stchip.ok{background:rgba(0,196,140,.15);color:var(--grn);border:1px solid rgba(0,196,140,.3)}
  .stchip.load{background:rgba(245,200,0,.1);color:var(--am);border:1px solid rgba(245,200,0,.2);animation:blink .9s infinite alternate}
  .stchip.err{background:rgba(232,37,58,.1);color:#e87a8a;border:1px solid rgba(232,37,58,.2)}
  @keyframes blink{from{opacity:1}to{opacity:.5}}
  .sdot{width:6px;height:6px;border-radius:50%;background:currentColor}
  .statrow{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:6px}
  .stattxt{font-size:12px;color:var(--mute)}.stattxt strong{color:var(--grn)}
  .seclbl{font-size:11px;font-weight:700;color:var(--mute);letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px}
  .fcard{background:var(--mid);border-radius:14px;overflow:hidden;margin-bottom:14px;border:1px solid rgba(255,255,255,.07);text-decoration:none;display:block;transition:transform .15s,border-color .15s}
  .fcard:hover{transform:translateY(-2px);border-color:var(--am)}
  .fcard.fan-card:hover{border-color:var(--pink)}
  .fthumb{width:100%;height:190px;background:linear-gradient(135deg,var(--deep),var(--mid));display:flex;align-items:center;justify-content:center;font-size:52px;overflow:hidden}
  .fthumb img{width:100%;height:100%;object-fit:cover}
  .fbody{padding:16px}
  .fmeta{display:flex;align-items:center;gap:7px;margin-bottom:8px;flex-wrap:wrap}
  .bdg{background:var(--am);color:var(--bg);font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:.5px;text-transform:uppercase}
  .bdg.fan{background:var(--pink);color:#fff}
  .bdg.yt{background:#FF0000;color:#fff}
  .tago{font-size:11px;color:var(--mute)}.clbl{font-size:11px;color:var(--grn);font-weight:600}
  .ftitle{font-family:'Newsreader',serif;font-size:19px;font-weight:700;line-height:1.3;color:var(--fg);margin-bottom:6px}
  .fsum{font-size:13px;color:var(--mute);line-height:1.6}
  .ngrid{display:flex;flex-direction:column;gap:8px}
  .ncard{background:var(--mid);border-radius:12px;padding:13px;border:1px solid rgba(255,255,255,.06);text-decoration:none;display:flex;gap:12px;align-items:flex-start;transition:border-color .15s,transform .1s}
  .ncard:hover{border-color:rgba(245,200,0,.35);transform:translateX(2px)}
  .ncard.fan-card:hover{border-color:rgba(255,107,157,.4)}
  .nthumb{width:66px;height:66px;border-radius:8px;background:var(--deep);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:26px;overflow:hidden}
  .nthumb img{width:100%;height:100%;object-fit:cover}
  .nbody{flex:1;min-width:0}
  .nmeta{display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap}
  .ntitle{font-family:'Newsreader',serif;font-size:15px;font-weight:500;line-height:1.35;color:var(--fg);margin-bottom:3px}
  .nsrc{font-size:11px;color:var(--mute)}
  .pag{display:flex;justify-content:center;gap:8px;margin-top:24px}
  .pagbtn{background:var(--mid);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px 20px;color:var(--fg);font-family:'Sora',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
  .pagbtn:hover{border-color:var(--am);color:var(--am)}.pagbtn:disabled{opacity:.3;cursor:not-allowed}
  .spinner{width:34px;height:34px;border:3px solid rgba(245,200,0,.15);border-top-color:var(--am);border-radius:50%;animation:spin .7s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loadwrap{display:flex;flex-direction:column;align-items:center;gap:14px;padding:60px 20px}
  .loadtxt{color:var(--mute);font-size:13px}
  .empty{text-align:center;padding:60px 20px;color:var(--mute)}
  .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--am);color:var(--bg);font-weight:700;font-size:13px;padding:10px 20px;border-radius:8px;transition:transform .3s;z-index:999;white-space:nowrap}
  .toast.show{transform:translateX(-50%) translateY(0)}
  footer{border-top:1px solid rgba(255,255,255,.06);padding:20px;text-align:center;color:var(--mute);font-size:12px;max-width:960px;margin:0 auto}
  @media(max-width:600px){.logo-txt .tag{display:none}.ftitle{font-size:17px}.nthumb{width:58px;height:58px}}
</style>
</head>
<body>

<header>
  <div class="hi">
    <a class="logo" href="#">
      <span class="logo-icon">🦅</span>
      <div class="logo-txt">
        <div class="name">Ecua<span>News</span></div>
        <div class="tag">Noticias Ecuador</div>
      </div>
    </a>
    <div class="hright">
      <div class="ldot"></div>
      <button class="btnact" id="btnRef" onclick="reload()">⟳ Actualizar</button>
    </div>
  </div>
</header>

<div class="citybar"><div class="cbi">
  <button class="cb on" onclick="setCity('todas',this)">🇪🇨 Todo el país</button>
  <button class="cb" onclick="setCity('quito',this)">🏔️ Quito</button>
  <button class="cb" onclick="setCity('guayaquil',this)">🌊 Guayaquil</button>
  <button class="cb" onclick="setCity('manta',this)">⚓ Manta</button>
  <button class="cb" onclick="setCity('portoviejo',this)">🏙️ Portoviejo</button>
  <button class="cb" onclick="setCity('cuenca',this)">🏛️ Cuenca</button>
  <button class="cb" onclick="setCity('santo domingo',this)">🌿 Sto. Domingo</button>
  <button class="cb" onclick="setCity('ambato',this)">🌄 Ambato</button>
  <button class="cb" onclick="setCity('loja',this)">🎵 Loja</button>
  <button class="cb" onclick="setCity('esmeraldas',this)">🌴 Esmeraldas</button>
  <button class="cb" onclick="setCity('machala',this)">🍌 Machala</button>
  <button class="cb" onclick="setCity('ibarra',this)">🏘️ Ibarra</button>
</div></div>

<div class="catbar"><div class="cati">
  <button class="catb on" onclick="setCat('todas',this)">Todas</button>
  <button class="catb" onclick="setCat('seguridad',this)">🚔 Seguridad</button>
  <button class="catb" onclick="setCat('politica',this)">🏛️ Política</button>
  <button class="catb" onclick="setCat('economia',this)">💰 Economía</button>
  <button class="catb" onclick="setCat('transito',this)">🚗 Tránsito</button>
  <button class="catb" onclick="setCat('salud',this)">🏥 Salud</button>
  <button class="catb" onclick="setCat('deportes',this)">⚽ Deportes</button>
  <button class="catb" onclick="setCat('tecnologia',this)">💻 Tecnología</button>
  <button class="catb fan" onclick="setCat('farandula',this)">🌟 Farándula</button>
</div></div>

<div class="main">
  <div class="srchwrap">
    <span class="srchico">🔍</span>
    <input class="srchinp" id="q" type="text" placeholder="Buscar noticias… ej: cortes de luz, tránsito, Mundial" oninput="debounceSearch()">
  </div>
  <div class="statusbar" id="statusbar"><span class="stchip load"><span class="sdot"></span>Conectando…</span></div>
  <div id="container"><div class="loadwrap"><div class="spinner"></div><div class="loadtxt">Cargando noticias de Ecuador…</div></div></div>
  <div class="pag" id="pag"></div>
</div>

<footer>
  🦅 EcuaNews · Noticias de Ecuador en tiempo real<br>
  <span style="color:rgba(255,255,255,.2);font-size:11px;">El contenido pertenece a sus respectivos medios. EcuaNews solo agrega y redirige.</span>
</footer>
<div class="toast" id="toast"></div>

<script>
const API='https://web-production-4ab8f.up.railway.app/api';
const PAGE_SIZE=30;
const CAT_EMOJI={seguridad:'🚔',politica:'🏛️',economia:'💰',transito:'🚗',salud:'🏥',deportes:'⚽',tecnologia:'💻',farandula:'🌟',general:'📰'};
let ciudad='todas',cat='todas',pagina=0,totalNews=0,searchTimer=null;

function timeAgo(iso){
  const m=Math.floor((Date.now()-new Date(iso).getTime())/60000);
  if(m<1)return'ahora mismo';if(m<60)return`hace ${m} min`;
  const h=Math.floor(m/60);if(h<24)return`hace ${h} h`;
  return`hace ${Math.floor(h/24)} d`;
}

function getBadgeClass(n){
  if(n.categoria==='farandula') return 'bdg fan';
  if(n.tipo==='youtube') return 'bdg yt';
  return 'bdg';
}

function getFanClass(n){
  return n.categoria==='farandula' ? ' fan-card' : '';
}

async function fetchNews(loader=true){
  const q=document.getElementById('q').value.trim();
  if(loader)setContainer(`<div class="loadwrap"><div class="spinner"></div><div class="loadtxt">Cargando noticias…</div></div>`);
  try{
    const params=new URLSearchParams({limit:PAGE_SIZE,offset:pagina*PAGE_SIZE});
    if(ciudad!=='todas')params.set('ciudad',ciudad);
    if(cat!=='todas')params.set('categoria',cat);
    if(q)params.set('q',q);
    const res=await fetch(`${API}/noticias?${params}`);
    if(!res.ok)throw new Error(`Error ${res.status}`);
    const data=await res.json();
    totalNews=data.total||data.noticias?.length||0;
    renderNews(data.noticias||[]);
    renderPag();
    updateStatus(true,data.noticias?.length||0);
  }catch(e){
    updateStatus(false);
    setContainer(`<div class="empty"><div style="font-size:36px;margin-bottom:12px">⚠️</div><p style="color:var(--mute)">${e.message}</p></div>`);
  }
}

function renderNews(noticias){
  if(!noticias.length){setContainer(`<div class="empty"><div style="font-size:36px;margin-bottom:12px">🔎</div><p style="color:var(--mute)">No hay noticias para este filtro.</p></div>`);return;}
  const[top,...rest]=noticias;
  const em=CAT_EMOJI[top.categoria]||'📰';
  const th=top.img_url?`<img src="${top.img_url}" alt="" onerror="this.style.display='none'">`:`<span>${em}</span>`;
  let html=`
    <div class="statrow">
      <span class="stattxt">Mostrando <strong>${noticias.length}</strong> de ${totalNews} noticias</span>
      <span class="stattxt">${new Date().toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit'})}</span>
    </div>
    <div class="seclbl">${cat==='farandula'?'🌟':'📌'} Más reciente</div>
    <a class="fcard${getFanClass(top)}" href="${top.url}" target="_blank" rel="noopener">
      <div class="fthumb">${th}</div>
      <div class="fbody">
        <div class="fmeta">
          <span class="${getBadgeClass(top)}">${top.tipo==='youtube'?'▶ ':''} ${top.fuente_nombre||''}</span>
          <span class="clbl">📍 ${top.ciudad_label||'Nacional'}</span>
          <span class="tago">${timeAgo(top.publicado_en)}</span>
        </div>
        <div class="ftitle">${top.titulo}</div>
        ${top.resumen?`<div class="fsum">${top.resumen.slice(0,220)}…</div>`:''}
      </div>
    </a>`;
  if(rest.length){
    html+=`<div class="seclbl" style="margin-top:18px">📰 Noticias</div><div class="ngrid">`;
    rest.forEach(n=>{
      const e2=CAT_EMOJI[n.categoria]||'📰';
      const t2=n.img_url?`<img src="${n.img_url}" alt="" onerror="this.parentElement.innerHTML='${e2}'">`:`${e2}`;
      html+=`<a class="ncard${getFanClass(n)}" href="${n.url}" target="_blank" rel="noopener">
        <div class="nthumb">${t2}</div>
        <div class="nbody">
          <div class="nmeta"><span class="${getBadgeClass(n)}">${n.tipo==='youtube'?'▶ ':''} ${n.fuente_nombre||''}</span><span class="clbl">📍 ${n.ciudad_label||'Nacional'}</span></div>
          <div class="ntitle">${n.titulo}</div>
          <div class="nsrc">${timeAgo(n.publicado_en)}</div>
        </div>
      </a>`;
    });
    html+=`</div>`;
  }
  setContainer(html);
}

function renderPag(){
  const pag=document.getElementById('pag');
  const total=Math.ceil(totalNews/PAGE_SIZE);
  if(total<=1){pag.innerHTML='';return;}
  pag.innerHTML=`<button class="pagbtn" onclick="goPage(${pagina-1})" ${pagina===0?'disabled':''}>← Anterior</button>
    <span style="color:var(--mute);font-size:13px;padding:0 8px;align-self:center">${pagina+1} / ${total}</span>
    <button class="pagbtn" onclick="goPage(${pagina+1})" ${pagina>=total-1?'disabled':''}>Siguiente →</button>`;
}

function updateStatus(ok,count){
  const bar=document.getElementById('statusbar');
  if(!ok){bar.innerHTML=`<span class="stchip err"><span class="sdot"></span>Error de conexión</span>`;return;}
  if(!count){bar.innerHTML=`<span class="stchip load"><span class="sdot"></span>Cargando noticias desde los medios…</span>`;return;}
  bar.innerHTML=`<span class="stchip ok"><span class="sdot"></span>✅ ${totalNews} noticias · Actualiza cada 15 min</span>`;
}

function goPage(p){pagina=p;window.scrollTo({top:0,behavior:'smooth'});fetchNews();}
function setCity(c,btn){ciudad=c;pagina=0;document.querySelectorAll('.cb').forEach(b=>b.classList.remove('on'));btn.classList.add('on');fetchNews();}
function setCat(c,btn){cat=c;pagina=0;document.querySelectorAll('.catb').forEach(b=>b.classList.remove('on'));btn.classList.add('on');fetchNews();}
function debounceSearch(){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{pagina=0;fetchNews(false);},400);}
function reload(){const b=document.getElementById('btnRef');b.disabled=true;b.textContent='⟳ Actualizando…';fetchNews().then(()=>{b.disabled=false;b.textContent='⟳ Actualizar';showToast('✅ Actualizado');});}
function setContainer(h){document.getElementById('container').innerHTML=h;}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}

setInterval(()=>fetchNews(false),10*60*1000);
fetchNews();
</script>
</body>
</html>
