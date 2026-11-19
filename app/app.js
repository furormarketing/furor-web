"use strict";
/* =========================================================
   Furor · Panel interno — app.js
   Vanilla JS + Supabase (auth, base de datos, archivos, tiempo real)
   ========================================================= */

/* ---------- Constantes ---------- */
const CFG = window.FUROR_CONFIG || {};
const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
const NAV = [
  ["inicio","Inicio"],["agenda","Agenda"],["contenido","Contenido"],["clientes","Clientes"],
  ["tareas","Tareas"],["chat","Chat"],["novedades","Novedades"],["equipo","Equipo"]
];
const SEDES = ["Tucumán","Salta","Santiago del Estero","Otra provincia"];
const SEDE_VAR = {"Tucumán":"--s-tuc","Salta":"--s-sal","Santiago del Estero":"--s-sde"};
const ROLES = {admin:"Dirección",cm:"Community Manager",setter:"Setter",diseno:"Diseño gráfico",ugc:"UGC",web:"Desarrollo web",otro:"Otro"};
const AREAS = ["General","Ventas / Setter","Community","Diseño","Ads","Web","Administración"];
const ESTADOS_CLI = ["Activo","Onboarding","En pausa","Baja"];
const PLANES = ["Plan base","Plan expansión","Solo gestión de ads","Desarrollo web","Otro"];
const TIPOS_EV = ["Reunión","Llamada","Videollamada"];
const FORMATOS = ["Feed","Reel","Carrusel","Historia"];
const EST_ENT = ["En edición","Para revisar","Aprobada","Programada","Publicada"];
const DKEYS = ["lun","mar","mie","jue","vie","sab","dom"];
const DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MES_C = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const TABLES = ["miembros","clientes","tareas","eventos","entregas","publicaciones","mensajes","novedades","config"];
const MAX_MB = 50;

/* ---------- Estado ---------- */
const S = {
  session:null, me:null, loading:true, authMode:"entrar", authErr:"", authBusy:false,
  miembros:[], clientes:[], tareas:[], eventos:[], entregas:[], publicaciones:[], mensajes:[], novedades:[], config:[],
  view:"inicio", cliId:null, cliTab:"resumen",
  f:{ cliQ:"", cliSede:"", cliEstado:"Activo", tScope:"todas", tArea:"", agSede:"", calSel:null, ctScope:"todas", chatQ:"" },
  cal:(()=>{const d=new Date();return {y:d.getFullYear(),m:d.getMonth()};})(),
  weekOff:0, chatCh:"general", drafts:{}, pedido:false
};

/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl = u => { const s=String(u||"").trim(); if(!s) return ""; if(/^https?:\/\//i.test(s)) return s; if(/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(s)) return "https://"+s; return ""; };
const pad = n => String(n).padStart(2,"0");
const ymd = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today = () => ymd(new Date());
const parseYmd = s => { const [y,m,d]=String(s).split("-").map(Number); return new Date(y,(m||1)-1,d||1); };
const addDays = (s,n) => { const d=parseYmd(s); d.setDate(d.getDate()+n); return ymd(d); };
const fmtDate = s => { if(!s) return ""; const d=parseYmd(s); return d.getDate()+" "+MES_C[d.getMonth()]; };
const fmtDayLong = s => { const d=parseYmd(s); return ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"][d.getDay()]+" "+d.getDate()+" de "+MESES[d.getMonth()]; };
const relDays = s => { const n=Math.round((parseYmd(s)-parseYmd(today()))/86400000); if(n===0) return "hoy"; if(n===1) return "mañana"; if(n===-1) return "ayer"; return n<0?"hace "+(-n)+" días":"en "+n+" días"; };
const hhmm = t => t ? String(t).slice(0,5) : "";
const dayKey = s => DKEYS[(parseYmd(s).getDay()+6)%7];
const weekStart = off => { const d=new Date(); d.setDate(d.getDate()-((d.getDay()+6)%7)+off*7); return ymd(d); };
const initials = n => (n||"?").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("") || "?";
const sedeColor = s => `var(${SEDE_VAR[s]||"--s-otra"})`;
const isAdmin = () => S.me && S.me.rol==="admin";
const mem = id => S.miembros.find(m=>m.id===id);
const memName = id => { const m=mem(id); return m ? (m.nombre||m.email) : (id?"Ex integrante":"Sin asignar"); };
const memLabel = id => { const m=mem(id); return m ? (m.nombre||m.email)+" · "+(ROLES[m.rol]||m.rol)+(m.sede?" "+m.sede:"") : "Sin asignar"; };
const cli = id => S.clientes.find(c=>c.id===id);
const cliName = id => cli(id)?.nombre || "";
const cfg = k => (S.config.find(c=>c.clave===k)||{}).valor || null;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),3000); }
const ls = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };

/* ---------- Datos ---------- */
const ORDER = { mensajes:["creado",true], novedades:["creado",false], miembros:["nombre",true], clientes:["nombre",true] };
async function loadTable(t){
  let q = sb.from(t).select("*");
  if(ORDER[t]) q = q.order(ORDER[t][0], {ascending:ORDER[t][1]});
  if(t==="mensajes") q = sb.from(t).select("*").order("creado",{ascending:false}).limit(1500);
  if(t==="publicaciones") q = q.gte("fecha", addDays(today(),-60));
  const { data, error } = await q;
  if(error){ console.error(t,error); return; }
  S[t] = t==="mensajes" ? (data||[]).reverse() : (data||[]);
}
const reloadTimers = {};
function scheduleReload(t){
  clearTimeout(reloadTimers[t]);
  reloadTimers[t]=setTimeout(async()=>{ await loadTable(t); if(t==="miembros") S.me = S.miembros.find(m=>m.user_id===S.session?.user?.id) || S.me; render(); }, 250);
}
let channel=null;
function subscribe(){
  if(channel) sb.removeChannel(channel);
  channel = sb.channel("furor-db");
  TABLES.forEach(t=>channel.on("postgres_changes",{event:"*",schema:"public",table:t},()=>scheduleReload(t)));
  channel.subscribe();
}
async function run(promise, okMsg){
  const { error } = await promise;
  if(error){
    console.error(error);
    const m = String(error.message||"");
    toast(/row-level security|permission/i.test(m) ? "No tenés permiso para hacer eso." : "No se pudo guardar: "+m);
    return false;
  }
  if(okMsg) toast(okMsg);
  return true;
}

/* ---------- Auth ---------- */
async function boot(){
  const { data } = await sb.auth.getSession();
  S.session = data.session;
  sb.auth.onAuthStateChange((ev, session)=>{
    const before = S.session?.user?.id;
    S.session = session;
    if((session?.user?.id) !== before) afterAuth();
  });
  await afterAuth();
  route();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
}
async function afterAuth(){
  if(!S.session){ S.me=null; S.loading=false; if(channel){ sb.removeChannel(channel); channel=null; } render(); return; }
  S.loading=true; render();
  await loadTable("miembros");
  S.me = S.miembros.find(m=>m.user_id===S.session.user.id) || null;
  if(S.me && S.me.activo){
    await Promise.all(TABLES.filter(t=>t!=="miembros").map(loadTable));
    subscribe();
  }
  S.loading=false; render();
}
async function doAuth(e){
  e.preventDefault();
  const email=$("#aMail").value.trim().toLowerCase(), pass=$("#aPass").value;
  S.authErr=""; S.authBusy=true; renderLogin();
  let res;
  if(S.authMode==="registro"){
    if(pass.length<8){ S.authErr="La contraseña tiene que tener al menos 8 caracteres."; S.authBusy=false; return renderLogin(); }
    res = await sb.auth.signUp({ email, password:pass });
    if(!res.error && !res.data.session) res = await sb.auth.signInWithPassword({ email, password:pass });
  } else if(S.authMode==="recuperar"){
    res = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin+location.pathname });
    S.authBusy=false;
    if(res.error){ S.authErr="No se pudo enviar el mail. Probá en unos minutos."; return renderLogin(); }
    S.authMode="entrar"; S.authErr=""; toast("Te mandamos un mail para crear una contraseña nueva."); return renderLogin();
  } else {
    res = await sb.auth.signInWithPassword({ email, password:pass });
  }
  S.authBusy=false;
  if(res.error){
    const m=String(res.error.message||"");
    S.authErr = /MAIL_NO_AUTORIZADO|Database error saving new user/i.test(m) ? "Ese mail no está autorizado. Pedile a Marcelo que te sume al equipo."
      : /already registered/i.test(m) ? "Ese mail ya tiene cuenta. Entrá con tu contraseña."
      : /Invalid login/i.test(m) ? "Mail o contraseña incorrectos."
      : /Email not confirmed/i.test(m) ? "Tu mail no está confirmado. Revisá tu bandeja de entrada."
      : "No se pudo ingresar: "+m;
    renderLogin();
  }
}
async function logout(){ await sb.auth.signOut(); location.hash=""; }
async function handleRecovery(){
  // Si el usuario viene del mail de recuperación, pedimos contraseña nueva
  if(!/type=recovery/.test(location.hash)) return;
  openModal(`<h2>Nueva contraseña</h2><form class="form" onsubmit="saveNewPass(event)"><label class="f full" for="np">Contraseña nueva<input type="password" id="np" minlength="8" required autocomplete="new-password"></label><div class="actions"><span></span><button class="btn pri">Guardar</button></div></form>`);
}
async function saveNewPass(e){ e.preventDefault(); if(await run(sb.auth.updateUser({password:$("#np").value}),"Contraseña actualizada")){ closeModal(); location.hash=""; } }

