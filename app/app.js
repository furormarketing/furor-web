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
  ["inicio","Inicio","home","Operación"],["agenda","Agenda","cal","Operación"],["tareas","Tareas","check","Operación"],["chat","Chat","chat","Operación"],
  ["clientes","Clientes","briefcase","Cuentas"],["contenido","Contenido","grid","Cuentas"],["publicados","Publicados","link","Cuentas"],
  ["prospectos","Prospectos","target","Ventas"],["plantillas","Plantillas","message","Ventas"],["material","Material","file","Ventas"],
  ["novedades","Novedades","bell","Equipo"],["equipo","Equipo","users","Equipo"],
  ["direccion","Dirección","lock","Privado"]
];
const navItems = () => NAV.filter(n=>n[0]!=="direccion"||isAdmin());
const MOBILE_NAV = ["inicio","agenda","prospectos","chat"];
const ICONS = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>',
  cal:'<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  check:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
  chat:'<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
  briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  message:'<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12.5h5"/>',
  file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  lock:'<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  phone:'<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/>',
  wa:'<path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z"/><path d="M9 9.5c.5 2 2 3.5 4.5 4.5l1-1.2 2 .9c-.3 1.3-1.3 1.8-2.3 1.6-3-.6-5.4-3-6-6-.2-1 .3-2 1.6-2.3l.9 2z"/>',
  ok:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  play:'<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
  pause:'<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  link:'<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  send:'<path d="M21 3 3 10.5l7 3 3 7z"/><path d="m10 13.5 4.5-4.5"/>'
};
const icon = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||""}</svg>`;
const ETAPAS = ["Nuevo","Contactado","Reunión agendada","Propuesta enviada","Ganado","Perdido"];
const ETAPA_C = {"Nuevo":"var(--s-otra)","Contactado":"var(--info)","Reunión agendada":"var(--warn)","Propuesta enviada":"var(--s-sde)","Ganado":"var(--ok)","Perdido":"var(--danger)"};
const CAT_MAT = ["Honorarios","Propuestas","Contratos","Presentaciones","Guías y procesos","General"];
const ETAPAS_TPL = ["Primer contacto","Seguimiento","Reunión","Propuesta","Cierre","Recuperar","Otro"];
const ORIGENES = ["Anuncio Meta","Instagram orgánico","Referido","Búsqueda en frío","Google","Web","Otro"];
const SEDES = ["Tucumán","Salta","Santiago del Estero","Otra provincia"];
const SEDE_VAR = {"Tucumán":"--s-tuc","Salta":"--s-sal","Santiago del Estero":"--s-sde"};
const ROLES = {admin:"Dirección",cm:"Community Manager",setter:"Setter",diseno:"Diseño gráfico",ugc:"UGC",web:"Desarrollo web",otro:"Otro"};
const AREAS = ["General","Ventas / Setter","Community","Diseño","Ads","Web","Administración"];
const ESTADOS_CLI = ["Activo","Onboarding","En pausa","Baja"];
const PLANES = ["Plan base","Plan expansión","Solo gestión de ads","Desarrollo web","Otro"];
const TIPOS_EV = ["Reunión","Llamada","Videollamada","Visita","Feriado"];
const esFer = e => e.tipo==="Feriado";
const feriadosDe = (fecha, sede) => S.eventos.filter(e=>esFer(e)&&e.fecha===fecha&&(!sede||!e.sede||e.sede===sede));
const FORMATOS = ["Feed","Reel","Carrusel","Historia"];
const EST_ENT = ["En edición","Para revisar","Aprobada","Programada","Publicada"];
const DKEYS = ["lun","mar","mie","jue","vie","sab","dom"];
const DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MES_C = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const TABLES = ["miembros","clientes","tareas","eventos","entregas","publicaciones","mensajes","novedades","config","material","plantillas","prospectos","publicados","lecturas"];
const MAX_MB = 50;

/* ---------- Estado ---------- */
const S = {
  session:null, me:null, loading:true, authMode:"entrar", authErr:"", authBusy:false,
  miembros:[], clientes:[], tareas:[], eventos:[], entregas:[], publicaciones:[], mensajes:[], novedades:[], config:[], material:[], plantillas:[], prospectos:[], publicados:[], selPub:{}, lecturas:[], rec:null,
  more:false, chatOpen:false, tEstM:'pendiente', pendAtt:{}, sending:false, tareaId:null, mobile:window.matchMedia('(max-width:900px)').matches, pEtM:'',
  view:"inicio", cliId:null, cliTab:"resumen",
  f:{ cliQ:"", cliSede:"", cliEstado:"Activo", tScope:"todas", tArea:"", agSede:"", calSel:null, ctScope:"todas", chatQ:"", pScope:"todos", pSede:"", pQ:"", matCat:"", tplEt:"", pubEst:"pendientes", pubCli:"", pubQ:"" },
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
const MEM_COLORS=["#185638","#1f5fa6","#c2570c","#8e3fb0","#b8326b","#0f7c80","#7a5a10","#4b5bd6","#a33a2a","#2f7d32"];
function memColor(id){ const i=S.miembros.findIndex(m=>m.id===id); if(i>=0) return MEM_COLORS[i%MEM_COLORS.length]; let h=0; for(const c of String(id)) h=(h*31+c.charCodeAt(0))>>>0; return MEM_COLORS[h%MEM_COLORS.length]; }
const cliName = id => cli(id)?.nombre || "";
const norm = s => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const hermanos = c => c && c.contacto ? S.clientes.filter(x=>x.id!==c.id && norm(x.contacto)===norm(c.contacto) && norm(x.contacto)!==norm(x.nombre)) : [];
const cfg = k => (S.config.find(c=>c.clave===k)||{}).valor || null;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),3000); }
const ls = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };

/* ---------- Datos ---------- */
const ORDER = { mensajes:["creado",true], novedades:["creado",false], miembros:["nombre",true], clientes:["nombre",true], material:["creado",false], plantillas:["orden",true], prospectos:["actualizado",false], publicados:["fecha",false] };
async function loadTable(t){
  let q = sb.from(t).select("*");
  if(ORDER[t]) q = q.order(ORDER[t][0], {ascending:ORDER[t][1]});
  if(t==="mensajes") q = sb.from(t).select("*").order("creado",{ascending:false}).limit(1500);
  if(t==="publicaciones") q = q.gte("fecha", addDays(today(),-60));
  if(t==="publicados") q = q.gte("fecha", addDays(today(),-120));
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
const PK = { lecturas:r=>r.miembro_id+"|"+r.canal, config:r=>r.clave };
const keyOf = (t,r) => (PK[t]||(x=>x.id))(r);
let _rf=0;
function renderSoon(){ if(_rf) return; _rf=requestAnimationFrame(()=>{ _rf=0; render(); }); }
function applyChange(t, p){
  const arr=S[t]; if(!Array.isArray(arr)) return scheduleReload(t);
  const ev=p.eventType, nw=p.new, old=p.old;
  if(ev==="DELETE"){ const k=keyOf(t,old); S[t]=arr.filter(r=>keyOf(t,r)!==k); }
  else {
    if(!nw || Array.isArray(nw) || Object.keys(nw).length===0 || (PK[t]?false:!nw.id)) return scheduleReload(t);
    const k=keyOf(t,nw), i=arr.findIndex(r=>keyOf(t,r)===k);
    // reemplaza el mensaje "enviando…" propio por el definitivo
    if(ev==="INSERT" && t==="mensajes") S.mensajes=arr.filter(r=>!(String(r.id).startsWith("tmp")&&r.autor===nw.autor&&(r.texto||"")===(nw.texto||"")&&(r.adjuntos||[]).length===(nw.adjuntos||[]).length));
    if(ev==="INSERT" && t==="publicaciones") S.publicaciones=arr.filter(r=>!(r.id==="tmp"&&r.cliente_id===nw.cliente_id&&r.fecha===nw.fecha&&r.formato===nw.formato));
    const cur=S[t], j=cur.findIndex(r=>keyOf(t,r)===k);
    if(j>=0) cur[j]=nw; else cur.push(nw);
    if(t==="mensajes") S.mensajes.sort((a,b)=>String(a.creado).localeCompare(String(b.creado)));
  }
  if(t==="miembros") S.me = S.miembros.find(m=>m.user_id===S.session?.user?.id) || S.me;
  renderSoon();
}
S.rt="conectando";
function subscribe(){
  if(channel) sb.removeChannel(channel);
  // El canal de tiempo real necesita la credencial del usuario: sin ella, las reglas de seguridad no dejan pasar los avisos
  if(S.session?.access_token) sb.realtime.setAuth(S.session.access_token);
  channel = sb.channel("furor-db");
  TABLES.forEach(t=>channel.on("postgres_changes",{event:"*",schema:"public",table:t},p=>applyChange(t,p)));
  channel.subscribe(st=>{
    const antes=S.rt;
    S.rt = st==="SUBSCRIBED" ? "ok" : (st==="CHANNEL_ERROR"||st==="TIMED_OUT"||st==="CLOSED") ? "caido" : "conectando";
    if(st==="SUBSCRIBED" && antes==="caido") ponerseAlDia();
    if(S.rt==="caido") setTimeout(()=>{ if(S.rt==="caido") subscribe(); },4000);
    if(antes!==S.rt) renderSoon();
  });
}
// Respaldo: cada pocos segundos trae solo los mensajes nuevos (por si el tiempo real se corta)
async function ponerseAlDia(){
  if(!S.me) return;
  const ult=S.mensajes.filter(m=>!String(m.id).startsWith("tmp")).slice(-1)[0];
  const q=sb.from("mensajes").select("*").order("creado",{ascending:true}).limit(200);
  const { data } = ult ? await q.gt("creado", ult.creado) : await q;
  (data||[]).forEach(m=>applyChange("mensajes",{eventType:"INSERT",new:m}));
  const { data:lec } = await sb.from("lecturas").select("*");
  if(lec){ S.lecturas=lec; renderSoon(); }
}
setInterval(()=>{ if(S.me && !document.hidden) ponerseAlDia(); }, 8000);
// Al volver a la app después de un rato, se trae todo de nuevo (por si se cortó la conexión)
let _hiddenAt=0;
document.addEventListener("visibilitychange",async()=>{
  if(document.hidden){ _hiddenAt=Date.now(); return; }
  if(S.me && _hiddenAt && Date.now()-_hiddenAt>30000){ await Promise.all(TABLES.map(loadTable)); subscribe(); render(); }
});
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
    if(session?.access_token) sb.realtime.setAuth(session.access_token);
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
    estadoPush().then(render);
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
  else if(h.startsWith("tarea-")){ S.view="tareas"; S.tareaId=h.slice(6); S.cliId=null; }
  else { S.view = NAV.some(n=>n[0]===h) ? h : "inicio"; S.cliId=null; S.tareaId=null; }
  if(S.view==="direccion" && S.me && !isAdmin()){ S.view="inicio"; }
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
const chKey = m => m.tarea_id ? "t-"+m.tarea_id : (m.cliente_id||"general");
function vistoHasta(ch, mid){
  const r=S.lecturas.find(l=>l.miembro_id===(mid||S.me?.id)&&l.canal===ch);
  return r ? r.visto_hasta : (mid ? "" : ls.get("furor-seen-"+ch,""));
}
function unread(ch){
  const seen=vistoHasta(ch);
  return S.mensajes.filter(m=>chKey(m)===ch && m.autor!==S.me?.id && m.creado>seen).length;
}
function unreadTotal(){ const chs=new Set(S.mensajes.filter(m=>!m.tarea_id).map(chKey)); let n=0; chs.forEach(c=>n+=unread(c)); return n; }
const _seenQ={};
function markSeen(ch){
  const last=S.mensajes.filter(m=>chKey(m)===ch && !String(m.id).startsWith("tmp")).slice(-1)[0]; if(!last) return;
  ls.set("furor-seen-"+ch,last.creado);
  if(document.hidden) return;
  const cur=S.lecturas.find(l=>l.miembro_id===S.me.id&&l.canal===ch);
  if(cur && cur.visto_hasta>=last.creado) return;
  if(_seenQ[ch]===last.creado) return; _seenQ[ch]=last.creado;
  if(cur) cur.visto_hasta=last.creado; else S.lecturas.push({miembro_id:S.me.id,canal:ch,visto_hasta:last.creado});
  sb.from("lecturas").upsert({miembro_id:S.me.id,canal:ch,visto_hasta:last.creado},{onConflict:"miembro_id,canal"}).then(({error})=>{ if(error) console.error(error); });
}
document.addEventListener("visibilitychange",()=>{ if(!document.hidden && S.me) render(); });
const openPedidos = () => S.mensajes.filter(m=>m.pedido && !m.resuelto);

/* ---------- Render ---------- */
const LOGO = "img/logo-furor.png";
function render(){
  const root=$("#root");
  if(S.loading){ root.innerHTML=`<div class="login"><div class="side-brand"><img src="${LOGO}" alt="Furor Marketing"><div></div><small>Cargando…</small></div><div class="form-side"><div class="box"><p>Cargando…</p></div></div></div>`; return; }
  if(!S.session) return renderLogin();
  if(!S.me || !S.me.activo){
    root.innerHTML=`<div class="login"><div class="side-brand"><img src="${LOGO}" alt="Furor Marketing"><div><h2>Panel interno del equipo Furor</h2></div><small>Furor Marketing · Tucumán · Salta · Santiago del Estero</small></div><div class="form-side"><div class="box"><img class="mobile-logo" src="${LOGO}" alt="Furor Marketing"><h1>Acceso pendiente</h1><p>Tu cuenta (${esc(S.session.user.email)}) todavía no está habilitada en el equipo de Furor. Pedile a Marcelo que te sume.</p><button class="btn block" onclick="logout()">Salir</button></div></div></div>`;
    return;
  }
  const ae=document.activeElement, aid=ae&&ae.id, sel=ae&&typeof ae.selectionStart==="number"?ae.selectionStart:null;
  const msgsEl=$(".msgs"), atBottom = msgsEl ? (msgsEl.scrollHeight-msgsEl.scrollTop-msgsEl.clientHeight<60) : true;
  if(!$(".app")){
    root.innerHTML=`<div class="app">
      <aside class="side"><div class="brand"><img src="${LOGO}" alt="Furor Marketing"><div><b>Furor Marketing</b><span>Panel interno</span></div></div><nav id="nav"></nav><div class="me" id="meBox"></div></aside>
      <div><header class="topbar" id="topbar"></header><main id="main"></main></div></div>
      <nav class="bottom-nav" id="bnav"></nav><button class="fab" id="fab" hidden></button><div class="more-sheet" id="more" onclick="if(event.target.id==='more'){S.more=false;render()}"></div>`;
  }
  renderNav();
  const views={inicio:vInicio,agenda:vAgenda,contenido:vContenido,clientes:vClientes,tareas:vTareas,chat:vChat,novedades:vNovedades,equipo:vEquipo,prospectos:vProspectos,plantillas:vPlantillas,material:vMaterial,publicados:vPublicados,direccion:vDireccion};
  $("#main").innerHTML = views[S.view]();
  document.querySelectorAll("body > .daysheet-bg").forEach(x=>x.remove());
  const ds=$("#main .daysheet-bg"); if(ds) document.body.appendChild(ds);
  if(aid){ const el=document.getElementById(aid); if(el){ el.focus(); try{ if(sel!=null) el.setSelectionRange(sel,sel); }catch(e){} } }
  const m2=$(".msgs"); if(m2 && atBottom) m2.scrollTop=m2.scrollHeight;
  if(S.view==="chat" && (!S.mobile || S.chatOpen)) markSeen(S.chatCh);
  if(S.view==="clientes" && S.cliId && S.cliTab==="chat") markSeen(S.cliId);
  if(S.view==="tareas" && S.tareaId) markSeen("t-"+S.tareaId);
  renderFab();
  hidratarImagenes();
}
function navBadges(){
  return { chat:unreadTotal(), tareas:overdue(openTasks().filter(t=>t.asignado===S.me.id)).length, contenido:pendingToday(S.me.rol==="cm").length, prospectos:prospAtrasados(true).length, publicados:(S.me.rol==="admin"?S.publicados.filter(p=>!p.enviado).length:0) };
}
function renderNav(){
  const b=navBadges(); let html="", grp="";
  navItems().forEach(([k,l,ic,g])=>{
    if(g!==grp){ html+=`<div class="nav-group">${g}</div>`; grp=g; }
    html+=`<a href="#${k}" class="${S.view===k?"on":""}">${icon(ic)}<span class="lbl">${l}</span>${b[k]?`<span class="badge">${b[k]}</span>`:""}</a>`;
  });
  $("#nav").innerHTML=`<div class="nav">${html}</div>`;
  const nm=S.me.nombre||S.me.email;
  $("#meBox").innerHTML=`<div class="avatar">${esc(initials(nm))}</div><div style="min-width:0"><div class="n">${esc(nm)}</div><div class="r">${esc(ROLES[S.me.rol]||"")}${S.me.sede?" · "+esc(S.me.sede):""}</div><button onclick="logout()">Cerrar sesión</button></div>`;
  const cur=NAV.find(n=>n[0]===S.view);
  $("#topbar").innerHTML=`<img src="${LOGO}" alt="Furor"><b>${esc(cur?cur[1]:"Furor")}</b><button class="avatar" onclick="S.more=true;render()" aria-label="Más opciones">${esc(initials(nm))}</button>`;
  const inMore=!MOBILE_NAV.includes(S.view), moreBadge=navItems().filter(n=>!MOBILE_NAV.includes(n[0])).reduce((a,n)=>a+(b[n[0]]||0),0);
  $("#bnav").innerHTML=MOBILE_NAV.map(k=>{const n=NAV.find(x=>x[0]===k);return `<a href="#${k}" class="${S.view===k?"on":""}">${icon(n[2])}${n[1]}${b[k]?`<span class="badge">${b[k]}</span>`:""}</a>`;}).join("")+`<button class="${inMore?"on":""}" onclick="S.more=true;render()">${icon("more")}Más${moreBadge?`<span class="badge">${moreBadge}</span>`:""}</button>`;
  const mo=$("#more"); mo.classList.toggle("open",!!S.more);
  mo.innerHTML=S.more?`<div class="sheet">${navItems().filter(n=>!MOBILE_NAV.includes(n[0])).map(([k,l,ic])=>`<a href="#${k}" onclick="S.more=false">${icon(ic)}${l}${b[k]?`<span class="badge" style="position:absolute;top:6px;right:8px">${b[k]}</span>`:""}</a>`).join("")}<button onclick="logout()">${icon("users")}Cerrar sesión</button></div>`:"";
}
function renderLogin(){
  const m=S.authMode;
  $("#root").innerHTML=`<div class="login">
   <div class="side-brand"><img src="${LOGO}" alt="Furor Marketing"><div><h2>El panel donde trabaja el equipo Furor.</h2><p>Agenda de las tres sedes, clientes, contenido, prospectos y material de venta en un solo lugar.</p></div><small>Furor Marketing · Tucumán · Salta · Santiago del Estero</small></div>
   <div class="form-side"><div class="box">
    <img class="mobile-logo" src="${LOGO}" alt="Furor Marketing">
    <h1>${m==="registro"?"Crear mi acceso":m==="recuperar"?"Recuperar contraseña":"Ingresar"}</h1>
    <p>${m==="registro"?"Usá el mail con el que te sumó Marcelo y elegí tu contraseña.":m==="recuperar"?"Te mandamos un link para crear una contraseña nueva.":"Ingresá con tu mail y contraseña del equipo."}</p>
    <form onsubmit="doAuth(event)">
      ${S.authErr?`<div class="err">${esc(S.authErr)}</div>`:""}
      <label class="f" for="aMail">Mail<input type="email" id="aMail" required autocomplete="email" autocapitalize="none"></label>
      ${m!=="recuperar"?`<label class="f" for="aPass">Contraseña<input type="password" id="aPass" required minlength="${m==="registro"?8:1}" autocomplete="${m==="registro"?"new-password":"current-password"}" autocapitalize="none"></label>`:""}
      <button class="btn pri block" ${S.authBusy?"disabled":""}>${S.authBusy?"Un momento…":m==="registro"?"Crear mi acceso":m==="recuperar"?"Enviar link":"Entrar"}</button>
    </form>
    <div class="alt">${m==="entrar"?`¿Primera vez? <a href="#" onclick="S.authMode='registro';S.authErr='';renderLogin();return false;">Crear mi acceso</a> · <a href="#" onclick="S.authMode='recuperar';S.authErr='';renderLogin();return false;">Olvidé mi contraseña</a>`:`<a href="#" onclick="S.authMode='entrar';S.authErr='';renderLogin();return false;">Volver a ingresar</a>`}</div>
   </div></div></div>`;
}
const pageHead = (eyebrow, title, sub, acts) => `<div class="head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub?`<p>${sub}</p>`:""}</div>${acts?`<div class="acts">${acts}</div>`:""}</div>`;
const cardH = (title, right) => `<div class="card-h"><h2>${title}</h2>${right||""}</div>`;
const emptyMsg = (txt, ic) => `<div class="empty">${icon(ic||"ok")}<span>${txt}</span></div>`;

