// Envía las notificaciones de Organización Personal. Lo ejecuta GitHub Actions cada 15 minutos (.github/workflows/notificaciones.yml).
// Lee las suscripciones (tabla push_subs) y el estado sincronizado de cada cuenta (tabla estados) en Supabase,
// calcula qué avisos tocan entre la última pasada y ahora, en la zona horaria de cada teléfono, y los envía con Web Push.
// 2.12: como mucho 4 al día (2 a 8 en Ajustes), lo que no tiene hora va junto al empezar tus ventanas, nada durante el enfoque,
// los eventos ni los bloques protegidos, y cada aviso da tu razón y una elección, sin XP ni imperativos (F8, F16, F21, F24).
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

// ---------- Textos (F8): tu razón y una elección; sin imperativos, sin XP y con tres opciones como mucho (Legault et al., 2011).
const sinPunto = t => String(t ?? '').trim().replace(/[\s.!?…]+$/, '');
const mayus = t => t ? t[0].toUpperCase() + t.slice(1) : '';
const minus = t => t && !/^\p{Lu}{2}/u.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
const esUrl = t => /^https?:\/\//i.test(String(t || '').trim());
const hmOk = hm => /^([01]\d|2[0-3]):[0-5]\d$/.test(hm || '');
// «la 1:00 PM», «las 7:00 AM».
const art = hm => /^1:/.test(hora12(hm)) ? 'la' : 'las';
const delas = hm => `de ${art(hm)} ${hora12(hm)}`, alas = hm => `a ${art(hm)} ${hora12(hm)}`, sonlas = hm => `${art(hm) === 'la' ? 'es' : 'son'} ${art(hm)} ${hora12(hm)}`;
// El plan se escribe en primera persona («estoy cansado») y el aviso te lo dice a ti («estás cansado»).
const TU = { estoy: 'estás', tengo: 'tienes', puedo: 'puedes', quiero: 'quieres', voy: 'vas', soy: 'eres', hago: 'haces', siento: 'sientes', llego: 'llegas', salgo: 'sales', duermo: 'duermes', vuelvo: 'vuelves', necesito: 'necesitas', me: 'te', mi: 'tu', mis: 'tus', 'mí': 'ti', conmigo: 'contigo', yo: 'tú' };
const RE_TU = new RegExp(`(?<!\\p{L})(${Object.keys(TU).join('|')})(?!\\p{L})`, 'giu');
const aTi = t => String(t || '').replace(RE_TU, w => { const r = TU[w.toLowerCase()]; return /^\p{Lu}/u.test(w) ? mayus(r) : r; });
// «Dormir mejor» → «Para dormir mejor.»: la razón como un para qué.
const NO_VERBO = new Set(['lugar', 'hogar', 'mar', 'bar', 'par', 'azúcar', 'azar', 'placer', 'mujer', 'taller', 'collar', 'altar', 'pilar', 'lunar', 'pulgar', 'dólar', 'ayer', 'bienestar', 'carácter', 'líder', 'cáncer',
  'mártir', 'menester', 'militar', 'familiar', 'popular', 'particular', 'regular', 'similar', 'singular', 'peculiar', 'solar', 'escolar', 'celular', 'ejemplar', 'titular', 'auxiliar', 'circular']);
const razon = t => { t = aTi(sinPunto(t)); if (!t) return ''; const w = (t.match(/^\p{L}+/u) || [''])[0].toLowerCase();
  return (/^(para|por)\s/i.test(t) || !/(ar|er|ir|ír)(me|te|se|lo|la|le|nos)?$/.test(w) || NO_VERBO.has(w) ? mayus(t) : 'Para ' + minus(t)) + '.'; };
const DETERMINANTE = /^(el|la|los|las|un|una|unos|unas|tu|tus|su|sus|este|esta|estos|estas|ese|esa)\s/i;

