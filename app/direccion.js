"use strict";
/* =========================================================
   Furor · Dirección (sub-app privada del administrador)
   Se descarga solo cuando el admin entra a #direccion.
   La base de datos rechaza estas tablas para cualquier otro usuario.
   ========================================================= */
(function(){
const FT = ["fin_cuentas","fin_cobros","fin_gastos","fin_equipo","fin_campanas","fin_visitas"];
const D = { loaded:false, loading:false, tab:"resumen", sub:"mes", mes:today().slice(0,7), anual:false,
  fin_cuentas:[], fin_cobros:[], fin_gastos:[], fin_equipo:[], fin_campanas:[], fin_visitas:[], q:"", nv:{cuenta:"",n:1} };
const CAT_G = ["Publicidad","Software","Producción","Marketing","Oficina","Impuestos","Otros"];
const CONC_E = ["Sueldo","Comisión","Pago por trabajo","Adelanto","Bono","Retiro"];
const MES_L = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const money = n => (Number(n)||0).toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});
const moneyK = n => { n=Number(n)||0; return Math.abs(n)>=1e6 ? "$"+(n/1e6).toLocaleString("es-AR",{maximumFractionDigits:2})+" M" : Math.abs(n)>=1e3 ? "$"+Math.round(n/1e3)+" mil" : money(n); };
const ym = d => String(d).slice(0,7);
const mesLabel = m => { const [y,mm]=m.split("-").map(Number); return MES_L[mm-1]+" "+y; };
const addMes = (m,k) => { let [y,mm]=m.split("-").map(Number); mm+=k; while(mm<1){mm+=12;y--;} while(mm>12){mm-=12;y++;} return y+"-"+pad(mm); };
const cuenta = id => D.fin_cuentas.find(c=>c.id===id);
const incluidos = c => D.fin_cuentas.filter(x=>x.cobro_con===c.id && x.activo);
const packTotal = c => Number(c.pack) + incluidos(c).reduce((a,x)=>a+Number(x.pack),0);
const incluyeTxt = c => { const inc=incluidos(c); return inc.length ? "incluye "+inc.map(x=>x.negocio).join(", ") : ""; };
const num = v => Number(String(v).replace(/[^\d.,-]/g,"").replace(/\./g,"").replace(",","."))||0;

async function cargar(){
  if(D.loading) return; D.loading=true;
  const res = await Promise.all(FT.map(t=>sb.from(t).select("*")));
  res.forEach((r,i)=>{ if(r.error){ console.error(FT[i], r.error); } else D[FT[i]]=r.data||[]; });
  D.fin_cuentas.sort((a,b)=>a.negocio.localeCompare(b.negocio));
  D.loaded=true; D.loading=false;
  const ch=sb.channel("furor-dir");
  FT.forEach(t=>ch.on("postgres_changes",{event:"*",schema:"public",table:t},p=>{
    const arr=D[t];
    if(p.eventType==="DELETE"){ D[t]=arr.filter(r=>r.id!==p.old.id); }
    else { const i=arr.findIndex(r=>r.id===p.new.id); if(i>=0) arr[i]=p.new; else arr.push(p.new); }
    renderSoon();
  }));
  ch.subscribe();
  render();
}

/* ---------- cálculos ---------- */
function totalesMes(m){
  const cob=D.fin_cobros.filter(c=>ym(c.fecha)===m);
  const cobrado=cob.filter(c=>c.estado!=="Pendiente").reduce((a,c)=>a+Number(c.monto),0);
  const pendientes=cob.filter(c=>c.estado==="Pendiente").reduce((a,c)=>a+Number(c.monto),0);
  const gastos=D.fin_gastos.filter(g=>ym(g.fecha)===m).reduce((a,g)=>a+Number(g.monto),0);
  const eq=D.fin_equipo.filter(e=>ym(e.fecha)===m);
  const equipo=eq.filter(e=>e.concepto!=="Retiro").reduce((a,e)=>a+Number(e.monto),0);
  const retiro=eq.filter(e=>e.concepto==="Retiro").reduce((a,e)=>a+Number(e.monto),0);
  return {cobrado,pendientes,gastos,equipo,retiro,resultado:cobrado-gastos-equipo};
}
function ultimoMonto(cid){ const c=D.fin_cobros.filter(x=>x.cuenta_id===cid&&x.estado!=="Parcial").sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)))[0]; return c?Number(c.monto):null; }
function inicioCuenta(c){
  // desde cuándo cobra: fecha de alta o, si no hay, el primer cobro registrado
  if(c.alta) return String(c.alta).slice(0,7);
  const f=D.fin_cobros.filter(x=>x.cuenta_id===c.id).map(x=>String(x.fecha)).sort()[0];
  return f?f.slice(0,7):"0000-00";
}
function porCobrar(m){
  // Meses pasados: solo lo que figura como pendiente en el registro (como la planilla).
  // Mes actual y siguientes: además, los clientes activos que ya estaban dados de alta y todavía no pagaron.
  const out=[], actual=today().slice(0,7);
  if(m>=actual) D.fin_cuentas.filter(c=>c.activo && !c.cobro_con && inicioCuenta(c)<=m).forEach(c=>{
    const cob=D.fin_cobros.filter(x=>x.cuenta_id===c.id&&ym(x.fecha)===m);
    if(cob.some(x=>x.estado!=="Pendiente")) return;
    const pend=cob.find(x=>x.estado==="Pendiente");
    const dia=Math.min(c.dia_cobro||1, 28);
    out.push({cuenta:c, cobro:pend||null, fecha:pend?pend.fecha:`${m}-${pad(dia)}`, monto:pend?Number(pend.monto):(ultimoMonto(c.id)??packTotal(c))});
  });
  D.fin_cobros.filter(x=>ym(x.fecha)===m&&x.estado==="Pendiente"&&!out.some(o=>o.cobro&&o.cobro.id===x.id)).forEach(x=>out.push({cuenta:cuenta(x.cuenta_id)||{negocio:x.titular,titular:x.titular},cobro:x,fecha:x.fecha,monto:Number(x.monto)}));
  return out.sort((a,b)=>a.fecha.localeCompare(b.fecha));
}
const mrr = () => D.fin_cuentas.filter(c=>c.activo && !c.cobro_con).reduce((a,c)=>a+(ultimoMonto(c.id)??packTotal(c)),0);

/* ---------- vista principal ---------- */
function vista(){
  if(!isAdmin()) return `<div class="card">${emptyMsg("Esta sección es privada.","alert")}</div>`;
  if(!D.loaded){ cargar(); return `<div class="card">${emptyMsg("Cargando Dirección…","clock")}</div>`; }
  const tabs=[["resumen","Resumen"],["cobros","Cobros"],["visitas","Visitas"],["gastos","Gastos"],["equipo","Equipo"],["comercial","Comercial"]];
  const body={resumen:vResumen,cobros:vCobros,gastos:vGastos,equipo:vEquipo,comercial:vComercial,visitas:vVisitas}[D.tab]();
  return `<div class="dir">
    <div class="dir-head"><div><div class="eyebrow">${icon("lock")} Privado · solo vos</div><h1>Dirección</h1></div>
      <div class="mes-sel"><button class="btn" onclick="DIR.mes(-1)" aria-label="Mes anterior">‹</button><b>${mesLabel(D.mes)}</b><button class="btn" onclick="DIR.mes(1)" aria-label="Mes siguiente">›</button></div></div>
    <div class="tabs dir-tabs">${tabs.map(([k,l])=>`<button class="${D.tab===k?"on":""}" onclick="DIR.tab('${k}')">${l}</button>`).join("")}</div>
    ${body}</div>`;
}