/* ---------- Piezas comunes ---------- */
function evRow(e){
  if(esFer(e)){ const d=parseYmd(e.fecha); return `<div class="row ferrow"><div class="when" style="--sc:var(--danger)"><b>${d.getDate()}</b><span>${MES_C[d.getMonth()]}</span></div>
  <div class="main"><div class="t">${!e.titulo||e.titulo==="Feriado"?`<span class="pill bad">Feriado</span>`:`${esc(e.titulo)} <span class="pill bad">Feriado</span>`}</div><div class="s">${esc([e.sede||"Todas las sedes", relDays(e.fecha), e.notas].filter(Boolean).join(" · "))}</div></div>
  <button class="btn sm ghost" onclick="formEvento('${e.id}')">Editar</button></div>`; }
  const d=parseYmd(e.fecha), parts=(e.participantes||[]).map(memName).join(", "), link=safeUrl(e.link);
  return `<div class="row"><div class="when" style="--sc:${sedeColor(e.sede)}"><b>${d.getDate()}</b><span>${MES_C[d.getMonth()]}</span></div>
  <div class="main"><div class="t">${esc(e.titulo)}</div>
  <div class="s">${esc([e.tipo, hhmm(e.hora)?hhmm(e.hora)+" hs":"", relDays(e.fecha), e.cliente_id?cliName(e.cliente_id):e.contacto, e.sede].filter(Boolean).join(" · "))}</div>
  ${parts?`<div class="s">Con: ${esc(parts)}</div>`:""}
  ${link?`<div class="s"><a href="${esc(link)}" target="_blank" rel="noopener">Unirse a la videollamada</a></div>`:(e.lugar?`<div class="s">${esc(e.lugar)}</div>`:"")}
  </div><button class="btn sm ghost" onclick="formEvento('${e.id}')">Editar</button></div>`;
}
function taskRow(t){
  const late=t.vence&&t.vence<today();
  return `<div class="row"><div class="main"><a class="t" href="#tarea-${t.id}" style="color:inherit;text-decoration:none;display:block">${esc(t.titulo)}</a>
  <div class="s">${esc([memName(t.asignado), t.cliente_id?cliName(t.cliente_id):"", t.area].filter(Boolean).join(" · "))}</div></div>
  ${t.vence?`<span class="pill ${late?"bad":t.vence===today()?"warn":""}">${esc(late?"Venció "+fmtDate(t.vence):fmtDate(t.vence))}</span>`:""}
  <button class="btn sm" onclick="advance('${t.id}')">${t.estado==="curso"?"Terminar":"Empezar"}</button></div>`;
}
function postHtml(n,compact){
  const d=new Date(n.creado);
  return `<div class="row post"><div class="avatar">${esc(initials(memName(n.autor)))}</div><div class="main">
  <div><b>${esc(memName(n.autor))}</b> <span class="s">${d.getDate()} ${MES_C[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}</span> ${n.fijada?`<span class="pill ok">Fijada</span>`:""} ${n.etiqueta?`<span class="pill info">${esc(n.etiqueta)}</span>`:""}</div>
  <div style="white-space:pre-wrap;margin-top:4px;overflow-wrap:anywhere">${esc(n.texto)}</div></div>
  ${!compact&&(isAdmin()||n.autor===S.me.id)?`<div><button class="btn sm ghost" onclick="pinNov('${n.id}')">${n.fijada?"Desfijar":"Fijar"}</button><button class="btn sm ghost danger" onclick="askDel('novedades','${n.id}','esta novedad')">Borrar</button></div>`:""}</div>`;
}
const sortNov = () => S.novedades.slice().sort((a,b)=>(b.fijada?1:0)-(a.fijada?1:0) || String(b.creado).localeCompare(String(a.creado)));
const EST_CLS = {"Activo":"ok","Onboarding":"info","En pausa":"warn","Baja":"bad"};
const estSel = c => `<div class="estsel" role="group" aria-label="Estado de ${esc(c.nombre)}" onclick="event.preventDefault();event.stopPropagation()">${ESTADOS_CLI.map(e=>`<button type="button" class="${EST_CLS[e]} ${c.estado===e?"on":""}" ${c.estado===e?'aria-pressed="true"':""} onclick="event.preventDefault();event.stopPropagation();setEstadoCli('${c.id}','${e}')">${esc(e)}</button>`).join("")}</div>`;
async function setEstadoCli(id, estado){
  const c=cli(id); if(!c||c.estado===estado) return;
  const prev=c.estado; c.estado=estado; render();
  const { error } = await sb.from("clientes").update({estado}).eq("id",id);
  if(error){ c.estado=prev; render(); toast("No se pudo cambiar el estado."); }
  else toast(`${c.nombre}: ${estado}`+(S.f.cliEstado&&S.f.cliEstado!==estado&&S.view==="clientes"&&!S.cliId?` · ya no se muestra con el filtro "${S.f.cliEstado}"`:""));
}
const estPill = e => `<span class="pill ${e==="Activo"?"ok":e==="Onboarding"?"info":e==="En pausa"?"warn":"bad"}">${esc(e||"—")}</span>`;
const entPill = e => `<span class="pill ${e==="Publicada"?"ok":e==="Aprobada"||e==="Programada"?"info":e==="Para revisar"?"warn":""}">${esc(e)}</span>`;

/* ---------- Inicio (Mi día) ---------- */
function vInicio(){
  const t=today(), mineAll=openTasks().filter(x=>x.asignado===S.me.id), mine=sortTasks(mineAll);
  const ferHoy=feriadosDe(t,S.me.sede), evHoy=S.eventos.filter(e=>e.fecha===t&&!esFer(e)).sort((a,b)=>String(a.hora||"").localeCompare(String(b.hora||"")));
  const myEv=evFrom(t).filter(e=>esFer(e)?(!e.sede||!S.me.sede||e.sede===S.me.sede):((e.participantes||[]).includes(S.me.id)||e.creado_por===S.me.id)).slice(0,6);
  const evs = myEv.length ? myEv : evFrom(t).slice(0,6);
  const pend=pendingToday(S.me.rol==="cm"), lateW=lateThisWeek();
  const ped=openPedidos(), paraRevisar=S.entregas.filter(e=>e.estado==="Para revisar");
  const venc=overdue(S.me.rol==="admin"?openTasks():mineAll);
  const pAtr=prospAtrasados(S.me.rol!=="admin"), pHoy=S.prospectos.filter(p=>p.proximo===t&&!["Ganado","Perdido"].includes(p.etapa)&&(S.me.rol==="admin"||p.setter===S.me.id));
  const enf=cfg("enfoque")||{}; const objs=Array.isArray(enf.objetivos)?enf.objetivos:[];
  const first=(S.me.nombre||"").split(" ")[0];

  const alerts=[
    [ferHoy.length?"Hoy":0,"bad","cal","Feriado"+(ferHoy.some(f=>f.titulo&&f.titulo!=="Feriado")?": "+ferHoy.map(f=>f.titulo+(f.sede?" ("+f.sede+")":"")).join(" · "):""),"#agenda"],
    [lateW,"bad","alert","Publicaciones atrasadas esta semana","#contenido"],
    [venc.length,"bad","clock",S.me.rol==="admin"?"Tareas vencidas del equipo":"Tareas tuyas vencidas","#tareas"],
    [pAtr.length,"bad","target","Prospectos con seguimiento atrasado","#prospectos"],
    [ped.length,"warn","chat","Pedidos sin resolver","#chat"],
    [paraRevisar.length,"warn","eye","Piezas esperando revisión","#clientes"],
    [isAdmin()?S.publicados.filter(p=>!p.enviado).length:0,"warn","send","Links publicados sin enviar al cliente","#publicados"],
    [pend.length,"info","grid","Publicaciones para hoy","#contenido"],
    [evHoy.length,"info","cal","Reuniones, llamadas y visitas hoy","#agenda"],
    [pHoy.length,"info","phone","Prospectos para contactar hoy","#prospectos"]
  ].filter(a=>a[0]);

  return `
  ${pageHead(esc(fmtDayLong(t)), first?"Hola, "+esc(first):"Mi día", "", `<button class="btn" onclick="formTarea()">${icon("plus")}Tarea</button><button class="btn" onclick="formProspecto()">${icon("plus")}Prospecto</button><button class="btn pri" onclick="formEvento()">${icon("cal")}Agendar</button>`)}

  ${bannerNotis()}
  <section class="hero">
    <div><div class="eyebrow">Enfoque de la semana</div>
      ${enf.texto?`<p class="focus-text">${esc(enf.texto)}</p>`:`<p class="focus-text" style="opacity:.75">${isAdmin()?"Definí la prioridad de la semana para que todo el equipo empuje para el mismo lado.":"Todavía no hay enfoque cargado para esta semana."}</p>`}
      ${objs.length?`<div class="objs">${objs.map((o,i)=>`<label class="obj ${o.hecho?"done":""}"><input type="checkbox" ${o.hecho?"checked":""} ${isAdmin()?"":"disabled"} onchange="toggleObj(${i})">${esc(o.t)}</label>`).join("")}</div>`:""}
      ${objs.length?`<div class="meta">${objs.filter(o=>o.hecho).length} de ${objs.length} objetivos cumplidos</div>`:""}
    </div>
    ${isAdmin()?`<button class="btn sm" onclick="formEnfoque()">Editar enfoque</button>`:""}
  </section>

  <div class="section-t">${icon("alert")}Requiere atención</div>
  ${alerts.length?`<div class="alerts">${alerts.map(([n,c,ic,l,h])=>`<a class="alert ${c}" href="${h}"><div class="ic">${icon(ic)}</div><div><div class="v">${n}</div><div class="l">${l}</div></div></a>`).join("")}</div>`
    :`<div class="allgood">${icon("ok")}Todo al día. No hay nada atrasado ni pendiente urgente.</div>`}

  <div class="section-t">${icon("clock")}Tu día</div>
  <div class="split">
    <div class="grid">
      <section class="card">${cardH(`${myEv.length?"Mi agenda":"Agenda del equipo"}`, `<a href="#agenda">Ver agenda →</a>`)}
        <div class="list">${evs.length?evs.map(evRow).join(""):emptyMsg("Nada agendado por ahora.","cal")}</div></section>
      <section class="card">${cardH(`Publicar hoy <span class="count">${pend.length}</span>`, `<a href="#contenido">Calendario →</a>`)}
        <div class="list">${pend.length?pend.slice(0,10).map(({c,f})=>`<div class="row"><div class="main"><div class="t">${esc(c.nombre)}</div><div class="s">${esc(f)}${c.instagram?" · "+esc(c.instagram):""}</div></div><button class="btn sm pri" onclick="togglePub('${c.id}','${t}','${f}')">${icon("ok")}Publicado</button></div>`).join(""):emptyMsg(pautaClients().length?"Todo publicado por hoy.":"Cargá la pauta de cada cliente para ver acá lo que toca subir.","grid")}</div></section>
      ${(S.me.rol==="setter"||isAdmin())?`<section class="card">${cardH(`Prospectos a contactar <span class="count">${pAtr.length+pHoy.length}</span>`, `<a href="#prospectos">Prospectos →</a>`)}
        <div class="list">${[...pAtr,...pHoy].slice(0,8).map(prospRow).join("")||emptyMsg("No hay seguimientos pendientes.","target")}</div></section>`:""}
    </div>
    <div class="grid">
      <section class="card">${cardH(`Mis tareas <span class="count">${mine.length}</span>`, `<a href="#tareas">Tablero →</a>`)}
        <div class="list">${mine.length?mine.slice(0,7).map(taskRow).join(""):emptyMsg("No tenés tareas pendientes.","check")}</div></section>
      <section class="card">${cardH(`Pedidos abiertos <span class="count">${ped.length}</span>`, `<a href="#chat">Chat →</a>`)}
        <div class="list">${ped.length?ped.slice(-6).reverse().map(m=>`<div class="row"><div class="main"><div class="t">${esc(m.texto.length>110?m.texto.slice(0,110)+"…":m.texto)}</div><div class="s">${esc(memName(m.autor))} · ${esc(m.cliente_id?cliName(m.cliente_id):"General")}</div></div><button class="btn sm" onclick="resolver('${m.id}')">Resuelto</button></div>`).join(""):emptyMsg("No hay pedidos abiertos.","chat")}</div></section>
      <section class="card">${cardH("Novedades", `<a href="#novedades">Ver todas →</a>`)}
        <div class="list">${S.novedades.length?sortNov().slice(0,3).map(n=>postHtml(n,true)).join(""):emptyMsg("Sin novedades.","bell")}</div></section>
    </div>
  </div>`;
}