// Hábito a su hora: lo que disfrutas delante, tu razón y tres salidas.
function cuerpoHabito(h) {
  const L = [], dis = aTi(sinPunto(h.disfrute));
  if (dis && !esUrl(dis)) L.push((/^con\s/i.test(dis) ? mayus(dis) : DETERMINANTE.test(dis) ? 'Con ' + minus(dis) : mayus(dis)) + '.');
  const r = razon(Array.isArray(h.beneficios) ? h.beneficios[0] : ''); if (r) L.push(r);
  const min = sinPunto(h.minima), preg = `¿Completo, la versión de 2 min${min ? ` (${min})` : ''} o lo mueves?`;
  // «Solo mientras…» solo si cabe en una frase corta (sin enlaces ni comas).
  const sm = aTi(sinPunto(h.soloMientras));
  if (sm && !esUrl(sm) && sm.length <= 40 && !/[,;:.!?/]/.test(sm) && [...L, preg].join(' ').length + sm.length <= 140) L.splice(dis ? 1 : 0, 0, `Solo mientras lo haces: ${minus(sm)}.`);
  return [...L, preg].join(' ');
}
// Plan para volver (F1): «Si a las 7:00 AM estás cansado, entonces: Leer 1 página.» Si Hábitos ya lo pasó a segunda
// persona (rt.siTu), se usa ese, para que el aviso diga lo mismo que la tarjeta.
function cuerpoPlan(h, rt) {
  const si = minus(sinPunto(rt.siTu) || aTi(sinPunto(rt.si))), ent = sinPunto(rt.entonces) || sinPunto(h.minima) || h.nombre;
  return si ? `Si ${alas(rt.hora)} ${si}, entonces: ${ent}. Cuenta igual para la racha.` : `${mayus(alas(rt.hora))}: ${ent}. Cuenta igual para la racha.`;
}

// ---------- Fechas y hábitos
const masDias = (fecha, n) => new Date(Date.parse(fecha + 'T12:00Z') + n * 864e5).toISOString().slice(0, 10);
const aMin = hm => +hm.slice(0, 2) * 60 + +hm.slice(3);
const deMin = m => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const ts = x => typeof x === 'number' ? (x < 1e11 ? x * 1000 : x) : (Date.parse(x || '') || 0);
const programado = (h, fecha) => (h.dias?.length ? h.dias : [0, 1, 2, 3, 4, 5, 6]).includes(wd(fecha));
const protegido = (h, fecha) => Array.isArray(h.protegidos) && h.protegidos.includes(fecha);
const horasDe = h => [...new Set((h.horas || []).filter(hmOk))].sort();
// Aviso que se retira (F21): a diario las semanas 1–3, en días alternos (de los que tocan) las semanas 4–6 y, después,
// solo si el hábito baja del 70 % en sus últimos 14 días. Con h.avisoDiario (la persona lo pidió) vuelve a diario.
function tasaBaja(st, h, fecha) {
  let n = 0, hechos = 0;
  for (let i = 0, k = masDias(fecha, -1); i < 120 && n < 14 && (!h.creado || k >= h.creado); i++, k = masDias(k, -1)) {
    if (!programado(h, k) || protegido(h, k)) continue;
    const m = st.log?.[h.id]?.[k]; if (m === 'just') continue;
    n++; if (m === 'full' || m === 'min') hechos++;
  }
  return !n || hechos / n < 0.7;
}
function faseAviso(st, h, fecha) {
  if (h.avisoDiario) return true;
  if (!/^\d{4}-\d\d-\d\d$/.test(h.creado || '')) return tasaBaja(st, h, fecha);
  const edad = dias(h.creado, fecha);
  if (edad < 21) return true;
  if (edad < 42) { let n = 0; for (let k = masDias(h.creado, 21); k < fecha; k = masDias(k, 1)) if (programado(h, k)) n++; return n % 2 === 0; }
  return tasaBaja(st, h, fecha);
}
// ¿Tocaba el aviso de esa hora ese día? (sin contar el tope ni el silencio)
const tocaAviso = (st, h, hm, fecha) => !h.rutina && (!h.creado || h.creado <= fecha) && programado(h, fecha) && horasDe(h).includes(hm) && !protegido(h, fecha)
  && !(h.retomar?.d === fecha && h.retomar.hora === hm) && faseAviso(st, h, fecha);