/* ---------- Ruteo ---------- */
function route(){
  const h=(location.hash||"").replace(/^#/,"");
  if(h.startsWith("cliente-")){ S.view="clientes"; S.cliId=h.slice(8); }
  else { S.view = NAV.some(n=>n[0]===h) ? h : "inicio"; S.cliId=null; }
  render(); window.scrollTo(0,0);
}
window.addEventListener("hashchange", route);

/* ---------- Derivados ---------- */
const openTasks = () => S.tareas.filter(t=>t.estado!=="hecha");
const overdue = l => l.filter(t=>t.vence && t.vence<today());
const prio = {alta:0,media:1,baja:2};
const sortTasks = l => l.slice().sort((a,b)=>(prio[a.prioridad]??1)-(prio[b.prioridad]??1) || String(a.vence||"9999").localeCompare(String(b.vence||"9999")));
const evFrom = from => S.eventos.filter(e=>e.fecha>=from).sort((a,b)=>(a.fecha+(a.hora||"")).localeCompare(b.fecha+(b.hora||"")));
const pubDone = (cid,fecha,f) => S.publicaciones.some(p=>p.cliente_id===cid&&p.fecha===fecha&&p.formato===f);
function expected(c, fecha){ const p=c.pauta||{}; return Array.isArray(p[dayKey(fecha)]) ? p[dayKey(fecha)] : []; }
const pautaClients = () => S.clientes.filter(c=>c.estado!=="Baja" && c.estado!=="En pausa" && DKEYS.some(k=>(c.pauta||{})[k]?.length));
function pendingToday(onlyMine){
  const t=today(); const out=[];
  pautaClients().filter(c=>!onlyMine||c.responsable===S.me?.id).forEach(c=>expected(c,t).forEach(f=>{ if(!pubDone(c.id,t,f)) out.push({c,f}); }));
  return out;
}
function lateThisWeek(){
  const ws=weekStart(0), t=today(); let n=0;
  for(let d=ws; d<t; d=addDays(d,1)) pautaClients().forEach(c=>expected(c,d).forEach(f=>{ if(!pubDone(c.id,d,f)) n++; }));
  return n;
}
function unread(ch){
  const seen=ls.get("furor-seen-"+ch, "");
  return S.mensajes.filter(m=>(m.cliente_id||"general")===ch && m.autor!==S.me?.id && m.creado>seen).length;
}
function unreadTotal(){ const chs=new Set(S.mensajes.map(m=>m.cliente_id||"general")); let n=0; chs.forEach(c=>n+=unread(c)); return n; }
function markSeen(ch){ const last=S.mensajes.filter(m=>(m.cliente_id||"general")===ch).slice(-1)[0]; if(last) ls.set("furor-seen-"+ch,last.creado); }
const openPedidos = () => S.mensajes.filter(m=>m.pedido && !m.resuelto);

/* ---------- Render ---------- */
function render(){
  const root=$("#root");
  if(S.loading){ root.innerHTML=`<div class="login"><div class="box"><h1>Furor</h1><p>Cargando…</p></div></div>`; return; }
  if(!S.session) return renderLogin();
  if(!S.me || !S.me.activo){
    root.innerHTML=`<div class="login"><div class="box"><h1>Acceso pendiente</h1><p>Tu cuenta (${esc(S.session.user.email)}) no está habilitada en el equipo de Furor. Pedile a Marcelo que te sume.</p><button class="btn block" onclick="logout()">Salir</button></div></div>`;
    return;
  }
  const ae=document.activeElement, aid=ae&&ae.id, sel=ae&&typeof ae.selectionStart==="number"?ae.selectionStart:null;
  const msgsEl=$(".msgs"), atBottom = msgsEl ? (msgsEl.scrollHeight-msgsEl.scrollTop-msgsEl.clientHeight<60) : true;
  if(!$(".app")){
    root.innerHTML=`<div class="app"><aside class="side"><div class="brand"><b>Furor Marketing</b><span>Panel interno</span></div><nav class="nav" id="nav"></nav><div class="me" id="meBox"></div></aside><div><nav class="mobile-nav" id="mnav"></nav><main id="main"></main></div></div>`;
  }
  renderNav();
  const views={inicio:vInicio,agenda:vAgenda,contenido:vContenido,clientes:vClientes,tareas:vTareas,chat:vChat,novedades:vNovedades,equipo:vEquipo};
  $("#main").innerHTML = views[S.view]();
  if(aid){ const el=document.getElementById(aid); if(el){ el.focus(); try{ if(sel!=null) el.setSelectionRange(sel,sel); }catch(e){} } }
  const m2=$(".msgs"); if(m2 && atBottom) m2.scrollTop=m2.scrollHeight;
  if(S.view==="chat") markSeen(S.chatCh);
  if(S.view==="clientes" && S.cliId && S.cliTab==="chat") markSeen(S.cliId);
}
function renderNav(){
  const badge={ chat:unreadTotal(), tareas:overdue(openTasks().filter(t=>t.asignado===S.me.id)).length, contenido:pendingToday(S.me.rol==="cm").length };
  const item=(k,l,cls)=>`<a href="#${k}" class="${S.view===k?"on":""}">${l}${badge[k]?`<span class="badge">${badge[k]}</span>`:""}</a>`;
  $("#nav").innerHTML=NAV.map(([k,l])=>item(k,l)).join("");
  $("#mnav").innerHTML=NAV.map(([k,l])=>item(k,l)).join("");
  $("#meBox").innerHTML=`<div class="n">${esc(S.me.nombre||S.me.email)}</div><div class="r">${esc(ROLES[S.me.rol]||"")}${S.me.sede?" · "+esc(S.me.sede):""}</div><div><button class="btn sm ghost" onclick="logout()" style="padding-left:0">Cerrar sesión</button></div>`;
}
function renderLogin(){
  const m=S.authMode;
  $("#root").innerHTML=`<div class="login"><div class="box">
    <h1>Furor · Panel interno</h1>
    <p>${m==="registro"?"Primera vez: creá tu contraseña con el mail que te habilitó Marcelo.":m==="recuperar"?"Te mandamos un link para crear una contraseña nueva.":"Ingresá con tu mail y contraseña."}</p>
    <form onsubmit="doAuth(event)">
      ${S.authErr?`<div class="err">${esc(S.authErr)}</div>`:""}
      <label class="f" for="aMail">Mail<input type="email" id="aMail" required autocomplete="email"></label>
      ${m!=="recuperar"?`<label class="f" for="aPass">Contraseña<input type="password" id="aPass" required minlength="${m==="registro"?8:1}" autocomplete="${m==="registro"?"new-password":"current-password"}"></label>`:""}
      <button class="btn pri block" ${S.authBusy?"disabled":""}>${S.authBusy?"Un momento…":m==="registro"?"Crear mi acceso":m==="recuperar"?"Enviar link":"Entrar"}</button>
    </form>
    <div class="alt">${m==="entrar"?`¿Primera vez? <a href="#" onclick="S.authMode='registro';S.authErr='';renderLogin();return false;">Crear mi acceso</a> · <a href="#" onclick="S.authMode='recuperar';S.authErr='';renderLogin();return false;">Olvidé mi contraseña</a>`:`<a href="#" onclick="S.authMode='entrar';S.authErr='';renderLogin();return false;">Volver a ingresar</a>`}</div>
  </div></div>`;
}

/* ---------- Piezas comunes ---------- */
function evRow(e){
  const d=parseYmd(e.fecha), parts=(e.participantes||[]).map(memName).join(", "), link=safeUrl(e.link);
  return `<div class="row"><div class="when" style="border-left-color:${sedeColor(e.sede)}"><b>${d.getDate()}</b><span>${MES_C[d.getMonth()]}</span></div>
  <div class="main"><div class="t">${esc(e.titulo)}</div>
  <div class="s">${esc([e.tipo, hhmm(e.hora)?hhmm(e.hora)+" hs":"", relDays(e.fecha), e.cliente_id?cliName(e.cliente_id):e.contacto, e.sede].filter(Boolean).join(" · "))}</div>
  ${parts?`<div class="s">Con: ${esc(parts)}</div>`:""}
  ${link?`<div class="s"><a href="${esc(link)}" target="_blank" rel="noopener">Unirse a la videollamada</a></div>`:(e.lugar?`<div class="s">${esc(e.lugar)}</div>`:"")}
  </div><button class="btn sm ghost" onclick="formEvento('${e.id}')">Editar</button></div>`;
}
function taskRow(t){
  const late=t.vence&&t.vence<today();
  return `<div class="row"><div class="main"><div class="t" style="cursor:pointer" onclick="formTarea('${t.id}')">${esc(t.titulo)}</div>
  <div class="s">${esc([memName(t.asignado), t.cliente_id?cliName(t.cliente_id):"", t.area].filter(Boolean).join(" · "))}</div></div>
  ${t.vence?`<span class="pill ${late?"bad":t.vence===today()?"warn":""}">${esc(late?"Venció "+fmtDate(t.vence):fmtDate(t.vence))}</span>`:""}
  <button class="btn sm" onclick="advance('${t.id}')">${t.estado==="curso"?"Terminar":"Empezar"}</button></div>`;
}
function postHtml(n){
  const d=new Date(n.creado);
  return `<div class="row"><div class="avatar">${esc(initials(memName(n.autor)))}</div><div class="main">
  <div><b>${esc(memName(n.autor))}</b> <span class="s">${d.getDate()} ${MES_C[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}</span> ${n.fijada?`<span class="pill ok">Fijada</span>`:""} ${n.etiqueta?`<span class="pill info">${esc(n.etiqueta)}</span>`:""}</div>
  <div style="white-space:pre-wrap;margin-top:4px;overflow-wrap:anywhere">${esc(n.texto)}</div></div>
  ${(isAdmin()||n.autor===S.me.id)?`<div><button class="btn sm ghost" onclick="pinNov('${n.id}')">${n.fijada?"Desfijar":"Fijar"}</button><button class="btn sm ghost danger" onclick="askDel('novedades','${n.id}','esta novedad')">Borrar</button></div>`:""}</div>`;
}
const sortNov = () => S.novedades.slice().sort((a,b)=>(b.fijada?1:0)-(a.fijada?1:0) || String(b.creado).localeCompare(String(a.creado)));
const estPill = e => `<span class="pill ${e==="Activo"?"ok":e==="Onboarding"?"info":e==="En pausa"?"warn":"bad"}">${esc(e||"—")}</span>`;
const entPill = e => `<span class="pill ${e==="Publicada"?"ok":e==="Aprobada"||e==="Programada"?"info":e==="Para revisar"?"warn":""}">${esc(e)}</span>`;

/* ---------- Inicio (Mi día) ---------- */
function vInicio(){
  const t=today(), mine=sortTasks(openTasks().filter(x=>x.asignado===S.me.id));
  const myEv=evFrom(t).filter(e=>(e.participantes||[]).includes(S.me.id)||e.creado_por===S.me.id).slice(0,6);
  const allEv=evFrom(t).slice(0,6);
  const evs = myEv.length ? myEv : allEv;
  const pend=pendingToday(S.me.rol==="cm");
  const ped=openPedidos();
  const paraRevisar=S.entregas.filter(e=>e.estado==="Para revisar");
  const enf=cfg("enfoque")||{}; const objs=Array.isArray(enf.objetivos)?enf.objetivos:[];
  const venc=overdue(openTasks());
  const first=(S.me.nombre||"").split(" ")[0];
  return `
  <div class="head"><div><h1>${first?"Hola, "+esc(first):"Mi día"}</h1><p style="text-transform:capitalize">${esc(fmtDayLong(t))}</p></div>
    <div class="acts"><button class="btn" onclick="formTarea()">+ Tarea</button><button class="btn pri" onclick="formEvento()">+ Agendar</button></div></div>
  <div class="stats">
    <div class="stat"><div class="v">${S.clientes.filter(c=>c.estado==="Activo").length}</div><div class="l">Clientes activos</div></div>
    <div class="stat ${pend.length?"alert":""}"><div class="v">${pend.length}</div><div class="l">Publicaciones pendientes hoy</div></div>
    <div class="stat"><div class="v">${evFrom(t).filter(e=>e.fecha<addDays(t,7)).length}</div><div class="l">Agendados próximos 7 días</div></div>
    <div class="stat ${venc.length?"alert":""}"><div class="v">${venc.length}</div><div class="l">Tareas vencidas</div></div>
  </div>
  <div class="grid g2">
    <section class="card"><h2>Enfoque de la semana ${isAdmin()?`<button class="btn sm" onclick="formEnfoque()">Editar</button>`:""}</h2>
      ${enf.texto?`<p class="focus-text">${esc(enf.texto)}</p>`:`<div class="empty">${isAdmin()?"Definí la prioridad de la semana para todo el equipo.":"Todavía no hay enfoque cargado."}</div>`}
      ${objs.map((o,i)=>`<label class="check ${o.hecho?"done":""}"><input type="checkbox" ${o.hecho?"checked":""} ${isAdmin()?"":"disabled"} onchange="toggleObj(${i})"><span>${esc(o.t)}</span></label>`).join("")}
    </section>
    <section class="card"><h2>Publicar hoy <a href="#contenido">Calendario de contenido</a></h2>
      <div class="list">${pend.length?pend.slice(0,10).map(({c,f})=>`<div class="row"><div class="main"><div class="t">${esc(c.nombre)}</div><div class="s">${esc(f)}${c.instagram?" · "+esc(c.instagram):""}</div></div><button class="btn sm pri" onclick="togglePub('${c.id}','${t}','${f}')">Publicado</button></div>`).join(""):`<div class="empty">${pautaClients().length?"Todo publicado por hoy.":"Cargá la pauta de publicación en cada cliente para ver acá lo que toca subir."}</div>`}</div>
    </section>
    <section class="card"><h2>${myEv.length?"Mi agenda":"Agenda del equipo"} <a href="#agenda">Ver todo</a></h2>
      <div class="list">${evs.length?evs.map(evRow).join(""):`<div class="empty">Nada agendado.</div>`}</div></section>
    <section class="card"><h2>Mis tareas <a href="#tareas">Tablero</a></h2>
      <div class="list">${mine.length?mine.slice(0,8).map(taskRow).join(""):`<div class="empty">No tenés tareas pendientes.</div>`}</div></section>
    <section class="card"><h2>Pedidos sin resolver <a href="#chat">Chat</a></h2>
      <div class="list">${ped.length?ped.slice(-8).reverse().map(m=>`<div class="row"><div class="main"><div class="t">${esc(m.texto.length>120?m.texto.slice(0,120)+"…":m.texto)}</div><div class="s">${esc(memName(m.autor))} · ${esc(m.cliente_id?cliName(m.cliente_id):"General")}</div></div><button class="btn sm" onclick="resolver('${m.id}')">Resuelto</button></div>`).join(""):`<div class="empty">No hay pedidos abiertos.</div>`}</div></section>
    <section class="card"><h2>Piezas para revisar</h2>
      <div class="list">${paraRevisar.length?paraRevisar.map(e=>`<div class="row"><div class="main"><div class="t">${esc(e.titulo)}</div><div class="s">${esc(cliName(e.cliente_id))} · ${esc(e.formato)}${e.fecha_pub?" · sale "+fmtDate(e.fecha_pub):""}</div></div><a class="btn sm" href="#cliente-${e.cliente_id}" onclick="S.cliTab='entregas'">Ver</a></div>`).join(""):`<div class="empty">Nada esperando revisión.</div>`}</div></section>
    <section class="card" style="grid-column:1/-1"><h2>Novedades <a href="#novedades">Ver todas</a></h2>
      <div class="list">${S.novedades.length?sortNov().slice(0,4).map(postHtml).join(""):`<div class="empty">Sin novedades.</div>`}</div></section>
  </div>`;
}

/* ---------- Agenda ---------- */
function vAgenda(){
  const {y,m}=S.cal, first=new Date(y,m,1), start=new Date(first); start.setDate(1-((first.getDay()+6)%7));
  const t=today(), evs=S.eventos.filter(e=>!S.f.agSede||e.sede===S.f.agSede);
  const by={}; evs.forEach(e=>(by[e.fecha]=by[e.fecha]||{e:[],t:[]}).e.push(e));
  openTasks().forEach(x=>{ if(x.vence) (by[x.vence]=by[x.vence]||{e:[],t:[]}).t.push(x); });
  let cells=DIAS.map(d=>`<div class="dow">${d}</div>`).join("");
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i); const k=ymd(d), it=by[k]||{e:[],t:[]};
    const list=[...it.e.sort((a,b)=>String(a.hora||"").localeCompare(String(b.hora||""))).map(e=>`<div class="ev" style="background:${sedeColor(e.sede)}" title="${esc(e.tipo+": "+e.titulo)}">${esc((hhmm(e.hora)?hhmm(e.hora)+" ":"")+e.titulo)}</div>`), ...it.t.map(x=>`<div class="ev task" title="${esc(x.titulo)}">${esc(x.titulo)}</div>`)];
    cells+=`<div class="day ${d.getMonth()!==m?"out":""} ${k===t?"today":""} ${S.f.calSel===k?"sel":""}" tabindex="0" onclick="S.f.calSel='${k}';render()" onkeydown="if(event.key==='Enter'){S.f.calSel='${k}';render()}"><div class="num">${d.getDate()}</div>${list.slice(0,3).join("")}${list.length>3?`<div class="ev more">+${list.length-3} más</div>`:""}</div>`;
  }
  const sel=S.f.calSel||t, si=by[sel]||{e:[],t:[]};
  return `
  <div class="head"><div><h1>Agenda Furor</h1><p>Reuniones, llamadas y videollamadas de Tucumán, Salta y Santiago del Estero</p></div>
    <div class="acts"><button class="btn" onclick="calMove(-1)" aria-label="Mes anterior">‹</button><h2 style="min-width:150px;text-align:center;text-transform:capitalize">${MESES[m]} ${y}</h2><button class="btn" onclick="calMove(1)" aria-label="Mes siguiente">›</button><button class="btn" onclick="calToday()">Hoy</button><button class="btn pri" onclick="formEvento(null,'${sel}')">+ Agendar</button></div></div>
  <div class="toolbar"><div class="seg">${["",...SEDES.slice(0,3)].map(s=>`<button class="${S.f.agSede===s?"on":""}" onclick="S.f.agSede='${s}';render()">${s||"Todas las sedes"}</button>`).join("")}</div>
    <div class="legend">${SEDES.slice(0,3).map(s=>`<span><span class="sede-dot" style="background:${sedeColor(s)}"></span>${s}</span>`).join("")}<span><span class="sede-dot" style="border:1px solid var(--warn)"></span>Vence tarea</span></div></div>
  <div class="cal-layout"><div class="cal">${cells}</div>
    <section class="card"><h2 style="text-transform:capitalize">${esc(fmtDayLong(sel))}</h2>
      <div class="list">${si.e.length?si.e.map(evRow).join(""):`<div class="empty">Nada agendado.</div>`}</div>
      ${si.t.length?`<h3 style="margin:14px 0 4px">Vencen</h3><div class="list">${si.t.map(taskRow).join("")}</div>`:""}
    </section></div>`;
}
function calMove(n){ let {y,m}=S.cal; m+=n; if(m<0){m=11;y--;} if(m>11){m=0;y++;} S.cal={y,m}; render(); }
function calToday(){ const d=new Date(); S.cal={y:d.getFullYear(),m:d.getMonth()}; S.f.calSel=today(); render(); }