/* ---------- Agenda ---------- */
function vAgenda(){
  const {y,m}=S.cal, first=new Date(y,m,1), start=new Date(first); start.setDate(1-((first.getDay()+6)%7));
  const t=today(), evs=S.eventos.filter(e=>!S.f.agSede||e.sede===S.f.agSede||(esFer(e)&&!e.sede));
  const by={}; evs.forEach(e=>(by[e.fecha]=by[e.fecha]||{e:[],t:[]}).e.push(e));
  openTasks().forEach(x=>{ if(x.vence) (by[x.vence]=by[x.vence]||{e:[],t:[]}).t.push(x); });
  let cells=DIAS.map(d=>`<div class="dow">${d}</div>`).join("");
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i); const k=ymd(d), it=by[k]||{e:[],t:[]}, fer=it.e.filter(esFer);
    const list=[...it.e.filter(e=>!esFer(e)).sort((a,b)=>String(a.hora||"").localeCompare(String(b.hora||""))).map(e=>`<div class="ev ${e.tipo==="Visita"?"visita":""}" style="--sc:${sedeColor(e.sede)}" title="${esc(e.tipo+": "+e.titulo)}">${esc((hhmm(e.hora)?hhmm(e.hora)+" ":"")+e.titulo)}</div>`), ...it.t.map(x=>`<div class="ev task" title="${esc(x.titulo)}">${esc(x.titulo)}</div>`)];
    cells+=`<div class="day ${d.getMonth()!==m?"out":""} ${k===t?"today":""} ${S.f.calSel===k?"sel":""} ${fer.length?"feriado":""}" tabindex="0" onclick="abrirDia('${k}')" onkeydown="if(event.key==='Enter')abrirDia('${k}')"><div class="num">${d.getDate()}</div>${fer.length?`<div class="fer" title="${esc(fer.map(f=>f.titulo+(f.sede?" ("+f.sede+")":"")).join(" · "))}">${esc(fer[0].titulo||"Feriado")}</div>`:""}${list.slice(0,3).join("")}${list.length>3?`<div class="ev more">+${list.length-3} más</div>`:""}</div>`;
  }
  const sel=S.f.calSel||t, si=by[sel]||{e:[],t:[]};
  return `
  <div class="head"><div><div class="eyebrow">Operación</div><h1>Agenda Furor</h1><p>Reuniones, llamadas, visitas de producción y feriados de Tucumán, Salta y Santiago del Estero</p></div>
    <div class="acts"><button class="btn" onclick="calMove(-1)" aria-label="Mes anterior">‹</button><h2 style="min-width:150px;text-align:center;text-transform:capitalize">${MESES[m]} ${y}</h2><button class="btn" onclick="calMove(1)" aria-label="Mes siguiente">›</button><button class="btn" onclick="calToday()">Hoy</button><button class="btn" onclick="toggleFeriado('${sel}')">${(by[sel]||{e:[]}).e.some(esFer)?"Quitar feriado":"Marcar feriado"}</button><button class="btn pri" onclick="formEvento(null,'${sel}')">${icon("plus")}Agendar</button></div></div>
  <div class="toolbar"><div class="seg">${["",...SEDES.slice(0,3)].map(s=>`<button class="${S.f.agSede===s?"on":""}" onclick="S.f.agSede='${s}';render()">${s||"Todas las sedes"}</button>`).join("")}</div>
    <div class="legend">${SEDES.slice(0,3).map(s=>`<span><span class="sede-dot" style="--sc:${sedeColor(s)}"></span>${s}</span>`).join("")}<span><span class="sede-dot" style="border:1px solid var(--warn)"></span>Vence tarea</span><span><span class="sede-dot" style="background:var(--danger)"></span>Feriado</span></div></div>
  <div class="cal-layout"><div class="cal">${cells}</div>
    ${S.mobile?(S.diaSheet?`<div class="daysheet-bg" onclick="if(event.target===this){S.diaSheet=false;render()}"><section class="card daypanel sheet">${dayPanel(sel,si)}</section></div>`:""):`<section class="card daypanel">${dayPanel(sel,si)}</section>`}</div>`;
}
const QA_TIPOS=[["Reunión","users"],["Llamada","phone"],["Videollamada","eye"],["Visita","image"],["Tarea","check"]];
function dayPanel(sel, si){
  if(S.qa==="Feriado") S.qa="Reunión";
  const tp=S.qa||"Reunión", conHora=tp!=="Tarea", esF=si.e.some(esFer);
  const ph={Reunión:"Ej: Reunión con Cálido",Llamada:"Ej: Llamar a prospecto de Salta",Videollamada:"Ej: Presentación de propuesta",Tarea:"Ej: Diseñar placas de DG Service",Visita:"Qué se produce (opcional)",Feriado:"Ej: Día de la Soberanía Nacional"}[tp];
  return `<div class="dp-h"><h2>${esc(fmtDayLong(sel))}</h2>${S.mobile?`<button class="btn sm ghost" onclick="S.diaSheet=false;render()" aria-label="Cerrar">✕</button>`:""}</div>
  <form class="qadd" onsubmit="quickAdd(event,'${sel}')">
    <div class="qtipos">${QA_TIPOS.map(([t,ic])=>`<button type="button" class="${tp===t?"on":""}" onclick="S.qa='${t}';render();setTimeout(()=>{const i=document.getElementById('qaTit');if(i&&!S.mobile)i.focus()})">${icon(ic)}${t}</button>`).join("")}<button type="button" class="fer-t ${esF?"on":""}" onclick="toggleFeriado('${sel}')" title="${esF?"Quitar el feriado de este día":"Marcar este día como feriado"}">${icon("cal")}${esF?"Es feriado · quitar":"Feriado"}</button></div>
    ${tp==="Visita"?`<div class="qrow" style="margin-bottom:6px"><select id="qaCli" aria-label="Cliente" onchange="S.qaCli=this.value">${cliOptions(S.qaCli||"").replace("Ninguno / interno","Elegí el cliente…")}</select></div>`:""}
    <div class="qrow"><input type="text" id="qaTit" ${tp==="Visita"?"":"required"} autocomplete="off" placeholder="${esc(ph)}" value="${esc(S.qaTxt||"")}" oninput="S.qaTxt=this.value">
      ${conHora?`<input type="time" id="qaHora" aria-label="Hora" value="${esc(S.qaHora||"")}" oninput="S.qaHora=this.value">`:""}
      <button class="btn pri" id="qaBtn">${icon("plus")}Agregar</button></div>
    <button type="button" class="qmas" onclick="qaMas('${sel}')">Más detalles (cliente, sede, participantes…)</button>
  </form>
  <div class="dp-list">
  ${si.e.length||si.t.length?"":`<div class="empty">Nada para este día todavía.</div>`}
  ${si.e.length?`<div class="list">${si.e.map(evRow).join("")}</div>`:""}
  ${si.t.length?`<h3 style="margin:14px 0 4px">Vencen</h3><div class="list">${si.t.map(taskRow).join("")}</div>`:""}</div>`;
}
async function toggleFeriado(fecha){
  const ex=S.eventos.filter(e=>esFer(e)&&e.fecha===fecha);
  if(ex.length){
    S.eventos=S.eventos.filter(e=>!ex.includes(e)); render();
    const { error } = await sb.from("eventos").delete().in("id",ex.map(e=>e.id));
    if(error){ S.eventos.push(...ex); render(); toast("No se pudo quitar."); } else toast("Feriado quitado");
    return;
  }
  const { data, error } = await sb.from("eventos").insert({titulo:"Feriado",tipo:"Feriado",fecha,sede:"",participantes:[],creado_por:S.me.id}).select().single();
  if(error){ toast("No se pudo guardar: "+error.message); return; }
  if(data && !Array.isArray(data)) applyChange("eventos",{eventType:"INSERT",new:data});
  toast("Marcado como feriado");
}
function abrirDia(k){
  if(S.f.calSel!==k){ S.qaTxt=""; S.qaHora=""; }
  S.f.calSel=k; if(S.mobile) S.diaSheet=true; render();
  if(!S.mobile) setTimeout(()=>{ const i=document.getElementById("qaTit"); if(i) i.focus(); });
}
function qaMas(fecha){
  const tp=S.qa||"Reunión", tit=S.qaTxt||"";
  if(tp==="Tarea"){ formTarea(null,null,fecha); }
  else { formEvento(null,fecha); const sel=document.getElementById("eTipo"); if(sel){ sel.value=tp; } const ec=document.getElementById("eCli"); if(ec&&S.qaCli) ec.value=S.qaCli; const h=document.getElementById("eHora"); if(h&&S.qaHora) h.value=S.qaHora; }
  const ti=document.getElementById(tp==="Tarea"?"tTit":"eTit"); if(ti&&tit) ti.value=tit;
}
async function quickAdd(e, fecha){
  e.preventDefault();
  const tp=S.qa||"Reunión"; let titulo=(S.qaTxt||"").trim();
  const cliV = tp==="Visita" ? (S.qaCli||"") : "";
  if(tp==="Visita"){ if(!cliV){ toast("Elegí el cliente de la visita"); return; } const cn=cliName(cliV); titulo = titulo ? `Visita ${cn} · ${titulo}` : `Visita a ${cn}`; }
  if(!titulo) return;
  const btn=document.getElementById("qaBtn"); if(btn) btn.disabled=true;
  let res;
  if(tp==="Tarea") res=await sb.from("tareas").insert({titulo,vence:fecha,asignado:S.me.id,prioridad:"media",estado:"pendiente",area:"General",creado_por:S.me.id}).select().single();
  else res=await sb.from("eventos").insert({titulo,tipo:tp,fecha,hora:nz(S.qaHora||""),cliente_id:cliV||null,sede:(cliV&&cli(cliV)?.sede)||S.me.sede||"",participantes:[S.me.id],creado_por:S.me.id}).select().single();
  if(btn) btn.disabled=false;
  if(res.error){ toast("No se pudo guardar: "+res.error.message); return; }
  applyChange(tp==="Tarea"?"tareas":"eventos",{eventType:"INSERT",new:res.data});
  S.qaTxt=""; S.qaHora=""; S.qaCli=""; render(); toast(tp==="Tarea"?"Tarea agregada":tp==="Visita"?"Visita agendada":"Agendado");
  if(!S.mobile) setTimeout(()=>{ const i=document.getElementById("qaTit"); if(i) i.focus(); });
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
  <div class="head"><div><div class="eyebrow">Cuentas</div><h1>Calendario de contenido</h1><p>Qué se publica en cada cuenta, día por día. Tocá cada casilla para marcarla como publicada.</p></div>
    <div class="acts"><button class="btn" onclick="S.weekOff--;render()" aria-label="Semana anterior">‹</button><h2 style="min-width:170px;text-align:center">${fmtDate(days[0])} – ${fmtDate(days[6])}</h2><button class="btn" onclick="S.weekOff++;render()" aria-label="Semana siguiente">›</button><button class="btn" onclick="S.weekOff=0;render()">Esta semana</button></div></div>
  <div class="toolbar"><div class="seg"><button class="${S.f.ctScope==="todas"?"on":""}" onclick="S.f.ctScope='todas';render()">Todas las cuentas</button><button class="${S.f.ctScope==="mias"?"on":""}" onclick="S.f.ctScope='mias';render()">Mis cuentas</button></div>
    ${late?`<span class="pill bad">${late} publicaciones atrasadas esta semana</span>`:`<span class="pill ok">Semana al día</span>`}
    <span class="s">Verde: publicado · Rojo: atrasado · Línea punteada: pieza programada</span></div>
  ${list.length?`<div class="week"><table><thead><tr><th>Cuenta</th>${days.map((d,i)=>{ const f=feriadosDe(d); return `<th class="${d===t?"today":""} ${f.length?"ferth":""}">${DIAS[i]} ${parseYmd(d).getDate()}${f.length?`<span class="pill bad" title="${esc(f.map(x=>x.titulo+(x.sede?" ("+x.sede+")":"")).join(" · "))}">Feriado</span>`:""}</th>`; }).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`
    :`<div class="card"><div class="empty">Ninguna cuenta tiene pauta cargada. Entrá a un cliente → pestaña <b>Pauta</b> y marcá qué se publica cada día.</div></div>`}`;
}
async function togglePub(cid,fecha,formato){
  const ex=S.publicaciones.find(p=>p.cliente_id===cid&&p.fecha===fecha&&p.formato===formato);
  if(ex){ S.publicaciones=S.publicaciones.filter(p=>p!==ex); render(); await run(sb.from("publicaciones").delete().eq("id",ex.id)); }
  else { const row={cliente_id:cid,fecha,formato,hecho_por:S.me.id}; S.publicaciones.push(Object.assign({id:"tmp"},row)); render(); if(await run(sb.from("publicaciones").insert(row))) formPublicado(null,cid,fecha,formato,true); }
}

/* ---------- Clientes ---------- */
function vClientes(){
  if(S.cliId){ const c=cli(S.cliId); if(c) return fichaCliente(c); }
  const q=S.f.cliQ.toLowerCase();
  const base=S.clientes.filter(c=>!S.f.cliEstado||c.estado===S.f.cliEstado);
  const tiles=`<div class="sede-tiles"><button class="stile ${!S.f.cliSede?"on":""}" onclick="S.f.cliSede='';render()" style="--sc:var(--brand)"><b>${base.length}</b><span>${S.f.cliEstado?esc(S.f.cliEstado)+"s":"Todos"}</span></button>${SEDES.slice(0,3).map(sd=>`<button class="stile ${S.f.cliSede===sd?"on":""}" onclick="S.f.cliSede=S.f.cliSede==='${sd}'?'':'${sd}';render()" style="--sc:${sedeColor(sd)}"><b>${base.filter(c=>c.sede===sd).length}</b><span>${sd}</span></button>`).join("")}</div>`;
  const list=S.clientes.filter(c=>(!S.f.cliSede||c.sede===S.f.cliSede)&&(!S.f.cliEstado||c.estado===S.f.cliEstado)&&(!q||[c.nombre,c.rubro,c.instagram,c.contacto].join(" ").toLowerCase().includes(q)));
  return `
  <div class="head"><div><div class="eyebrow">Cuentas</div><h1>Clientes</h1><p>Ficha, recursos, entregas y chat de cada cuenta</p></div><button class="btn pri" onclick="formCliente()">${icon("plus")}Nuevo cliente</button></div>
  ${tiles}
  <div class="toolbar">
    <input type="search" id="cliQ" placeholder="Buscar por nombre, rubro, Instagram…" value="${esc(S.f.cliQ)}" oninput="S.f.cliQ=this.value;render()">
    <select id="cliSede" aria-label="Sede" onchange="S.f.cliSede=this.value;render()"><option value="">Todas las sedes</option>${SEDES.map(s=>`<option ${S.f.cliSede===s?"selected":""}>${s}</option>`).join("")}</select>
    <select id="cliEstado" aria-label="Estado" onchange="S.f.cliEstado=this.value;render()"><option value="">Todos los estados</option>${ESTADOS_CLI.map(s=>`<option ${S.f.cliEstado===s?"selected":""}>${s}</option>`).join("")}</select>
    <span class="pill">${list.length} de ${S.clientes.length}</span></div>
  ${S.mobile&&list.length?`<div class="mcards">${list.map(c=>{ const ents=S.entregas.filter(e=>e.cliente_id===c.id&&e.estado!=="Publicada").length; const un=unread(c.id);
    return `<a class="mcard cli" href="#cliente-${c.id}" style="--sc:${sedeColor(c.sede)}"><div class="mc-top">${cliAv(c)}<b class="cn">${esc(c.nombre)}</b></div>${c.contacto&&c.contacto!==c.nombre?`<div class="titular">${icon("users")}${esc(c.contacto)}${hermanos(c).length?` <span class="pill">${hermanos(c).length+1} negocios</span>`:""}</div>`:""}
    <div class="s">${c.sede?`<span class="sede-dot" style="--sc:${sedeColor(c.sede)}"></span>${esc(c.sede)}`:"Sin sede"}${c.rubro?" · "+esc(c.rubro):""}${c.responsable?" · "+esc(memName(c.responsable)):""}</div>
    ${ents||un?`<div style="display:flex;gap:6px;margin-top:6px">${ents?`<span class="pill info">${ents} pieza${ents>1?"s":""}</span>`:""}${un?`<span class="pill bad">${un} mensajes</span>`:""}</div>`:""}${estSel(c)}</a>`; }).join("")}</div>`
  :list.length?`<div class="table-wrap"><table><thead><tr><th>Negocio · Titular</th><th>Sede</th><th>Servicio</th><th>Responsable</th><th>Estado</th><th>Pendiente</th></tr></thead><tbody>
  ${list.map(c=>{ const ents=S.entregas.filter(e=>e.cliente_id===c.id&&e.estado!=="Publicada").length; const un=unread(c.id); return `<tr class="click cli-tr" style="--sc:${sedeColor(c.sede)}" onclick="location.hash='cliente-${c.id}'"><td><div class="cli-cell">${cliAv(c)}<div><b class="cn">${esc(c.nombre)}</b>${c.contacto&&c.contacto!==c.nombre?`<div class="titular">${icon("users")}${esc(c.contacto)}${hermanos(c).length?` <span class="pill">${hermanos(c).length+1} negocios</span>`:""}</div>`:c.contacto===c.nombre?`<div class="s" style="color:var(--warn)">Falta el nombre del negocio</div>`:""}${c.rubro?`<div class="s">${esc(c.rubro)}</div>`:""}</div></div></td><td>${c.sede?`<span class="sede-dot" style="--sc:${sedeColor(c.sede)}"></span>${esc(c.sede)}`:"—"}</td><td>${esc(c.plan||"—")}</td><td>${esc(c.responsable?memName(c.responsable):"—")}</td><td class="estcell">${estSel(c)}</td><td>${ents?`<span class="pill info">${ents} pieza${ents>1?"s":""}</span> `:""}${un?`<span class="pill bad">${un} mensajes</span>`:""}</td></tr>`; }).join("")}
  </tbody></table></div>`:`<div class="card"><div class="empty">${S.clientes.length?"No hay clientes con esos filtros.":"Todavía no hay clientes. Cargá el primero."}</div></div>`}`;
}
function cliAv(c){ const ini=String(c.nombre||"?").replace(/[^\p{L}\p{N} ]/gu,"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?"; return `<span class="cav" style="--sc:${sedeColor(c.sede)}">${esc(ini)}</span>`; }
function fichaCliente(c){
  const tabs=[["resumen","Ficha"],["entregas","Entregas"],["publicados","Publicados"],["chat","Chat"],["pauta","Pauta"],["agenda","Tareas y agenda"]];
  const un=unread(c.id);
  const body={resumen:tabResumen,entregas:tabEntregas,publicados:c=>`<div class="toolbar"><button class="btn pri" onclick="formPublicado(null,'${c.id}')">${icon("plus")}Cargar link</button></div>`+pubGroup(c,S.publicados.filter(p=>p.cliente_id===c.id)),chat:()=>chatBox(c.id,true),pauta:tabPauta,agenda:tabAgenda}[S.cliTab]||tabResumen;
  return `
  <div class="eyebrow" style="margin-bottom:10px"><a href="#clientes" style="text-decoration:none">← Clientes</a></div>
  <div class="cli-hero" style="--sc:${sedeColor(c.sede)}"><div class="ch-main">${cliAv(c)}<div style="min-width:0"><h1>${esc(c.nombre)}</h1>
    <div class="ch-meta">${c.contacto&&c.contacto!==c.nombre?`<span class="titular">${icon("users")}<b>${esc(c.contacto)}</b></span>`:""}${c.sede?`<span class="sede-tag">${esc(c.sede)}</span>`:""}${c.rubro?`<span class="pill">${esc(c.rubro)}</span>`:""}${c.plan?`<span class="pill info">${esc(c.plan)}</span>`:""}</div>${hermanos(c).length?`<div class="hermanos">${icon("briefcase")}<span>Otros negocios de ${esc(c.contacto.split(" ")[0])}:</span>${hermanos(c).map(h=>`<a class="pill info" href="#cliente-${h.id}">${esc(h.nombre)}</a>`).join("")}</div>`:""}</div>
    </div>
    <div class="ch-est"><span class="s">Estado</span>${estSel(c)}</div>
    <div class="ch-acts">${cliAcciones(c)}<button class="btn" onclick="formCliente('${c.id}')">${icon("edit")}Editar ficha</button></div></div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${S.cliTab===k?"on":""}" onclick="S.cliTab='${k}';render()">${l}${k==="chat"&&un?` <span class="badge">${un}</span>`:""}</button>`).join("")}</div>
  ${body(c)}`;
}
const dd = x => (x==null||x===""||x==="—") ? `<span class="nodata">—</span>` : esc(x);
function cliAcciones(c){
  const ig=String(c.instagram||"").replace(/^@/,""), wa=waNumber(c.whatsapp||""), drive=(c.recursos||[]).map(r=>safeUrl(r.url)).find(Boolean);
  return [wa?`<a class="btn wa" href="https://wa.me/${wa}" target="_blank" rel="noopener">${icon("wa")}WhatsApp</a>`:"",
    ig?`<a class="btn" href="https://instagram.com/${encodeURIComponent(ig)}" target="_blank" rel="noopener">${icon("image")}Instagram</a>`:"",
    drive?`<a class="btn" href="${esc(drive)}" target="_blank" rel="noopener">${icon("file")}Carpeta</a>`:"",
    `<button class="btn" onclick="S.cliTab='chat';render()">${icon("chat")}Chat</button>`].join("");
}
function tabResumen(c){
  const ig=String(c.instagram||"").replace(/^@/,""), rec=c.recursos||[], acc=c.accesos||[], mk=c.marca||{};
  return `<div class="grid g2">
    <section class="card"><h2>${icon("file")}Recursos y carpetas</h2>
      <div class="links">${rec.length?rec.map(r=>{const u=safeUrl(r.url);return u?`<a class="btn" href="${esc(u)}" target="_blank" rel="noopener"><span>${esc(r.nombre||"Link")}</span><span class="s">Abrir ↗</span></a>`:"";}).join(""):`<div class="empty">Sin links. En "Editar ficha" agregá el Drive de creativos, Canva, logos, fotos.</div>`}</div></section>
    <section class="card"><h2>${icon("briefcase")}Datos</h2><dl class="ficha">
      <div><dt>Responsable</dt><dd>${dd(c.responsable?memLabel(c.responsable):"—")}</dd></div>
      <div><dt>Contacto</dt><dd>${dd(c.contacto||"—")}</dd></div>
      <div><dt>WhatsApp</dt><dd>${dd(c.whatsapp||"—")}</dd></div>
      <div><dt>Instagram</dt><dd>${ig?`<a href="https://instagram.com/${encodeURIComponent(ig)}" target="_blank" rel="noopener">@${esc(ig)}</a>`:dd("")}</dd></div>
      <div><dt>Web</dt><dd>${safeUrl(c.web)?`<a href="${esc(safeUrl(c.web))}" target="_blank" rel="noopener">${esc(c.web)}</a>`:dd("")}</dd></div>
      <div><dt>Cliente desde</dt><dd>${dd(c.inicio?fmtDate(c.inicio)+" "+c.inicio.slice(0,4):"—")}</dd></div>
      <div><dt>Inversión en ads</dt><dd>${dd(c.inversion||"—")}</dd></div></dl>
      ${c.notas?`<h3 style="margin-top:12px">Notas</h3><p style="white-space:pre-wrap;margin:4px 0 0">${esc(c.notas)}</p>`:""}</section>
    <section class="card"><h2>${icon("image")}Ficha de marca</h2><dl class="ficha">
      <div><dt>Tono</dt><dd>${dd(mk.tono||"—")}</dd></div>
      <div><dt>Colores</dt><dd>${dd(mk.colores||"—")}</dd></div>
      <div><dt>Tipografías</dt><dd>${dd(mk.tipos||"—")}</dd></div>
      <div><dt>Sí</dt><dd>${dd(mk.si||"—")}</dd></div>
      <div><dt>No</dt><dd>${dd(mk.no||"—")}</dd></div>
      <div><dt>Competencia / referencias</dt><dd>${dd(mk.refs||"—")}</dd></div></dl></section>
    <section class="card"><h2>${icon("lock")}Accesos</h2>
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
  const last = id => (S.mensajes.filter(m=>chKey(m)===id).slice(-1)[0]||{}).creado||"";
  const sorted=chs.filter(c=>!q||c.n.toLowerCase().includes(q)).sort((a,b)=>a.id==="general"?-1:b.id==="general"?1:String(last(b.id)).localeCompare(String(last(a.id))) || a.n.localeCompare(b.n));
  if(S.mobile){
    if(S.chatOpen) return `<div class="chat mthread">${thread(S.chatCh)}</div>`;
    return `<div class="m-head"><div><div class="eyebrow">Operación</div><h1>Chat</h1></div><span class="pill ${openPedidos().length?"warn":"ok"}">${openPedidos().length} pedidos abiertos</span></div>
    <div class="chat mlist"><div class="channels"><input type="search" id="chatQ" placeholder="Buscar cliente…" value="${esc(S.f.chatQ)}" oninput="S.f.chatQ=this.value;render()">${canales(sorted)}</div></div>`;
  }
  return `<div class="head"><div><div class="eyebrow">Operación</div><h1>Chat</h1><p>Pedidos y conversaciones del equipo, por cliente o generales</p></div>
    <span class="pill ${openPedidos().length?"warn":"ok"}">${openPedidos().length} pedidos abiertos</span></div>
  <div class="chat"><div class="channels"><input type="search" id="chatQ" placeholder="Buscar cliente…" value="${esc(S.f.chatQ)}" oninput="S.f.chatQ=this.value;render()">
    ${canales(sorted)}</div>
    ${thread(S.chatCh)}</div>`;
}
function canales(sorted){ return sorted.map(c=>{const u=unread(c.id), g=c.id==="general", lm=S.mensajes.filter(m=>chKey(m)===c.id).slice(-1)[0];
      return `<button class="${S.chatCh===c.id?"on":""} ${g?"ch-gen":""}" onclick="S.chatCh='${c.id}';S.chatOpen=true;render();if(S.mobile)window.scrollTo(0,0)">${g?`<span class="gen-ic sm">${icon("users")}</span>`:`<span class="ch-av">${esc(initials(c.n))}</span>`}<span class="ch-txt"><span class="ch-n">${esc(c.n)}</span>${lm?`<span class="ch-l">${esc((lm.autor===S.me.id?"Vos":memName(lm.autor).split(" ")[0])+": "+msgPreview(lm))}</span>`:""}</span>${u?`<span class="badge">${u}</span>`:""}</button>`;}).join(""); }