// La franja de un aviso abierto: la última hora del hábito que ya había pasado al abrirlo.
const franjaDe = (h, fecha, t, tz) => { const hs = horasDe(h); let f = hs[0]; for (const hm of hs) if (aMs(fecha, hm, tz) <= t + 5 * 60000) f = hm; return f; };
// Un aviso ignorado 3 días seguidos en la misma franja se pausa (F16): ni lo abriste ni marcaste el hábito en 30 min.
// Un día hecho a una hora que no consta cuenta como útil; tras «Mover» o «Dejarlo» (h.avisoReinicio) se cuenta de nuevo.
// Solo cuentan los días desde que la app anota los avisos que abres (enfoque.avisosDesde).
function pausado(st, tz, h, hm, fecha) {
  const A = Array.isArray(st.enfoque?.avisosAbiertos) ? st.enfoque.avisosAbiertos : [], desdeAv = st.enfoque?.avisosDesde;
  if (!/^\d{4}-\d\d-\d\d$/.test(desdeAv || '')) return false;
  let n = 0;
  for (let i = 1, e = masDias(fecha, -1); i <= 21; i++, e = masDias(e, -1)) {
    if (e < desdeAv || (h.avisoReinicio && e < h.avisoReinicio) || (h.creado && e < h.creado)) break;
    if (!tocaAviso(st, h, hm, e)) continue;
    const m = st.log?.[h.id]?.[e];
    if (m === 'skip' || m === 'just') continue;
    const slot = aMs(e, hm, tz);
    if (m === 'full' || m === 'min') {
      const he = ts(h.hechoEn);
      if (!he || fechaEn(he, tz) !== e) return false;
      if (he < slot) continue;
      if (he - slot <= 30 * 60000) return false;
    }
    if (A.some(x => x && x.tag === 'h-' + h.id && x.d === e && franjaDe(h, e, +x.t || 0, tz) === hm)) return false;
    if (++n >= 3) return true;
  }
  return false;
}

// ---------- La agenda de un día (con la hora a la que se organizó, para no contar lo que aún no existía)
const agendaDe = (E, fecha) => {
  const A = E.agendaHoy?.fecha === fecha ? E.agendaHoy : null, P = E.agendaPlan?.fecha === fecha ? E.agendaPlan : null;
  const deA = (A?.items || []).map(it => ({ ...it, enFuente: true, org: +A.organizado || 0 }));
  const orgAt = [A?.organizado, P?.organizado].map(x => +x || 0).filter(Boolean).map(x => x < 1e11 ? 1 : x);
  const base = { organizadoEn: orgAt.length ? Math.min(...orgAt) : 0 };
  if (!P || A?.organizado) return { ...base, items: deA, organizado: !!A?.organizado };
  const clave = it => it.tipo + ':' + (it.tipo === 'libre' ? it.id : it.ref), ya = new Set((P.items || []).map(clave));
  return { ...base, items: [...(P.items || []).map(it => ({ ...it, enFuente: !['ini', 'prio'].includes(it.tipo), org: +P.organizado || 0 })), ...deA.filter(it => !ya.has(clave(it)))], organizado: true };
};
// Prioridades de un día: las del teléfono si son de ese día; si no, la rana que se eligió la víspera.
const prioDe = (E, fecha) => E.prioridades?.fecha === fecha ? E.prioridades.items || [] : E.agendaPlan?.fecha === fecha && E.agendaPlan.rana?.t ? [{ id: E.agendaPlan.rana.id, t: E.agendaPlan.rana.t, hecho: false }] : null;

// Resumen de la mañana: informa, sin XP ni imperativos.
function resumen(st, fecha) {
  const E = st.enfoque || {}, L = [];
  const P = prioDe(E, fecha) || [];
  L.push(P.length ? `Prioridades: ${P.map((x, i) => `${i + 1}. ${x.t}`).join(' · ')}` : 'Aún sin prioridades: tres como máximo, la más difícil primero.');
  const ag = agendaDe(E, fecha).items.filter(e => e.t).sort((a, b) => (a.h || '99') < (b.h || '99') ? -1 : 1);
  if (ag.length) L.push(`Agenda: ${ag.slice(0, 4).map(e => `${e.h ? hora12(e.h) + ' ' : ''}${e.t}`).join(' · ')}${ag.length > 4 ? '…' : ''}`);
  const pl = (E.planes || []).filter(p => !p.hecho && p.fecha === fecha);
  if (pl.length) L.push(`Planes: ${pl.map(p => `${p.titulo}${p.con ? ' con ' + p.con : ''} ${hora12(p.hora)}`).join(' · ')}`);
  const hab = (st.habits || []).filter(h => !h.rutina && !h.graduado && (!h.creado || h.creado <= fecha) && programado(h, fecha) && !protegido(h, fecha));
  if (hab.length) L.push(`Hábitos: ${hab.slice(0, 4).map(h => h.nombre).join(', ')}${hab.length > 4 ? '…' : ''}`);
  const tareas = (st.tareas?.items || []).filter(x => !x.hecha && x.fecha && x.fecha <= fecha);
  if (tareas.length) L.push(`Tareas para hoy: ${tareas.length}${tareas.some(x => x.fecha < fecha) ? ' (hay vencidas)' : ''}`);
  const per = (E.personas || []).find(p => !p.ultimo || dias(p.ultimo, fecha) >= (p.cada || 30));
  if (per) L.push(`Hace tiempo que no hablas con ${per.nombre}.`);
  return { tag: 'resumen', title: `Buenos días${st.nombre ? ', ' + st.nombre : ''}`, body: L.join('\n'), url: './?v=enfoque' };
}

