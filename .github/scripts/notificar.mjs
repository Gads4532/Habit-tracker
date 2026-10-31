// Envía las notificaciones de Organización Personal. Lo ejecuta GitHub Actions cada 15 minutos (.github/workflows/notificaciones.yml).
// Lee las suscripciones (tabla push_subs) y el estado sincronizado de cada cuenta (tabla estados) en Supabase,
// calcula qué avisos tocan entre la última pasada y ahora, en la zona horaria de cada teléfono, y los envía con Web Push.
import webpush from 'web-push';

const SUPA = 'https://vqxtxzmtrgsitgsxtvif.supabase.co';
const VAPID_PUBLIC = 'BCkSUFWA-q7GyyocviKZMTzTPNMvWGUNO-G_js0Y9zvBo5DtHoALCHHQIu5SoWc9ML1xaIO9JdPiP_DNG_FMito';
const KEY = process.env.SUPABASE_SERVICE_KEY, VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
if (!KEY || !VAPID_PRIVATE) { console.log('Faltan los secretos SUPABASE_SERVICE_KEY o VAPID_PRIVATE_KEY: no se envía nada.'); process.exit(0); }
webpush.setVapidDetails('https://gads4532.github.io/Habit-tracker/', VAPID_PUBLIC, VAPID_PRIVATE);

const H = { apikey: KEY, 'Content-Type': 'application/json', ...(KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + KEY } : {}) };
async function rest(path, opt = {}) {
  const r = await fetch(`${SUPA}/rest/v1/${path}`, { ...opt, headers: { ...H, ...(opt.headers || {}) } });
  if (!r.ok) throw new Error(`${path.split('?')[0]} ${r.status} ${await r.text()}`);
  return r.status === 204 || r.headers.get('content-length') === '0' ? null : r.json().catch(() => null);
}