function chatBox(ch){ return `<div class="chat solo">${thread(ch)}</div>`; }
function lectoresDe(ch){
  // Quiénes deberían leer este canal
  if(ch.startsWith("t-")){ const t=S.tareas.find(x=>x.id===ch.slice(2)); const ids=new Set([t?.asignado,t?.creado_por,...S.mensajes.filter(m=>m.tarea_id===ch.slice(2)).map(m=>m.autor)]); return [...ids].filter(Boolean); }
  return S.miembros.filter(m=>m.activo&&m.user_id).map(m=>m.id);
}
function ticks(m, ch){
  if(String(m.id).startsWith("tmp")) return `<span class="tk" title="Enviando">🕓</span>`;
  const otros=lectoresDe(ch).filter(id=>id!==m.autor);
  const vieron=otros.filter(id=>vistoHasta(ch,id)>=m.creado);
  const cls = otros.length && vieron.length===otros.length ? "all" : vieron.length ? "some" : "";
  return `<span class="tk ${cls}" title="${vieron.length?"Visto por "+esc(vieron.map(memName).join(", ")):"Enviado"}">${vieron.length?"✓✓":"✓"}</span>`;
}
function attHtml(m){
  const adj=m.adjuntos||[]; if(!adj.length) return "";
  const auds=adj.map((a,i)=>[a,i]).filter(([a])=>/^audio\//.test(a.tipo||""));
  const imgs=adj.map((a,i)=>[a,i]).filter(([a])=>!/^audio\//.test(a.tipo||""));
  return (imgs.length?`<div class="atts">${imgs.map(([a,i])=>`<button type="button" class="att" onclick="verImagen('${m.id}',${i})" aria-label="Ver imagen"><img data-path="${esc(a.path)}" alt="${esc(a.nombre||"Imagen")}"></button>`).join("")}</div>`:"")
   + auds.map(([a])=>{ const pl=AUD.path===a.path; return `<div class="audio ${pl&&AUD.playing?"playing":""}" data-ap="${esc(a.path)}"><button type="button" class="aplay" onclick="toggleAudio(this.parentElement.dataset.ap,${Number(a.dur)||0})" aria-label="Reproducir audio">${pl&&AUD.loading?'<span class="spin"></span>':pl&&AUD.playing?icon("pause"):icon("play")}</button><div class="abar" onclick="seekAudio(event,this.parentElement.dataset.ap)"><div class="afill" style="width:${pl&&AUD.dur?Math.min(100,AUD.t/AUD.dur*100):0}%"></div></div><span class="atime">${fmtDur(pl&&AUD.t?AUD.t:(a.dur||0))}</span></div>`; }).join("");
}
const msgPreview = m => m.texto || (String((m.adjuntos||[])[0]?.tipo||"").startsWith("audio") ? "🎤 Audio" : (m.adjuntos||[]).length ? "📷 Foto" : "");
const fmtDur = sec => { sec=Math.round(sec||0); return Math.floor(sec/60)+":"+pad(sec%60); };
function thread(ch){
  const msgs=S.mensajes.filter(m=>chKey(m)===ch);
  const isTask=ch.startsWith("t-"), isGen=ch==="general";
  const title= isGen ? "General del equipo" : isTask ? "Conversación de la tarea" : cliName(ch);
  let lastDay="", lastAut="", lastT=0, html="";
  const myLast=[...msgs].reverse().find(m=>m.autor===S.me.id);
  msgs.forEach(m=>{
    const d=new Date(m.creado), day=ymd(d);
    if(day!==lastDay){ html+=`<div class="daysep">${day===today()?"Hoy":fmtDayLong(day)}</div>`; lastDay=day; lastAut=""; }
    const me=m.autor===S.me.id, col=memColor(m.autor), nm=memName(m.autor);
    const cont = m.autor===lastAut && (d-lastT)<5*60000;
    lastAut=m.autor; lastT=d;
    const vistoPor = (myLast && m===myLast) ? lectoresDe(ch).filter(id=>id!==m.autor && vistoHasta(ch,id)>=m.creado) : [];
    html+=`<div class="mrow ${me?"me":""} ${cont?"cont":""}">
      ${me?"":`<div class="mav" style="--mc:${col}" title="${esc(nm)}">${cont?"":esc(initials(nm))}</div>`}
      <div class="msg ${me?"me":""} ${m.pedido?"pedido":""} ${m.resuelto?"ok":""}" style="--mc:${col}">
        ${!me&&!cont?`<div class="who"><b style="color:${col}">${esc(nm)}</b>${mem(m.autor)?` <span>${esc(ROLES[mem(m.autor).rol]||"")}${mem(m.autor).sede?" · "+esc(mem(m.autor).sede):""}</span>`:""}</div>`:""}
        ${attHtml(m)}
        ${m.texto?`<div class="b">${esc(m.texto)}</div>`:""}
        <div class="meta-m">${pad(d.getHours())}:${pad(d.getMinutes())}${me?" "+ticks(m,ch):""}</div>
        ${m.pedido?`<div class="tag">${m.resuelto?`<span style="color:var(--ok)">✓ Resuelto</span>`:`<span style="color:var(--warn)">Pedido pendiente</span><button class="btn sm ghost" onclick="resolver('${m.id}')">Marcar resuelto</button>`}</div>`:""}
        ${vistoPor.length?`<div class="visto">Visto por ${esc(vistoPor.map(id=>memName(id).split(" ")[0]).join(", "))}</div>`:""}
      </div></div>`;
  });
  const dk="d-"+ch, rec=S.rec&&S.rec.ch===ch;
  return `<div class="thread ${isGen?"gen":""}"><div class="top">${S.mobile&&S.view==="chat"?`<button class="btn sm ghost back" onclick="S.chatOpen=false;render()" aria-label="Volver a los chats">‹ Chats</button>`:""}${isGen?`<div class="gen-ic">${icon("users")}</div>`:""}<div style="flex:1;min-width:0"><b>${esc(title)}</b>${isGen?`<div class="s">${S.miembros.filter(m=>m.activo).length} integrantes</div>`:""}</div>${!isGen&&!isTask&&S.view==="chat"?`<a class="btn sm" href="#cliente-${ch}">Ver cliente</a>`:""}</div>
    <div class="msgs">${html||`<div class="empty" style="align-self:center">${isTask?"Dejá acá las referencias, fotos y comentarios de esta tarea.":"Todavía no hay mensajes. Escribí el primero."}</div>`}</div>
    ${(S.pendAtt[ch]||[]).length?`<div class="pend">${S.pendAtt[ch].map((p,i)=>`<div class="pthumb"><img src="${p.url}" alt=""><button type="button" onclick="quitarAdj('${ch}',${i})" aria-label="Quitar">✕</button></div>`).join("")}</div>`:""}
    ${rec?`<div class="recbar"><span class="dotrec"></span><b>Grabando</b><span id="recT">${fmtDur(S.rec.seg||0)}</span><span style="flex:1"></span><button type="button" class="btn sm ghost" onclick="cancelarAudio()">Cancelar</button><button type="button" class="btn sm pri" onclick="detenerAudio(true)">${icon("send")}Enviar audio</button></div>`
    :`<form class="composer" onsubmit="sendMsg(event,'${ch}')">
      <label class="btn attach" title="Adjuntar fotos" aria-label="Adjuntar fotos">${icon("image")}<input type="file" hidden accept="image/*" multiple onchange="agregarAdj('${ch}',this.files);this.value=''"></label>
      <textarea id="msg-${ch}" placeholder="${isTask?"Escribí una indicación o pegá una foto…":"Escribí un mensaje…"}" rows="1" oninput="S.drafts['${dk}']=this.value" onpaste="pegarAdj(event,'${ch}')" onkeydown="if(event.key==='Enter'&&!event.shiftKey&&!S.mobile){event.preventDefault();this.form.requestSubmit();}">${esc(S.drafts[dk]||"")}</textarea>
      ${isTask?"":`<label class="opt"><input type="checkbox" id="ped-${ch}" ${S.pedido?"checked":""} onchange="S.pedido=this.checked"> Pedido</label>`}
      <button type="button" class="btn attach mic" onclick="grabarAudio('${ch}')" title="Grabar audio" aria-label="Grabar audio" ${S.sending?"disabled":""}>${icon("mic")}</button>
      <button class="btn pri" ${S.sending?"disabled":""}>${S.sending?"…":"Enviar"}</button></form>`}</div>`;
}

/* ---------- Reproductor de audios ---------- */
// Un solo reproductor fuera de la pantalla: los cambios de la app no lo cortan.
const AUD={el:new Audio(),path:null,playing:false,loading:false,t:0,dur:0,blobs:{}};
AUD.el.preload="auto";
AUD.el.addEventListener("timeupdate",()=>{ AUD.t=AUD.el.currentTime; if(isFinite(AUD.el.duration)) AUD.dur=AUD.el.duration; pintarAudio(); });
AUD.el.addEventListener("ended",()=>{ AUD.playing=false; AUD.t=0; pintarAudio(true); });
AUD.el.addEventListener("pause",()=>{ AUD.playing=false; pintarAudio(true); });
AUD.el.addEventListener("play",()=>{ AUD.playing=true; pintarAudio(true); });
AUD.el.addEventListener("error",()=>{ if(AUD.path){ AUD.loading=false; AUD.playing=false; pintarAudio(true); toast("Este audio no se puede reproducir en este dispositivo."); } });
function pintarAudio(full){
  document.querySelectorAll(".audio[data-ap]").forEach(box=>{
    const me=box.dataset.ap===AUD.path;
    if(!me){ if(box.classList.contains("playing")){ box.classList.remove("playing"); box.querySelector(".aplay").innerHTML=icon("play"); box.querySelector(".afill").style.width="0%"; } return; }
    box.classList.toggle("playing",AUD.playing);
    box.querySelector(".afill").style.width=(AUD.dur?Math.min(100,AUD.t/AUD.dur*100):0)+"%";
    box.querySelector(".atime").textContent=fmtDur(AUD.t||AUD.dur);
    if(full) box.querySelector(".aplay").innerHTML = AUD.loading?'<span class="spin"></span>':AUD.playing?icon("pause"):icon("play");
  });
}
async function cargarAudio(path){
  if(AUD.blobs[path]) return AUD.blobs[path];
  const { data, error } = await sb.storage.from("chat").download(path);
  if(error) throw error;
  const url=URL.createObjectURL(data); AUD.blobs[path]=url; return url;
}
async function toggleAudio(path, durHint){
  if(AUD.path===path && !AUD.loading){ if(AUD.playing) AUD.el.pause(); else AUD.el.play().catch(()=>{}); return; }
  AUD.el.pause(); AUD.path=path; AUD.t=0; AUD.dur=durHint||0; AUD.loading=true; pintarAudio(true);
  try{
    const url=await cargarAudio(path);
    if(AUD.path!==path) return;
    AUD.el.src=url; AUD.loading=false;
    await AUD.el.play();
  }catch(e){ AUD.loading=false; AUD.playing=false; pintarAudio(true); if(e?.name!=="AbortError") toast("No se pudo reproducir el audio."); }
}
function seekAudio(ev, path){
  if(AUD.path!==path || !AUD.dur) return;
  const r=ev.currentTarget.getBoundingClientRect(); AUD.el.currentTime=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width))*AUD.dur;
}