// ---------- Todo lo que podría avisarse un día, cada cosa con su hora y su tipo:
// clase 1 = a la hora que tú pusiste (hábitos, planes, pasos, agenda, plan para volver, hora de dormir), 2 = resumen, 3 = lo demás.
// vivo(at) dice si seguía pendiente a esa hora; para lo de pasadas anteriores se usa la hora en que se marcó, si consta.
const APAGAR = 'Apagar este tipo';
function candidatos(C, fecha) {
  const { st, tz, prefs, desde } = C, E = st.enfoque || {}, w = wd(fecha), out = [];
  const actual = at => at > desde;
  const sinMarca = (hecho, at) => !hecho || !actual(at);
  const habito = id => (st.habits || []).find(h => h.id === id);
  const pendienteHabito = (h, at) => {
    const m = st.log?.[h.id]?.[fecha]; if (!m) return true;
    if (actual(at)) return false;
    const he = ts(h.hechoEn);
    return ['full', 'min'].includes(m) && he > at && fechaEn(he, tz) === fecha;
  };
  const en = hm => aMs(fecha, hm, tz);
  if (prefs.manana !== false) out.push({ ...resumen(st, fecha), t: en(hmOk(prefs.hora) ? prefs.hora : '07:30'), clase: 2, apagar: APAGAR, vivo: () => true });
  // Plan para volver (F1): lo pediste tú, así que llega aunque el aviso normal esté quitado.
  if (prefs.habitos !== false) for (const h of st.habits || []) {
    const rt = h.retomar;
    if (h.rutina || rt?.d !== fecha || !hmOk(rt.hora) || protegido(h, fecha) || ['full', 'min'].includes(st.log?.[h.id]?.[rt.de])) continue;
    out.push({ t: en(rt.hora), clase: 1, tag: 'rt-' + h.id, title: `${h.nombre} · tu plan de hoy`, body: cuerpoPlan(h, rt), url: './?v=hoy', limite: 60, vivo: at => pendienteHabito(h, at) });
  }
  // Hábito a su hora, con sus fases (F21) y su pausa si no sirvió (F16). Nunca si confías en la señal o ya se graduó.
  if (prefs.habitos !== false) for (const h of st.habits || []) {
    if (h.rutina || (h.creado && h.creado > fecha) || !programado(h, fecha) || h.sinAviso || h.graduado || protegido(h, fecha) || !faseAviso(st, h, fecha)) continue;
    for (const hm of horasDe(h)) {
      if ((h.retomar?.d === fecha && h.retomar.hora === hm) || pausado(st, tz, h, hm, fecha)) continue;
      out.push({ t: en(hm), clase: 1, tag: 'h-' + h.id, title: `${h.nombre} · tu espacio ${delas(hm)}`, body: cuerpoHabito(h), url: './?v=hoy', apagar: 'No avisar este hábito', limite: 60, vivo: at => pendienteHabito(h, at) });
    }
  }
  if (prefs.agenda !== false) {
    // Agenda del día: 10 minutos antes de cada cosa con hora que siga pendiente. Planes y eventos tienen su propio aviso,
    // y un hábito agendado a su hora de siempre lo gobierna su propio aviso (sus fases y su pausa): no se duplica.
    const A = agendaDe(E, fecha), I4 = E.iniciativas4?.dia === fecha ? E.iniciativas4.items || [] : [], PR = E.prioridades?.fecha === fecha ? E.prioridades.items || [] : [];
    // La fuente de cada cosa: si se borró o se vació, no se avisa; el texto y la hora salen de ahí (si la editaste, el aviso la sigue).
    const fuente = it => !it.enFuente ? null : it.tipo === 'habito' ? habito(it.ref) : it.tipo === 'tarea' ? (st.tareas?.items || []).find(x => x.id === it.ref)
      : it.tipo === 'ini' ? I4.find(x => x.k === it.ref && x.t) : it.tipo === 'prio' ? PR.find(x => x.id === it.ref) : it;
    const vivoF = it => !it.enFuente || !!fuente(it);
    const texto = it => { const f = fuente(it); return (it.tipo === 'tarea' ? f?.titulo : it.tipo === 'habito' ? f?.nombre : ['ini', 'prio'].includes(it.tipo) ? f?.t : '') || it.t; };
    const horaDe = it => { const f = fuente(it); return it.tipo === 'ini' && f ? f.hora || '' : it.tipo === 'tarea' && f?.hora ? f.hora : it.h; };
    const pendienteAg = (it, at) => { const f = fuente(it);
      if (it.tipo === 'habito') { const h = habito(it.ref); return h ? pendienteHabito(h, at) : sinMarca(['full', 'min'].includes(st.log?.[it.ref]?.[fecha]), at); }
      if (it.tipo === 'tarea') return !f?.hecha || (!actual(at) && +f.hechaEn > at);
      return sinMarca(['ini', 'prio'].includes(it.tipo) ? !!f?.hecho : !!it.hecho, at); };
    const gobiernaHabito = it => { if (it.tipo !== 'habito' || prefs.habitos === false) return false; const h = habito(it.ref);
      return !!h && !h.rutina && !(h.creado && h.creado > fecha) && programado(h, fecha) && horasDe(h).includes(horaDe(it)); };
    for (const it of A.items) {
      const h = horaDe(it), hb = it.tipo === 'habito' ? fuente(it) : null;
      if (!hmOk(h) || ['evento', 'plan'].includes(it.tipo) || !vivoF(it) || (hb && (hb.sinAviso || hb.graduado || protegido(hb, fecha))) || gobiernaHabito(it) || !menos(h, 10)) continue;
      const org = +it.org || 0, min = +it.min || 0;
      // Un bloque protegido (F25) recuerda, además, que la app calla mientras dura.
      out.push({ t: en(menos(h, 10)), clase: 1, tag: 'ag-' + it.id, title: `${texto(it)}${min ? ` · ${min} min` : ''}`, body: `Si ${sonlas(h)}, entonces empiezo: No molestar y el teléfono lejos.${it.foco ? ' Los avisos de la app callan en este bloque.' : ''}`,
        url: './?v=agenda', apagar: APAGAR, hasta: en(h), vivo: at => (actual(at) || !org || org < 1e11 || org <= at) && pendienteAg(it, at) });
    }
    // A las 9:30, si el día no tiene hora (solo trae de vuelta a la app: cuenta como el único del día de ese tipo).
    out.push({ t: en('09:30'), clase: 3, soloVolver: true, tag: 'agenda', title: 'Tu día aún no tiene hora', body: 'Dos minutos y lo importante queda con hora.', url: './?v=agenda', apagar: APAGAR,
      vivo: at => !A.organizado || (!actual(at) && A.organizadoEn > at) });
  }
  if (prefs.planes !== false) for (const p of E.planes || []) if (p.fecha === fecha && hmOk(p.hora) && menos(p.hora, 60))
    out.push({ t: en(menos(p.hora, 60)), clase: 1, tag: 'p-' + p.id, title: `En 1 hora: ${p.titulo}${p.con ? ' con ' + p.con : ''}`, body: 'Para conectar de verdad: ¿llevas una pregunta pensada y el teléfono guardado?',
      url: './?v=enfoque', apagar: APAGAR, hasta: en(p.hora), vivo: at => sinMarca(p.hecho, at) });
  if (prefs.proyectos !== false) for (const pr of E.proyectos || []) if (!pr.archivado && pr.paso && pr.cuando === fecha && hmOk(pr.hora))
    out.push({ t: en(pr.hora), clase: 1, tag: 'r-' + pr.id, title: `${pr.paso} · tu espacio ${delas(pr.hora)}`, body: `${pr.nombre}${pr.donde ? ' · ' + pr.donde : ''}. ¿Lo empiezas, la versión de 2 min${sinPunto(pr.minima) ? ` (${sinPunto(pr.minima)})` : ''} o lo mueves?`,
      url: './?v=enfoque', apagar: APAGAR, limite: 60, vivo: () => true });
  // Teléfono fuera del cuarto (F24): 30 min antes de tu hora de dormir.
  if (prefs.noche !== false) out.push({ t: en(deMin(aMin(hmOk(E.horaDormir) ? E.horaDormir : '23:00') - 30)), clase: 1, tag: 'dormir', title: 'Hora de soltar el teléfono', body: 'Cárgalo fuera del cuarto. Mañana te pregunto cómo dormiste.',
    url: './?v=enfoque', apagar: APAGAR, limite: 60, vivo: () => true });
  if (prefs.semana !== false && w === 0) out.push({ t: en('08:30'), clase: 3, soloVolver: true, tag: 'semana', title: 'Nuevo comienzo: revisión semanal', body: 'Diez minutos para ver lo logrado y poner día y hora a lo siguiente. ¿Ahora o en tu próxima ventana?',
    url: './?v=enfoque', apagar: APAGAR, vivo: at => !(E.revision >= masDias(fecha, -1)) || !actual(at) });
  // Lo que no tiene hora propia sale junto, en un solo aviso, al empezar tu siguiente ventana de revisión (F16).
  const sueltos = [];
  if (prefs.mediodia !== false) {
    sueltos.push({ nominal: '12:00', parte: at => {
      const P = (prioDe(E, fecha) || []).filter(x => x && sinPunto(x.t));
      if (!P.length) return { tag: 'mediodia', soloVolver: true, corto: 'aún no tienes prioridades', title: 'Aún no tienes prioridades', body: 'Tres como máximo, la más difícil primero. ¿Las eliges ahora o en tu próxima ventana?' };
      let i = P.findIndex(x => !x.hecho); if (i < 0) { if (actual(at)) return null; i = 0; }
      const tarde = aMin(fechaHM(at, tz)) >= 15 * 60;
      return { tag: 'mediodia', corto: `Tu prioridad ${i + 1} sigue libre`, title: `Tu prioridad ${i + 1} sigue libre`, body: `${sinPunto(P[i].t)}. ¿La empiezas 10 minutos ahora o ${tarde ? 'le pones hora' : 'la agendas a las 4:00 PM'}?` };
    } });
    sueltos.push({ nominal: '16:00', parte: at => {
      const I = E.iniciativas4?.dia === fecha ? E.iniciativas4.items || [] : [], min = E.minIni || 2, hechas = I.filter(x => x.hecho).length;
      if (actual(at) && hechas >= min) return null;
      const falta = Math.max(1, min - (actual(at) ? hechas : 0)), pend = I.filter(x => x.t && !x.hecho).map(x => sinPunto(x.t)).slice(0, 2).join(' · ') || 'estudio, proyecto, laboral, social o espiritual';
      return { tag: 'ini4', corto: falta === 1 ? 'falta una iniciativa' : `faltan ${falta} iniciativas`, title: `Iniciativas: ${min - falta} de ${min} hoy`, body: `${falta === 1 ? 'Falta una' : `Faltan ${falta}`}: ${pend}. ¿10 minutos ahora o le pones hora?` };
    } });
    sueltos.push({ nominal: '16:00', parte: at => {
      const minSoc = E.minSocial || 6, D = E.dias || {}, lunesK = masDias(fecha, -w), hoyHecho = actual(at) && (D[fecha]?.ini_social || 0) > 0;
      const socDias = Object.keys(D).filter(k => k >= lunesK && k < fecha && (D[k].ini_social || 0) > 0).length, quedan = 7 - w;
      if (hoyHecho || !(socDias < minSoc && minSoc - socDias >= quedan)) return null;
      return { tag: 'social6', corto: 'hoy cuenta para social', title: `Social: ${socDias} de ${minSoc} días esta semana`, body: 'Hoy cuenta para llegar al mínimo: ¿un mensaje, una llamada o un plan que propongas tú?' };
    } });
  }
  if (prefs.semana !== false && w === 4) sueltos.push({ nominal: '17:00', parte: at => {
    const lunesK = masDias(fecha, -w), dadas = (E.personas || []).some(p => (p.historial || []).some(x => x?.tipo === 'Gracias' && x.d >= lunesK));
    if (actual(at) && dadas) return null;
    return { tag: 'viernes', corto: 'el gracias del viernes', title: 'Gracias del viernes', body: '¿A quién le agradeces algo concreto esta semana? Un mensaje corto basta.' };
  } });
  if (prefs.noche !== false) {
    sueltos.push({ nominal: '20:00', parte: at => actual(at) && (E.dias?.[fecha]?.ini_esp || 0) > 0 ? null
      : { tag: 'esp', corto: 'tu momento espiritual', title: 'Tu momento espiritual', body: 'Unos minutos de oración, silencio, gratitud o servicio, cuando te venga bien antes de dormir.' } });
    sueltos.push({ nominal: '21:00', parte: at => {
      if (actual(at) && (E.buenas || []).some(x => x?.d === fecha)) return null;
      // Si mañana ya está organizado, lo primero que tiene hora (F6).
      const m = masDias(fecha, 1), P = E.agendaPlan?.fecha === m ? E.agendaPlan : null;
      const nom = it => (it.tipo === 'habito' ? habito(it.ref)?.nombre : it.tipo === 'tarea' ? (st.tareas?.items || []).find(x => x.id === it.ref)?.titulo : '') || it.t;
      const r = (P?.items || []).filter(it => hmOk(it.h) && nom(it)).sort((a, b) => a.h < b.h ? -1 : 1)[0];
      const res = r ? `Mañana ${alas(r.h)} tienes reservado: ${sinPunto(nom(r))}.` : '';
      return { tag: 'noche', corto: `lo mejor de hoy${res ? ' · ' + minus(res.slice(0, -1)) : ''}`, title: '¿Qué fue lo mejor de hoy?', body: `Un minuto para cerrar con lo que avanzaste y lo mejor del día.${res ? ' ' + res : ''}` };
    } });
  }
  const V = [...new Set((Array.isArray(E.ventanas) && E.ventanas.length ? E.ventanas : ['12:30', '18:00', '21:00']).filter(hmOk))].sort();
  const lotes = new Map();
  for (const p of sueltos) { const v = V.find(x => x >= p.nominal) || ''; const k = v || p.nominal; if (!lotes.has(k)) lotes.set(k, { ventana: v, partes: [] }); lotes.get(k).partes.push(p); }
  for (const [hm, l] of lotes) out.push({ t: en(hm), clase: 3, lote: l, tag: 'lote-' + hm.replace(':', ''), vivo: () => true });
  return out;
}
const fechaHM = (ms, tz) => { const p = partes(ms, tz); return `${p.hour}:${p.minute}`; };
// Un lote con una sola cosa usa su propio texto; con varias, «Para tu ventana de las…» y las partes cortas.
function armarLote(c, at, sinVolver) {
  const P = c.lote.partes.map(p => p.parte(at)).filter(x => x && !(sinVolver && x.soloVolver));
  if (!P.length) return null;
  if (P.length === 1) return { tag: P[0].tag, title: P[0].title, body: P[0].body, url: './?v=enfoque', apagar: APAGAR, soloVolver: !!P[0].soloVolver };
  const v = c.lote.ventana;
  return { tag: c.tag, title: v ? `Para tu ventana ${delas(v)}` : 'Lo que sigue pendiente hoy', body: mayus(P.map(x => x.corto).join(' · ')) + '.', url: './?v=enfoque', apagar: 'Ajustar avisos', soloVolver: P.every(x => x.soloVolver) };
}