// ---------- Fechas en la zona horaria de cada teléfono
const partes = (ms, tz) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  .formatToParts(new Date(ms)).map(p => [p.type, p.value]));
const fechaEn = (ms, tz) => { const p = partes(ms, tz); return `${p.year}-${p.month}-${p.day}`; };
// Instante (ms) de una fecha y hora locales en tz.
function aMs(fecha, hm, tz) {
  const [y, m, d] = fecha.split('-').map(Number), [h, mi] = hm.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const p = partes(guess, tz), comoUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return guess - (comoUTC - guess);
}
const wd = fecha => (new Date(fecha + 'T12:00Z').getUTCDay() + 6) % 7;   // 0 = lunes
const dias = (a, b) => Math.round((Date.parse(b + 'T12:00Z') - Date.parse(a + 'T12:00Z')) / 864e5);
const hora12 = hm => { if (!/^\d\d:\d\d$/.test(hm || '')) return ''; let [h, m] = hm.split(':').map(Number); const ap = h < 12 ? 'AM' : 'PM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
const menos = (hm, min) => { const t = +hm.slice(0, 2) * 60 + +hm.slice(3) - min; return t < 0 ? '' : `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

// ---------- Qué avisar
function resumen(st, fecha) {
  const E = st.enfoque || {}, w = wd(fecha), L = [];
  const P = E.prioridades?.fecha === fecha ? E.prioridades.items || [] : [];
  L.push(P.length ? `Prioridades: ${P.map((x, i) => `${i + 1}. ${x.t}`).join(' · ')}` : 'Elige tus 3 prioridades: la más difícil primero.');
  const ag = E.agendaHoy?.fecha === fecha ? E.agendaHoy.items || [] : [];
  if (ag.length) L.push(`Agenda: ${ag.slice(0, 3).map(e => `${e.h ? hora12(e.h) + ' ' : ''}${e.t}`).join(' · ')}`);
  const pl = (E.planes || []).filter(p => !p.hecho && p.fecha === fecha);
  if (pl.length) L.push(`Planes: ${pl.map(p => `${p.titulo}${p.con ? ' con ' + p.con : ''} ${hora12(p.hora)}`).join(' · ')}`);
  const hab = (st.habits || []).filter(h => !h.rutina && (!h.creado || h.creado <= fecha) && (h.dias?.length ? h.dias : [0, 1, 2, 3, 4, 5, 6]).includes(w));
  if (hab.length) L.push(`Hábitos: ${hab.slice(0, 4).map(h => h.nombre).join(', ')}${hab.length > 4 ? '…' : ''}`);
  const tareas = (st.tareas?.items || []).filter(x => !x.hecha && x.fecha && x.fecha <= fecha);
  if (tareas.length) L.push(`Tareas para hoy: ${tareas.length}${tareas.some(x => x.fecha < fecha) ? ' (hay vencidas)' : ''}`);
  const per = (E.personas || []).find(p => !p.ultimo || dias(p.ultimo, fecha) >= (p.cada || 30));
  if (per) L.push(`Escríbele a ${per.nombre}.`);
  return { title: `Buenos días${st.nombre ? ', ' + st.nombre : ''}`, body: L.join('\n'), tag: 'resumen', url: './?v=enfoque' };
}
function avisos(st, tz, prefs, desde, hasta) {
  const E = st.enfoque || {}, out = [];
  const en = (fecha, hm) => { if (!hm) return false; const t = aMs(fecha, hm, tz); return t > desde && t <= hasta; };
  for (const fecha of [...new Set([fechaEn(desde, tz), fechaEn(hasta, tz)])]) {
    const w = wd(fecha);
    if (prefs.manana !== false && en(fecha, prefs.hora || '07:30')) out.push(resumen(st, fecha));
    if (prefs.habitos !== false) for (const h of st.habits || []) {
      if (h.rutina || (h.creado && h.creado > fecha) || !(h.dias?.length ? h.dias : [0, 1, 2, 3, 4, 5, 6]).includes(w) || st.log?.[h.id]?.[fecha]) continue;
      for (const hm of h.horas || []) if (en(fecha, hm)) out.push({ title: `Hora de: ${h.nombre}`, body: h.minima ? `Si hoy cuesta, la versión de 2 minutos: ${h.minima}.` : h.identidad ? `Soy una persona que ${h.identidad}.` : 'Márcalo en la app cuando lo hagas.', tag: 'h-' + h.id, url: './?v=hoy' });
    }
    if (prefs.planes !== false) for (const p of E.planes || []) if (!p.hecho && p.fecha === fecha && en(fecha, menos(p.hora || '', 60)))
      out.push({ title: `En 1 hora: ${p.titulo}${p.con ? ' con ' + p.con : ''}`, body: 'Lleva una pregunta pensada y escucha sin mirar el teléfono.', tag: 'p-' + p.id, url: './?v=enfoque' });
    if (prefs.proyectos !== false) for (const pr of E.proyectos || []) if (!pr.archivado && pr.paso && pr.cuando === fecha && en(fecha, pr.hora))
      out.push({ title: `Ahora: ${pr.paso}`, body: `${pr.nombre}${pr.donde ? ' · ' + pr.donde : ''}. Si cuesta, empieza por 2 minutos${pr.minima ? ': ' + pr.minima : ''}.`, tag: 'r-' + pr.id, url: './?v=enfoque' });
    if (prefs.mediodia !== false && en(fecha, '13:00')) {
      const P = E.prioridades?.fecha === fecha ? E.prioridades.items || [] : null, x = P?.find(i => !i.hecho);
      if (!P || !P.length) out.push({ title: 'Aún no eliges tus prioridades', body: 'Tres como máximo, la más difícil primero. Te toma un minuto.', tag: 'mediodia', url: './?v=enfoque' });
      else if (x) out.push({ title: 'Tu prioridad sigue pendiente', body: `${x.t}. ¿25 minutos ahora, con el teléfono boca abajo?`, tag: 'mediodia', url: './?v=enfoque' });
    }
    if (prefs.noche !== false && en(fecha, '20:00') && !((E.dias?.[fecha]?.ini_esp || 0) > 0)) out.push({ title: 'Tu momento espiritual de hoy', body: 'Todos los días: unos minutos de oración, silencio, gratitud o servicio. Hoy aún no está.', tag: 'esp', url: './?v=enfoque' });
    if (prefs.noche !== false && en(fecha, '21:00')) {
      const d = E.dias?.[fecha] || {};
      out.push({ title: 'Cierre del día', body: `${d.enfoque || 0} min de enfoque · ${d.iniciativas || 0} iniciativas · resististe ${(d.resistidas || 0) + (d.alternativas || 0)} veces.\n¿Tres cosas buenas de hoy?`, tag: 'noche', url: './?v=enfoque' });
    }
    if (prefs.semana !== false && w === 0 && en(fecha, '08:30')) out.push({ title: 'Nuevo comienzo: revisión semanal', body: 'Diez minutos: logros, siguientes pasos con día y hora, y a quién escribir.', tag: 'semana', url: './?v=enfoque' });
    if (prefs.mediodia !== false && en(fecha, '16:00')) {
      const I = E.iniciativas4?.dia === fecha ? E.iniciativas4.items || [] : [], min = E.minIni || 2, hechas = I.filter(x => x.hecho).length;
      const minSoc = E.minSocial || 6, dias = E.dias || {}, wdl = wd(fecha), lunesK = new Date(Date.parse(fecha + 'T12:00Z') - wdl * 864e5).toISOString().slice(0, 10);
      const socDias = Object.keys(dias).filter(k => k >= lunesK && k <= fecha && (dias[k].ini_social || 0) > 0).length, quedan = 7 - wdl - ((dias[fecha]?.ini_social || 0) > 0 ? 1 : 0);
      if (socDias < minSoc && minSoc - socDias >= quedan && !((dias[fecha]?.ini_social || 0) > 0)) out.push({ title: `Social: ${socDias} de ${minSoc} días esta semana`, body: 'Hoy cuenta para llegar al mínimo: un mensaje, una llamada o un plan que propongas tú.', tag: 'social6', url: './?v=enfoque' });
      if (hechas < min) out.push({ title: `Iniciativas: ${hechas} de ${min} hoy`, body: `Faltan ${min - hechas}. ${I.filter(x => x.t && !x.hecho).map(x => x.t).join(' · ') || 'Elige entre estudio, proyecto, laboral y social'}. Cada una vale 30 XP.`, tag: 'ini4', url: './?v=enfoque' });
    }
    if (prefs.agenda !== false) {
      // Agenda del día: 10 minutos antes de cada cosa con hora que siga pendiente (planes y eventos tienen sus propios avisos).
      const ag = E.agendaHoy?.fecha === fecha ? E.agendaHoy.items || [] : [], I4 = E.iniciativas4?.dia === fecha ? E.iniciativas4.items || [] : [];
      const hechoAg = it => it.tipo === 'habito' ? ['full', 'min'].includes(st.log?.[it.ref]?.[fecha]) : it.tipo === 'tarea' ? !!(st.tareas?.items || []).find(x => x.id === it.ref)?.hecha
        : it.tipo === 'ini' ? !!I4.find(x => x.k === it.ref)?.hecho : it.tipo === 'prio' ? !!(E.prioridades?.fecha === fecha ? E.prioridades.items || [] : []).find(x => x.id === it.ref)?.hecho : !!it.hecho;
      const etq = { habito: 'Hábito', tarea: 'Tarea', ini: 'Iniciativa', prio: 'Prioridad', libre: 'Agenda' };
      for (const it of ag) if (it.h && !['evento', 'plan'].includes(it.tipo) && !hechoAg(it) && en(fecha, menos(it.h, 10)))
        out.push({ title: `En 10 min: ${it.t}`, body: `${etq[it.tipo] || 'Agenda'}${it.min ? ' · ' + it.min + ' min' : ''}. Si son las ${hora12(it.h)}, entonces empiezo: teléfono boca abajo.`, tag: 'ag-' + it.id, url: './?v=agenda' });
      if (en(fecha, '09:30') && !(E.agendaHoy?.fecha === fecha && E.agendaHoy.organizado)) out.push({ title: 'Tu día aún no tiene agenda', body: 'Dos minutos: hábitos, tareas e iniciativas con hora. Tan fácil que sería ridículo no hacerlo.', tag: 'agenda', url: './?v=agenda' });
    }
    if (prefs.semana !== false && w === 4 && en(fecha, '17:00')) out.push({ title: 'Gracias del viernes', body: 'Agradécele algo concreto a alguien. Le alegrará más de lo que imaginas.', tag: 'viernes', url: './?v=enfoque' });
  }
  return out.slice(0, 5);
}

// ---------- Pasada
const ahora = Date.now();
const subs = await rest('push_subs?select=*');
const uids = [...new Set(subs.map(s => s.user_id))];
const estados = uids.length ? await rest(`estados?select=user_id,data&user_id=in.(${uids.join(',')})`) : [];
const datos = Object.fromEntries(estados.map(e => [e.user_id, e.data]));
let enviados = 0;
for (const s of subs) {
  const desde = Math.max(s.ultimo ? Date.parse(s.ultimo) : ahora - 20 * 60000, ahora - 2 * 3600e3);
  const lista = datos[s.user_id] ? avisos(datos[s.user_id], s.tz || 'UTC', s.prefs || {}, desde, ahora) : [];
  const filtro = `push_subs?endpoint=eq.${encodeURIComponent(s.endpoint)}`;
  let viva = true;
  for (const a of lista) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(a), { TTL: 3600 }); enviados++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) { await rest(filtro, { method: 'DELETE' }); viva = false; break; } console.error('Error al enviar:', e.statusCode || e.message); }
  }
  if (viva) await rest(filtro, { method: 'PATCH', body: JSON.stringify({ ultimo: new Date(ahora).toISOString() }) });
}
console.log(`${subs.length} suscripciones, ${enviados} avisos enviados.`);