/* ---------- Audios ---------- */
let _mr=null, _chunks=[], _recTimer=null, _stream=null;
async function grabarAudio(ch){
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){ toast("Este navegador no permite grabar audio."); return; }
  try{ _stream=await navigator.mediaDevices.getUserMedia({audio:true}); }
  catch(e){ toast("Necesitamos permiso para usar el micrófono."); return; }
  const tipo=(esIOS?["audio/mp4","audio/webm;codecs=opus","audio/webm"]:["audio/webm;codecs=opus","audio/webm","audio/ogg","audio/mp4"]).find(t=>MediaRecorder.isTypeSupported(t))||"";
  _mr=new MediaRecorder(_stream, tipo?{mimeType:tipo}:undefined); _chunks=[];
  _mr.ondataavailable=e=>{ if(e.data.size) _chunks.push(e.data); };
  _mr.start(250);
  S.rec={ch,inicio:Date.now(),seg:0,enviar:false}; render();
  _recTimer=setInterval(()=>{ if(!S.rec) return; S.rec.seg=(Date.now()-S.rec.inicio)/1000; const el=$("#recT"); if(el) el.textContent=fmtDur(S.rec.seg); if(S.rec.seg>=300) detenerAudio(true); },500);
}
function _limpiarRec(){ clearInterval(_recTimer); if(_stream) _stream.getTracks().forEach(t=>t.stop()); _stream=null; }
function cancelarAudio(){ if(_mr&&_mr.state!=="inactive"){ _mr.onstop=null; _mr.stop(); } _limpiarRec(); S.rec=null; render(); }
function detenerAudio(enviar){
  if(!_mr||!S.rec) return;
  const ch=S.rec.ch, dur=(Date.now()-S.rec.inicio)/1000;
  _mr.onstop=async ()=>{
    _limpiarRec(); S.rec=null;
    const tipo=(_mr.mimeType||"audio/webm").split(";")[0];
    const blob=new Blob(_chunks,{type:tipo});
    if(!enviar || dur<0.8 || !blob.size){ render(); if(dur<0.8) toast("Mantené la grabación un poco más."); return; }
    let out=blob, outTipo=tipo;
    // AAC (iPhone) se escucha en todos lados; webm/ogg no se escucha en iPhone: lo pasamos a WAV
    if(!/mp4|aac|m4a/.test(tipo)){ try{ out=await aWav(blob); outTipo="audio/wav"; }catch(e){ console.warn("No se pudo convertir a WAV",e); } }
    await enviarAudio(ch, out, outTipo, dur);
  };
  _mr.stop();
}
async function aWav(blob){
  const ab=await blob.arrayBuffer();
  const AC=window.AudioContext||window.webkitAudioContext; const ctx=new AC();
  const buf=await ctx.decodeAudioData(ab); ctx.close&&ctx.close();
  const rate=16000, len=Math.ceil(buf.duration*rate);
  const off=new OfflineAudioContext(1,len,rate); const src=off.createBufferSource(); src.buffer=buf; src.connect(off.destination); src.start();
  const r=await off.startRendering(); const d=r.getChannelData(0);
  const out=new DataView(new ArrayBuffer(44+d.length*2)); const w=(o,s)=>[...s].forEach((c,i)=>out.setUint8(o+i,c.charCodeAt(0)));
  w(0,"RIFF"); out.setUint32(4,36+d.length*2,true); w(8,"WAVE"); w(12,"fmt "); out.setUint32(16,16,true); out.setUint16(20,1,true); out.setUint16(22,1,true);
  out.setUint32(24,rate,true); out.setUint32(28,rate*2,true); out.setUint16(32,2,true); out.setUint16(34,16,true); w(36,"data"); out.setUint32(40,d.length*2,true);
  for(let i=0;i<d.length;i++){ const v=Math.max(-1,Math.min(1,d[i])); out.setInt16(44+i*2, v<0?v*0x8000:v*0x7FFF, true); }
  return new Blob([out],{type:"audio/wav"});
}
async function enviarAudio(ch, blob, tipo, dur){
  const isTask=ch.startsWith("t-");
  S.sending=true; render();
  const ext=tipo.includes("wav")?"wav":tipo.includes("mp4")?"m4a":tipo.includes("ogg")?"ogg":"webm";
  const path=`${ch}/audio_${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
  const up=await sb.storage.from("chat").upload(path, blob, {contentType:tipo});
  if(up.error){ S.sending=false; render(); toast("No se pudo enviar el audio: "+up.error.message); return; }
  const row={texto:"",autor:S.me.id,cliente_id:(ch==="general"||isTask)?null:ch,tarea_id:isTask?ch.slice(2):null,pedido:false,adjuntos:[{path,nombre:"Audio",tipo,tam:blob.size,dur:Math.round(dur)}]};
  const tmp=Object.assign({id:"tmp-"+Date.now(),creado:new Date().toISOString(),resuelto:false},row);
  S.mensajes.push(tmp); S.sending=false; render();
  const { data:ins, error } = await sb.from("mensajes").insert(row).select().single();
  if(error){ S.mensajes=S.mensajes.filter(m=>m!==tmp); render(); toast("No se pudo enviar el audio: "+error.message); return; }
  applyChange("mensajes",{eventType:"INSERT",new:ins});
}
async function sendMsg(e, ch){
  e.preventDefault();
  if(S.sending) return;
  const el=document.getElementById("msg-"+ch), txt=el.value.trim(), pend=S.pendAtt[ch]||[];
  if(!txt && !pend.length) return;
  const isTask=ch.startsWith("t-");
  const row={texto:txt,autor:S.me.id,cliente_id:(ch==="general"||isTask)?null:ch,tarea_id:isTask?ch.slice(2):null,pedido:!isTask&&!!S.pedido,adjuntos:[]};
  S.sending=true; render();
  for(const p of pend){
    try{
      const blob=await comprimirImagen(p.file);
      const path=`${ch}/${Date.now()}_${Math.random().toString(36).slice(2,7)}.${blob.type==="image/png"?"png":blob.type==="image/gif"?"gif":"jpg"}`;
      const up=await sb.storage.from("chat").upload(path, blob, {contentType:blob.type});
      if(up.error) throw up.error;
      row.adjuntos.push({path,nombre:p.file.name,tipo:blob.type,tam:blob.size});
    }catch(err){ toast("No se pudo subir una imagen: "+(err.message||err)); S.sending=false; render(); return; }
  }
  pend.forEach(p=>URL.revokeObjectURL(p.url));
  S.pendAtt[ch]=[]; S.drafts["d-"+ch]=""; S.pedido=false; el.value="";
  const tmp=Object.assign({id:"tmp-"+Date.now(),creado:new Date().toISOString(),resuelto:false},row);
  S.mensajes.push(tmp); S.sending=false; render();
  const { data:ins, error } = await sb.from("mensajes").insert(row).select().single();
  if(error){ S.mensajes=S.mensajes.filter(m=>m!==tmp); S.drafts["d-"+ch]=txt; render(); toast("No se pudo enviar: "+error.message); return; }
  applyChange("mensajes",{eventType:"INSERT",new:ins});
}
/* ---------- Imágenes del chat ---------- */
function agregarAdj(ch, files){
  const imgs=[...(files||[])].filter(f=>/^image\//.test(f.type));
  if(!imgs.length) return;
  const big=imgs.find(f=>f.size>25*1048576); if(big){ toast("La imagen "+big.name+" es demasiado pesada."); return; }
  S.pendAtt[ch]=(S.pendAtt[ch]||[]).concat(imgs.map(f=>({file:f,url:URL.createObjectURL(f)}))).slice(0,10);
  if(ch==="form-tarea") pintarFotosForm(); else render();
}
function pegarAdj(e, ch){
  const files=[...(e.clipboardData?.files||[])].filter(f=>/^image\//.test(f.type));
  if(files.length){ e.preventDefault(); agregarAdj(ch, files); }
}
function quitarAdj(ch,i){ const p=(S.pendAtt[ch]||[])[i]; if(p) URL.revokeObjectURL(p.url); S.pendAtt[ch].splice(i,1); render(); }
async function comprimirImagen(file){
  if(file.type==="image/gif" || file.size<350*1024) return file;
  try{
    const bmp=await createImageBitmap(file);
    const max=1800, k=Math.min(1, max/Math.max(bmp.width,bmp.height));
    const c=document.createElement("canvas"); c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k);
    const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height); ctx.drawImage(bmp,0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",0.86));
    return blob && blob.size<file.size ? blob : file;
  }catch(e){ return file; }
}
const urlCache={};
async function hidratarImagenes(){
  const imgs=[...document.querySelectorAll("img[data-path]:not([src])")];
  if(!imgs.length) return;
  const now=Date.now(), falta=[...new Set(imgs.map(i=>i.dataset.path))].filter(p=>!(urlCache[p]&&urlCache[p].exp>now));
  if(falta.length){
    const { data } = await sb.storage.from("chat").createSignedUrls(falta, 3600);
    (data||[]).forEach(d=>{ if(d.signedUrl) urlCache[d.path]={url:d.signedUrl,exp:now+3300*1000}; });
  }
  document.querySelectorAll("img[data-path]:not([src])").forEach(i=>{ const c=urlCache[i.dataset.path]; if(c) i.src=c.url; });
}
async function verImagen(mid, i){
  const m=S.mensajes.find(x=>x.id===mid); const a=m&&(m.adjuntos||[])[i]; if(!a) return;
  openModal(`<div class="lightbox"><img data-path="${esc(a.path)}" alt="${esc(a.nombre||"Imagen")}"><div class="actions" style="display:flex;justify-content:space-between;gap:8px;margin-top:12px"><span class="s">${esc(memName(m.autor))} · ${esc(a.nombre||"")}</span><div style="display:flex;gap:8px"><button class="btn" onclick="descargarImagen('${mid}',${i})">${icon("download")}Descargar</button><button class="btn pri" onclick="closeModal()">Cerrar</button></div></div></div>`);
  hidratarImagenes();
}
async function descargarImagen(mid,i){
  const m=S.mensajes.find(x=>x.id===mid); const a=m&&(m.adjuntos||[])[i]; if(!a) return;
  const { data, error } = await sb.storage.from("chat").createSignedUrl(a.path, 600, {download:a.nombre||true});
  if(error){ toast("No se pudo descargar."); return; }
  window.location.href=data.signedUrl;
}
async function resolver(id){ await run(sb.from("mensajes").update({resuelto:true}).eq("id",id),"Pedido resuelto"); }

/* ---------- Tareas ---------- */
function vTareas(){
  if(S.tareaId){ const t=S.tareas.find(x=>x.id===S.tareaId); if(t) return vTarea(t); }
  let list=S.tareas.slice();
  if(S.f.tScope==="mias") list=list.filter(t=>t.asignado===S.me.id);
  if(S.f.tArea) list=list.filter(t=>t.area===S.f.tArea);
  const col=([k,l])=>{ let it=list.filter(t=>t.estado===k); it = k==="hecha" ? it.sort((a,b)=>String(b.hecha_el||"").localeCompare(String(a.hecha_el||""))).slice(0,20) : sortTasks(it);
    return `<div class="col"><h3>${l}<span class="pill">${it.length}</span></h3>${it.length?it.map(taskCard).join(""):`<div class="empty">Vacío</div>`}</div>`; };
  if(S.mobile){
    const cols=[["pendiente","Por hacer"],["curso","En curso"],["hecha","Hechas"]];
    let it=list.filter(t=>t.estado===S.tEstM);
    it = S.tEstM==="hecha" ? it.sort((a,b)=>String(b.hecha_el||"").localeCompare(String(a.hecha_el||""))).slice(0,30) : sortTasks(it);
    return `<div class="m-head"><div><div class="eyebrow">Operación</div><h1>Tareas</h1></div></div>
    <div class="m-filters"><div class="seg"><button class="${S.f.tScope==="todas"?"on":""}" onclick="S.f.tScope='todas';render()">Todas</button><button class="${S.f.tScope==="mias"?"on":""}" onclick="S.f.tScope='mias';render()">Mías</button></div>
      <select id="tAreaM" aria-label="Área" onchange="S.f.tArea=this.value;render()"><option value="">Todas las áreas</option>${AREAS.map(a=>`<option ${S.f.tArea===a?"selected":""}>${a}</option>`).join("")}</select></div>
    <div class="etabs">${cols.map(([k,l])=>`<button class="${S.tEstM===k?"on":""}" style="--c:${k==="pendiente"?"var(--s-otra)":k==="curso"?"var(--info)":"var(--ok)"}" onclick="S.tEstM='${k}';render()"><span class="dot"></span>${l}<b>${list.filter(t=>t.estado===k).length}</b></button>`).join("")}</div>
    <div>${it.map(taskCard).join("")||`<div class="card">${emptyMsg("No hay tareas acá.","check")}</div>`}</div>`;
  }
  return `<div class="head"><div><div class="eyebrow">Operación</div><h1>Tareas</h1><p>Quién hace qué, para qué cliente y para cuándo</p></div><button class="btn pri" onclick="formTarea()">${icon("plus")}Nueva tarea</button></div>
  <div class="toolbar"><div class="seg"><button class="${S.f.tScope==="todas"?"on":""}" onclick="S.f.tScope='todas';render()">Todas</button><button class="${S.f.tScope==="mias"?"on":""}" onclick="S.f.tScope='mias';render()">Mías</button></div>
    <select id="tArea" aria-label="Área" onchange="S.f.tArea=this.value;render()"><option value="">Todas las áreas</option>${AREAS.map(a=>`<option ${S.f.tArea===a?"selected":""}>${a}</option>`).join("")}</select></div>
  <div class="board">${[["pendiente","Por hacer"],["curso","En curso"],["hecha","Hechas"]].map(col).join("")}</div>`;
}
function taskCard(t){
  const late=t.vence&&t.vence<today()&&t.estado!=="hecha";
  const nCom=S.mensajes.filter(m=>m.tarea_id===t.id).length, nImg=S.mensajes.filter(m=>m.tarea_id===t.id).reduce((a,m)=>a+(m.adjuntos||[]).length,0), un=unread("t-"+t.id);
  return `<div class="task p-${esc(t.prioridad)}"><a class="t" href="#tarea-${t.id}" style="color:inherit;text-decoration:none;display:block">${esc(t.titulo)}</a>
  ${t.detalle?`<div class="s" style="white-space:pre-wrap">${esc(t.detalle.length>140?t.detalle.slice(0,140)+"…":t.detalle)}</div>`:""}
  <div class="meta"><span>${esc(memName(t.asignado))}</span>${t.cliente_id?`<span>· ${esc(cliName(t.cliente_id))}</span>`:""}${t.area?`<span>· ${esc(t.area)}</span>`:""}</div>
  ${nCom?`<div class="meta"><span class="pill ${un?"bad":""}">${icon("chat")}${nCom} mensaje${nCom>1?"s":""}${un?" · "+un+" sin leer":""}</span>${nImg?`<span class="pill">${icon("image")}${nImg}</span>`:""}</div>`:""}
  <div class="acts">${t.vence?`<span class="pill ${late?"bad":t.vence===today()?"warn":""}">${esc(late?"Venció "+fmtDate(t.vence):"Vence "+fmtDate(t.vence))}</span>`:""}<button class="btn sm" onclick="advance('${t.id}')">${t.estado==="hecha"?"Reabrir":t.estado==="curso"?"Terminar":"Empezar"}</button></div></div>`;
}
async function advance(id){
  const t=S.tareas.find(x=>x.id===id); if(!t) return;
  const nx = t.estado==="pendiente"?"curso":t.estado==="curso"?"hecha":"pendiente";
  await run(sb.from("tareas").update({estado:nx,hecha_el:nx==="hecha"?new Date().toISOString():null}).eq("id",id), nx==="hecha"?"Tarea terminada":null);
}

function vTarea(t){
  const late=t.vence&&t.vence<today()&&t.estado!=="hecha";
  const PR={alta:"Alta",media:"Media",baja:"Baja"}, ES={pendiente:"Por hacer",curso:"En curso",hecha:"Hecha"};
  return `<div class="head"><div><div class="eyebrow"><a href="#tareas" style="text-decoration:none">← Tareas</a></div><h1>${esc(t.titulo)}</h1>
    <p>${esc([t.cliente_id?cliName(t.cliente_id):"", t.area].filter(Boolean).join(" · "))}</p></div>
    <div class="acts"><button class="btn" onclick="formTarea('${t.id}')">${icon("edit")}Editar</button><button class="btn pri" onclick="advance('${t.id}')">${t.estado==="hecha"?"Reabrir":t.estado==="curso"?"Marcar terminada":"Empezar"}</button></div></div>
  <div class="split">
    <section class="card" style="padding:0;overflow:hidden">${thread("t-"+t.id)}</section>
    <section class="card"><h2 style="margin-bottom:12px">Detalle</h2><dl class="ficha">
      <div><dt>Estado</dt><dd><span class="pill ${t.estado==="hecha"?"ok":t.estado==="curso"?"info":""}">${ES[t.estado]}</span></dd></div>
      <div><dt>Prioridad</dt><dd><span class="pill ${t.prioridad==="alta"?"bad":t.prioridad==="media"?"warn":"ok"}">${PR[t.prioridad]||"—"}</span></dd></div>
      <div><dt>Responsable</dt><dd>${dd(memName(t.asignado))}</dd></div>
      <div><dt>Vence</dt><dd>${t.vence?`<span class="pill ${late?"bad":""}">${esc(late?"Venció "+fmtDate(t.vence):fmtDate(t.vence))}</span>`:"—"}</dd></div>
      <div><dt>Creada por</dt><dd>${dd(memName(t.creado_por))}</dd></div>
      ${t.cliente_id?`<div><dt>Cliente</dt><dd><a href="#cliente-${t.cliente_id}">${esc(cliName(t.cliente_id))}</a></dd></div>`:""}</dl>
      ${t.detalle?`<h3 style="margin:16px 0 6px">Brief</h3><p style="white-space:pre-wrap;margin:0">${esc(t.detalle)}</p>`:""}
    </section></div>`;
}

/* ---------- Notificaciones push ---------- */
const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const esInstalada = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
function b64ToU8(b64){ const p="=".repeat((4-b64.length%4)%4), s=atob((b64+p).replace(/-/g,"+").replace(/_/g,"/")); return Uint8Array.from([...s].map(c=>c.charCodeAt(0))); }
async function estadoPush(){
  if(!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)){ S.push = esIOS && !esInstalada ? "ios" : "nosoporta"; return; }
  if(Notification.permission==="denied"){ S.push="bloqueada"; return; }
  try{
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.getSubscription();
    if(sub && Notification.permission==="granted"){ S.push="on"; guardarSub(sub); } else S.push="off";
  }catch(e){ S.push="off"; }
}
async function guardarSub(sub){
  const j=sub.toJSON();
  const disp=(esIOS?"iPhone":/android/i.test(navigator.userAgent)?"Android":/mac/i.test(navigator.userAgent)?"Mac":/win/i.test(navigator.userAgent)?"Windows":"Otro")+(esInstalada?" · app":" · navegador");
  return sb.from("push_subs").upsert({miembro_id:S.me.id,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,dispositivo:disp},{onConflict:"endpoint"});
}
async function activarNotis(){
  if(S.push==="ios"){ openModal(`<h2>Notificaciones en iPhone</h2><p>En iPhone, las notificaciones funcionan solo si la app está agregada a la pantalla de inicio:</p><ol style="line-height:1.7"><li>Abrí este link en <b>Safari</b>.</li><li>Tocá el botón <b>Compartir</b> (el cuadrado con la flecha).</li><li>Elegí <b>"Agregar a inicio"</b>.</li><li>Abrí la app <b>Furor</b> desde el ícono y tocá de nuevo "Activar notificaciones".</li></ol><div class="form"><div class="actions"><span></span><button class="btn pri" onclick="closeModal()">Entendido</button></div></div>`); return; }
  if(S.push==="bloqueada"){ openModal(`<h2>Notificaciones bloqueadas</h2><p>Bloqueaste las notificaciones para esta app. Para activarlas:</p><ul style="line-height:1.7"><li><b>Android (Chrome):</b> tocá el candado o los tres puntos → Configuración del sitio → Notificaciones → Permitir.</li><li><b>Compu (Chrome):</b> tocá el candado a la izquierda de la dirección → Notificaciones → Permitir.</li></ul><p>Después recargá la página.</p><div class="form"><div class="actions"><span></span><button class="btn pri" onclick="closeModal()">Entendido</button></div></div>`); return; }
  try{
    const perm=await Notification.requestPermission();
    if(perm!=="granted"){ S.push = perm==="denied"?"bloqueada":"off"; render(); toast("No se activaron las notificaciones."); return; }
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToU8(CFG.VAPID_PUBLIC)});
    const { error } = await guardarSub(sub);
    if(error) throw error;
    S.push="on"; render();
    await sb.rpc("probar_notificacion");
    toast("Listo. Te mandamos una notificación de prueba.");
  }catch(e){ console.error(e); toast("No se pudieron activar: "+(e.message||e)); }
}
async function desactivarNotis(){
  try{
    const reg=await navigator.serviceWorker.ready; const sub=await reg.pushManager.getSubscription();
    if(sub){ await sb.from("push_subs").delete().eq("endpoint",sub.endpoint); await sub.unsubscribe(); }
    S.push="off"; render(); toast("Notificaciones desactivadas en este dispositivo.");
  }catch(e){ toast("No se pudo desactivar."); }
}
function bannerNotis(){
  if(S.push==="on"||S.push==="nosoporta"||!S.push||ls.get("furor-notis-later","")===today()) return "";
  return `<div class="notibar">${icon("bell")}<div style="flex:1"><b>Activá las notificaciones en este ${S.mobile?"celular":"dispositivo"}</b><div class="s">Te avisamos cuando te asignan una tarea, te escriben o tenés un seguimiento pendiente.</div></div><button class="btn pri sm" onclick="activarNotis()">Activar</button><button class="btn ghost sm" onclick="ls.set('furor-notis-later',today());render()">Más tarde</button></div>`;
}
if("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e=>{ if(e.data?.tipo==="ir"){ location.hash=e.data.url; } });

/* ---------- Dirección (módulo privado, se carga a demanda) ---------- */
let _dirCargando=false;
function vDireccion(){
  if(!isAdmin()) return `<div class="card">${emptyMsg("Esta sección es privada.","lock")}</div>`;
  if(window.DIR) return DIR.vista();
  if(!_dirCargando){
    _dirCargando=true;
    const sc=document.createElement("script"); sc.src="direccion.js?v=3"; sc.onload=()=>render();
    sc.onerror=()=>{ _dirCargando=false; toast("No se pudo abrir Dirección. Revisá la conexión."); };
    document.body.appendChild(sc);
  }
  return `<div class="card">${emptyMsg("Abriendo Dirección…","lock")}</div>`;
}

/* ---------- Botón flotante (celular) ---------- */
function renderFab(){
  const f=$("#fab"); if(!f) return;
  const map={inicio:["Agendar","formEvento()"],agenda:["Agendar","formEvento()"],tareas:S.tareaId?null:["Nueva tarea","formTarea()"],prospectos:["Nuevo prospecto","formProspecto()"],clientes:S.cliId?null:["Nuevo cliente","formCliente()"],publicados:["Cargar link","formPublicado()"],material:isAdmin()?["Subir material","formMaterial()"]:null,novedades:null,equipo:isAdmin()?["Sumar integrante","formMiembro()"]:null};
  const a=map[S.view];
  document.body.classList.toggle("has-fab",!!a);
  if(!a){ f.hidden=true; return; }
  f.hidden=false; f.innerHTML=icon("plus")+`<span>${a[0]}</span>`; f.setAttribute("onclick",a[1]); f.setAttribute("aria-label",a[0]);
}
window.matchMedia('(max-width:900px)').addEventListener("change",e=>{ S.mobile=e.matches; render(); });

/* ---------- Novedades ---------- */
function vNovedades(){
  return `<div class="head"><div><div class="eyebrow">Equipo</div><h1>Novedades</h1><p>Avisos, cambios de clientes y anuncios del equipo</p></div></div>
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
  return `<div class="head"><div><div class="eyebrow">Equipo</div><h1>Equipo</h1><p>Quién es quién y qué tiene cada uno en curso</p></div>${isAdmin()?`<button class="btn pri" onclick="formMiembro()">${icon("plus")}Sumar integrante</button>`:""}</div>
  <section class="card" style="margin-bottom:16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">${icon("bell")}<div style="flex:1;min-width:200px"><b>Tus notificaciones en este dispositivo</b><div class="s">${S.push==="on"?"Activadas. Te llegan avisos de tareas, mensajes, prospectos y el resumen de la mañana.":S.push==="nosoporta"?"Este navegador no permite notificaciones. Probá con Chrome o con la app instalada.":S.push==="ios"?"En iPhone, primero agregá la app a la pantalla de inicio.":S.push==="bloqueada"?"Están bloqueadas en este navegador.":"Desactivadas."}</div></div>${S.push==="on"?`<button class="btn sm" onclick="sb.rpc('probar_notificacion');toast('Notificación de prueba enviada')">Probar</button><button class="btn sm ghost" onclick="desactivarNotis()">Desactivar</button>`:S.push!=="nosoporta"?`<button class="btn sm pri" onclick="activarNotis()">Activar</button>`:""}</section>
  ${isAdmin()?`<div class="note">${icon("users")}<span>Al sumar a alguien, avisale que entre al link del panel, toque <b>"Crear mi acceso"</b> con ese mismo mail y elija su contraseña. Si lo desactivás, pierde el acceso al instante.</span></div>`:""}
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

/* ---------- Prospectos ---------- */
const activeProsp = p => !["Ganado","Perdido"].includes(p.etapa);
function prospAtrasados(onlyMine){
  const t=today();
  return S.prospectos.filter(p=>activeProsp(p) && p.proximo && p.proximo<t && (!onlyMine || p.setter===S.me?.id));
}
function prospRow(p){
  const late=p.proximo&&p.proximo<today();
  return `<div class="row"><div class="main"><div class="t" style="cursor:pointer" onclick="formProspecto('${p.id}')">${esc(p.nombre)}${p.negocio?" · "+esc(p.negocio):""}</div>
    <div class="s">${esc([p.etapa, p.sede, p.setter?memName(p.setter):""].filter(Boolean).join(" · "))}</div></div>
    ${p.proximo?`<span class="pill ${late?"bad":"warn"}">${late?"Atrasado "+fmtDate(p.proximo):"Hoy"}</span>`:""}
    <button class="btn sm wa" onclick="usarPlantilla(null,'${p.id}')">${icon("wa")}Escribir</button></div>`;
}
function vProspectos(){
  const t=today(), q=S.f.pQ.toLowerCase();
  let list=S.prospectos.slice();
  if(S.f.pScope==="mios") list=list.filter(p=>p.setter===S.me.id);
  if(S.f.pSede) list=list.filter(p=>p.sede===S.f.pSede);
  if(q) list=list.filter(p=>[p.nombre,p.negocio,p.rubro,p.whatsapp,p.instagram].join(" ").toLowerCase().includes(q));
  const act=list.filter(activeProsp), atr=act.filter(p=>p.proximo&&p.proximo<t), hoy=act.filter(p=>p.proximo===t);
  const mes=t.slice(0,7), ganMes=list.filter(p=>p.etapa==="Ganado"&&String(p.actualizado).slice(0,7)===mes).length;
  const cerrados=list.filter(p=>!activeProsp(p)).length, ganTot=list.filter(p=>p.etapa==="Ganado").length;
  const et=S.f.pEt||"";
  let rows = et==="" ? act : et==="todos" ? list : list.filter(p=>p.etapa===et);
  rows = rows.sort((a,b)=> activeProsp(a)&&activeProsp(b) ? String(a.proximo||"9999").localeCompare(String(b.proximo||"9999")) : String(b.actualizado||b.creado).localeCompare(String(a.actualizado||a.creado)));
  const cells=`<div class="etcells">
    <button class="${et===""?"on":""}" style="--c:var(--brand)" onclick="S.f.pEt='';render()">En seguimiento<b>${act.length}</b></button>
    ${ETAPAS.map(e=>`<button class="${et===e?"on":""}" style="--c:${ETAPA_C[e]}" onclick="S.f.pEt='${e}';render()"><span class="dot"></span>${ETAPA_CORTA[e]}<b>${list.filter(p=>p.etapa===e).length}</b></button>`).join("")}
    <button class="${et==="todos"?"on":""}" style="--c:var(--ink-2)" onclick="S.f.pEt='todos';render()">Todos<b>${list.length}</b></button></div>`;
  const body = rows.length ? `<div class="plist">${rows.map(pRow).join("")}</div>` : `<div class="card">${emptyMsg(et===""?"No hay prospectos en seguimiento. Cargá el primero con “Nuevo prospecto”.":"No hay prospectos en esta etapa.","target")}</div>`;
  if(S.mobile){
    return `<div class="m-head"><div><div class="eyebrow">Ventas</div><h1>Prospectos</h1></div><a class="btn sm" href="#plantillas">${icon("message")}Plantillas</a></div>
    <div class="m-kpis"><div><b>${act.length}</b><span>En seguimiento</span></div><div class="${hoy.length?"warn":""}"><b>${hoy.length}</b><span>Hoy</span></div><div class="${atr.length?"bad":""}"><b>${atr.length}</b><span>Atrasados</span></div><div class="ok"><b>${ganMes}</b><span>Ganados mes</span></div></div>
    <div class="m-filters"><div class="seg"><button class="${S.f.pScope==="todos"?"on":""}" onclick="S.f.pScope='todos';render()">Todos</button><button class="${S.f.pScope==="mios"?"on":""}" onclick="S.f.pScope='mios';render()">Míos</button></div>
      <select id="pSedeM" aria-label="Sede" onchange="S.f.pSede=this.value;render()"><option value="">Todas las sedes</option>${SEDES.slice(0,3).map(x=>`<option ${S.f.pSede===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <input type="search" id="pQ" placeholder="Buscar por nombre, negocio o número…" value="${esc(S.f.pQ)}" oninput="S.f.pQ=this.value;render()" style="margin-bottom:10px">
    ${cells}${body}`;
  }
  return `${pageHead("Ventas","Prospectos","Nombre, negocio y número a la vista. Tocá la etapa para moverlo; lo atrasado se marca en rojo.",`<a class="btn" href="#plantillas">${icon("message")}Plantillas</a><button class="btn pri" onclick="formProspecto()">${icon("plus")}Nuevo prospecto</button>`)}
  <div class="kpis pk" style="margin-bottom:14px">
    <div class="kpi"><div class="v">${act.length}</div><div class="l">En seguimiento</div></div>
    <div class="kpi"><div class="v" style="color:var(--warn)">${hoy.length}</div><div class="l">Para contactar hoy</div></div>
    <div class="kpi"><div class="v" style="color:${atr.length?"var(--danger)":"inherit"}">${atr.length}</div><div class="l">Seguimiento atrasado</div></div>
    <div class="kpi"><div class="v" style="color:var(--ok)">${ganMes}</div><div class="l">Ganados este mes</div></div>
    <div class="kpi"><div class="v">${cerrados?Math.round(ganTot/cerrados*100)+"%":"—"}</div><div class="l">Tasa de cierre</div></div>
  </div>
  <div class="toolbar">
    <div class="seg"><button class="${S.f.pScope==="todos"?"on":""}" onclick="S.f.pScope='todos';render()">Todos</button><button class="${S.f.pScope==="mios"?"on":""}" onclick="S.f.pScope='mios';render()">Míos</button></div>
    <div class="seg">${["",...SEDES.slice(0,3)].map(s=>`<button class="${S.f.pSede===s?"on":""}" onclick="S.f.pSede='${s}';render()">${s||"Todas las sedes"}</button>`).join("")}</div>
    <input type="search" id="pQ" placeholder="Buscar por nombre, negocio o número…" value="${esc(S.f.pQ)}" oninput="S.f.pQ=this.value;render()">
  </div>
  ${cells}${body}`;
}
const ETAPA_CORTA = {"Nuevo":"Nuevo","Contactado":"Contactado","Reunión agendada":"Reunión","Propuesta enviada":"Propuesta","Ganado":"Ganado","Perdido":"Perdido"};
function pRow(p){
  const t=today(), late=activeProsp(p)&&p.proximo&&p.proximo<t, wa=waNumber(p.whatsapp||""), idx=ETAPAS.indexOf(p.etapa);
  const steps=ETAPAS.map((e,i)=>`<button type="button" class="${e===p.etapa?"on":""} ${e!=="Perdido"&&i<idx&&p.etapa!=="Perdido"?"done":""} ${e==="Perdido"?"lost":""}" style="--c:${ETAPA_C[e]}" title="${e===p.etapa?"Etapa actual":"Mover a "+e}" onclick="moverEtapa('${p.id}','${e}')">${ETAPA_CORTA[e]}</button>`).join("");
  return `<div class="prow2 ${late?"late":""}" style="--c:${ETAPA_C[p.etapa]||"var(--line)"}">
    <div class="pr-main" onclick="formProspecto('${p.id}')" title="Ver / editar">
      <div class="pr-nom">${esc(p.nombre)}</div>
      <div class="pr-neg">${p.negocio?esc(p.negocio):`<span class="nodata">Sin negocio</span>`}${p.rubro?` <span class="s">· ${esc(p.rubro)}</span>`:""}</div>
    </div>
    <div class="pr-tel">${wa?`<a class="tel" href="https://wa.me/${wa}" target="_blank" rel="noopener" title="Abrir WhatsApp">${icon("wa")}<span>${esc(p.whatsapp)}</span></a>
      <a class="btn sm ghost ic" href="tel:+${wa}" title="Llamar" aria-label="Llamar">${icon("phone")}</a>
      <button class="btn sm ghost ic" onclick="usarPlantilla(null,'${p.id}')" title="Mensaje con plantilla" aria-label="Mensaje con plantilla">${icon("message")}</button>`
      :`<span class="nodata">Sin número</span>`}</div>
    <div class="pr-meta">${activeProsp(p)&&p.proximo?`<span class="pill ${late?"bad":p.proximo===t?"warn":""}">${icon("clock")}${late?"Atrasado · ":p.proximo===t?"Hoy · ":""}${fmtDate(p.proximo)}</span>`:""}
      <span class="s">${p.sede?`<span class="sede-dot" style="--sc:${sedeColor(p.sede)}"></span>${esc(p.sede)} · `:""}${esc(p.setter?memName(p.setter):"Sin setter")}</span>
      ${p.etapa==="Ganado"&&!p.cliente_id?`<button class="btn sm pri" onclick="pasarACliente('${p.id}')">Pasar a cliente</button>`:""}</div>
    <div class="pr-steps">${steps}</div>
  </div>`;
}
function pCard(p){
  const t=today(), late=activeProsp(p)&&p.proximo&&p.proximo<t;
  const next=ETAPAS[ETAPAS.indexOf(p.etapa)+1];
  return `<div class="pcard ${late?"late":""}">
    <div class="t" onclick="formProspecto('${p.id}')">${esc(p.nombre)}</div>
    ${p.negocio||p.rubro?`<div class="s">${esc([p.negocio,p.rubro].filter(Boolean).join(" · "))}</div>`:""}
    <div class="s">${p.sede?`<span class="sede-dot" style="--sc:${sedeColor(p.sede)}"></span>${esc(p.sede)} · `:""}${esc(p.setter?memName(p.setter):"Sin setter")}${p.contactos?` · ${p.contactos} contacto${p.contactos>1?"s":""}`:""}</div>
    ${activeProsp(p)&&p.proximo?`<div><span class="pill ${late?"bad":p.proximo===t?"warn":""}">${icon("clock")}${late?"Atrasado · ":p.proximo===t?"Hoy · ":""}${fmtDate(p.proximo)}</span></div>`:""}
    ${p.etapa==="Ganado"&&!p.cliente_id?`<button class="btn sm pri" onclick="pasarACliente('${p.id}')">Pasar a cliente</button>`:""}
    ${p.etapa==="Perdido"&&p.motivo_perdida?`<div class="s">Motivo: ${esc(p.motivo_perdida)}</div>`:""}
    ${activeProsp(p)?`<div class="acts">${p.whatsapp?`<button class="btn sm wa" onclick="usarPlantilla(null,'${p.id}')">${icon("wa")}Escribir</button>`:`<button class="btn sm" onclick="usarPlantilla(null,'${p.id}')">${icon("message")}Mensaje</button>`}${next&&next!=="Perdido"?`<button class="btn sm" onclick="moverEtapa('${p.id}','${next}')">→ ${next}</button>`:""}</div>`:""}
  </div>`;
}
async function moverEtapa(id, etapa){
  const p=S.prospectos.find(x=>x.id===id); if(!p) return;
  if(etapa==="Perdido"){ formProspecto(id); return; }
  if(p.etapa===etapa) return;
  const data={etapa,actualizado:new Date().toISOString()};
  if(etapa==="Ganado") data.proximo=null;
  const prev={etapa:p.etapa,proximo:p.proximo,actualizado:p.actualizado}; Object.assign(p,data); render();
  if(!await run(sb.from("prospectos").update(data).eq("id",id), etapa==="Ganado"?"¡Prospecto ganado!":"Movido a "+etapa)){ Object.assign(p,prev); render(); }
}
function formProspecto(id){
  const p=id?S.prospectos.find(x=>x.id===id)||{}:{etapa:"Nuevo",setter:S.me.id,sede:S.me.sede||"",proximo:today()};
  openModal(`<h2>${id?esc(p.nombre):"Nuevo prospecto"}</h2><form class="form" onsubmit="saveProspecto(event,'${id||""}')">
    <label class="f" for="pNom">Nombre del contacto<input type="text" id="pNom" required value="${esc(p.nombre)}"></label>
    <label class="f" for="pNeg">Negocio<input type="text" id="pNeg" value="${esc(p.negocio)}"></label>
    <label class="f" for="pWa">Número de contacto (WhatsApp)<input type="tel" id="pWa" value="${esc(p.whatsapp)}" placeholder="381 555 1234" inputmode="tel"></label>
    <label class="f" for="pRub">Rubro<input type="text" id="pRub" value="${esc(p.rubro)}"></label>
    <label class="f" for="pIg">Instagram<input type="text" id="pIg" value="${esc(p.instagram)}" placeholder="@negocio"></label>
    <label class="f" for="pOri">Origen<select id="pOri"><option value="">—</option>${opts(ORIGENES,p.origen)}</select></label>
    <div class="sep">Seguimiento</div>
    <label class="f" for="pEt">Etapa<select id="pEt">${opts(ETAPAS,p.etapa)}</select></label>
    <label class="f" for="pProx">Próximo contacto<input type="date" id="pProx" value="${esc(p.proximo)}"></label>
    <label class="f" for="pSede">Sede<select id="pSede"><option value="">—</option>${opts(SEDES,p.sede)}</select></label>
    <label class="f" for="pSet">Setter<select id="pSet">${memOptions(p.setter)}</select></label>
    <label class="f" for="pPlan">Plan de interés<select id="pPlan"><option value="">—</option>${opts(PLANES,p.plan)}</select></label>
    <label class="f" for="pMot">Motivo si se perdió<input type="text" id="pMot" value="${esc(p.motivo_perdida)}" placeholder="Precio, no responde, ya tiene agencia…"></label>
    <label class="f full" for="pNot">Notas<textarea id="pNot" placeholder="Qué necesita, objeciones, presupuesto…">${esc(p.notas)}</textarea></label>
    ${id&&p.ultimo_contacto?`<p class="full s" style="margin:0">Último contacto: ${esc(new Date(p.ultimo_contacto).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}))} · ${p.contactos} en total</p>`:""}
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="askDel('prospectos','${id}','este prospecto')">Borrar</button>`:""}</div><div style="display:flex;gap:8px">${id?`<button type="button" class="btn wa" onclick="usarPlantilla(null,'${id}')">${icon("wa")}Escribir</button>`:""}<button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveProspecto(e,id){
  e.preventDefault();
  const etapa=v("pEt");
  const data={nombre:v("pNom"),negocio:v("pNeg"),rubro:v("pRub"),whatsapp:v("pWa"),instagram:v("pIg"),origen:v("pOri"),etapa,proximo:activeProsp({etapa})?nz(v("pProx")):null,sede:v("pSede"),setter:nz(v("pSet")),plan:v("pPlan"),motivo_perdida:v("pMot"),notas:v("pNot"),actualizado:new Date().toISOString()};
  const ok = id ? await run(sb.from("prospectos").update(data).eq("id",id),"Prospecto actualizado") : await run(sb.from("prospectos").insert(data),"Prospecto cargado");
  if(ok) closeModal();
}
async function pasarACliente(id){
  const p=S.prospectos.find(x=>x.id===id); if(!p) return;
  const { data:row, error } = await sb.from("clientes").insert({nombre:p.negocio||p.nombre,rubro:p.rubro,sede:p.sede,estado:"Onboarding",plan:p.plan,contacto:p.nombre,whatsapp:p.whatsapp,instagram:p.instagram,notas:p.notas}).select().single();
  if(error){ toast("No se pudo crear el cliente: "+error.message); return; }
  await sb.from("prospectos").update({cliente_id:row.id}).eq("id",id);
  toast("Cliente creado. Completá su ficha."); location.hash="cliente-"+row.id;
}