/* ---------- Resumen ---------- */
function vResumen(){
  const m=D.mes, t=totalesMes(m), prev=totalesMes(addMes(m,-1)), pc=porCobrar(m);
  const totPC=pc.reduce((a,x)=>a+x.monto,0);
  const hoy=today(), semana=addDays(hoy,7);
  const venc=pc.filter(x=>x.fecha<hoy), prox=pc.filter(x=>x.fecha>=hoy&&x.fecha<=semana);
  const margen=t.cobrado?Math.round(t.resultado/t.cobrado*100):0;
  const delta=(a,b)=>b?`<span class="delta ${a>=b?"up":"down"}">${a>=b?"▲":"▼"} ${Math.abs(Math.round((a-b)/b*100))}% vs mes anterior</span>`:"";
  const activas=D.fin_cuentas.filter(c=>c.activo);
  return `
  <div class="kpis dir-kpis">
    <div class="kpi big ok"><div class="l">Cobrado</div><div class="v">${money(t.cobrado)}</div>${delta(t.cobrado,prev.cobrado)}</div>
    <div class="kpi big warn"><div class="l">${m<today().slice(0,7)?"Quedó sin cobrar":"Por cobrar"}</div><div class="v">${money(totPC)}</div><div class="s">${pc.length} cliente${pc.length!==1?"s":""}${venc.length?` · <b style="color:var(--danger)">${venc.length} vencido${venc.length>1?"s":""}</b>`:""}</div></div>
    <div class="kpi big gas"><div class="l">Gastos + equipo</div><div class="v">${money(t.gastos+t.equipo)}</div><div class="s">Operativos ${moneyK(t.gastos)} · Equipo ${moneyK(t.equipo)}</div></div>
    <div class="kpi big ${t.resultado>=0?"res":"bad"}"><div class="l">Sueldo Marcelo</div><div class="v">${money(t.resultado)}</div><div class="s">${t.retiro?`Retiraste ${moneyK(t.retiro)} · queda en caja ${moneyK(t.resultado-t.retiro)}`:`Lo que queda después de gastos y equipo · margen ${margen}%`}</div></div>
  </div>
  <div class="kpis dir-sub" style="margin-top:12px">
    <div class="kpi"><div class="v">${activas.length}</div><div class="l">Clientes activos</div></div>
    <div class="kpi"><div class="v">${moneyK(mrr())}</div><div class="l">Facturación mensual recurrente</div></div>
    <div class="kpi"><div class="v">${moneyK(activas.filter(c=>!c.cobro_con).length?mrr()/activas.filter(c=>!c.cobro_con).length:0)}</div><div class="l">Ticket promedio por titular</div></div>
    <div class="kpi"><div class="v">${D.fin_cuentas.filter(c=>c.alta&&ym(c.alta)===m).length}</div><div class="l">Altas del mes</div></div>
  </div>
  <div class="split" style="margin-top:16px">
    <section class="card">${cardH("Ingresos y egresos · últimos 12 meses", `<span class="legend"><span><span class="sede-dot" style="--sc:var(--ok)"></span>Cobrado</span><span><span class="sede-dot" style="--sc:var(--danger)"></span>Gastos + equipo</span></span>`)}${grafico(m)}</section>
    <section class="card">${cardH(`${m<today().slice(0,7)?"Sin cobrar en":"Por cobrar en"} ${MES_L[Number(m.slice(5))-1].toLowerCase()} <span class="count">${pc.length}</span>`, `<a href="#direccion" onclick="DIR.tab('cobros');return false;">Cobros →</a>`)}
      <div class="list">${pc.length?pc.slice(0,8).map(filaCobrar).join("")+(pc.length>8?`<div class="row"><a href="#direccion" onclick="DIR.tab('cobros');return false;">Ver los ${pc.length} pendientes →</a></div>`:"")+[].map(filaCobrar).join(""):emptyMsg("Todo cobrado este mes.","ok")}</div></section>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <section class="card">${cardH("Ventas por sede · "+MES_L[Number(m.slice(5))-1].toLowerCase())}${ventasSede(m)}</section>
    <section class="card">${cardH("Gastos del mes por categoría")}${barrasCat(m)}</section>
  </div>`;
}
function filaCobrar(x){
  const c=x.cuenta, hoy=today(), late=x.fecha<hoy;
  return `<div class="row"><div class="when" style="--sc:${late?"var(--danger)":"var(--warn)"}"><b>${parseYmd(x.fecha).getDate()}</b><span>${MES_C[parseYmd(x.fecha).getMonth()]}</span></div>
    <div class="main"><div class="t">${esc(c.negocio)}</div><div class="s">${esc(c.titular||"")}${c.id&&incluyeTxt(c)?` · <b>${esc(incluyeTxt(c))}</b>`:""}</div><div class="cob-m"><b>${money(x.monto)}</b>${late?`<span class="pill bad">Vencido</span>`:`<span class="pill warn">Pendiente</span>`}</div></div>
    <button class="btn sm wa" onclick="DIR.recordar('${c.id||""}','${x.fecha}',${x.monto})" title="Recordar pago por WhatsApp">${icon("wa")}</button>
    <button class="btn sm pri" onclick="DIR.cobrar('${c.id||""}','${x.cobro?x.cobro.id:""}',${x.monto})">Cobrado</button></div>`;
}
function grafico(m){
  const meses=[...Array(12)].map((_,i)=>addMes(m,i-11));
  const data=meses.map(x=>{ const t=totalesMes(x); return {m:x, a:t.cobrado, b:t.gastos+t.equipo}; });
  const max=Math.max(1,...data.map(d=>Math.max(d.a,d.b)));
  const W=640,H=230,pl=44,pb=26,bw=(W-pl)/12;
  const y=v=>H-pb-(v/max)*(H-pb-10);
  const ticks=[0,.25,.5,.75,1].map(k=>max*k);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cobrado contra egresos por mes">
    ${ticks.map(v=>`<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${pl-6}" y="${y(v)+4}" class="ax" text-anchor="end">${v>=1e6?(v/1e6).toFixed(1)+"M":Math.round(v/1e3)+"k"}</text>`).join("")}
    ${data.map((d,i)=>{ const x=pl+i*bw+bw*.14, w=bw*.34; return `<g><title>${mesLabel(d.m)}: cobrado ${money(d.a)} · egresos ${money(d.b)}</title>
      <rect x="${x}" y="${y(d.a)}" width="${w}" height="${Math.max(0,H-pb-y(d.a))}" rx="3" class="ba ${d.m===m?"cur":""}"/>
      <rect x="${x+w+2}" y="${y(d.b)}" width="${w}" height="${Math.max(0,H-pb-y(d.b))}" rx="3" class="bb"/>
      <text x="${pl+i*bw+bw/2}" y="${H-8}" class="ax ${d.m===m?"cur":""}" text-anchor="middle">${MES_C[Number(d.m.slice(5))-1]}</text></g>`; }).join("")}
  </svg>`;
}
function ventasSede(m){
  const sedes=["Tucumán","Salta","Santiago del Estero"];
  const rows=sedes.map(s=>{
    const c=D.fin_campanas.find(x=>ym(x.mes)===m&&x.sede===s)||{};
    const pr=S.prospectos.filter(p=>p.sede===s&&ym(p.creado)===m);
    const ganados=S.prospectos.filter(p=>p.sede===s&&p.etapa==="Ganado"&&ym(p.actualizado)===m).length;
    const prospectos=Math.max(c.prospectos||0, pr.length), nuevos=Math.max(c.clientes_nuevos||0, ganados);
    const altas=D.fin_cuentas.filter(x=>x.alta&&ym(x.alta)===m&&(x.sede||"Tucumán")===s);
    return {s,prospectos,nuevos,ingresos:Number(c.ingresos)||altas.reduce((a,x)=>a+Number(x.pack),0),inv:Number(c.inversion)||0};
  });
  return `<div class="table-wrap" style="box-shadow:none"><table><thead><tr><th>Sede</th><th>Prospectos</th><th>Cierres</th><th>Conversión</th><th>Ingresos nuevos</th></tr></thead><tbody>
  ${rows.map(r=>`<tr><td><span class="sede-dot" style="--sc:${sedeColor(r.s)}"></span>${r.s}</td><td>${r.prospectos||"—"}</td><td><b>${r.nuevos||0}</b></td><td>${r.prospectos?Math.round(r.nuevos/r.prospectos*100)+"%":"—"}</td><td>${r.ingresos?money(r.ingresos):"—"}</td></tr>`).join("")}
  </tbody></table></div>`;
}
function barrasCat(m){
  const g=D.fin_gastos.filter(x=>ym(x.fecha)===m), by={};
  g.forEach(x=>by[x.categoria]=(by[x.categoria]||0)+Number(x.monto));
  const eq=D.fin_equipo.filter(x=>ym(x.fecha)===m&&x.concepto!=="Retiro").reduce((a,x)=>a+Number(x.monto),0);
  if(eq) by["Equipo"]=eq;
  const arr=Object.entries(by).sort((a,b)=>b[1]-a[1]), max=Math.max(1,...arr.map(a=>a[1]));
  return arr.length?`<div class="hbars">${arr.map(([k,v])=>`<div class="hb"><span>${esc(k)}</span><div><i style="width:${v/max*100}%"></i></div><b>${money(v)}</b></div>`).join("")}</div>`:emptyMsg("Sin gastos cargados este mes.","file");
}

/* ---------- Cobros ---------- */
function vCobros(){
  const seg=`<div class="seg"><button class="${D.sub==="mes"?"on":""}" onclick="DIR.sub('mes')">Cobros del mes</button><button class="${D.sub==="cuentas"?"on":""}" onclick="DIR.sub('cuentas')">Clientes y packs</button></div>`;
  if(D.sub==="cuentas") return vCuentas(seg);
  const m=D.mes, list=D.fin_cobros.filter(c=>ym(c.fecha)===m).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  const t=totalesMes(m), pc=porCobrar(m), sinGen=pc.filter(x=>!x.cobro).length;
  return `<div class="toolbar">${seg}<span style="flex:1"></span>
    ${sinGen?`<button class="btn" onclick="DIR.generar()">${icon("plus")}Generar ${sinGen} cobro${sinGen>1?"s":""} pendiente${sinGen>1?"s":""}</button>`:""}
    <button class="btn pri" onclick="DIR.formCobro()">${icon("plus")}Registrar cobro</button></div>
  <div class="kpis" style="margin-bottom:14px"><div class="kpi"><div class="v" style="color:var(--ok)">${money(t.cobrado)}</div><div class="l">Cobrado</div></div><div class="kpi"><div class="v" style="color:var(--warn)">${money(pc.reduce((a,x)=>a+x.monto,0))}</div><div class="l">Falta cobrar</div></div><div class="kpi"><div class="v">${list.filter(c=>c.estado!=="Pendiente").length} / ${list.length+pc.filter(x=>!x.cobro).length}</div><div class="l">Pagos recibidos</div></div></div>
  <div class="table-wrap"><table class="rtable"><thead><tr><th>Fecha</th><th>Cliente</th><th>Monto</th><th>Estado</th><th>Observaciones</th><th></th></tr></thead><tbody>
  ${list.map(c=>{ const cu=cuenta(c.cuenta_id); const late=c.estado==="Pendiente"&&c.fecha<today(); return `<tr>
    <td class="rt-fecha">${fmtDate(c.fecha)}</td><td class="rt-cli"><b>${esc(cu?cu.negocio:c.titular)}</b><div class="s">${esc(c.titular||cu?.titular||"")}${cu&&incluyeTxt(cu)?" · "+esc(incluyeTxt(cu)):""}</div></td><td class="num" data-l="Monto">${inlMonto("fin_cobros",c.id,"monto",c.monto)}</td>
    <td data-l="Estado" class="rt-full">${segEstado(c.id,c.estado,late)}</td><td class="rt-full"><input class="inl obs" type="text" value="${esc(c.obs||"")}" placeholder="Agregar nota…" onchange="DIR.campo('fin_cobros','${c.id}','obs',this.value)"></td>
    <td class="acts-td">${c.estado!=="Pagado"&&cu?`<button class="btn sm wa" onclick="DIR.recordar('${cu.id}','${c.fecha}',${c.monto})" aria-label="Recordar por WhatsApp" title="Recordar por WhatsApp">${icon("wa")}</button>`:""}<button class="btn sm ghost ic" onclick="DIR.formCobro('${c.id}')" title="Más opciones" aria-label="Editar">${icon("edit")}</button></td></tr>`; }).join("")
   || `<tr><td colspan="6">${emptyMsg("Sin cobros registrados en este mes.","file")}</td></tr>`}
  </tbody></table></div>`;
}
function vCuentas(seg){
  const q=D.q.toLowerCase();
  const list=D.fin_cuentas.filter(c=>!q||[c.negocio,c.titular,c.sede].join(" ").toLowerCase().includes(q)).sort((a,b)=>(b.activo-a.activo)||a.negocio.localeCompare(b.negocio));
  return `<div class="toolbar">${seg}<input type="search" id="dirQ" placeholder="Buscar cliente…" value="${esc(D.q)}" oninput="DIR.buscar(this.value)"><span style="flex:1"></span><button class="btn pri" onclick="DIR.formCuenta()">${icon("plus")}Nuevo cliente</button></div>
  <div class="kpis" style="margin-bottom:14px"><div class="kpi"><div class="v">${D.fin_cuentas.filter(c=>c.activo).length}</div><div class="l">Activos</div></div><div class="kpi"><div class="v">${money(mrr())}</div><div class="l">Facturación mensual</div></div></div>
  <div class="table-wrap"><table class="rtable"><thead><tr><th>Cliente</th><th>Sede</th><th>Pack</th><th>Último pago</th><th>Día de cobro</th><th>Alta</th><th>Estado</th><th></th></tr></thead><tbody>
  ${list.map(c=>{ const u=D.fin_cobros.filter(x=>x.cuenta_id===c.id&&x.estado!=="Pendiente").sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)))[0];
    const con=c.cobro_con?cuenta(c.cobro_con):null;
    return `<tr class="${c.activo?"":"dim"}"><td class="rt-cli"><b>${esc(c.negocio)}</b><div class="s">${esc(c.titular||"")}</div>${con?`<div class="s" style="color:var(--info)">Se cobra junto con ${esc(con.negocio)}</div>`:incluyeTxt(c)?`<div class="s" style="color:var(--info)">Cobro unificado: ${esc(incluyeTxt(c))}</div>`:""}</td><td data-l="Sede"><select class="inl" style="--sc:${sedeColor(c.sede)}" onchange="DIR.campo('fin_cuentas','${c.id}','sede',this.value)"><option value="">—</option>${SEDES.slice(0,3).map(x=>`<option ${c.sede===x?"selected":""}>${x}</option>`).join("")}</select></td><td class="num" data-l="Pack">${inlMonto("fin_cuentas",c.id,"pack",c.pack)}</td>
    <td data-l="Último pago">${u?`${money(u.monto)}<div class="s">${fmtDate(u.fecha)}</div>`:con?`<span class="s">con ${esc(con.negocio)}</span>`:"—"}</td><td data-l="Día de cobro"><input class="inl dia" type="number" min="1" max="31" inputmode="numeric" value="${c.dia_cobro||""}" placeholder="—" onchange="DIR.campo('fin_cuentas','${c.id}','dia_cobro',this.value?Math.min(31,Math.max(1,+this.value)):null)"></td><td data-l="Alta">${c.alta?fmtDate(c.alta)+" "+c.alta.slice(2,4):"—"}</td>
    <td class="rt-full" data-l="Estado"><div class="estsel"><button type="button" class="ok ${c.activo?"on":""}" onclick="DIR.campo('fin_cuentas','${c.id}','activo',true)">Activo</button><button type="button" class="bad ${!c.activo?"on":""}" onclick="DIR.campo('fin_cuentas','${c.id}','activo',false)">Inactivo</button></div></td><td><button class="btn sm ghost ic" onclick="DIR.formCuenta('${c.id}')" title="Más opciones" aria-label="Editar">${icon("edit")}</button></td></tr>`; }).join("")}
  </tbody></table></div>`;
}

/* ---------- Gastos ---------- */
function vGastos(){
  const m=D.mes;
  const seg=`<div class="seg"><button class="${!D.anual?"on":""}" onclick="DIR.anual(false)">Del mes</button><button class="${D.anual?"on":""}" onclick="DIR.anual(true)">Vista anual</button></div>`;
  if(D.anual){
    const y=m.slice(0,4), meses=[...Array(12)].map((_,i)=>`${y}-${pad(i+1)}`);
    const conceptos=[...new Set(D.fin_gastos.filter(g=>String(g.fecha).startsWith(y)).map(g=>g.categoria+" · "+g.concepto))].sort();
    const val=(k,mm)=>D.fin_gastos.filter(g=>g.categoria+" · "+g.concepto===k&&ym(g.fecha)===mm).reduce((a,g)=>a+Number(g.monto),0);
    return `<div class="toolbar">${seg}</div><div class="table-wrap"><table class="anual"><thead><tr><th>Concepto</th>${meses.map((mm,i)=>`<th class="num">${MES_C[i]}</th>`).join("")}<th class="num">Total</th></tr></thead><tbody>
    ${conceptos.map(k=>{ const vs=meses.map(mm=>val(k,mm)); return `<tr><td>${esc(k)}</td>${vs.map(v=>`<td class="num">${v?moneyK(v):""}</td>`).join("")}<td class="num"><b>${moneyK(vs.reduce((a,b)=>a+b,0))}</b></td></tr>`; }).join("")}
    <tr class="tot"><td><b>Total</b></td>${meses.map(mm=>`<td class="num"><b>${moneyK(D.fin_gastos.filter(g=>ym(g.fecha)===mm).reduce((a,g)=>a+Number(g.monto),0))}</b></td>`).join("")}<td class="num"><b>${moneyK(D.fin_gastos.filter(g=>String(g.fecha).startsWith(y)).reduce((a,g)=>a+Number(g.monto),0))}</b></td></tr>
    </tbody></table></div>`;
  }
  const list=D.fin_gastos.filter(g=>ym(g.fecha)===m).sort((a,b)=>Number(b.monto)-Number(a.monto));
  const tot=list.reduce((a,g)=>a+Number(g.monto),0), prev=D.fin_gastos.filter(g=>ym(g.fecha)===addMes(m,-1)).reduce((a,g)=>a+Number(g.monto),0);
  return `<div class="toolbar">${seg}<span style="flex:1"></span>${!list.length&&prev?`<button class="btn" onclick="DIR.copiarGastos()">Copiar fijos del mes anterior</button>`:""}<button class="btn pri" onclick="DIR.formGasto()">${icon("plus")}Cargar gasto</button></div>
  <div class="split"><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Categoría</th><th>Concepto</th><th class="num">Monto</th><th></th></tr></thead><tbody>
    ${list.map(g=>`<tr><td>${fmtDate(g.fecha)}</td><td><span class="pill">${esc(g.categoria)}</span></td><td>${esc(g.concepto)}${g.sede?`<div class="s">${esc(g.sede)}</div>`:""}</td><td class="num">${money(g.monto)}</td><td><button class="btn sm ghost" onclick="DIR.formGasto('${g.id}')">Editar</button></td></tr>`).join("")||`<tr><td colspan="5">${emptyMsg("Sin gastos en este mes.","file")}</td></tr>`}
    ${list.length?`<tr class="tot"><td colspan="3"><b>Total</b></td><td class="num"><b>${money(tot)}</b></td><td></td></tr>`:""}
  </tbody></table></div>
  <section class="card">${cardH("Por categoría")}${barrasCat(m)}${prev?`<p class="s" style="margin:12px 0 0">Mes anterior: ${money(prev)} (${tot>=prev?"+":""}${Math.round((tot-prev)/prev*100)}%)</p>`:""}</section></div>`;
}

/* ---------- Equipo ---------- */
function vEquipo(){
  const m=D.mes, y=m.slice(0,4);
  const list=D.fin_equipo.filter(e=>ym(e.fecha)===m).sort((a,b)=>a.persona.localeCompare(b.persona));
  const personas=[...new Set(D.fin_equipo.filter(e=>String(e.fecha).startsWith(y)).map(e=>e.persona))];
  const anual=personas.map(p=>({p,tot:D.fin_equipo.filter(e=>e.persona===p&&String(e.fecha).startsWith(y)).reduce((a,e)=>a+Number(e.monto),0)})).sort((a,b)=>b.tot-a.tot);
  const tot=list.filter(e=>e.concepto!=="Retiro").reduce((a,e)=>a+Number(e.monto),0);
  return `<div class="toolbar"><span class="s">Sueldos, comisiones y pagos por trabajo. El retiro de Marcelo se muestra aparte y no cuenta como gasto.</span><span style="flex:1"></span>${!list.length&&D.fin_equipo.some(e=>ym(e.fecha)===addMes(m,-1))?`<button class="btn" onclick="DIR.copiarEquipo()">Copiar sueldos del mes anterior</button>`:""}<button class="btn pri" onclick="DIR.formPago()">${icon("plus")}Cargar pago</button></div>
  <div class="split"><div class="table-wrap"><table><thead><tr><th>Persona</th><th>Concepto</th><th class="num">Monto</th><th>Estado</th><th></th></tr></thead><tbody>
    ${list.map(e=>`<tr class="${e.concepto==="Retiro"?"dim":""}"><td><b>${esc(e.persona)}</b>${e.notas&&e.notas!=="Importado de CAJA"?`<div class="s">${esc(e.notas)}</div>`:""}</td><td>${esc(e.concepto)}</td><td class="num">${money(e.monto)}</td><td><span class="pill ${e.pagado?"ok":"warn"}">${e.pagado?"Pagado":"A pagar"}</span></td><td><button class="btn sm ghost" onclick="DIR.formPago('${e.id}')">Editar</button></td></tr>`).join("")||`<tr><td colspan="5">${emptyMsg("Sin pagos cargados este mes.","users")}</td></tr>`}
    ${list.length?`<tr class="tot"><td colspan="2"><b>Total equipo (sin retiro)</b></td><td class="num"><b>${money(tot)}</b></td><td colspan="2"></td></tr>`:""}
  </tbody></table></div>
  <section class="card">${cardH("Acumulado "+y)}<div class="hbars">${anual.map(a=>`<div class="hb"><span>${esc(a.p)}</span><div><i style="width:${a.tot/Math.max(1,anual[0]?.tot||1)*100}%"></i></div><b>${moneyK(a.tot)}</b></div>`).join("")}</div></section></div>`;
}

/* ---------- Visitas (producciones con clientes) ---------- */
function vVisitas(){
  const m=D.mes, list=D.fin_visitas.filter(v=>ym(v.mes)===m).sort((a,b)=>String(a.fecha||"9999").localeCompare(String(b.fecha||"9999")));
  const tot=list.reduce((a,v)=>a+v.visitas,0), hechas=list.reduce((a,v)=>a+Math.min(v.hechas,v.visitas),0);
  const film=list.reduce((a,v)=>a+Number(v.pago_filmaker||0),0), hook=list.reduce((a,v)=>a+Number(v.pago_hook||0),0);
  const deuda=list.filter(v=>!v.pagado).reduce((a,v)=>a+Number(v.pago_filmaker||0)+Number(v.pago_hook||0),0);
  const nombres=[...new Set(D.fin_visitas.map(v=>v.filmaker).filter(Boolean))];
  const activos=D.fin_cuentas.filter(c=>c.activo).sort((a,b)=>a.negocio.localeCompare(b.negocio));
  // visitas que el equipo agendó en la Agenda este mes y todavía no están acá
  const ag=(S.eventos||[]).filter(e=>e.tipo==="Visita"&&ym(e.fecha)===m&&!list.some(v=>v.evento_id===e.id||(v.fecha===e.fecha&&cuentaDeCliente(e.cliente_id)&&v.cuenta_id===cuentaDeCliente(e.cliente_id)?.id)));
  return `<div class="toolbar"><span class="s">Producciones con clientes: cuántas visitas, cuándo, y cuánto se le paga al filmaker y al hook.</span></div>
  <div class="kpis" style="margin-bottom:14px">
    <div class="kpi"><div class="v">${hechas} / ${tot}</div><div class="l">Visitas hechas</div></div>
    <div class="kpi"><div class="v">${money(film)}</div><div class="l">Pago filmaker</div></div>
    <div class="kpi"><div class="v">${money(hook)}</div><div class="l">Pago hook</div></div>
    <div class="kpi"><div class="v" style="color:${deuda?"var(--warn)":"var(--ok)"}">${money(deuda)}</div><div class="l">Falta pagar</div></div>
  </div>
  <form class="vadd card" onsubmit="DIR.nuevaVisita(event)">
    <b>Agregar visita</b>
    <select id="nvCu" aria-label="Cliente" onchange="DIR._nv('cuenta',this.value)"><option value="">Elegí el cliente…</option>${activos.map(c=>`<option value="${c.id}" ${D.nv.cuenta===c.id?"selected":""}>${esc(c.negocio)}</option>`).join("")}<option value="otro" ${D.nv.cuenta==="otro"?"selected":""}>Otro (escribir)…</option></select>
    ${D.nv.cuenta==="otro"?`<input id="nvTxt" type="text" placeholder="Nombre del negocio" required>`:""}
    <label class="s" style="display:flex;align-items:center;gap:6px">Visitas <input id="nvN" class="inl dia" type="number" min="1" max="12" value="${D.nv.n||1}" onchange="DIR._nv('n',+this.value)"></label>
    <button class="btn pri">${icon("plus")}Agregar</button>
  </form>
  ${ag.length?`<div class="card vag"><b>${icon("cal")} Agendadas por el equipo en la Agenda</b>${ag.map(e=>`<div class="row"><div class="main"><div class="t">${esc(e.titulo)}</div><div class="s">${fmtDate(e.fecha)}${e.hora?" · "+String(e.hora).slice(0,5)+" hs":""}</div></div><button class="btn sm pri" onclick="DIR.desdeAgenda('${e.id}')">${icon("plus")}Sumar</button></div>`).join("")}</div>`:""}
  <datalist id="dlFilm">${nombres.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
  <div class="table-wrap"><table class="rtable"><thead><tr><th>Cliente</th><th>Visitas</th><th>Fecha</th><th>Filmaker</th><th class="num">Pago filmaker</th><th class="num">Pago hook</th><th>Pago</th><th></th></tr></thead><tbody>
  ${list.map(v=>`<tr>
    <td class="rt-cli"><b>${esc(v.negocio)}</b>${v.fechas_txt?`<div class="s">${esc(v.fechas_txt)}</div>`:""}${v.notas?`<div class="s">${esc(v.notas)}</div>`:""}</td>
    <td data-l="Visitas hechas"><div class="vchecks">${[...Array(v.visitas)].map((_,i)=>`<button type="button" class="${i<v.hechas?"on":""}" title="Visita ${i+1}: ${i<v.hechas?"hecha":"pendiente"}" onclick="DIR.hecha('${v.id}',${i+1})">${i<v.hechas?icon("ok"):""}</button>`).join("")}</div></td>
    <td data-l="Fecha"><input class="inl" type="date" value="${esc(v.fecha||"")}" onchange="DIR.campo('fin_visitas','${v.id}','fecha',this.value||null)"></td>
    <td data-l="Filmaker"><input class="inl" type="text" list="dlFilm" value="${esc(v.filmaker||"")}" placeholder="Nombre…" onchange="DIR.campo('fin_visitas','${v.id}','filmaker',this.value)"></td>
    <td class="num" data-l="Pago filmaker">${inlMonto("fin_visitas",v.id,"pago_filmaker",v.pago_filmaker)}</td>
    <td class="num" data-l="Pago hook">${inlMonto("fin_visitas",v.id,"pago_hook",v.pago_hook)}</td>
    <td class="rt-full" data-l="Pago"><div class="estsel"><button type="button" class="ok ${v.pagado?"on":""}" onclick="DIR.campo('fin_visitas','${v.id}','pagado',true)">Pagado</button><button type="button" class="warn ${!v.pagado?"on":""}" onclick="DIR.campo('fin_visitas','${v.id}','pagado',false)">Pendiente</button></div></td>
    <td><button class="btn sm ghost ic" onclick="DIR.borrar('fin_visitas','${v.id}')" title="Borrar" aria-label="Borrar">✕</button></td></tr>`).join("")
   || `<tr><td colspan="8">${emptyMsg("Sin visitas cargadas en "+mesLabel(m).toLowerCase()+".","cal")}</td></tr>`}
  </tbody></table></div>`;
}
const cuentaDeCliente = cid => cid ? D.fin_cuentas.find(c=>c.cliente_id===cid) : null;
async function nuevaVisita(e){
  e.preventDefault();
  const sel=D.nv.cuenta; if(!sel){ toast("Elegí el cliente"); return; }
  const cu=sel==="otro"?null:cuenta(sel), negocio=cu?cu.negocio:(document.getElementById("nvTxt")?.value||"").trim(); if(!negocio) return;
  const prev=[...D.fin_visitas].sort((a,b)=>String(b.creado).localeCompare(String(a.creado))).find(v=>Number(v.pago_filmaker)>0)||{};
  const row={mes:D.mes+"-01",cuenta_id:cu?cu.id:null,negocio,visitas:Math.max(1,Math.min(12,D.nv.n||1)),hechas:0,pago_filmaker:prev.pago_filmaker||0,filmaker:prev.filmaker||""};
  const { data, error } = await sb.from("fin_visitas").insert(row).select().single();
  if(error){ toast("No se pudo guardar: "+error.message); return; }
  if(data && !D.fin_visitas.some(v=>v.id===data.id)) D.fin_visitas.push(data);
  D.nv={cuenta:"",n:1}; render(); toast("Visita agregada");
}
async function desdeAgenda(eid){
  const ev=(S.eventos||[]).find(x=>x.id===eid); if(!ev) return;
  const cu=cuentaDeCliente(ev.cliente_id);
  const prev=[...D.fin_visitas].sort((a,b)=>String(b.creado).localeCompare(String(a.creado))).find(v=>Number(v.pago_filmaker)>0)||{};
  const row={mes:ym(ev.fecha)+"-01",cuenta_id:cu?cu.id:null,negocio:cu?cu.negocio:(cliName(ev.cliente_id)||ev.titulo),visitas:1,hechas:ev.fecha<=today()?1:0,fecha:ev.fecha,evento_id:ev.id,pago_filmaker:prev.pago_filmaker||0,filmaker:prev.filmaker||""};
  const { data, error } = await sb.from("fin_visitas").insert(row).select().single();
  if(error){ toast("No se pudo guardar: "+error.message); return; }
  if(data && !D.fin_visitas.some(v=>v.id===data.id)) D.fin_visitas.push(data);
  render(); toast("Visita sumada");
}
function hecha(id,n){ const v=D.fin_visitas.find(x=>x.id===id); if(!v) return; campo("fin_visitas",id,"hechas", v.hechas>=n ? n-1 : n); }

/* ---------- Comercial ---------- */
function vComercial(){
  const y=D.mes.slice(0,4);
  const rows=D.fin_campanas.filter(c=>String(c.mes).startsWith(y)).sort((a,b)=>String(b.mes).localeCompare(String(a.mes))||a.sede.localeCompare(b.sede));
  const live=["Tucumán","Salta","Santiago del Estero"].map(s=>{ const m=D.mes; const pr=S.prospectos.filter(p=>p.sede===s&&ym(p.creado)===m);
    return {s, total:pr.length, contact:pr.filter(p=>p.etapa!=="Nuevo").length, reun:pr.filter(p=>["Reunión agendada","Propuesta enviada","Ganado"].includes(p.etapa)).length, prop:pr.filter(p=>["Propuesta enviada","Ganado"].includes(p.etapa)).length, gan:pr.filter(p=>p.etapa==="Ganado").length, perd:pr.filter(p=>p.etapa==="Perdido").length}; });
  const setters=S.miembros.filter(mb=>mb.rol==="setter"||S.prospectos.some(p=>p.setter===mb.id)).map(mb=>{ const pr=S.prospectos.filter(p=>p.setter===mb.id&&ym(p.creado)===D.mes); const cerr=pr.filter(p=>!["Ganado","Perdido"].includes(p.etapa)===false).length; const gan=pr.filter(p=>p.etapa==="Ganado").length;
    return {n:mb.nombre||mb.email, sede:mb.sede, total:pr.length, contactos:pr.reduce((a,p)=>a+(p.contactos||0),0), gan, tasa:cerr?Math.round(gan/cerr*100):null}; });
  const f=(v)=>v==null||v===""?"—":v;
  return `<section class="card" style="margin-bottom:16px">${cardH("En vivo · "+mesLabel(D.mes)+" (desde la app)")}
    <div class="table-wrap" style="box-shadow:none"><table><thead><tr><th>Sede</th><th>Prospectos</th><th>Contactados</th><th>Reunión o más</th><th>Propuesta</th><th>Ganados</th><th>Perdidos</th></tr></thead><tbody>
    ${live.map(r=>`<tr><td><span class="sede-dot" style="--sc:${sedeColor(r.s)}"></span>${r.s}</td><td>${r.total}</td><td>${r.contact}</td><td>${r.reun}</td><td>${r.prop}</td><td><b>${r.gan}</b></td><td>${r.perd}</td></tr>`).join("")}</tbody></table></div>
    ${setters.length?`<h3 style="margin:16px 0 8px">Por setter</h3><div class="table-wrap" style="box-shadow:none"><table><thead><tr><th>Setter</th><th>Prospectos del mes</th><th>Mensajes enviados</th><th>Ganados</th><th>Tasa de cierre</th></tr></thead><tbody>${setters.map(s=>`<tr><td><b>${esc(s.n)}</b><div class="s">${esc(s.sede||"")}</div></td><td>${s.total}</td><td>${s.contactos}</td><td><b>${s.gan}</b></td><td>${s.tasa==null?"—":s.tasa+"%"}</td></tr>`).join("")}</tbody></table></div>`:""}
  </section>
  <section class="card">${cardH("Campañas "+y+" (historial de tu planilla + meses nuevos)", `<button class="btn sm pri" onclick="DIR.formCampana()">${icon("plus")}Cargar mes</button>`)}
  <div class="table-wrap" style="box-shadow:none"><table><thead><tr><th>Mes</th><th>Sede</th><th class="num">Prosp.</th><th class="num">Llamadas</th><th class="num">PDF</th><th class="num">Clientes nuevos</th><th class="num">Conversión</th><th class="num">Inversión ads</th><th class="num">Costo x prosp.</th><th class="num">Ingresos</th><th class="num">ROAS</th><th></th></tr></thead><tbody>
  ${rows.map(c=>{ const conv=c.prospectos&&c.clientes_nuevos!=null?Math.round(c.clientes_nuevos/c.prospectos*1000)/10+"%":"—"; const cpp=c.prospectos&&c.inversion?money(c.inversion/c.prospectos):"—"; const roas=c.inversion&&c.ingresos?(c.ingresos/c.inversion).toFixed(1)+"x":"—";
    return `<tr><td>${MES_L[Number(String(c.mes).slice(5,7))-1]}</td><td><span class="sede-dot" style="--sc:${sedeColor(c.sede)}"></span>${esc(c.sede)}</td><td class="num">${f(c.prospectos)}</td><td class="num">${f(c.llamadas)}</td><td class="num">${f(c.pdf)}</td><td class="num"><b>${f(c.clientes_nuevos)}</b></td><td class="num">${conv}</td><td class="num">${c.inversion?money(c.inversion):"—"}</td><td class="num">${cpp}</td><td class="num">${c.ingresos?money(c.ingresos):"—"}</td><td class="num"><b>${roas}</b></td><td><button class="btn sm ghost" onclick="DIR.formCampana('${c.id}')">Editar</button></td></tr>`; }).join("")}
  </tbody></table></div></section>`;
}

/* ---------- acciones ---------- */
async function cobrar(cid, cobroId, monto){
  if(cobroId) return marcarPagado(cobroId);
  const c=cuenta(cid); if(!c) return;
  await run(sb.from("fin_cobros").insert({cuenta_id:c.id,titular:c.titular,fecha:today().slice(0,7)===D.mes?today():`${D.mes}-${pad(Math.min(c.dia_cobro||1,28))}`,monto,estado:"Pagado"}),"Cobro registrado");
}
function inlMonto(t,id,campo,val){ return `<label class="inl-m"><span>$</span><input class="inl num" type="number" min="0" step="1000" inputmode="numeric" value="${Number(val)||0}" onchange="DIR.campo('${t}','${id}','${campo}',Number(this.value)||0)" onfocus="this.select()"></label>`; }
function segEstado(id,estado,late){
  const ops=[["Pagado","ok","Pagado"],["Parcial","info","Parcial"],["Pendiente",late?"bad":"warn",late?"Vencido":"Pendiente"]];
  return `<div class="estsel">${ops.map(([v,cl,l])=>`<button type="button" class="${cl} ${estado===v?"on":""}" onclick="DIR.campo('fin_cobros','${id}','estado','${v}')">${l}</button>`).join("")}</div>`;
}
async function campo(t,id,k,val){
  const row=(D[t]||[]).find(r=>r.id===id); if(!row) return;
  if(row[k]===val) return;
  const prev=row[k]; row[k]=val; render();
  const { error } = await sb.from(t).update({[k]:val}).eq("id",id);
  if(error){ row[k]=prev; render(); toast("No se pudo guardar: "+error.message); return; }
  toast(k==="estado"?(val==="Pagado"?"Marcado como cobrado":"Estado: "+val):k==="activo"?(val?"Cliente activo":"Cliente inactivo"):k==="pagado"?(val?"Marcado como pagado":"Marcado como pendiente"):k==="hechas"?"Visitas hechas: "+val:"Guardado");
}
async function marcarPagado(id){ await run(sb.from("fin_cobros").update({estado:"Pagado"}).eq("id",id),"Marcado como cobrado"); }
async function generar(){
  const rows=porCobrar(D.mes).filter(x=>!x.cobro&&x.cuenta.id).map(x=>({cuenta_id:x.cuenta.id,titular:x.cuenta.titular,fecha:x.fecha,monto:x.monto,estado:"Pendiente"}));
  if(rows.length) await run(sb.from("fin_cobros").insert(rows), rows.length+" cobros pendientes generados");
}
function recordar(cid, fecha, monto){
  const c=cuenta(cid); if(!c) return;
  const cl=S.clientes.find(x=>x.id===c.cliente_id)||{};
  const nombre=(c.titular||"").split(" ")[0];
  const vencido=fecha<today();
  const txt=`Hola ${nombre}! ¿Cómo estás? Te escribo de Furor Marketing para recordarte ${vencido?"que quedó pendiente":"que vence el "+fmtDate(fecha)} el pago mensual de ${c.negocio}: ${money(monto)}.\n\nCuando lo abones, mandame el comprobante por acá. ¡Gracias!`;
  const n=waNumber(cl.whatsapp||"");
  openModal(`<h2>Recordatorio de pago · ${esc(c.negocio)}</h2><div class="form">
    <label class="f full" for="rcTxt">Mensaje<textarea id="rcTxt" style="min-height:150px">${esc(txt)}</textarea></label>
    ${n?"":`<p class="full s" style="margin:0">Este cliente no tiene WhatsApp en su ficha: usá "Elegir chat" o cargalo en Clientes → Editar ficha.</p>`}
    <div class="actions"><button type="button" class="btn" onclick="closeModal()">Cerrar</button><div style="display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="btn" onclick="copyText($('#rcTxt').value)">${icon("copy")}Copiar</button>
      <a class="btn ${n?"":"wa"}" target="_blank" rel="noopener" href="#" onclick="this.href='https://wa.me/?text='+encodeURIComponent($('#rcTxt').value)">${icon("wa")}Elegir chat</a>
      ${n?`<a class="btn wa" target="_blank" rel="noopener" href="#" onclick="this.href='https://wa.me/${n}?text='+encodeURIComponent($('#rcTxt').value)">${icon("wa")}WhatsApp de ${esc(nombre||c.negocio)}</a>`:""}
    </div></div></div>`);
}
function formCobro(id){
  const c=id?D.fin_cobros.find(x=>x.id===id)||{}:{fecha:today().slice(0,7)===D.mes?today():D.mes+"-01",estado:"Pagado"};
  const act=D.fin_cuentas.filter(x=>x.activo||x.id===c.cuenta_id);
  openModal(`<h2>${id?"Editar cobro":"Registrar cobro"}</h2><form class="form" onsubmit="DIR.saveCobro(event,'${id||""}')">
    <label class="f full" for="cbC">Cliente<select id="cbC" required onchange="const k=DIR._c(this.value); if(k&&!$('#cbM').value) $('#cbM').value=k">${act.map(x=>`<option value="${x.id}" ${x.id===c.cuenta_id?"selected":""}>${esc(x.negocio)} · ${esc(x.titular||"")}</option>`).join("")}</select></label>
    <label class="f" for="cbF">Fecha<input type="date" id="cbF" required value="${esc(c.fecha)}"></label>
    <label class="f" for="cbM">Monto<input type="number" id="cbM" required min="0" step="1" value="${c.monto!=null?Number(c.monto):""}"></label>
    <label class="f" for="cbE">Estado<select id="cbE">${opts(["Pagado","Parcial","Pendiente"],c.estado)}</select></label>
    <label class="f" for="cbMd">Medio de pago<select id="cbMd"><option value="">—</option>${opts(["Transferencia","Efectivo","Mercado Pago","Otro"],c.medio)}</select></label>
    <label class="f full" for="cbO">Observaciones<input type="text" id="cbO" value="${esc(c.obs)}" placeholder="Ej: resta abonar $100.000"></label>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="DIR.borrar('fin_cobros','${id}')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
  if(!id){ const k=ultimoMonto($("#cbC").value)??cuenta($("#cbC").value)?.pack; if(k) $("#cbM").value=Number(k); }
}
async function saveCobro(e,id){
  e.preventDefault();
  const cu=cuenta(v("cbC"));
  const data={cuenta_id:v("cbC"),titular:cu?.titular||"",fecha:v("cbF"),monto:Number(v("cbM")),estado:v("cbE"),medio:v("cbMd"),obs:v("cbO")};
  const ok= id? await run(sb.from("fin_cobros").update(data).eq("id",id),"Cobro actualizado") : await run(sb.from("fin_cobros").insert(data),"Cobro registrado");
  if(ok) closeModal();
}
function formCuenta(id){
  const c=id?cuenta(id)||{}:{activo:true,alta:today()};
  openModal(`<h2>${id?"Editar cliente":"Nuevo cliente"}</h2><form class="form" onsubmit="DIR.saveCuenta(event,'${id||""}')">
    <label class="f" for="cuN">Negocio<input type="text" id="cuN" required value="${esc(c.negocio)}"></label>
    <label class="f" for="cuT">Titular<input type="text" id="cuT" value="${esc(c.titular)}"></label>
    <label class="f" for="cuP">Pack mensual<input type="number" id="cuP" min="0" step="1" required value="${c.pack!=null?Number(c.pack):""}"></label>
    <label class="f" for="cuD">Día de cobro<input type="number" id="cuD" min="1" max="31" value="${esc(c.dia_cobro)}"></label>
    <label class="f" for="cuA">Fecha de alta<input type="date" id="cuA" value="${esc(c.alta)}"></label>
    <label class="f" for="cuS">Sede<select id="cuS"><option value="">—</option>${opts(SEDES,c.sede)}</select></label>
    <label class="f full" for="cuCon">Se cobra junto con (mismo titular, un solo pago)<select id="cuCon"><option value="">— Se cobra por separado —</option>${D.fin_cuentas.filter(x=>x.id!==c.id&&!x.cobro_con).sort((a,b)=>((b.titular===c.titular)-(a.titular===c.titular))||(b.activo-a.activo)||a.negocio.localeCompare(b.negocio)).map(x=>`<option value="${x.id}" ${c.cobro_con===x.id?"selected":""}>${esc(x.negocio)} · ${esc(x.titular||"")}${x.titular&&x.titular===c.titular?" (mismo titular)":""}</option>`).join("")}</select></label>
    <label class="f full" for="cuNo">Notas<input type="text" id="cuNo" value="${esc(c.notas)}"></label>
    <label class="check full"><input type="checkbox" id="cuAc" ${c.activo?"checked":""}><span>Cliente activo (se le genera el cobro todos los meses)</span></label>
    ${!id?`<label class="check full"><input type="checkbox" id="cuEq" checked><span>Crear también la ficha en Clientes para el equipo (sin montos)</span></label>`:""}
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="DIR.borrar('fin_cuentas','${id}')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveCuenta(e,id){
  e.preventDefault();
  const data={negocio:v("cuN"),titular:v("cuT"),pack:Number(v("cuP")),dia_cobro:v("cuD")?Number(v("cuD")):null,alta:nz(v("cuA")),sede:v("cuS"),notas:v("cuNo"),activo:$("#cuAc").checked,cobro_con:nz(v("cuCon"))};
  if(id){ if(await run(sb.from("fin_cuentas").update(data).eq("id",id),"Cliente actualizado")) closeModal(); return; }
  if($("#cuEq")?.checked){
    const { data:cl } = await sb.from("clientes").insert({nombre:data.negocio,contacto:data.titular,sede:data.sede,estado:"Onboarding",inicio:data.alta}).select().single();
    if(cl) data.cliente_id=cl.id;
  }
  if(await run(sb.from("fin_cuentas").insert(data),"Cliente creado")) closeModal();
}
function formGasto(id){
  const g=id?D.fin_gastos.find(x=>x.id===id)||{}:{fecha:today().slice(0,7)===D.mes?today():D.mes+"-01",categoria:"Publicidad"};
  const conceptos=[...new Set(D.fin_gastos.map(x=>x.concepto))].sort();
  openModal(`<h2>${id?"Editar gasto":"Cargar gasto"}</h2><form class="form" onsubmit="DIR.saveGasto(event,'${id||""}')">
    <label class="f" for="gaC">Categoría<select id="gaC">${opts(CAT_G,g.categoria)}</select></label>
    <label class="f" for="gaK">Concepto<input type="text" id="gaK" list="gaL" required value="${esc(g.concepto)}"><datalist id="gaL">${conceptos.map(c=>`<option value="${esc(c)}">`).join("")}</datalist></label>
    <label class="f" for="gaF">Fecha<input type="date" id="gaF" required value="${esc(g.fecha)}"></label>
    <label class="f" for="gaM">Monto<input type="number" id="gaM" min="0" step="0.01" required value="${g.monto!=null?Number(g.monto):""}"></label>
    <label class="f" for="gaS">Sede<select id="gaS"><option value="">General</option>${opts(SEDES,g.sede)}</select></label>
    <label class="f" for="gaMd">Medio de pago<select id="gaMd"><option value="">—</option>${opts(["Transferencia","Efectivo","Tarjeta","Mercado Pago","Otro"],g.medio)}</select></label>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="DIR.borrar('fin_gastos','${id}')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveGasto(e,id){
  e.preventDefault();
  const data={categoria:v("gaC"),concepto:v("gaK"),fecha:v("gaF"),monto:Number(v("gaM")),sede:v("gaS"),medio:v("gaMd")};
  const ok= id? await run(sb.from("fin_gastos").update(data).eq("id",id),"Gasto actualizado") : await run(sb.from("fin_gastos").insert(data),"Gasto cargado");
  if(ok) closeModal();
}
async function copiarGastos(){
  const prev=D.fin_gastos.filter(g=>ym(g.fecha)===addMes(D.mes,-1)&&["Software","Oficina"].includes(g.categoria));
  if(!prev.length){ toast("El mes anterior no tiene gastos fijos (Software u Oficina)."); return; }
  await run(sb.from("fin_gastos").insert(prev.map(g=>({categoria:g.categoria,concepto:g.concepto,monto:g.monto,sede:g.sede,medio:g.medio,fecha:D.mes+"-01",notas:"Copiado del mes anterior"}))), prev.length+" gastos fijos copiados");
}
function formPago(id){
  const p=id?D.fin_equipo.find(x=>x.id===id)||{}:{fecha:today().slice(0,7)===D.mes?today():D.mes+"-01",concepto:"Sueldo",pagado:true};
  const personas=[...new Set([...S.miembros.filter(m=>m.activo).map(m=>m.nombre||m.email),...D.fin_equipo.map(e=>e.persona)])].sort();
  openModal(`<h2>${id?"Editar pago":"Cargar pago al equipo"}</h2><form class="form" onsubmit="DIR.savePago(event,'${id||""}')">
    <label class="f" for="paP">Persona<input type="text" id="paP" list="paL" required value="${esc(p.persona)}"><datalist id="paL">${personas.map(x=>`<option value="${esc(x)}">`).join("")}</datalist></label>
    <label class="f" for="paC">Concepto<select id="paC">${opts(CONC_E,p.concepto)}</select></label>
    <label class="f" for="paF">Fecha<input type="date" id="paF" required value="${esc(p.fecha)}"></label>
    <label class="f" for="paM">Monto<input type="number" id="paM" min="0" step="1" required value="${p.monto!=null?Number(p.monto):""}"></label>
    <label class="f full" for="paN">Notas<input type="text" id="paN" value="${esc(p.notas)}"></label>
    <label class="check full"><input type="checkbox" id="paOk" ${p.pagado?"checked":""}><span>Ya está pagado</span></label>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="DIR.borrar('fin_equipo','${id}')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function savePago(e,id){
  e.preventDefault();
  const persona=v("paP"), mb=S.miembros.find(m=>(m.nombre||m.email)===persona);
  const data={persona,miembro_id:mb?mb.id:null,concepto:v("paC"),fecha:v("paF"),monto:Number(v("paM")),notas:v("paN"),pagado:$("#paOk").checked};
  const ok= id? await run(sb.from("fin_equipo").update(data).eq("id",id),"Pago actualizado") : await run(sb.from("fin_equipo").insert(data),"Pago cargado");
  if(ok) closeModal();
}
async function copiarEquipo(){
  const prev=D.fin_equipo.filter(e=>ym(e.fecha)===addMes(D.mes,-1)&&e.concepto==="Sueldo");
  if(!prev.length){ toast("El mes anterior no tiene sueldos cargados."); return; }
  await run(sb.from("fin_equipo").insert(prev.map(e=>({persona:e.persona,miembro_id:e.miembro_id,concepto:e.concepto,monto:e.monto,fecha:D.mes+"-01",pagado:false,notas:"Copiado del mes anterior"}))), prev.length+" sueldos copiados como 'A pagar'");
}
function formCampana(id){
  const c=id?D.fin_campanas.find(x=>x.id===id)||{}:{mes:D.mes+"-01",sede:"Tucumán"};
  const f=(k,l)=>`<label class="f" for="ca_${k}">${l}<input type="number" id="ca_${k}" min="0" step="any" value="${c[k]!=null?Number(c[k]):""}"></label>`;
  openModal(`<h2>${id?"Editar campaña":"Cargar campaña del mes"}</h2><form class="form" onsubmit="DIR.saveCampana(event,'${id||""}')">
    <label class="f" for="caM">Mes<input type="month" id="caM" required value="${esc(String(c.mes).slice(0,7))}"></label>
    <label class="f" for="caS">Sede<select id="caS">${opts(SEDES.slice(0,3),c.sede)}</select></label>
    ${f("prospectos","Prospectos")}${f("llamadas","Llamadas")}${f("pdf","PDF enviados")}${f("no_interesados","No interesados")}${f("clientes_nuevos","Clientes nuevos")}${f("pendientes","Pendiente avanzar")}${f("inversion","Inversión ads")}${f("ingresos","Ingresos")}${f("dias","Días de campaña")}
    <p class="full s" style="margin:0">Tip: Prospectos, clientes nuevos e ingresos se pueden completar con los datos "En vivo" de arriba.</p>
    <div class="actions"><div>${id?`<button type="button" class="btn danger" onclick="DIR.borrar('fin_campanas','${id}')">Borrar</button>`:""}</div><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri">Guardar</button></div></div></form>`);
}
async function saveCampana(e,id){
  e.preventDefault();
  const g=k=>{ const x=v("ca_"+k); return x===""?null:Number(x); };
  const data={mes:v("caM")+"-01",sede:v("caS"),prospectos:g("prospectos"),llamadas:g("llamadas"),pdf:g("pdf"),no_interesados:g("no_interesados"),clientes_nuevos:g("clientes_nuevos"),pendientes:g("pendientes"),inversion:g("inversion"),ingresos:g("ingresos"),dias:g("dias")};
  const ok= id? await run(sb.from("fin_campanas").update(data).eq("id",id),"Campaña actualizada") : await run(sb.from("fin_campanas").upsert(data,{onConflict:"mes,sede"}),"Campaña cargada");
  if(ok) closeModal();
}
function borrar(t,id){
  openModal(`<h2>¿Borrar este registro?</h2><p>No se puede deshacer.</p><div class="form"><div class="actions"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn pri" style="background:var(--danger);border-color:var(--danger)" onclick="DIR._del('${t}','${id}')">Borrar</button></div></div>`);
}

window.DIR = {
  vista,
  tab(k){ D.tab=k; render(); window.scrollTo(0,0); }, sub(k){ D.sub=k; render(); }, anual(b){ D.anual=b; render(); },
  mes(k){ D.mes=addMes(D.mes,k); render(); }, buscar(q){ D.q=q; render(); },
  cobrar, marcarPagado, campo, generar, recordar, formCobro, saveCobro, formCuenta, saveCuenta, formGasto, saveGasto, copiarGastos,
  formPago, savePago, copiarEquipo, formCampana, saveCampana, borrar, nuevaVisita, desdeAgenda, hecha,
  _nv(k,v){ D.nv[k]=v; if(k==="cuenta") render(); },
  async _del(t,id){ if(await run(sb.from(t).delete().eq("id",id),"Borrado")) closeModal(); },
  _c(id){ return ultimoMonto(id)??cuenta(id)?.pack; }
};
render();
})();