/* ---------- Calendario de contenido ---------- */
function vContenido(){
  const ws=weekStart(S.weekOff), days=[...Array(7)].map((_,i)=>addDays(ws,i)), t=today();
  let list=pautaClients();
  if(S.f.ctScope==="mias") list=list.filter(c=>c.responsable===S.me.id);
  const late=lateThisWeek();
  const rows=list.map(c=>`<tr><td class="cli"><a href="#cliente-${c.id}" onclick="S.cliTab='pauta'"><b>${esc(c.nombre)}</b></a><div class="s">${esc(c.instagram||"")}${c.responsable?" · "+esc(memName(c.responsable)):""}</div></td>
    ${days.map(d=>{
      const exp=expected(c,d).map(f=>{ const done=pubDone(c.id,d,f); const isLate=!done&&d<t; return `<button class="chip ${done?"done":isLate?"late":""}" onclick="togglePub('${c.id}','${d}','${f}')" title="${done?"Marcar como no publicado":"Marcar como publicado"}">${esc(f)}</button>`; }).join("");
      const ents=S.entregas.filter(e=>e.cliente_id===c.id&&e.fecha_pub===d).map(e=>`<button class="chip ent" onclick="formEntrega('${e.id}')" title="${esc(e.estado)}">${esc(e.titulo)}</button>`).join("");
      return `<td class="${d===t?"today":""}">${exp}${ents}</td>`;
    }).join("")}</tr>`).join("");
  return `
  <div class="head"><div><h1>Calendario de contenido</h1><p>Qué se publica en cada cuenta, día por día. Tocá cada casilla para marcarla como publicada.</p></div>
    <div class="acts"><button class="btn" onclick="S.weekOff--;render()" aria-label="Semana anterior">‹</button><h2 style="min-width:170px;text-align:center">${fmtDate(days[0])} – ${fmtDate(days[6])}</h2><button class="btn" onclick="S.weekOff++;render()" aria-label="Semana siguiente">›</button><button class="btn" onclick="S.weekOff=0;render()">Esta semana</button></div></div>
  <div class="toolbar"><div class="seg"><button class="${S.f.ctScope==="todas"?"on":""}" onclick="S.f.ctScope='todas';render()">Todas las cuentas</button><button class="${S.f.ctScope==="mias"?"on":""}" onclick="S.f.ctScope='mias';render()">Mis cuentas</button></div>
    ${late?`<span class="pill bad">${late} publicaciones atrasadas esta semana</span>`:`<span class="pill ok">Semana al día</span>`}
    <span class="s">Verde: publicado · Rojo: atrasado · Línea punteada: pieza programada</span></div>
  ${list.length?`<div class="week"><table><thead><tr><th>Cuenta</th>${days.map((d,i)=>`<th class="${d===t?"today":""}">${DIAS[i]} ${parseYmd(d).getDate()}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`
    :`<div class="card"><div class="empty">Ninguna cuenta tiene pauta cargada. Entrá a un cliente → pestaña <b>Pauta</b> y marcá qué se publica cada día.</div></div>`}`;
}
async function togglePub(cid,fecha,formato){
  const ex=S.publicaciones.find(p=>p.cliente_id===cid&&p.fecha===fecha&&p.formato===formato);
  if(ex){ S.publicaciones=S.publicaciones.filter(p=>p!==ex); render(); await run(sb.from("publicaciones").delete().eq("id",ex.id)); }
  else { const row={cliente_id:cid,fecha,formato,hecho_por:S.me.id}; S.publicaciones.push(Object.assign({id:"tmp"},row)); render(); await run(sb.from("publicaciones").insert(row)); }
  scheduleReload("publicaciones");
}

/* ---------- Clientes ---------- */
function vClientes(){
  if(S.cliId){ const c=cli(S.cliId); if(c) return fichaCliente(c); }
  const q=S.f.cliQ.toLowerCase();
  const list=S.clientes.filter(c=>(!S.f.cliSede||c.sede===S.f.cliSede)&&(!S.f.cliEstado||c.estado===S.f.cliEstado)&&(!q||[c.nombre,c.rubro,c.instagram,c.contacto].join(" ").toLowerCase().includes(q)));
  return `
  <div class="head"><div><h1>Clientes</h1><p>Ficha, recursos, entregas y chat de cada cuenta</p></div><button class="btn pri" onclick="formCliente()">+ Nuevo cliente</button></div>
  <div class="toolbar">
    <input type="search" id="cliQ" placeholder="Buscar por nombre, rubro, Instagram…" value="${esc(S.f.cliQ)}" oninput="S.f.cliQ=this.value;render()">
    <select id="cliSede" aria-label="Sede" onchange="S.f.cliSede=this.value;render()"><option value="">Todas las sedes</option>${SEDES.map(s=>`<option ${S.f.cliSede===s?"selected":""}>${s}</option>`).join("")}</select>
    <select id="cliEstado" aria-label="Estado" onchange="S.f.cliEstado=this.value;render()"><option value="">Todos los estados</option>${ESTADOS_CLI.map(s=>`<option ${S.f.cliEstado===s?"selected":""}>${s}</option>`).join("")}</select>
    <span class="pill">${list.length} de ${S.clientes.length}</span></div>
  ${list.length?`<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Sede</th><th>Servicio</th><th>Responsable</th><th>Estado</th><th>Pendiente</th></tr></thead><tbody>
  ${list.map(c=>{ const ents=S.entregas.filter(e=>e.cliente_id===c.id&&e.estado!=="Publicada").length; const un=unread(c.id); return `<tr class="click" onclick="location.hash='cliente-${c.id}'"><td><b>${esc(c.nombre)}</b>${c.rubro?`<div class="s">${esc(c.rubro)}</div>`:""}</td><td>${c.sede?`<span class="sede-dot" style="background:${sedeColor(c.sede)}"></span>${esc(c.sede)}`:"—"}</td><td>${esc(c.plan||"—")}</td><td>${esc(c.responsable?memName(c.responsable):"—")}</td><td>${estPill(c.estado)}</td><td>${ents?`<span class="pill info">${ents} piezas</span> `:""}${un?`<span class="pill bad">${un} mensajes</span>`:""}</td></tr>`; }).join("")}
  </tbody></table></div>`:`<div class="card"><div class="empty">${S.clientes.length?"No hay clientes con esos filtros.":"Todavía no hay clientes. Cargá el primero."}</div></div>`}`;
}
function fichaCliente(c){
  const tabs=[["resumen","Ficha"],["entregas","Entregas"],["chat","Chat"],["pauta","Pauta"],["agenda","Tareas y agenda"]];
  const un=unread(c.id);
  const body={resumen:tabResumen,entregas:tabEntregas,chat:()=>chatBox(c.id,true),pauta:tabPauta,agenda:tabAgenda}[S.cliTab]||tabResumen;
  return `
  <div class="head"><div><a href="#clientes">← Clientes</a><h1 style="margin-top:6px">${esc(c.nombre)}</h1><p>${esc([c.rubro,c.sede,c.plan].filter(Boolean).join(" · "))} ${estPill(c.estado)}</p></div>
    <div class="acts"><button class="btn" onclick="formCliente('${c.id}')">Editar ficha</button></div></div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${S.cliTab===k?"on":""}" onclick="S.cliTab='${k}';render()">${l}${k==="chat"&&un?` <span class="badge">${un}</span>`:""}</button>`).join("")}</div>
  ${body(c)}`;
}
function tabResumen(c){
  const ig=String(c.instagram||"").replace(/^@/,""), rec=c.recursos||[], acc=c.accesos||[], mk=c.marca||{};
  return `<div class="grid g2">
    <section class="card"><h2>Recursos y carpetas</h2>
      <div class="links">${rec.length?rec.map(r=>{const u=safeUrl(r.url);return u?`<a class="btn" href="${esc(u)}" target="_blank" rel="noopener"><span>${esc(r.nombre||"Link")}</span><span class="s">Abrir ↗</span></a>`:"";}).join(""):`<div class="empty">Sin links. En "Editar ficha" agregá el Drive de creativos, Canva, logos, fotos.</div>`}</div></section>
    <section class="card"><h2>Datos</h2><dl class="ficha">
      <div><dt>Responsable</dt><dd>${esc(c.responsable?memLabel(c.responsable):"—")}</dd></div>
      <div><dt>Contacto</dt><dd>${esc(c.contacto||"—")}</dd></div>
      <div><dt>WhatsApp</dt><dd>${esc(c.whatsapp||"—")}</dd></div>
      <div><dt>Instagram</dt><dd>${ig?`<a href="https://instagram.com/${encodeURIComponent(ig)}" target="_blank" rel="noopener">@${esc(ig)}</a>`:"—"}</dd></div>
      <div><dt>Web</dt><dd>${safeUrl(c.web)?`<a href="${esc(safeUrl(c.web))}" target="_blank" rel="noopener">${esc(c.web)}</a>`:"—"}</dd></div>
      <div><dt>Cliente desde</dt><dd>${esc(c.inicio?fmtDate(c.inicio)+" "+c.inicio.slice(0,4):"—")}</dd></div>
      <div><dt>Inversión en ads</dt><dd>${esc(c.inversion||"—")}</dd></div></dl>
      ${c.notas?`<h3 style="margin-top:12px">Notas</h3><p style="white-space:pre-wrap;margin:4px 0 0">${esc(c.notas)}</p>`:""}</section>
    <section class="card"><h2>Ficha de marca</h2><dl class="ficha">
      <div><dt>Tono</dt><dd>${esc(mk.tono||"—")}</dd></div>
      <div><dt>Colores</dt><dd>${esc(mk.colores||"—")}</dd></div>
      <div><dt>Tipografías</dt><dd>${esc(mk.tipos||"—")}</dd></div>
      <div><dt>Sí</dt><dd>${esc(mk.si||"—")}</dd></div>
      <div><dt>No</dt><dd>${esc(mk.no||"—")}</dd></div>
      <div><dt>Competencia / referencias</dt><dd>${esc(mk.refs||"—")}</dd></div></dl></section>
    <section class="card"><h2>Accesos</h2>
      <p class="s" style="margin:0 0 10px">Las contraseñas viven en el gestor de contraseñas. Acá queda el usuario y el link al ítem.</p>
      ${acc.length?acc.map(a=>{const l=safeUrl(a.link);return `<div class="acc"><b>${esc(a.plataforma||"Cuenta")}</b><span style="overflow-wrap:anywhere">${esc(a.usuario||"—")} ${a.usuario?`<button class="btn sm ghost" data-v="${esc(a.usuario)}" onclick="copyText(this.dataset.v)">Copiar</button>`:""}</span>${l?`<a class="btn sm" href="${esc(l)}" target="_blank" rel="noopener">Ver contraseña</a>`:`<span class="pill warn">Sin link</span>`}</div>`;}).join(""):`<div class="empty">Sin accesos cargados.</div>`}</section>
  </div>`;
}
function tabEntregas(c){
  const list=S.entregas.filter(e=>e.cliente_id===c.id).sort((a,b)=>(a.estado==="Publicada")-(b.estado==="Publicada") || String(a.fecha_pub||"9999").localeCompare(String(b.fecha_pub||"9999")));
  return `<div class="toolbar"><button class="btn pri" onclick="formEntrega(null,'${c.id}')">+ Nueva pieza</button><span class="s">Reels, posts, carruseles e historias listos o en proceso</span></div>
  ${list.length?`<div class="ent-grid">${list.map(entCard).join("")}</div>`:`<div class="card"><div class="empty">Sin piezas cargadas para este cliente.</div></div>`}`;
}
function entCard(e){
  const files=e.archivos||[], link=safeUrl(e.link);
  return `<div class="ent-card">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><div class="t">${esc(e.titulo)}</div><div class="s">${esc(e.formato)}${e.fecha_pub?" · sale el "+fmtDate(e.fecha_pub):""}${e.asignado?" · "+esc(memName(e.asignado)):""}</div></div>${entPill(e.estado)}</div>
    <div class="steps">${EST_ENT.map(s=>`<button class="${e.estado===s?"on":""}" onclick="setEstEnt('${e.id}','${s}')">${s}</button>`).join("")}</div>
    ${files.length||link?`<div class="files">${files.map((f,i)=>`<div class="file"><span style="overflow-wrap:anywhere">${esc(f.nombre)} <span class="s">${(f.tam/1048576).toFixed(1)} MB</span></span><button class="btn sm" onclick="downloadFile('${e.id}',${i})">Descargar</button></div>`).join("")}${link?`<div class="file"><span>Link externo</span><a class="btn sm" href="${esc(link)}" target="_blank" rel="noopener">Abrir</a></div>`:""}</div>`:""}
    ${e.copy?`<div class="copy-box">${esc(e.copy)}</div><div><button class="btn sm" data-v="${esc(e.copy)}" onclick="copyText(this.dataset.v)">Copiar copy</button></div>`:""}
    <div style="display:flex;gap:6px;flex-wrap:wrap"><label class="btn sm" style="cursor:pointer">Adjuntar archivo<input type="file" hidden onchange="uploadFiles('${e.id}',this.files)" multiple accept="video/*,image/*,application/pdf"></label><button class="btn sm ghost" onclick="formEntrega('${e.id}')">Editar</button></div>
  </div>`;
}
function tabPauta(c){
  const p=c.pauta||{};
  return `<section class="card"><h2>Pauta de publicación</h2>
    <p class="s" style="margin:0 0 12px">Marcá qué se publica cada día en esta cuenta. Con esto se arma el calendario de contenido de la CM.</p>
    <div class="pauta">${DKEYS.map((k,i)=>`<div class="d"><b>${DIAS[i]}</b>${FORMATOS.map(f=>`<label><input type="checkbox" class="pz" data-d="${k}" value="${f}" ${(p[k]||[]).includes(f)?"checked":""}> ${f}</label>`).join("")}</div>`).join("")}</div>
    <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn pri" onclick="savePauta('${c.id}')">Guardar pauta</button><label class="f" style="flex-direction:row;align-items:center;gap:8px">Responsable de la cuenta <select id="pzResp" style="width:auto">${memOptions(c.responsable)}</select></label></div>
  </section>`;
}
async function savePauta(id){
  const pauta={}; DKEYS.forEach(k=>pauta[k]=[]);
  document.querySelectorAll(".pz:checked").forEach(x=>pauta[x.dataset.d].push(x.value));
  await run(sb.from("clientes").update({pauta,responsable:$("#pzResp").value||null,actualizado:new Date().toISOString()}).eq("id",id),"Pauta guardada");
}
function tabAgenda(c){
  const ts=sortTasks(S.tareas.filter(t=>t.cliente_id===c.id&&t.estado!=="hecha"));
  const evs=S.eventos.filter(e=>e.cliente_id===c.id).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).slice(0,8);
  return `<div class="grid g2"><section class="card"><h2>Tareas abiertas <button class="btn sm" onclick="formTarea(null,'${c.id}')">+ Tarea</button></h2><div class="list">${ts.length?ts.map(taskRow).join(""):`<div class="empty">Nada pendiente.</div>`}</div></section>
  <section class="card"><h2>Agenda <button class="btn sm" onclick="formEvento(null,null,'${c.id}')">+ Agendar</button></h2><div class="list">${evs.length?evs.map(evRow).join(""):`<div class="empty">Sin reuniones registradas.</div>`}</div></section></div>`;
}

/* ---------- Archivos ---------- */
async function uploadFiles(entId, fileList){
  const e=S.entregas.find(x=>x.id===entId); if(!e||!fileList||!fileList.length) return;
  const files=[...fileList], big=files.find(f=>f.size>MAX_MB*1048576);
  if(big){ toast(`"${big.name}" pesa más de ${MAX_MB} MB. Subilo a Drive y pegá el link en la pieza.`); return; }
  const archivos=(e.archivos||[]).slice();
  for(const f of files){
    toast("Subiendo "+f.name+"…");
    const safe=f.name.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^\w.-]+/g,"_");
    const path=`${e.cliente_id}/${e.id}/${Date.now()}_${safe}`;
    const { error } = await sb.storage.from("entregas").upload(path, f, { contentType:f.type||undefined, upsert:false });
    if(error){ toast("No se pudo subir "+f.name+": "+error.message); continue; }
    archivos.push({path,nombre:f.name,tipo:f.type,tam:f.size});
  }
  await run(sb.from("entregas").update({archivos,actualizado:new Date().toISOString()}).eq("id",entId),"Archivo adjuntado");
}
async function downloadFile(entId, i){
  const e=S.entregas.find(x=>x.id===entId); const f=e&&(e.archivos||[])[i]; if(!f) return;
  const { data, error } = await sb.storage.from("entregas").createSignedUrl(f.path, 600, { download:f.nombre });
  if(error){ toast("No se pudo descargar."); return; }
  window.open(data.signedUrl, "_blank", "noopener");
}
async function removeFile(entId, i){
  const e=S.entregas.find(x=>x.id===entId); if(!e) return;
  const f=(e.archivos||[])[i]; const archivos=(e.archivos||[]).filter((_,j)=>j!==i);
  if(f) await sb.storage.from("entregas").remove([f.path]);
  if(await run(sb.from("entregas").update({archivos}).eq("id",entId),"Archivo quitado")){ formEntrega(entId); }
}
async function setEstEnt(id, estado){ await run(sb.from("entregas").update({estado,actualizado:new Date().toISOString()}).eq("id",id)); }
async function copyText(v){ try{ await navigator.clipboard.writeText(v); toast("Copiado"); }catch(e){ toast("No se pudo copiar"); } }

/* ---------- Chat ---------- */
function vChat(){
  const q=S.f.chatQ.toLowerCase();
  const chs=[{id:"general",n:"General del equipo"}].concat(S.clientes.filter(c=>c.estado!=="Baja").map(c=>({id:c.id,n:c.nombre})));
  const last = id => (S.mensajes.filter(m=>(m.cliente_id||"general")===id).slice(-1)[0]||{}).creado||"";
  const sorted=chs.filter(c=>!q||c.n.toLowerCase().includes(q)).sort((a,b)=>a.id==="general"?-1:b.id==="general"?1:String(last(b.id)).localeCompare(String(last(a.id))) || a.n.localeCompare(b.n));
  return `<div class="head"><div><h1>Chat</h1><p>Pedidos y conversaciones del equipo, por cliente o generales</p></div>
    <span class="pill ${openPedidos().length?"warn":"ok"}">${openPedidos().length} pedidos abiertos</span></div>
  <div class="chat"><div class="channels"><input type="search" id="chatQ" placeholder="Buscar cliente…" value="${esc(S.f.chatQ)}" oninput="S.f.chatQ=this.value;render()">
    ${sorted.map(c=>{const u=unread(c.id);return `<button class="${S.chatCh===c.id?"on":""}" onclick="S.chatCh='${c.id}';render()"><span>${esc(c.n)}</span>${u?`<span class="badge">${u}</span>`:""}</button>`;}).join("")}</div>
    ${thread(S.chatCh)}</div>`;
}
function chatBox(ch){ return `<div class="chat solo">${thread(ch)}</div>`; }
function thread(ch){
  const msgs=S.mensajes.filter(m=>(m.cliente_id||"general")===ch);
  const title= ch==="general" ? "General del equipo" : cliName(ch);
  let lastDay="", html="";
  msgs.forEach(m=>{
    const d=new Date(m.creado), day=ymd(d);
    if(day!==lastDay){ html+=`<div class="daysep">${day===today()?"Hoy":fmtDayLong(day)}</div>`; lastDay=day; }
    const me=m.autor===S.me.id;
    html+=`<div class="msg ${me?"me":""} ${m.pedido?"pedido":""} ${m.resuelto?"ok":""}">
      <div class="who">${me?"Vos":esc(memName(m.autor))} · ${pad(d.getHours())}:${pad(d.getMinutes())}</div>
      <div class="b">${esc(m.texto)}</div>
      ${m.pedido?`<div class="tag">${m.resuelto?`<span style="color:var(--accent)">✓ Resuelto</span>`:`<span style="color:var(--warn)">Pedido pendiente</span><button class="btn sm ghost" onclick="resolver('${m.id}')">Marcar resuelto</button>`}</div>`:""}
    </div>`;
  });
  const dk="d-"+ch;
  return `<div class="thread"><div class="top"><b>${esc(title)}</b>${ch!=="general"&&S.view==="chat"?`<a class="btn sm" href="#cliente-${ch}">Ver cliente</a>`:""}</div>
    <div class="msgs">${html||`<div class="empty" style="align-self:center">Todavía no hay mensajes. Escribí el primero.</div>`}</div>
    <form class="composer" onsubmit="sendMsg(event,'${ch}')">
      <textarea id="msg-${ch}" placeholder="Escribí un mensaje o un pedido…" rows="1" oninput="S.drafts['${dk}']=this.value" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.form.requestSubmit();}">${esc(S.drafts[dk]||"")}</textarea>
      <label class="opt"><input type="checkbox" id="ped-${ch}" ${S.pedido?"checked":""} onchange="S.pedido=this.checked"> Es un pedido</label>
      <button class="btn pri">Enviar</button></form></div>`;
}
async function sendMsg(e, ch){
  e.preventDefault();
  const el=document.getElementById("msg-"+ch), txt=el.value.trim(); if(!txt) return;
  const row={texto:txt,autor:S.me.id,cliente_id:ch==="general"?null:ch,pedido:!!S.pedido};
  S.drafts["d-"+ch]=""; S.pedido=false; el.value="";
  const tmp=Object.assign({id:"tmp-"+Date.now(),creado:new Date().toISOString(),resuelto:false},row);
  S.mensajes.push(tmp); render();
  if(!await run(sb.from("mensajes").insert(row))){ S.mensajes=S.mensajes.filter(m=>m!==tmp); S.drafts["d-"+ch]=txt; render(); }
}
async function resolver(id){ await run(sb.from("mensajes").update({resuelto:true}).eq("id",id),"Pedido resuelto"); }

/* ---------- Tareas ---------- */
function vTareas(){
  let list=S.tareas.slice();
  if(S.f.tScope==="mias") list=list.filter(t=>t.asignado===S.me.id);
  if(S.f.tArea) list=list.filter(t=>t.area===S.f.tArea);
  const col=([k,l])=>{ let it=list.filter(t=>t.estado===k); it = k==="hecha" ? it.sort((a,b)=>String(b.hecha_el||"").localeCompare(String(a.hecha_el||""))).slice(0,20) : sortTasks(it);
    return `<div class="col"><h3>${l}<span class="pill">${it.length}</span></h3>${it.length?it.map(taskCard).join(""):`<div class="empty">Vacío</div>`}</div>`; };
  return `<div class="head"><div><h1>Tareas</h1><p>Quién hace qué, para qué cliente y para cuándo</p></div><button class="btn pri" onclick="formTarea()">+ Nueva tarea</button></div>
  <div class="toolbar"><div class="seg"><button class="${S.f.tScope==="todas"?"on":""}" onclick="S.f.tScope='todas';render()">Todas</button><button class="${S.f.tScope==="mias"?"on":""}" onclick="S.f.tScope='mias';render()">Mías</button></div>
    <select id="tArea" aria-label="Área" onchange="S.f.tArea=this.value;render()"><option value="">Todas las áreas</option>${AREAS.map(a=>`<option ${S.f.tArea===a?"selected":""}>${a}</option>`).join("")}</select></div>
  <div class="board">${[["pendiente","Por hacer"],["curso","En curso"],["hecha","Hechas"]].map(col).join("")}</div>`;
}
function taskCard(t){
  const late=t.vence&&t.vence<today()&&t.estado!=="hecha";
  return `<div class="task p-${esc(t.prioridad)}"><div class="t" onclick="formTarea('${t.id}')">${esc(t.titulo)}</div>
  ${t.detalle?`<div class="s" style="white-space:pre-wrap">${esc(t.detalle.length>140?t.detalle.slice(0,140)+"…":t.detalle)}</div>`:""}
  <div class="meta"><span>${esc(memName(t.asignado))}</span>${t.cliente_id?`<span>· ${esc(cliName(t.cliente_id))}</span>`:""}${t.area?`<span>· ${esc(t.area)}</span>`:""}</div>
  <div class="acts">${t.vence?`<span class="pill ${late?"bad":t.vence===today()?"warn":""}">${esc(late?"Venció "+fmtDate(t.vence):"Vence "+fmtDate(t.vence))}</span>`:""}<button class="btn sm" onclick="advance('${t.id}')">${t.estado==="hecha"?"Reabrir":t.estado==="curso"?"Terminar":"Empezar"}</button></div></div>`;
}
async function advance(id){
  const t=S.tareas.find(x=>x.id===id); if(!t) return;
  const nx = t.estado==="pendiente"?"curso":t.estado==="curso"?"hecha":"pendiente";
  await run(sb.from("tareas").update({estado:nx,hecha_el:nx==="hecha"?new Date().toISOString():null}).eq("id",id), nx==="hecha"?"Tarea terminada":null);
}

/* ---------- Novedades ---------- */
function vNovedades(){
  return `<div class="head"><div><h1>Novedades</h1><p>Avisos, cambios de clientes y anuncios del equipo</p></div></div>
  <section class="card" style="margin-bottom:16px"><h2>Publicar</h2><form class="form" onsubmit="postNov(event)">
    <label class="f full" for="novTxt">Mensaje<textarea id="novTxt" required placeholder="Ej: Desde el lunes, las reuniones con prospectos de Salta las toma el setter de Salta."></textarea></label>
    <label class="f" for="novTag">Etiqueta<select id="novTag"><option value="">Sin etiqueta</option><option>Aviso</option><option>Cliente nuevo</option><option>Baja de cliente</option><option>Proceso</option><option>Logro</option></select></label>
    <div class="actions" style="justify-content:flex-end;align-items:end"><button class="btn pri">Publicar</button></div></form></section>
  <section class="card"><div class="list">${S.novedades.length?sortNov().map(postHtml).join(""):`<div class="empty">Sin novedades todavía.</div>`}</div></section>`;
}
async function postNov(e){ e.preventDefault(); const txt=$("#novTxt").value.trim(); if(!txt) return; if(await run(sb.from("novedades").insert({texto:txt,etiqueta:$("#novTag").value,autor:S.me.id}),"Publicado")) $("#novTxt").value=""; }
async function pinNov(id){ const n=S.novedades.find(x=>x.id===id); if(n) await run(sb.from("novedades").update({fijada:!n.fijada}).eq("id",id)); }

/* ---------- Equipo ---------- */
function vEquipo(){
  const list=S.miembros.slice().sort((a,b)=>(b.activo-a.activo)||String(a.nombre).localeCompare(String(b.nombre)));
  return `<div class="head"><div><h1>Equipo</h1><p>Quién es quién y qué tiene cada uno en curso</p></div>${isAdmin()?`<button class="btn pri" onclick="formMiembro()">+ Sumar integrante</button>`:""}</div>
  ${isAdmin()?`<div class="note info">Al sumar a alguien, avisale que entre al link del panel, toque <b>"Crear mi acceso"</b> con ese mismo mail y elija su contraseña. Si lo desactivás, pierde el acceso al instante.</div>`:""}
  <div class="people">${list.map(m=>{ const ab=openTasks().filter(t=>t.asignado===m.id), v=overdue(ab).length, cuentas=S.clientes.filter(c=>c.responsable===m.id&&c.estado!=="Baja").length;
    return `<div class="card" style="display:flex;gap:12px;${m.activo?"":"opacity:.55"}"><div class="avatar">${esc(initials(m.nombre||m.email))}</div><div style="min-width:0;flex:1">
      <b>${esc(m.nombre||m.email)}</b><div class="s">${esc(ROLES[m.rol]||m.rol)}${m.sede?" · "+esc(m.sede):""}</div><div class="s">${esc(m.email)}</div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap"><span class="pill">${ab.length} tareas</span>${v?`<span class="pill bad">${v} vencidas</span>`:""}${cuentas?`<span class="pill info">${cuentas} cuentas</span>`:""}${!m.user_id?`<span class="pill warn">No ingresó aún</span>`:""}${!m.activo?`<span class="pill bad">Desactivado</span>`:""}</div>
      ${isAdmin()?`<div style="margin-top:8px"><button class="btn sm" onclick="formMiembro('${m.id}')">Editar</button></div>`:""}</div></div>`; }).join("")}</div>`;
}
function formMiembro(id){
  const m=id?mem(id)||{}:{rol:"cm",activo:true};
  const self = id===S.me.id;
  openModal(`<h2>${id?"Editar integrante":"Sumar integrante"}</h2><form class="form" onsubmit="saveMiembro(event,'${id||""}')">
    <label class="f" for="mNom">Nombre<input type="text" id="mNom" required value="${esc(m.nombre)}"></label>
    <label class="f" for="mMail">Mail<input type="email" id="mMail" required value="${esc(m.email)}" ${id?"disabled":""}></label>
    <label class="f" for="mRol">Rol<select id="mRol" ${self?"disabled":""}>${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${m.rol===k?"selected":""}>${v}</option>`).join("")}</select></label>
    <label class="f" for="mSede">Sede<select id="mSede"><option value="">Todas / remoto</option>${SEDES.map(s=>`<option ${m.sede===s?"selected":""}>${s}</option>`).join("")}</select></label>
    ${id&&!self?`<label class="f full" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" id="mAct" ${m.activo?"checked":""}> Acceso activo</label>`:""}
    <div class="actions"><span></span><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveMiembro(e,id){
  e.preventDefault();
  const data={nombre:$("#mNom").value.trim(),sede:$("#mSede").value};
  if(!(id&&id===S.me.id)) data.rol=$("#mRol").value;
  if($("#mAct")) data.activo=$("#mAct").checked;
  const ok = id ? await run(sb.from("miembros").update(data).eq("id",id),"Guardado")
                : await run(sb.from("miembros").insert(Object.assign({email:$("#mMail").value.trim().toLowerCase(),activo:true},data)),"Integrante sumado");
  if(ok) closeModal();
}

/* ---------- Modales y formularios ---------- */
function openModal(html){ $("#modal").innerHTML=html; $("#modalBg").classList.add("open"); const f=$("#modal input:not([type=checkbox]):not([disabled]), #modal select, #modal textarea"); if(f) f.focus(); }
function closeModal(){ $("#modalBg").classList.remove("open"); $("#modal").innerHTML=""; }
$("#modalBg").addEventListener("click",e=>{ if(e.target.id==="modalBg") closeModal(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeModal(); });
const opts=(arr,sel)=>arr.map(a=>`<option ${sel===a?"selected":""}>${esc(a)}</option>`).join("");
const memOptions = sel => `<option value="">Sin asignar</option>`+S.miembros.filter(m=>m.activo||m.id===sel).map(m=>`<option value="${m.id}" ${sel===m.id?"selected":""}>${esc(memLabel(m.id))}${m.id===S.me.id?" (vos)":""}</option>`).join("");
const cliOptions = sel => `<option value="">Ninguno / interno</option>`+S.clientes.filter(c=>c.estado!=="Baja"||c.id===sel).map(c=>`<option value="${c.id}" ${sel===c.id?"selected":""}>${esc(c.nombre)}</option>`).join("");
const v = id => { const el=document.getElementById(id); return el?el.value.trim():""; };
const nz = x => x===""?null:x;
function askDel(table,id,what){
  openModal(`<h2>¿Borrar ${esc(what)}?</h2><p>Se borra para todo el equipo y no se puede deshacer.</p><div class="form"><div class="actions"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri" style="background:var(--danger);border-color:var(--danger)" onclick="doDel('${table}','${id}')">Borrar</button></div></div>`);
}
async function doDel(table,id){
  if(table==="entregas"){ const e=S.entregas.find(x=>x.id===id); const paths=(e?.archivos||[]).map(f=>f.path); if(paths.length) await sb.storage.from("entregas").remove(paths); }
  if(await run(sb.from(table).delete().eq("id",id),"Borrado")){ closeModal(); if(table==="clientes") location.hash="clientes"; }
}

function formTarea(id, cliId){
  const t=id?S.tareas.find(x=>x.id===id)||{}:{asignado:S.me.id,cliente_id:cliId||"",prioridad:"media",estado:"pendiente",area:"General"};
  openModal(`<h2>${id?"Editar tarea":"Nueva tarea"}</h2><form class="form" onsubmit="saveTarea(event,'${id||""}')">
    <label class="f full" for="tTit">Tarea<input type="text" id="tTit" required value="${esc(t.titulo)}" placeholder="Ej: Diseñar 3 placas de feed para TANK"></label>
    <label class="f full" for="tDet">Detalle<textarea id="tDet" placeholder="Brief, links, referencias">${esc(t.detalle)}</textarea></label>
    <label class="f" for="tAsig">Responsable<select id="tAsig">${memOptions(t.asignado)}</select></label>
    <label class="f" for="tCli">Cliente<select id="tCli">${cliOptions(t.cliente_id)}</select></label>
    <label class="f" for="tArea2">Área<select id="tArea2">${opts(AREAS,t.area)}</select></label>
    <label class="f" for="tPrio">Prioridad<select id="tPrio">${[["alta","Alta"],["media","Media"],["baja","Baja"]].map(([k,l])=>`<option value="${k}" ${t.prioridad===k?"selected":""}>${l}</option>`).join("")}</select></label>
    <label class="f" for="tVence">Vence<input type="date" id="tVence" value="${esc(t.vence)}"></label>
    <label class="f" for="tEst">Estado<select id="tEst">${[["pendiente","Por hacer"],["curso","En curso"],["hecha","Hecha"]].map(([k,l])=>`<option value="${k}" ${t.estado===k?"selected":""}>${l}</option>`).join("")}</select></label>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="askDel('tareas','${id}','esta tarea')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveTarea(e,id){
  e.preventDefault();
  const prev=id?S.tareas.find(x=>x.id===id)||{}:{};
  const estado=v("tEst");
  const data={titulo:v("tTit"),detalle:v("tDet"),asignado:nz(v("tAsig")),cliente_id:nz(v("tCli")),area:v("tArea2"),prioridad:v("tPrio"),vence:nz(v("tVence")),estado,hecha_el:estado==="hecha"?(prev.hecha_el||new Date().toISOString()):null};
  const ok = id ? await run(sb.from("tareas").update(data).eq("id",id),"Tarea actualizada") : await run(sb.from("tareas").insert(Object.assign({creado_por:S.me.id},data)),"Tarea creada");
  if(ok) closeModal();
}

function formEvento(id, fecha, cliId){
  const ev=id?S.eventos.find(x=>x.id===id)||{}:{fecha:fecha||today(),cliente_id:cliId||"",participantes:[S.me.id],tipo:"Reunión",sede:S.me.sede||""};
  const parts=ev.participantes||[];
  openModal(`<h2>${id?"Editar":"Agendar"}</h2><form class="form" onsubmit="saveEvento(event,'${id||""}')">
    <label class="f full" for="eTit">Título<input type="text" id="eTit" required value="${esc(ev.titulo)}" placeholder="Ej: Presentación de propuesta a prospecto"></label>
    <label class="f" for="eTipo">Tipo<select id="eTipo">${opts(TIPOS_EV,ev.tipo)}</select></label>
    <label class="f" for="eSede">Sede<select id="eSede"><option value="">—</option>${opts(SEDES,ev.sede)}</select></label>
    <label class="f" for="eFecha">Fecha<input type="date" id="eFecha" required value="${esc(ev.fecha)}"></label>
    <label class="f" for="eHora">Hora<input type="time" id="eHora" value="${esc(hhmm(ev.hora))}"></label>
    <label class="f" for="eCli">Cliente<select id="eCli">${cliOptions(ev.cliente_id)}</select></label>
    <label class="f" for="eCont">Prospecto / contacto<input type="text" id="eCont" value="${esc(ev.contacto)}" placeholder="Si no es cliente todavía"></label>
    <label class="f" for="eLugar">Lugar<input type="text" id="eLugar" value="${esc(ev.lugar)}" placeholder="Oficina, local del cliente…"></label>
    <label class="f" for="eLink">Link de videollamada<input type="url" id="eLink" value="${esc(ev.link)}" placeholder="https://meet.google.com/…"></label>
    <div class="full"><div class="f" style="margin-bottom:6px">Participantes</div><div class="chips">${S.miembros.filter(m=>m.activo).map(m=>`<label><input type="checkbox" class="eP" value="${m.id}" ${parts.includes(m.id)?"checked":""}> ${esc(m.nombre||m.email)}</label>`).join("")}</div></div>
    <label class="f full" for="eNotas">Notas / minuta<textarea id="eNotas" placeholder="Temas, acuerdos, próximos pasos">${esc(ev.notas)}</textarea></label>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="askDel('eventos','${id}','este evento')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveEvento(e,id){
  e.preventDefault();
  const data={titulo:v("eTit"),tipo:v("eTipo"),sede:v("eSede"),fecha:v("eFecha"),hora:nz(v("eHora")),cliente_id:nz(v("eCli")),contacto:v("eCont"),lugar:v("eLugar"),link:v("eLink"),notas:v("eNotas"),participantes:[...document.querySelectorAll(".eP:checked")].map(x=>x.value)};
  const ok = id ? await run(sb.from("eventos").update(data).eq("id",id),"Actualizado") : await run(sb.from("eventos").insert(Object.assign({creado_por:S.me.id},data)),"Agendado");
  if(ok) closeModal();
}

function formEntrega(id, cliId){
  const en=id?S.entregas.find(x=>x.id===id)||{}:{cliente_id:cliId,formato:"Reel",estado:"En edición",asignado:S.me.id};
  const files=en.archivos||[];
  openModal(`<h2>${id?"Editar pieza":"Nueva pieza"}</h2><form class="form" onsubmit="saveEntrega(event,'${id||""}')">
    <label class="f full" for="nTit">Título<input type="text" id="nTit" required value="${esc(en.titulo)}" placeholder="Ej: Reel promo Black Friday"></label>
    <label class="f" for="nCli">Cliente<select id="nCli" required>${S.clientes.map(c=>`<option value="${c.id}" ${en.cliente_id===c.id?"selected":""}>${esc(c.nombre)}</option>`).join("")}</select></label>
    <label class="f" for="nFmt">Formato<select id="nFmt">${opts(FORMATOS,en.formato)}</select></label>
    <label class="f" for="nEst">Estado<select id="nEst">${opts(EST_ENT,en.estado)}</select></label>
    <label class="f" for="nFecha">Fecha de publicación<input type="date" id="nFecha" value="${esc(en.fecha_pub)}"></label>
    <label class="f" for="nAsig">Responsable<select id="nAsig">${memOptions(en.asignado)}</select></label>
    <label class="f" for="nLink">Link (Drive, Canva…)<input type="url" id="nLink" value="${esc(en.link)}" placeholder="https://drive.google.com/…"></label>
    <label class="f full" for="nCopy">Copy / descripción<textarea id="nCopy" placeholder="Texto para publicar, hashtags">${esc(en.copy)}</textarea></label>
    ${id?`<div class="full"><div class="f" style="margin-bottom:6px">Archivos</div><div class="files">${files.length?files.map((f,i)=>`<div class="file"><span>${esc(f.nombre)}</span><span><button type="button" class="btn sm" onclick="downloadFile('${id}',${i})">Descargar</button> <button type="button" class="btn sm ghost danger" onclick="removeFile('${id}',${i})">Quitar</button></span></div>`).join(""):`<span class="s">Sin archivos. Adjuntalos desde la tarjeta de la pieza (hasta ${MAX_MB} MB c/u).</span>`}</div></div>`:`<p class="full s" style="margin:0">Guardá la pieza y después adjuntá los archivos desde su tarjeta (hasta ${MAX_MB} MB c/u; para videos más pesados usá un link de Drive).</p>`}
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="askDel('entregas','${id}','esta pieza')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveEntrega(e,id){
  e.preventDefault();
  const data={titulo:v("nTit"),cliente_id:v("nCli"),formato:v("nFmt"),estado:v("nEst"),fecha_pub:nz(v("nFecha")),asignado:nz(v("nAsig")),link:v("nLink"),copy:v("nCopy"),actualizado:new Date().toISOString()};
  const ok = id ? await run(sb.from("entregas").update(data).eq("id",id),"Pieza actualizada") : await run(sb.from("entregas").insert(Object.assign({creado_por:S.me.id},data)),"Pieza creada");
  if(ok) closeModal();
}

const dynRow = (cls, fields, a) => `<div class="dyn ${fields.length===2?"two":""} ${cls}">${fields.map(([k,ph])=>`<input type="text" data-k="${k}" placeholder="${ph}" value="${esc((a||{})[k])}" aria-label="${ph}">`).join("")}<button type="button" class="btn sm ghost danger" onclick="this.parentElement.remove()" aria-label="Quitar">✕</button></div>`;
const REC_F=[["nombre","Nombre (Drive creativos, Canva, logos…)"],["url","Link"]];
const ACC_F=[["plataforma","Plataforma (Meta, IG, Tiendanube…)"],["usuario","Usuario / mail"],["link","Link al ítem del gestor"]];
const collect = cls => [...document.querySelectorAll("."+cls)].map(r=>{ const o={}; r.querySelectorAll("input").forEach(i=>o[i.dataset.k]=i.value.trim()); return o; }).filter(o=>Object.values(o).some(Boolean));
function formCliente(id){
  const c=id?cli(id)||{}:{estado:"Onboarding",sede:S.me.sede||""};
  const mk=c.marca||{}, rec=(c.recursos||[]).length?c.recursos:[{}], acc=(c.accesos||[]).length?c.accesos:[{}];
  openModal(`<h2>${id?"Editar ficha":"Nuevo cliente"}</h2><form class="form" onsubmit="saveCliente(event,'${id||""}')">
    <label class="f" for="cNom">Nombre<input type="text" id="cNom" required value="${esc(c.nombre)}"></label>
    <label class="f" for="cRub">Rubro<input type="text" id="cRub" value="${esc(c.rubro)}"></label>
    <label class="f" for="cSede">Sede<select id="cSede"><option value="">—</option>${opts(SEDES,c.sede)}</select></label>
    <label class="f" for="cEst">Estado<select id="cEst">${opts(ESTADOS_CLI,c.estado)}</select></label>
    <label class="f" for="cPlan">Servicio<select id="cPlan"><option value="">—</option>${opts(PLANES,c.plan)}</select></label>
    <label class="f" for="cResp">Responsable<select id="cResp">${memOptions(c.responsable)}</select></label>
    <label class="f" for="cCont">Contacto<input type="text" id="cCont" value="${esc(c.contacto)}"></label>
    <label class="f" for="cWa">WhatsApp<input type="text" id="cWa" value="${esc(c.whatsapp)}"></label>
    <label class="f" for="cIg">Instagram<input type="text" id="cIg" value="${esc(c.instagram)}" placeholder="@usuario"></label>
    <label class="f" for="cWeb">Web<input type="text" id="cWeb" value="${esc(c.web)}"></label>
    <label class="f" for="cIni">Cliente desde<input type="date" id="cIni" value="${esc(c.inicio)}"></label>
    <label class="f" for="cInv">Inversión en ads<input type="text" id="cInv" value="${esc(c.inversion)}" placeholder="Ej: $25.000/día"></label>
    <div class="full"><div class="f" style="margin-bottom:6px">Recursos y carpetas</div><div id="recList">${rec.map(r=>dynRow("rec",REC_F,r)).join("")}</div><button type="button" class="btn sm" onclick="document.getElementById('recList').insertAdjacentHTML('beforeend',dynRow('rec',REC_F))">+ Link</button></div>
    <div class="full"><div class="f" style="margin-bottom:6px">Accesos (sin contraseñas)</div><div id="accList">${acc.map(a=>dynRow("acc-r",ACC_F,a)).join("")}</div><button type="button" class="btn sm" onclick="document.getElementById('accList').insertAdjacentHTML('beforeend',dynRow('acc-r',ACC_F))">+ Acceso</button></div>
    <label class="f" for="mTono">Tono de comunicación<input type="text" id="mTono" value="${esc(mk.tono)}" placeholder="Cercano, técnico, premium…"></label>
    <label class="f" for="mCol">Colores<input type="text" id="mCol" value="${esc(mk.colores)}" placeholder="Negro, dorado, blanco"></label>
    <label class="f" for="mTip">Tipografías<input type="text" id="mTip" value="${esc(mk.tipos)}"></label>
    <label class="f" for="mRef">Competencia / referencias<input type="text" id="mRef" value="${esc(mk.refs)}"></label>
    <label class="f" for="mSi">Qué sí<textarea id="mSi">${esc(mk.si)}</textarea></label>
    <label class="f" for="mNo">Qué no<textarea id="mNo">${esc(mk.no)}</textarea></label>
    <label class="f full" for="cNot">Notas<textarea id="cNot">${esc(c.notas)}</textarea></label>
    <div class="actions"><div>${id&&isAdmin()?`<button type="button" class="btn danger" onclick="askDel('clientes','${id}','la ficha de ${esc(c.nombre)} y todo su contenido')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveCliente(e,id){
  e.preventDefault();
  const data={nombre:v("cNom"),rubro:v("cRub"),sede:v("cSede"),estado:v("cEst"),plan:v("cPlan"),responsable:nz(v("cResp")),contacto:v("cCont"),whatsapp:v("cWa"),instagram:v("cIg"),web:v("cWeb"),inicio:nz(v("cIni")),inversion:v("cInv"),notas:v("cNot"),
    recursos:collect("rec"),accesos:collect("acc-r"),marca:{tono:v("mTono"),colores:v("mCol"),tipos:v("mTip"),refs:v("mRef"),si:v("mSi"),no:v("mNo")},actualizado:new Date().toISOString()};
  if(id){ if(await run(sb.from("clientes").update(data).eq("id",id),"Ficha actualizada")) closeModal(); }
  else {
    const { data:row, error } = await sb.from("clientes").insert(data).select().single();
    if(error){ toast("No se pudo guardar: "+error.message); return; }
    toast("Cliente creado"); closeModal(); S.clientes.push(row); location.hash="cliente-"+row.id;
  }
}

function formEnfoque(){
  const e=cfg("enfoque")||{}, objs=(Array.isArray(e.objetivos)?e.objetivos:[]).map(o=>o.t).join("\n");
  openModal(`<h2>Enfoque de la semana</h2><form class="form" onsubmit="saveEnfoque(event)">
    <label class="f full" for="fTxt">Prioridad principal<textarea id="fTxt" placeholder="Ej: Cerrar 5 clientes nuevos en Salta y dejar listas las campañas de diciembre.">${esc(e.texto)}</textarea></label>
    <label class="f full" for="fObj">Objetivos (uno por línea)<textarea id="fObj">${esc(objs)}</textarea></label>
    <div class="actions"><span></span><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveEnfoque(ev){
  ev.preventDefault();
  const old=(cfg("enfoque")||{}).objetivos||[];
  const objetivos=v("fObj").split("\n").map(s=>s.trim()).filter(Boolean).map(t=>({t,hecho:!!(old.find(o=>o.t===t)||{}).hecho}));
  if(await run(sb.from("config").upsert({clave:"enfoque",valor:{texto:v("fTxt"),objetivos,por:S.me.id},actualizado:new Date().toISOString()}),"Enfoque guardado")) closeModal();
}
async function toggleObj(i){
  const e=cfg("enfoque"); if(!e) return;
  const valor=Object.assign({},e,{objetivos:e.objetivos.map((o,j)=>j===i?{t:o.t,hecho:!o.hecho}:o)});
  await run(sb.from("config").update({valor,actualizado:new Date().toISOString()}).eq("clave","enfoque"));
}

/* ---------- Arranque ---------- */
boot().then(handleRecovery);