/* ---------- Plantillas ---------- */
const tplHighlight = txt => esc(txt).replace(/\{(\w+)\}/g,'<mark>{$1}</mark>');
function fillTpl(txt, vars){ return String(txt).replace(/\{(\w+)\}/g,(m,k)=>vars[k]!=null&&vars[k]!==""?vars[k]:m); }
function vPlantillas(){
  const list=S.plantillas.filter(p=>!S.f.tplEt||p.etapa===S.f.tplEt);
  const etapas=ETAPAS_TPL.filter(e=>S.plantillas.some(p=>p.etapa===e));
  return `${pageHead("Ventas","Plantillas de mensajes","Mensajes probados para cada etapa del seguimiento. Tocá <b>Usar</b>, completá el nombre y mandalo por WhatsApp.",isAdmin()?`<button class="btn pri" onclick="formPlantilla()">${icon("plus")}Nueva plantilla</button>`:"")}
  <div class="note">${icon("message")}<span>Las palabras entre llaves se completan solas: <b>{nombre}</b>, <b>{negocio}</b>, <b>{sede}</b> y <b>{setter}</b> (tu nombre).</span></div>
  <div class="toolbar"><div class="seg">${["",...etapas].map(e=>`<button class="${S.f.tplEt===e?"on":""}" onclick="S.f.tplEt='${e}';render()">${e||"Todas"}</button>`).join("")}</div></div>
  <div class="grid g3">${list.map(p=>`<div class="tpl">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><div class="t">${esc(p.titulo)}</div><div class="s">${esc(p.etapa)} · ${esc(p.canal)}</div></div>${isAdmin()?`<button class="btn sm ghost" onclick="formPlantilla('${p.id}')">Editar</button>`:""}</div>
    <div class="txt">${tplHighlight(p.texto)}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm pri" onclick="usarPlantilla('${p.id}')">Usar</button><button class="btn sm" data-v="${esc(p.texto)}" onclick="copyText(this.dataset.v)">${icon("copy")}Copiar</button></div>
  </div>`).join("")||emptyMsg("No hay plantillas en esta etapa.","message")}</div>`;
}
function usarPlantilla(tplId, prospId){
  const p=prospId?S.prospectos.find(x=>x.id===prospId):null;
  const tpls=S.plantillas;
  if(!tpls.length){ toast("Todavía no hay plantillas cargadas."); return; }
  let tpl=tplId?tpls.find(x=>x.id===tplId):null;
  if(!tpl){
    const sug={"Nuevo":"Primer contacto","Contactado":"Seguimiento","Reunión agendada":"Reunión","Propuesta enviada":"Propuesta"}[p?.etapa]||"Primer contacto";
    tpl=tpls.find(x=>x.etapa===sug)||tpls[0];
  }
  S.uso={tpl:tpl.id,prosp:prospId||""};
  openModal(`<h2>Enviar mensaje</h2>
    <div class="form">
      <label class="f full" for="uTpl">Plantilla<select id="uTpl" onchange="S.uso.tpl=this.value;refreshUso()">${ETAPAS_TPL.map(e=>{const g=tpls.filter(x=>x.etapa===e);return g.length?`<optgroup label="${e}">${g.map(x=>`<option value="${x.id}" ${x.id===tpl.id?"selected":""}>${esc(x.titulo)}</option>`).join("")}</optgroup>`:"";}).join("")}</select></label>
      <label class="f full" for="uPro">Prospecto<select id="uPro" onchange="S.uso.prosp=this.value;fillUsoFromProsp();refreshUso()"><option value="">— Escribir a mano —</option>${S.prospectos.filter(activeProsp).map(x=>`<option value="${x.id}" ${x.id===prospId?"selected":""}>${esc(x.nombre)}${x.negocio?" · "+esc(x.negocio):""}</option>`).join("")}</select></label>
      <label class="f" for="uNom">Nombre<input type="text" id="uNom" value="${esc(p?.nombre?.split(" ")[0]||"")}" oninput="refreshUso()"></label>
      <label class="f" for="uNeg">Negocio<input type="text" id="uNeg" value="${esc(p?.negocio||"tu negocio")}" oninput="refreshUso()"></label>
      <label class="f" for="uSede">Sede<input type="text" id="uSede" value="${esc(p?.sede||S.me.sede||"")}" oninput="refreshUso()"></label>
      <label class="f" for="uWa">WhatsApp<input type="tel" id="uWa" value="${esc(p?.whatsapp||"")}" oninput="refreshUso()"></label>
      <label class="f full" for="uTxt">Mensaje (lo podés retocar)<textarea id="uTxt" style="min-height:190px" oninput="refreshUso()"></textarea></label>
      <div class="full" id="uReg">${prospId?`<label class="check"><input type="checkbox" id="uLog" checked><span>Registrar el contacto y programar el próximo seguimiento en <select id="uDias" style="width:auto;display:inline-block;padding:3px 6px"><option value="1">1 día</option><option value="2" selected>2 días</option><option value="3">3 días</option><option value="7">1 semana</option></select></span></label>`:""}</div>
      <div class="actions"><button type="button" class="btn" onclick="closeModal()">Cerrar</button><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="enviarUso('copiar')">${icon("copy")}Copiar</button><a class="btn wa" id="uWaBtn" href="#" target="_blank" rel="noopener" onclick="enviarUso('wa')">${icon("wa")}Abrir WhatsApp</a></div></div>
    </div>`);
  refreshUso();
}
function fillUsoFromProsp(){
  const p=S.prospectos.find(x=>x.id===S.uso.prosp);
  $("#uNom").value=p?.nombre?.split(" ")[0]||""; $("#uNeg").value=p?.negocio||"tu negocio"; $("#uSede").value=p?.sede||S.me.sede||""; $("#uWa").value=p?.whatsapp||"";
  $("#uReg").innerHTML=p?`<label class="check"><input type="checkbox" id="uLog" checked><span>Registrar el contacto y programar el próximo seguimiento en <select id="uDias" style="width:auto;display:inline-block;padding:3px 6px"><option value="1">1 día</option><option value="2" selected>2 días</option><option value="3">3 días</option><option value="7">1 semana</option></select></span></label>`:"";
}
function waNumber(raw){
  let d=String(raw||"").replace(/\D/g,"");
  if(!d) return "";
  if(d.startsWith("00")) d=d.slice(2);
  if(d.startsWith("0")) d=d.slice(1);
  d=d.replace(/^(\d{2,4})15(\d{6,8})$/,"$1$2");
  if(!d.startsWith("54")) d="549"+d; else if(!d.startsWith("549")) d="549"+d.slice(2);
  return d;
}
function refreshUso(){
  const tpl=S.plantillas.find(x=>x.id===S.uso.tpl); if(!tpl) return;
  const txt=fillTpl(tpl.texto,{nombre:v("uNom"),negocio:v("uNeg"),sede:v("uSede"),setter:(S.me.nombre||"").split(" ")[0]});
  const ta=$("#uTxt"); if(document.activeElement!==ta) ta.value=txt;
  const n=waNumber(v("uWa")), btn=$("#uWaBtn");
  btn.href = "https://wa.me/"+n+"?text="+encodeURIComponent(ta.value);
  btn.toggleAttribute("aria-disabled", !n); btn.style.opacity = n?1:.5;
}
async function enviarUso(modo){
  const txt=$("#uTxt").value;
  if(modo==="copiar") await copyText(txt);
  if(modo==="wa"){ const n=waNumber(v("uWa")); if(!n){ toast("Cargá el número de WhatsApp."); event.preventDefault(); return; } $("#uWaBtn").href="https://wa.me/"+n+"?text="+encodeURIComponent(txt); }
  const log=$("#uLog");
  if(log&&log.checked&&S.uso.prosp){
    const p=S.prospectos.find(x=>x.id===S.uso.prosp); if(!p) return;
    const data={contactos:(p.contactos||0)+1,ultimo_contacto:new Date().toISOString(),proximo:addDays(today(),Number($("#uDias").value||2)),actualizado:new Date().toISOString()};
    if(p.etapa==="Nuevo") data.etapa="Contactado";
    await run(sb.from("prospectos").update(data).eq("id",p.id),"Contacto registrado");
    log.checked=false;
  }
}
function formPlantilla(id){
  const p=id?S.plantillas.find(x=>x.id===id)||{}:{etapa:"Seguimiento",canal:"WhatsApp",orden:100};
  openModal(`<h2>${id?"Editar plantilla":"Nueva plantilla"}</h2><form class="form" onsubmit="savePlantilla(event,'${id||""}')">
    <label class="f full" for="plTit">Título<input type="text" id="plTit" required value="${esc(p.titulo)}"></label>
    <label class="f" for="plEt">Etapa<select id="plEt">${opts(ETAPAS_TPL,p.etapa)}</select></label>
    <label class="f" for="plCan">Canal<select id="plCan">${opts(["WhatsApp","Instagram","Mail"],p.canal)}</select></label>
    <label class="f full" for="plTxt">Texto<textarea id="plTxt" required style="min-height:200px" placeholder="Hola {nombre}, soy {setter} de Furor…">${esc(p.texto)}</textarea></label>
    <label class="f" for="plOrd">Orden<input type="number" id="plOrd" value="${esc(p.orden)}"></label>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="askDel('plantillas','${id}','esta plantilla')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function savePlantilla(e,id){
  e.preventDefault();
  const data={titulo:v("plTit"),etapa:v("plEt"),canal:v("plCan"),texto:$("#plTxt").value.trim(),orden:Number(v("plOrd")||100)};
  const ok = id ? await run(sb.from("plantillas").update(data).eq("id",id),"Plantilla guardada") : await run(sb.from("plantillas").insert(Object.assign({autor:S.me.id},data)),"Plantilla creada");
  if(ok) closeModal();
}

/* ---------- Material ---------- */
function vMaterial(){
  const list=S.material.filter(m=>!S.f.matCat||m.categoria===S.f.matCat).sort((a,b)=>(b.vigente-a.vigente)||(CAT_MAT.indexOf(a.categoria)-CAT_MAT.indexOf(b.categoria))||String(b.actualizado).localeCompare(String(a.actualizado)));
  const cats=CAT_MAT.filter(c=>S.material.some(m=>m.categoria===c));
  const hon=S.material.filter(m=>m.categoria==="Honorarios"&&m.vigente);
  return `${pageHead("Ventas","Material","Honorarios vigentes, propuestas, contratos y presentaciones para usar con prospectos y clientes.",isAdmin()?`<button class="btn pri" onclick="formMaterial()">${icon("plus")}Subir material</button>`:"")}
  ${hon.length?`<div class="note" style="background:var(--brand-soft)">${icon("ok")}<span><b>Honorarios vigentes:</b> ${hon.map(h=>esc(h.titulo)+(h.sede?" ("+esc(h.sede)+")":"")).join(", ")}. Usá siempre estos al pasar precios.</span></div>`:`<div class="note">${icon("file")}<span>${isAdmin()?"Subí el PDF de honorarios actualizado y marcalo como <b>vigente</b>: el equipo lo va a ver destacado arriba de todo.":"Todavía no hay honorarios cargados. Consultale a Marcelo antes de pasar precios."}</span></div>`}
  <div class="toolbar"><div class="seg">${["",...cats].map(c=>`<button class="${S.f.matCat===c?"on":""}" onclick="S.f.matCat='${c}';render()">${c||"Todo"}</button>`).join("")}</div></div>
  <div class="grid g2">${list.map(docCard).join("")||`<div class="card">${emptyMsg("No hay material cargado todavía.","file")}</div>`}</div>`;
}
function docCard(m){
  const a=m.archivo, ext=a?(a.nombre.split(".").pop()||"").slice(0,4).toUpperCase():"LINK", link=safeUrl(m.link);
  return `<div class="doc ${m.vigente?"vig":""}"><div class="fic ${a?"":"link"}">${esc(ext)}</div><div class="main">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="t">${esc(m.titulo)}</span>${m.vigente?`<span class="pill brand">Vigente</span>`:`<span class="pill">Anterior</span>`}</div>
    <div class="s">${esc([m.categoria,m.sede||"Todas las sedes","actualizado "+fmtDate(String(m.actualizado).slice(0,10))].join(" · "))}</div>
    ${m.descripcion?`<div style="font-size:14px;white-space:pre-wrap">${esc(m.descripcion)}</div>`:""}
    <div class="acts">${a?`<button class="btn sm pri" onclick="abrirMaterial('${m.id}',false)">${icon("eye")}Ver</button><button class="btn sm" onclick="abrirMaterial('${m.id}',true)">${icon("download")}Descargar</button>`:""}${link?`<a class="btn sm" href="${esc(link)}" target="_blank" rel="noopener">Abrir link</a>`:""}${isAdmin()?`<button class="btn sm ghost" onclick="formMaterial('${m.id}')">Editar</button>`:""}</div>
  </div></div>`;
}
async function abrirMaterial(id, descargar){
  const m=S.material.find(x=>x.id===id); if(!m?.archivo) return;
  const w = descargar ? null : window.open("", "_blank");
  const { data, error } = await sb.storage.from("material").createSignedUrl(m.archivo.path, 3600, descargar?{download:m.archivo.nombre}:undefined);
  if(error){ if(w) w.close(); toast("No se pudo abrir el archivo."); return; }
  if(w) w.location=data.signedUrl; else window.location.href=data.signedUrl;
}
function formMaterial(id){
  const m=id?S.material.find(x=>x.id===id)||{}:{categoria:"Honorarios",vigente:true};
  openModal(`<h2>${id?"Editar material":"Subir material"}</h2><form class="form" onsubmit="saveMaterial(event,'${id||""}')">
    <label class="f full" for="maTit">Título<input type="text" id="maTit" required value="${esc(m.titulo)}" placeholder="Ej: Honorarios Furor · Diciembre 2026"></label>
    <label class="f" for="maCat">Categoría<select id="maCat">${opts(CAT_MAT,m.categoria)}</select></label>
    <label class="f" for="maSede">Sede<select id="maSede"><option value="">Todas las sedes</option>${opts(SEDES,m.sede)}</select></label>
    <label class="f full" for="maFile">Archivo (PDF, imagen, hasta 50 MB)${m.archivo?` <span class="s">Actual: ${esc(m.archivo.nombre)}. Elegí otro solo si querés reemplazarlo.</span>`:""}<input type="file" id="maFile" accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"></label>
    <label class="f full" for="maLink">O un link (Drive, Canva…)<input type="url" id="maLink" value="${esc(m.link)}"></label>
    <label class="f full" for="maDes">Descripción / cómo usarlo<textarea id="maDes" placeholder="Ej: Usar para prospectos de Salta y Santiago desde el 1/12.">${esc(m.descripcion)}</textarea></label>
    <label class="check full"><input type="checkbox" id="maVig" ${m.vigente?"checked":""}><span>Vigente (si es honorarios, los anteriores de la misma sede pasan a "Anterior")</span></label>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="askDel('material','${id}','este material')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri" id="maSave">Guardar</button></div></div></form>`);
}
async function saveMaterial(e,id){
  e.preventDefault();
  const prev=id?S.material.find(x=>x.id===id)||{}:{};
  const f=$("#maFile").files[0];
  if(!f && !v("maLink") && !prev.archivo){ toast("Subí un archivo o pegá un link."); return; }
  if(f && f.size>MAX_MB*1048576){ toast(`El archivo pesa más de ${MAX_MB} MB.`); return; }
  $("#maSave").disabled=true; $("#maSave").textContent="Guardando…";
  let archivo=prev.archivo||null;
  if(f){
    const safe=f.name.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^\w.-]+/g,"_");
    const path=`${Date.now()}_${safe}`;
    const up=await sb.storage.from("material").upload(path,f,{contentType:f.type||undefined});
    if(up.error){ toast("No se pudo subir: "+up.error.message); $("#maSave").disabled=false; $("#maSave").textContent="Guardar"; return; }
    if(prev.archivo) await sb.storage.from("material").remove([prev.archivo.path]);
    archivo={path,nombre:f.name,tipo:f.type,tam:f.size};
  }
  const data={titulo:v("maTit"),categoria:v("maCat"),sede:v("maSede"),link:v("maLink"),descripcion:v("maDes"),vigente:$("#maVig").checked,archivo,actualizado:new Date().toISOString()};
  if(data.vigente && data.categoria==="Honorarios"){
    const otros=S.material.filter(x=>x.id!==id&&x.categoria==="Honorarios"&&x.vigente&&(x.sede||"")===data.sede).map(x=>x.id);
    if(otros.length) await sb.from("material").update({vigente:false}).in("id",otros);
  }
  const ok = id ? await run(sb.from("material").update(data).eq("id",id),"Material actualizado") : await run(sb.from("material").insert(Object.assign({autor:S.me.id},data)),"Material subido");
  if(ok) closeModal(); else { $("#maSave").disabled=false; $("#maSave").textContent="Guardar"; }
}

/* ---------- Publicados (links para enviar al cliente) ---------- */
const FMT_PUB = ["Reel","Post","Carrusel","Historia","Video","Otro"];
const REDES = ["Instagram","Facebook","TikTok","YouTube","Otra"];
const shortUrl = u => String(u).replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,"").slice(0,48)+(String(u).length>55?"…":"");
function vPublicados(){
  const q=S.f.pubQ.toLowerCase();
  let list=S.publicados.filter(p=>(S.f.pubEst!=="pendientes"||!p.enviado)&&(!S.f.pubCli||p.cliente_id===S.f.pubCli));
  if(q) list=list.filter(p=>[cliName(p.cliente_id),p.url,p.nota,p.formato].join(" ").toLowerCase().includes(q));
  const byCli={}; list.forEach(p=>(byCli[p.cliente_id]=byCli[p.cliente_id]||[]).push(p));
  const ids=Object.keys(byCli).sort((a,b)=>cliName(a).localeCompare(cliName(b)));
  const pend=S.publicados.filter(p=>!p.enviado).length;
  return `${pageHead("Cuentas","Publicados","La CM carga el link de cada publicación. Después se los mandás al cliente por WhatsApp, todos juntos en un solo mensaje.",`<button class="btn pri" onclick="formPublicado()">${icon("plus")}Cargar link</button>`)}
  <div class="toolbar">
    <div class="seg"><button class="${S.f.pubEst==="pendientes"?"on":""}" onclick="S.f.pubEst='pendientes';render()">Sin enviar <span class="count" style="margin-left:4px">${pend}</span></button><button class="${S.f.pubEst==="todos"?"on":""}" onclick="S.f.pubEst='todos';render()">Todos</button></div>
    <select id="pubCli" aria-label="Cliente" onchange="S.f.pubCli=this.value;render()"><option value="">Todos los clientes</option>${S.clientes.filter(c=>S.publicados.some(p=>p.cliente_id===c.id)).map(c=>`<option value="${c.id}" ${S.f.pubCli===c.id?"selected":""}>${esc(c.nombre)}</option>`).join("")}</select>
    <input type="search" id="pubQ" placeholder="Buscar…" value="${esc(S.f.pubQ)}" oninput="S.f.pubQ=this.value;render()">
  </div>
  <div class="grid">${ids.map(id=>`<section class="card">${cardH(`<a href="#cliente-${id}" style="color:inherit;text-decoration:none">${esc(cliName(id))}</a> <span class="count">${byCli[id].length}</span>`, cli(id)?.whatsapp?`<span class="s">${icon("phone")} ${esc(cli(id).whatsapp)}</span>`:"")}${pubGroup(cli(id)||{id}, byCli[id], true)}</section>`).join("")
    || `<div class="card">${emptyMsg(S.f.pubEst==="pendientes"?"No hay links pendientes de enviar. Todo al día.":"Todavía no hay links cargados.","link")}</div>`}</div>`;
}
function pubGroup(c, items, inCard){
  items=items.slice().sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
  if(!items.length) return `<div class="${inCard?"":"card"}">${emptyMsg("Sin links cargados para este cliente.","link")}</div>`;
  const sel=items.filter(p=>S.selPub[p.id]).length;
  const rows=items.map(p=>{ const u=safeUrl(p.url); return `<div class="row prow">
    <input type="checkbox" aria-label="Seleccionar" ${S.selPub[p.id]?"checked":""} onchange="S.selPub['${p.id}']=this.checked;render()" style="width:17px;height:17px;accent-color:var(--brand)">
    <div class="main"><div class="t">${esc(p.formato)} · ${esc(p.red)} <span class="s" style="font-weight:400">· ${fmtDate(p.fecha)}</span></div>
      <div class="s">${u?`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(shortUrl(p.url))}</a>`:esc(p.url)}${p.nota?" · "+esc(p.nota):""}</div></div>
    <button class="btn sm envbtn ${p.enviado?"on":""}" onclick="toggleEnviado('${p.id}')" title="${p.enviado?"Tocá para desmarcar":"Marcar como enviado al cliente"}">${p.enviado?icon("ok")+"Enviado":"Ya lo envié"}</button>
    <button class="btn sm ghost" data-v="${esc(p.url)}" onclick="copyText(this.dataset.v)" aria-label="Copiar link">${icon("copy")}</button>
    <button class="btn sm ghost" onclick="formPublicado('${p.id}')">Editar</button></div>`; }).join("");
  const unsent=items.filter(p=>!p.enviado).map(p=>p.id);
  return `${inCard?"":`<div class="card">`}<div class="list">${rows}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
      <button class="btn wa" onclick="enviarPublicados('${c.id}')">${icon("wa")}Enviar ${sel?sel+" seleccionado"+(sel>1?"s":""):unsent.length?"los "+unsent.length+" sin enviar":"todos"}</button>
      ${unsent.length?`<button class="btn" onclick="marcarTodosEnviados('${c.id}')">${icon("ok")}Marcar ${unsent.length>1?"los "+unsent.length:"el link"} como enviado${unsent.length>1?"s":""}</button>`:""}
      ${sel?`<button class="btn ghost" onclick="${items.map(p=>`S.selPub['${p.id}']=false;`).join("")}render()">Quitar selección</button>`:""}
    </div>${inCard?"":"</div>"}`;
}
async function toggleEnviado(id){
  const p=S.publicados.find(x=>x.id===id); if(!p) return;
  const enviado=!p.enviado;
  Object.assign(p,{enviado,enviado_el:enviado?new Date().toISOString():null,enviado_por:enviado?S.me.id:null}); render();
  const { error } = await sb.from("publicados").update({enviado,enviado_el:p.enviado_el,enviado_por:p.enviado_por}).eq("id",id);
  if(error){ p.enviado=!enviado; render(); toast("No se pudo guardar."); }
  else if(enviado) toast("Marcado como enviado");
}
async function marcarTodosEnviados(cid){
  const ids=S.publicados.filter(p=>p.cliente_id===cid&&!p.enviado).map(p=>p.id); if(!ids.length) return;
  const now=new Date().toISOString();
  S.publicados.forEach(p=>{ if(ids.includes(p.id)) Object.assign(p,{enviado:true,enviado_el:now,enviado_por:S.me.id}); }); render();
  await run(sb.from("publicados").update({enviado:true,enviado_el:now,enviado_por:S.me.id}).in("id",ids), ids.length>1?ids.length+" links marcados como enviados":"Marcado como enviado");
}
function enviarPublicados(cid){
  const c=cli(cid)||{}; const all=S.publicados.filter(p=>p.cliente_id===cid);
  let items=all.filter(p=>S.selPub[p.id]);
  if(!items.length) items=all.filter(p=>!p.enviado);
  if(!items.length) items=all;
  items=items.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  S.envio={cid,ids:items.map(p=>p.id)};
  const saludo=(c.contacto||"").split(" ")[0];
  const txt=`Hola${saludo?" "+saludo:""}! 👋 Te compartimos lo que publicamos para ${c.nombre||"tu cuenta"}:\n\n${items.map(p=>`▸ ${p.formato} (${fmtDate(p.fecha)}): ${p.url}`).join("\n")}\n\nCualquier comentario o idea, nos avisás. ¡Seguimos!`;
  const n=waNumber(c.whatsapp);
  openModal(`<h2>Enviar a ${esc(c.nombre||"cliente")}</h2><div class="form">
    <label class="f full" for="envTxt">Mensaje (lo podés editar)<textarea id="envTxt" style="min-height:220px" oninput="refreshEnvio()">${esc(txt)}</textarea></label>
    <label class="check full"><input type="checkbox" id="envMark" checked><span>Marcar ${items.length} link${items.length>1?"s":""} como enviado${items.length>1?"s":""}</span></label>
    ${n?"":`<p class="full s" style="margin:0">Este cliente no tiene WhatsApp cargado en su ficha: usá "Elegir chat" y seleccionalo en WhatsApp.</p>`}
    <div class="actions"><button type="button" class="btn" onclick="closeModal()">Cerrar</button><div style="display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="btn" onclick="confirmarEnvio('copiar')">${icon("copy")}Copiar</button>
      <a class="btn ${n?"":"wa"}" id="envElegir" href="#" target="_blank" rel="noopener" onclick="confirmarEnvio('wa')">${icon("wa")}Elegir chat</a>
      ${n?`<a class="btn wa" id="envDirecto" href="#" target="_blank" rel="noopener" onclick="confirmarEnvio('wa')">${icon("wa")}WhatsApp de ${esc(c.nombre)}</a>`:""}
    </div></div></div>`);
  refreshEnvio();
}
function refreshEnvio(){
  const t=encodeURIComponent($("#envTxt").value), c=cli(S.envio.cid)||{}, n=waNumber(c.whatsapp);
  $("#envElegir").href="https://wa.me/?text="+t;
  const d=$("#envDirecto"); if(d) d.href="https://wa.me/"+n+"?text="+t;
}
async function confirmarEnvio(modo){
  refreshEnvio();
  if(modo==="copiar") await copyText($("#envTxt").value);
  if($("#envMark").checked){
    $("#envMark").checked=false;
    const ids=S.envio.ids; ids.forEach(id=>S.selPub[id]=false);
    await run(sb.from("publicados").update({enviado:true,enviado_el:new Date().toISOString(),enviado_por:S.me.id}).in("id",ids),"Marcados como enviados");
  }
}
function formPublicado(id, cid, fecha, formato, desdeCalendario){
  const p=id?S.publicados.find(x=>x.id===id)||{}:{cliente_id:cid||S.f.pubCli||"",fecha:fecha||today(),formato:{"Feed":"Post"}[formato]||formato||"Reel",red:"Instagram"};
  openModal(`<h2>${id?"Editar link":desdeCalendario?"¿Pegás el link de la publicación?":"Cargar link publicado"}</h2>
  ${desdeCalendario?`<p class="s" style="margin:-8px 0 14px">Marcaste ${esc(formato)} de ${esc(cliName(cid))} como publicado. Si pegás el link ahora, queda listo para mandárselo al cliente.</p>`:""}
  <form class="form" onsubmit="savePublicado(event,'${id||""}')">
    <label class="f full" for="puUrl">${id?"Link":"Link (podés pegar varios, uno por línea)"}${id?`<input type="url" id="puUrl" required value="${esc(p.url)}">`:`<textarea id="puUrl" required style="min-height:70px" placeholder="https://www.instagram.com/reel/…"></textarea>`}</label>
    <label class="f" for="puCli">Cliente<select id="puCli" required><option value="">Elegí el cliente</option>${S.clientes.filter(c=>c.estado!=="Baja"||c.id===p.cliente_id).map(c=>`<option value="${c.id}" ${p.cliente_id===c.id?"selected":""}>${esc(c.nombre)}</option>`).join("")}</select></label>
    <label class="f" for="puFecha">Fecha de publicación<input type="date" id="puFecha" value="${esc(p.fecha)}"></label>
    <label class="f" for="puFmt">Formato<select id="puFmt">${opts(FMT_PUB,p.formato)}</select></label>
    <label class="f" for="puRed">Red<select id="puRed">${opts(REDES,p.red)}</select></label>
    <label class="f full" for="puNota">Nota (opcional)<input type="text" id="puNota" value="${esc(p.nota)}" placeholder="Ej: Promo Black Friday"></label>
    ${id?`<label class="check full"><input type="checkbox" id="puEnv" ${p.enviado?"checked":""}><span>Ya se envió al cliente</span></label>`:""}
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="askDel('publicados','${id}','este link')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">${desdeCalendario?"Ahora no":"Cancelar"}</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function savePublicado(e,id){
  e.preventDefault();
  const base={cliente_id:v("puCli"),fecha:v("puFecha")||today(),formato:v("puFmt"),red:v("puRed"),nota:v("puNota")};
  if(!base.cliente_id){ toast("Elegí el cliente."); return; }
  if(id){
    const enviado=$("#puEnv").checked;
    if(await run(sb.from("publicados").update(Object.assign({url:v("puUrl"),enviado,enviado_el:enviado?(S.publicados.find(x=>x.id===id)?.enviado_el||new Date().toISOString()):null},base)).eq("id",id),"Link actualizado")) closeModal();
    return;
  }
  const urls=$("#puUrl").value.split(/\s+/).map(x=>x.trim()).filter(Boolean);
  if(!urls.length){ toast("Pegá al menos un link."); return; }
  const rows=urls.map(url=>Object.assign({url,autor:S.me.id},base));
  if(await run(sb.from("publicados").insert(rows), urls.length>1?urls.length+" links cargados":"Link cargado")) closeModal();
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
  if(table==="material"){ const m=S.material.find(x=>x.id===id); if(m?.archivo) await sb.storage.from("material").remove([m.archivo.path]); }
  if(table==="entregas"){ const e=S.entregas.find(x=>x.id===id); const paths=(e?.archivos||[]).map(f=>f.path); if(paths.length) await sb.storage.from("entregas").remove(paths); }
  if(await run(sb.from(table).delete().eq("id",id),"Borrado")){ closeModal(); if(table==="clientes") location.hash="clientes"; }
}

function pintarFotosForm(){ const el=$("#tFotos"); if(!el) return; el.innerHTML=(S.pendAtt["form-tarea"]||[]).map((p,i)=>`<div class="pthumb"><img src="${p.url}" alt=""><button type="button" onclick="S.pendAtt['form-tarea'].splice(${i},1);pintarFotosForm()" aria-label="Quitar">✕</button></div>`).join(""); }
function formTarea(id, cliId, vence){
  S.pendAtt["form-tarea"]=[];
  const t=id?S.tareas.find(x=>x.id===id)||{}:{asignado:S.me.id,cliente_id:cliId||"",prioridad:"media",estado:"pendiente",area:"General",vence:vence||""};
  openModal(`<h2>${id?"Editar tarea":"Nueva tarea"}</h2><form class="form" onsubmit="saveTarea(event,'${id||""}')">
    <label class="f full" for="tTit">Tarea<input type="text" id="tTit" required value="${esc(t.titulo)}" placeholder="Ej: Diseñar 3 placas de feed para TANK"></label>
    <label class="f full" for="tDet">Detalle<textarea id="tDet" onpaste="pegarAdj(event,'form-tarea')" placeholder="Brief, links, referencias">${esc(t.detalle)}</textarea></label>
    <label class="f" for="tAsig">Responsable<select id="tAsig">${memOptions(t.asignado)}</select></label>
    <label class="f" for="tCli">Cliente<select id="tCli">${cliOptions(t.cliente_id)}</select></label>
    <label class="f" for="tArea2">Área<select id="tArea2">${opts(AREAS,t.area)}</select></label>
    <label class="f" for="tPrio">Prioridad<select id="tPrio">${[["alta","Alta"],["media","Media"],["baja","Baja"]].map(([k,l])=>`<option value="${k}" ${t.prioridad===k?"selected":""}>${l}</option>`).join("")}</select></label>
    <label class="f" for="tVence">Vence<input type="date" id="tVence" value="${esc(t.vence)}"></label>
    <label class="f" for="tEst">Estado<select id="tEst">${[["pendiente","Por hacer"],["curso","En curso"],["hecha","Hecha"]].map(([k,l])=>`<option value="${k}" ${t.estado===k?"selected":""}>${l}</option>`).join("")}</select></label>
    <div class="full"><div class="f" style="margin-bottom:6px">Fotos de referencia</div>
      <div class="pend" id="tFotos" style="border:0;padding:0 0 8px"></div>
      <label class="btn" style="cursor:pointer">${icon("image")}Agregar fotos<input type="file" hidden accept="image/*" multiple onchange="agregarAdj('form-tarea',this.files);pintarFotosForm();this.value=''"></label>
      <span class="s" style="margin-left:8px">También podés pegar una captura acá (Ctrl+V).</span>
      ${id?`<div style="margin-top:10px"><a href="#tarea-${id}" onclick="closeModal()">${icon("chat")} Ver la conversación de la tarea (${S.mensajes.filter(m=>m.tarea_id===id).length} mensajes)</a></div>`:""}</div>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="askDel('tareas','${id}','esta tarea')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveTarea(e,id){
  e.preventDefault();
  const prev=id?S.tareas.find(x=>x.id===id)||{}:{};
  const estado=v("tEst");
  const data={titulo:v("tTit"),detalle:v("tDet"),asignado:nz(v("tAsig")),cliente_id:nz(v("tCli")),area:v("tArea2"),prioridad:v("tPrio"),vence:nz(v("tVence")),estado,hecha_el:estado==="hecha"?(prev.hecha_el||new Date().toISOString()):null};
  const btn=e.submitter||document.querySelector("#modal .btn.pri"); if(btn){ btn.disabled=true; btn.textContent="Guardando…"; }
  let tid=id;
  if(id){ if(!await run(sb.from("tareas").update(data).eq("id",id))){ if(btn){btn.disabled=false;btn.textContent="Guardar";} return; } }
  else {
    const { data:row, error } = await sb.from("tareas").insert(Object.assign({creado_por:S.me.id},data)).select().single();
    if(error){ toast("No se pudo guardar: "+error.message); if(btn){btn.disabled=false;btn.textContent="Guardar";} return; }
    tid=row.id;
  }
  const fotos=S.pendAtt["form-tarea"]||[];
  if(fotos.length){
    const adjuntos=[];
    for(const p of fotos){
      const blob=await comprimirImagen(p.file);
      const path=`t-${tid}/${Date.now()}_${Math.random().toString(36).slice(2,7)}.${blob.type==="image/png"?"png":blob.type==="image/gif"?"gif":"jpg"}`;
      const up=await sb.storage.from("chat").upload(path,blob,{contentType:blob.type});
      if(!up.error) adjuntos.push({path,nombre:p.file.name,tipo:blob.type,tam:blob.size});
    }
    fotos.forEach(p=>URL.revokeObjectURL(p.url)); S.pendAtt["form-tarea"]=[];
    if(adjuntos.length) await run(sb.from("mensajes").insert({tarea_id:tid,autor:S.me.id,texto:"Fotos de referencia",adjuntos}));
  }
  toast(id?"Tarea actualizada":"Tarea creada"); closeModal();
}

function formEvento(id, fecha, cliId, fer){
  const ev=id?S.eventos.find(x=>x.id===id)||{}:fer?{fecha:fecha||today(),tipo:"Feriado",titulo:"Feriado",sede:"",participantes:[]}:{fecha:fecha||today(),cliente_id:cliId||"",participantes:[S.me.id],tipo:"Reunión",sede:S.me.sede||""};
  const parts=ev.participantes||[];
  openModal(`<h2>${id?"Editar":esFer(ev)?"Marcar feriado":"Agendar"}</h2><form class="form ${esFer(ev)?"es-fer":""}" id="evForm" onsubmit="saveEvento(event,'${id||""}')">
    <label class="f full" for="eTit">Título<input type="text" id="eTit" ${esFer(ev)?"":"required"} value="${esc(ev.titulo)}" placeholder="Ej: Presentación de propuesta a prospecto"></label>
    <label class="f" for="eTipo">Tipo<select id="eTipo" onchange="document.getElementById('evForm').classList.toggle('es-fer',this.value==='Feriado')">${opts(TIPOS_EV,ev.tipo)}</select></label>
    <label class="f" for="eSede">Sede<select id="eSede"><option value="">Todas las sedes</option>${opts(SEDES,ev.sede)}</select></label>
    <label class="f" for="eFecha">Fecha<input type="date" id="eFecha" required value="${esc(ev.fecha)}"></label>
    <label class="f nofer" for="eHora">Hora<input type="time" id="eHora" value="${esc(hhmm(ev.hora))}"></label>
    <label class="f nofer" for="eCli">Cliente<select id="eCli">${cliOptions(ev.cliente_id)}</select></label>
    <label class="f nofer" for="eCont">Prospecto / contacto<input type="text" id="eCont" value="${esc(ev.contacto)}" placeholder="Si no es cliente todavía"></label>
    <label class="f nofer" for="eLugar">Lugar<input type="text" id="eLugar" value="${esc(ev.lugar)}" placeholder="Oficina, local del cliente…"></label>
    <label class="f nofer" for="eLink">Link de videollamada<input type="url" id="eLink" value="${esc(ev.link)}" placeholder="https://meet.google.com/…"></label>
    <div class="full nofer"><div class="f" style="margin-bottom:6px">Participantes</div><div class="chips">${S.miembros.filter(m=>m.activo).map(m=>`<label><input type="checkbox" class="eP" value="${m.id}" ${parts.includes(m.id)?"checked":""}> ${esc(m.nombre||m.email)}</label>`).join("")}</div></div>
    <label class="f full" for="eNotas">Notas / minuta<textarea id="eNotas" placeholder="Temas, acuerdos, próximos pasos">${esc(ev.notas)}</textarea></label>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="askDel('eventos','${id}','este evento')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveEvento(e,id){
  e.preventDefault();
  const data={titulo:v("eTit"),tipo:v("eTipo"),sede:v("eSede"),fecha:v("eFecha"),hora:nz(v("eHora")),cliente_id:nz(v("eCli")),contacto:v("eCont"),lugar:v("eLugar"),link:v("eLink"),notas:v("eNotas"),participantes:[...document.querySelectorAll(".eP:checked")].map(x=>x.value)};
  if(data.tipo==="Feriado") Object.assign(data,{titulo:data.titulo||"Feriado",hora:null,cliente_id:null,contacto:"",lugar:"",link:"",participantes:[]});
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
    <label class="f" for="cNom">Nombre del negocio<input type="text" id="cNom" required value="${esc(c.nombre)}"></label>
    <label class="f" for="cRub">Rubro<input type="text" id="cRub" value="${esc(c.rubro)}"></label>
    <label class="f" for="cSede">Sede<select id="cSede"><option value="">—</option>${opts(SEDES,c.sede)}</select></label>
    <label class="f" for="cEst">Estado<select id="cEst">${opts(ESTADOS_CLI,c.estado)}</select></label>
    <label class="f" for="cPlan">Servicio<select id="cPlan"><option value="">—</option>${opts(PLANES,c.plan)}</select></label>
    <label class="f" for="cResp">Responsable<select id="cResp">${memOptions(c.responsable)}</select></label>
    <label class="f" for="cCont">Titular / dueño<input type="text" id="cCont" value="${esc(c.contacto)}" placeholder="Nombre de quien decide"></label>
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