// ---------- Silencio (F16 y F25): durante el enfoque, los eventos de la agenda y los bloques protegidos no llega nada.
function silencios(C, fecha) {
  const E = C.st.enfoque || {}, S = [];
  for (const x of Array.isArray(E.enfoqueLog) ? E.enfoqueLog : []) if (+x?.b > +x?.a) S.push({ a: +x.a, b: +x.b });
  const eh = +E.enfoqueHasta || 0;
  // Sesión en curso sin su tramo (llegó solo enfoqueHasta): calla desde esta pasada, sin tocar lo que ya salió.
  if (eh > C.ahora && !S.some(x => x.a <= C.ahora && x.b >= eh - 1000)) S.push({ a: C.desde + 1, b: eh });
  for (const it of agendaDe(E, fecha).items) {
    if (!hmOk(it.h) || !(+it.min > 0) || !(it.tipo === 'evento' || it.tipo === 'plan' || it.foco)) continue;
    const a = aMs(fecha, it.h, C.tz);
    // En un bloque protegido solo puede sonar su propio aviso, al empezar.
    S.push({ a, b: a + Math.min(720, +it.min) * 60000, propio: it.foco ? 'ag-' + it.id : '', ag: true, org: +it.org > 1e11 ? +it.org : 0 });
  }
  return S;
}

// ---------- El día de avisos (F16): tope diario sin guardar estado (se recalcula el día entero en cada pasada),
// primero lo que tiene tu hora, después el resumen y luego lo demás; lo que solo trae de vuelta a la app va al final
// y sale como mucho uno al día. Para dar un hueco a algo de menos rango se guardan los que vienen detrás con más rango.
const topeDe = prefs => [2, 3, 4, 5, 6, 7, 8].includes(+prefs.max) ? +prefs.max : 4;
function planDia(C, fecha) {
  const S = silencios(C, fecha), fin = aMs(masDias(fecha, 1), '00:00', C.tz), L = [];
  for (const c of candidatos(C, fecha)) {
    let t = c.t, n = 0, s;
    // Un evento o bloque de la agenda que apareció después (o sin hora de alta) no cambia lo que ya salió en pasadas anteriores.
    while (n++ < 12 && (s = S.find(x => x.a <= t && t < x.b && x.propio !== c.tag && (!x.ag || c.t > C.desde || (x.org && x.org <= c.t))))) t = s.b;
    // Lo que espera al silencio sale al terminar; lo que tiene hora, solo si aún llega a tiempo.
    if (t >= fin || (t !== c.t && (c.hasta ? t > c.hasta : c.limite ? t - c.t > c.limite * 60000 : false))) continue;
    L.push({ ...c, t });
  }
  L.sort((a, b) => a.t - b.t || a.clase - b.clase);
  const max = topeDe(C.prefs), env = [];
  let volver = false;
  for (let i = 0; i < L.length; i++) {
    const c = L[i], at = c.t;
    const a = c.lote ? armarLote(c, at, volver) : c.vivo(at) ? c : null;
    if (!a || (a.soloVolver && volver)) continue;
    const clase = a.soloVolver ? 4 : c.clase;
    const reservados = clase === 1 ? 0 : L.slice(i + 1).filter(d => d.t > at && (d.lote ? clase === 4 && !!armarLote(d, at, true)
      : (d.soloVolver ? 4 : d.clase) < clase && d.vivo(at))).length;
    if (env.length + 1 + reservados > max) continue;
    env.push({ t: at, tag: a.tag, title: a.title, body: a.body, url: a.url, ...(a.apagar ? { apagar: a.apagar } : {}) });
    if (a.soloVolver) volver = true;
  }
  return env.map((a, i) => ({ ...a, body: `${a.body}\n(aviso ${i + 1} de ${max} de hoy)` }));
}
function avisos(st, tz, prefs, desde, hasta) {
  const C = { st, tz, prefs: prefs || {}, desde, ahora: hasta }, out = [];
  for (const fecha of [...new Set([fechaEn(desde, tz), fechaEn(hasta, tz)])])
    for (const a of planDia(C, fecha)) if (a.t > desde && a.t <= hasta) { const { t, ...x } = a; out.push(x); }
  return out;
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
  // Un estado raro de una cuenta no frena los avisos de las demás.
  let lista = [];
  try { lista = datos[s.user_id] ? avisos(datos[s.user_id], s.tz || 'UTC', s.prefs || {}, desde, ahora) : []; } catch (e) { console.error('Error al calcular los avisos:', e.message); }
  const filtro = `push_subs?endpoint=eq.${encodeURIComponent(s.endpoint)}`;
  let viva = true;
  for (const a of lista) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(a), { TTL: 3600 }); enviados++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) { await rest(filtro, { method: 'DELETE' }); viva = false; break; } console.error('Error al enviar:', e.statusCode || e.message); }
  }
  if (viva) await rest(filtro, { method: 'PATCH', body: JSON.stringify({ ultimo: new Date(ahora).toISOString() }) });
}
console.log(`${subs.length} suscripciones, ${enviados} avisos enviados.`);
