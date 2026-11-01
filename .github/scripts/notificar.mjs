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
  const r = await fetch(`${SUPA}/rest/v1/${path}`, { ...opt, headers: { ...H, ...(opt.headers || {}) }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${path.split('?')[0]} ${r.status} ${await r.text()}`);
  return r.status === 204 || r.headers.get('content-length') === '0' ? null : r.json().catch(() => null);
}

// ---------- Fechas en la zona horaria de cada teléfono
// Un formateador por zona (crear uno por llamada costaba ~70 µs y se hacían miles por cuenta).
const FMT = new Map();
const fmtDe = tz => { let f = FMT.get(tz); if (!f) { f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); FMT.set(tz, f); } return f; };
const partes = (ms, tz) => Object.fromEntries(fmtDe(tz).formatToParts(new Date(ms)).map(p => [p.type, p.value]));
const fechaEn = (ms, tz) => { const p = partes(ms, tz); return `${p.year}-${p.month}-${p.day}`; };
// Instante (ms) de una fecha y hora locales en tz.
const AMS = new Map();
function aMs(fecha, hm, tz) {
  const k = fecha + ' ' + hm + ' ' + tz; let v = AMS.get(k);
  if (v === undefined) { if (AMS.size > 50000) AMS.clear(); v = aMs0(fecha, hm, tz); AMS.set(k, v); }
  return v;
}
function aMs0(fecha, hm, tz) {
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
const HORAS = new WeakMap(), MAX_HORAS = 24, MAX_HAB = 150;
const horasDe = h => { let v = HORAS.get(h); if (!v) { v = [...new Set((Array.isArray(h.horas) ? h.horas : []).filter(hmOk))].sort().slice(0, MAX_HORAS); HORAS.set(h, v); } return v; };
const habitosDe = st => (Array.isArray(st.habits) ? st.habits : []).filter(h => h && typeof h === 'object' && typeof h.id === 'string').slice(0, MAX_HAB);
const acota = (x, n) => Array.isArray(x) ? x.filter(y => y && typeof y === 'object').slice(0, n) : [];
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
const FASE = new WeakMap();
const faseDe = (st, h, fecha) => { let m = FASE.get(h); if (!m) FASE.set(h, m = new Map()); if (!m.has(fecha)) m.set(fecha, faseAviso(st, h, fecha)); return m.get(fecha); };
// ¿Tocaba el aviso de esa hora ese día? (sin contar el tope ni el silencio)
const tocaAviso = (st, h, hm, fecha) => !h.rutina && (!h.creado || h.creado <= fecha) && programado(h, fecha) && horasDe(h).includes(hm) && !protegido(h, fecha)
  && !(h.retomar?.d === fecha && h.retomar.hora === hm) && faseDe(st, h, fecha);
// La franja de un aviso abierto: la última hora del hábito que ya había pasado al abrirlo.
const franjaDe = (h, fecha, t, tz) => { const hs = horasDe(h); let f = hs[0]; for (const hm of hs) if (aMs(fecha, hm, tz) <= t + 5 * 60000) f = hm; return f; };
// Un aviso ignorado 3 días seguidos en la misma franja se pausa (F16): salió de verdad ese día (dentro del tope, fuera de
// los silencios y con su tipo encendido), no lo abriste y no marcaste el hábito en 30 min. Un día hecho a una hora que no
// consta cuenta como útil; tras «Mover», «Dejarlo» o volver a encenderlo (h.avisoReinicio) se cuenta de nuevo.
// Solo cuentan los días desde que la app anota los avisos que abres (enfoque.avisosDesde).
function pausado(C, h, hm, fecha) {
  if (C.sim) return false;
  const { st, tz } = C, desdeAv = st.enfoque?.avisosDesde, tag = 'h-' + h.id;
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
    if (abiertosDe(C, tag, e).some(t => franjaDe(h, e, t, tz) === hm)) return false;
    if (!salio(C, e, tag + '@' + hm)) continue;
    if (++n >= 3) return true;
  }
  return false;
}
// Lo mismo para los avisos diarios de hora fija que no son de un hábito: el resumen, «Tu día aún no tiene hora» y el lote de
// cada ventana. No se pausan la hora de soltar el teléfono (lo útil es no tocarlo) ni los semanales (lunes y viernes).
// Tras «Dejarlo», «Mover» o volver a encender su tipo, la app anota enfoque.avisosReinicio[franja o tipo] = hoy.
// Solo desde enfoque.avisosFijasDesde: el primer día completo en que el teléfono anotó lo que le llega, para que Enfoque pueda
// decirlo («lleva 3 días sin servir») con su salida. Una app que aún no lo anota nunca ve pausas de estos tipos.
function pausaFija(C, fecha, franja, tags, tipos, util) {
  if (C.sim) return false;
  const E = C.st.enfoque || {}, desdeAv = E.avisosDesde, desdeF = E.avisosFijasDesde, R = E.avisosReinicio && typeof E.avisosReinicio === 'object' ? E.avisosReinicio : {};
  if (!/^\d{4}-\d\d-\d\d$/.test(desdeAv || '') || !/^\d{4}-\d\d-\d\d$/.test(desdeF || '')) return false;
  const reinicio = [R[franja], ...tipos.map(k => R[k])].filter(x => /^\d{4}-\d\d-\d\d$/.test(x || '')).sort().pop() || '';
  let n = 0;
  for (let i = 1, e = masDias(fecha, -1); i <= 21; i++, e = masDias(e, -1)) {
    if (e < desdeAv || e < desdeF || e < reinicio) break;
    if (tags.some(t => abiertosDe(C, t, e).length) || util?.(e)) return false;
    if (!salio(C, e, franja)) continue;
    if (++n >= 3) return true;
  }
  return false;
}
// Los avisos abiertos (enfoque.avisosAbiertos), por tipo y día: una sola pasada por cuenta.
function abiertosDe(C, tag, e) {
  if (!C.ab) { C.ab = new Map(); for (const x of acota(C.st.enfoque?.avisosAbiertos, 200).slice(-60)) if (typeof x.tag === 'string') { const k = x.tag + '|' + x.d; if (!C.ab.has(k)) C.ab.set(k, []); C.ab.get(k).push(+x.t || 0); } }
  return C.ab.get(tag + '|' + e) || [];
}
// ¿Salió de verdad ese aviso el día e? Se recalcula ese día tal como se envió (sin pausas, con su agenda o la que guardó su
// historial) y solo cuenta si salió con seguridad: lo marcado a una hora que no consta ocupa su sitio del tope, pero no se da
// por enviado. Un día por cuenta y pasada.
function salio(C, e, franja) { return simDia(C, e).some(a => a.franja === franja && a.seguro); }
function simDia(C, e) {
  const M = C.memo || (C.memo = new Map());
  if (!M.has(e)) { const fin = aMs(masDias(e, 1), '00:00', C.tz); M.set(e, planDia({ ...C, desde: fin, ahora: fin, sim: true }, e)); }
  return M.get(e);
}
// Que el estado de una cuenta (lo escribe cada teléfono) no pueda comerse el tiempo de las demás.
const PRESUPUESTO = 8000;
function presupuesto(C) { if (performance.now() - C.t0 > PRESUPUESTO) { const e = new Error('el estado de esta cuenta pide demasiado trabajo'); e.presupuesto = true; throw e; } }

// ---------- La agenda de un día. Cada cosa trae la hora en que entró (it.alta, la pone la app; sin ella, la hora en que se
// organizó), para no contar lo que aún no existía; lo que se movió o se quitó después de su aviso queda en A.antes con la hora
// en que dejó de valer (hasta), para que lo ya enviado siga contando. Un día pasado sin su agenda usa la de su historial.
const altaDe = (it, org) => +it?.alta > 1e11 ? +it.alta : +it?.alta > 0 ? 1 : +org || 0;
const agendaDe = (C, fecha) => {
  const E = C.st.enfoque || {}, A = E.agendaHoy?.fecha === fecha ? E.agendaHoy : null, P = E.agendaPlan?.fecha === fecha ? E.agendaPlan : null;
  const deA = acota(A?.items, 80).map(it => ({ ...it, enFuente: true, org: altaDe(it, A.organizado) }));
  const fant = acota(A?.antes, 30).filter(x => hmOk(x.h) && +x.hasta > 0).map(x => ({ ...x, id: x.id || x.ref, enFuente: true, org: altaDe(x, A.organizado), fantasma: +x.hasta }));
  const orgAt = [A?.primero, A?.organizado, P?.organizado].map(x => +x || 0).filter(Boolean).map(x => x < 1e11 ? 1 : x);
  const base = { organizadoEn: orgAt.length ? Math.min(...orgAt) : 0 };
  if (!A && !P && C.sim) {
    const H = acota(E.agendaHist?.[fecha], 80);
    return { ...base, items: H.map((it, i) => ({ ...it, id: 'h' + i, enFuente: false, hist: true, org: 1 })), organizado: (E.dias?.[fecha]?.agenda || 0) > 0 };
  }
  if (!P || A?.organizado) return { ...base, items: [...deA, ...fant], organizado: !!A?.organizado };
  const clave = it => it.tipo + ':' + (it.tipo === 'libre' ? it.id : it.ref), ya = new Set(acota(P.items, 80).map(clave));
  return { ...base, items: [...acota(P.items, 80).map(it => ({ ...it, enFuente: !['ini', 'prio'].includes(it.tipo), org: altaDe(it, P.organizado) })), ...deA.filter(it => !ya.has(clave(it))), ...fant], organizado: true };
};
// Prioridades de un día: las del teléfono si son de ese día; si no, la rana que se eligió la víspera.
const prioDe = (E, fecha) => E.prioridades?.fecha === fecha ? acota(E.prioridades.items, 20) : E.agendaPlan?.fecha === fecha && E.agendaPlan.rana?.t ? [{ id: E.agendaPlan.rana.id, t: E.agendaPlan.rana.t, hecho: false }] : null;
// La fuente de cada cosa de la agenda: si se borró o se vació, no se avisa (ni sale en el resumen ni como «reservado»);
// el texto y la hora salen de ahí (si la editaste, el aviso la sigue). Una tarea borrada hoy después de su aviso sigue
// contando hasta la hora en que se borró (borradosEn, lo anota la app).
function fuentesAg(C, fecha) {
  const st = C.st, E = st.enfoque || {}, I4 = E.iniciativas4?.dia === fecha ? acota(E.iniciativas4.items, 12) : [], PR = E.prioridades?.fecha === fecha ? acota(E.prioridades.items, 20) : [];
  const T = acota(st.tareas?.items, 2000), H = habitosDe(st), BE = st.borradosEn && typeof st.borradosEn === 'object' ? st.borradosEn : {};
  const fuente = it => !it.enFuente ? null : it.tipo === 'habito' ? H.find(h => h.id === it.ref) : it.tipo === 'tarea' ? T.find(x => x.id === it.ref)
    : it.tipo === 'ini' ? I4.find(x => x.k === it.ref && x.t) : it.tipo === 'prio' ? PR.find(x => x.id === it.ref) : it;
  const borradoEn = it => +BE[it.ref] || 0;
  // ¿Existía su fuente a la hora at? Sin at, ahora.
  const vivoF = (it, at) => it.tipo !== 'estudio' && (!it.enFuente || !!fuente(it) || (at !== undefined && at <= C.desde && borradoEn(it) > at));   // 2.14 · estudio: avisa la ruta, no el ítem
  const texto = it => { const f = fuente(it); return (it.tipo === 'tarea' ? f?.titulo : it.tipo === 'habito' ? f?.nombre : ['ini', 'prio'].includes(it.tipo) ? f?.t : '') || it.t; };
  const horaDe = it => { if (it.fantasma) return it.h; const f = fuente(it); return it.tipo === 'ini' && f ? f.hora || '' : it.tipo === 'tarea' && f?.hora ? f.hora : it.h; };
  return { fuente, vivoF, texto, horaDe, borradoEn };
}

// 2.14 · Estudio (E.estudio.rutas): los bloques de un día y los exámenes que vienen, leídos a la defensiva (una ruta mal formada no
// para a las demás; nada de XP). El texto del bloque es el de la app: «{materia} · {tema}», «Repaso: …», «Ejercicios: …», «Simulacro», «Repaso ligero».
const ESTUDIO = new WeakMap();
function estTexto(b, materia, temas) {
  const tema = typeof b.tema === 'string' && b.tema ? temas.find(t => t.id === b.tema) : null, tt = sinPunto(tema ? tema.t : String(b.t || '').replace(/^(Ejercicios|Repaso): /, ''));
  const cuerpo = b.tipo === 'ligero' ? 'Repaso ligero' : b.tipo === 'simulacro' ? 'Simulacro' : b.tipo === 'repaso' ? `Repaso: ${tt}` : b.tipo === 'practica' ? `Ejercicios: ${tt}` : tt;
  return [materia, cuerpo].filter(Boolean).join(' · ');
}
function estudioDe(st, fecha) {
  let M = ESTUDIO.get(st); if (!M) ESTUDIO.set(st, M = new Map());
  if (M.has(fecha)) return M.get(fecha);
  const out = { bloques: [], examenes: [] }, E = st.enfoque || {}, D = E.estudio && typeof E.estudio === 'object' ? E.estudio : {}, mats = acota(D.materias, 20);
  for (const r of acota(D.rutas, 40)) {
    try {
      if (r.archivada || !/^\d{4}-\d\d-\d\d$/.test(r.fecha || '') || typeof r.id !== 'string') continue;
      const materia = sinPunto((mats.find(m => m.id === r.materia) || {}).nombre), temas = acota(r.temas, 30), hechos = r.hechos && typeof r.hechos === 'object' && !Array.isArray(r.hechos) ? r.hechos : {};
      if (r.fecha >= fecha && (materia || sinPunto(r.nombre))) out.examenes.push({ ruta: r.id, nombre: sinPunto(r.nombre), materia, fecha: r.fecha, hora: hmOk(r.hora) ? r.hora : '', dias: dias(fecha, r.fecha) });
      for (const b of acota(r.plan, 600)) {
        if (b.d !== fecha || typeof b.id !== 'string') continue;
        const h = hechos[b.id] && typeof hechos[b.id] === 'object' ? hechos[b.id] : null, min = Math.max(0, Math.round(+b.min || 0)), texto = estTexto(b, materia, temas);
        if (!(min > 0) || !texto) continue;   // un bloque sin minutos o sin texto no es un bloque
        out.bloques.push({ id: b.id, h: hmOk(b.h) ? b.h : '', min, ej: Math.max(0, Math.round(+b.ej || 0)), texto, materia, examen: r.fecha, hecho: !!hechos[b.id], hechoEn: h ? ts(h.en) : 0 });
      }
    } catch {}
  }
  out.bloques.sort((a, b) => (a.h || '99') < (b.h || '99') ? -1 : 1); out.examenes.sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  M.set(fecha, out); return out;
}
// 2.13 · Identidad: una sola línea dentro del resumen si alguna identidad (E.identidades, con iden en hábitos, iniciativas y agenda)
// lleva 3 o más días sin votos: «Sin votos desde el {día}: una persona que {t}. ¿Dos minutos hoy?». Sin XP, sin imperativos,
// sin aviso aparte. Los votos se calculan con el criterio simplificado: hábitos (log full/min), iniciativas del día y el historial de la agenda.
const DIAS_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'], MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaOk = k => /^\d{4}-\d\d-\d\d$/.test(k || '');
function jdLinea(C, fecha) {
  const st = C.st, E = st.enfoque || {};
  const L = acota(E.identidades, 12).filter(i => !i.archivada && typeof i.id === 'string' && typeof i.t === 'string' && i.t.trim()).slice(0, 6);
  if (!L.length) return '';
  const H = habitosDe(st).filter(h => typeof h.iden === 'string' && h.iden), hecho = m => m === 'full' || m === 'min';
  const I4 = E.iniciativas4 && typeof E.iniciativas4 === 'object' ? E.iniciativas4 : null, AH = E.agendaHist && typeof E.agendaHist === 'object' && !Array.isArray(E.agendaHist) ? E.agendaHist : {};
  const ultimo = i => {
    let best = '';
    for (const h of H) { if (h.iden !== i.id) continue; const log = st.log?.[h.id]; if (!log || typeof log !== 'object') continue;
      for (const k of Object.keys(log)) if (k < fecha && k > best && fechaOk(k) && hecho(log[k])) best = k; }
    if (I4 && fechaOk(I4.dia) && I4.dia < fecha && I4.dia > best && acota(I4.items, 12).some(x => x.hecho && x.iden === i.id)) best = I4.dia;
    for (const k of Object.keys(AH).slice(-60)) if (k < fecha && k > best && fechaOk(k) && acota(AH[k], 80).some(it => it.hecho && it.iden === i.id)) best = k;
    return best;
  };
  const cand = L.map(i => { const u = ultimo(i), desde = u || (fechaOk(i.creado) ? i.creado : ''); return { i, desde, d: desde && desde <= fecha ? dias(desde, fecha) : 0 }; })
    .filter(x => x.desde && x.d >= 3).sort((a, b) => b.d - a.d)[0];
  if (!cand) return '';
  const f = cand.desde, dia = cand.d <= 6 ? `el ${DIAS_ES[wd(f)]}` : `el ${+f.slice(8, 10)} de ${MESES_ES[+f.slice(5, 7) - 1] || ''}`.trim();
  return `Sin votos desde ${dia}: una persona que ${cand.i.t.trim()}. ¿Dos minutos hoy?`;
}
// Resumen de la mañana: informa, sin XP ni imperativos. Lo borrado no sale y lo editado sale con su texto y su hora actuales.
function resumen(C, fecha) {
  const st = C.st, E = st.enfoque || {}, L = [];
  const P = prioDe(E, fecha) || [];
  L.push(P.length ? `Prioridades: ${P.map((x, i) => `${i + 1}. ${x.t}`).join(' · ')}` : 'Aún sin prioridades: tres como máximo, la más difícil primero.');
  const FA = fuentesAg(C, fecha), ag = agendaDe(C, fecha).items.filter(it => !it.fantasma && !it.hist && FA.vivoF(it)).map(it => ({ t: FA.texto(it), h: FA.horaDe(it) })).filter(e => e.t).sort((a, b) => (a.h || '99') < (b.h || '99') ? -1 : 1);
  if (ag.length) L.push(`Agenda: ${ag.slice(0, 4).map(e => `${hmOk(e.h) ? hora12(e.h) + ' ' : ''}${e.t}`).join(' · ')}${ag.length > 4 ? '…' : ''}`);
  // 2.14 · Estudio: hasta dos bloques de hoy que siguen pendientes y el examen que viene en la semana («mañana» si es mañana).
  const ES = estudioDe(st, fecha);
  for (const b of ES.bloques.filter(b => !b.hecho).slice(0, 2)) L.push(`Estudio: ${b.h ? hora12(b.h) + ' ' : ''}${b.texto} · ${b.min} min${b.ej ? ` · ${b.ej} ${b.ej === 1 ? 'ejercicio' : 'ejercicios'}` : ''}`);
  for (const x of ES.examenes.filter(x => x.dias <= 7).slice(0, 2)) L.push(`Examen de ${x.materia || x.nombre || 'estudio'}: ${x.dias === 0 ? 'hoy' : x.dias === 1 ? 'mañana' : `en ${x.dias} días`}${x.hora ? ' ' + alas(x.hora) : ''}`);
  const pl = acota(E.planes, 60).filter(p => !p.hecho && p.fecha === fecha);
  if (pl.length) L.push(`Planes: ${pl.map(p => `${p.titulo}${p.con ? ' con ' + p.con : ''} ${hora12(p.hora)}`).join(' · ')}`);
  const hab = habitosDe(st).filter(h => !h.rutina && !h.graduado && (!h.creado || h.creado <= fecha) && programado(h, fecha) && !protegido(h, fecha));
  if (hab.length) L.push(`Hábitos: ${hab.slice(0, 4).map(h => h.nombre).join(', ')}${hab.length > 4 ? '…' : ''}`);
  const tareas = acota(st.tareas?.items, 2000).filter(x => !x.hecha && x.fecha && x.fecha <= fecha);
  if (tareas.length) L.push(`Tareas para hoy: ${tareas.length}${tareas.some(x => x.fecha < fecha) ? ' (hay vencidas)' : ''}`);
  const per = acota(E.personas, 300).find(p => !p.ultimo || dias(p.ultimo, fecha) >= (p.cada || 30));
  if (per) L.push(`Hace tiempo que no hablas con ${per.nombre}.`);
  const idn = jdLinea(C, fecha); if (idn) L.push(idn);
  return { tag: 'resumen', title: `Buenos días${st.nombre ? ', ' + st.nombre : ''}`, body: L.join('\n'), url: './?v=enfoque' };
}

// ---------- Todo lo que podría avisarse un día, cada cosa con su hora y su tipo:
// clase 1 = a la hora que tú pusiste (hábitos, planes, pasos, agenda, plan para volver, hora de dormir), 2 = resumen, 3 = lo demás.
// vivo(at) dice si seguía pendiente a esa hora. Para lo de pasadas anteriores usa la hora que la app anota de cada cambio:
// cuándo se marcó el día (h.marcaEn) o se hizo (h.hechoEn, x.hechoEn), cuándo se apagó o encendió un tipo (prefs.apagadoEn,
// prefs.encendidoEn), cuándo se quitó o volvió el aviso de un hábito (h.sinAvisoEn, h.conAvisoEn), cuándo entró algo a la
// agenda (it.alta) y cuándo se borró una tarea (borradosEn). Así lo que ya salió sigue contando en el tope y en el pie.
// duda(at): en la simulación de un día pasado, no consta si seguía pendiente (salió o no: no se da por seguro).
const APAGAR = 'Apagar este tipo';
function candidatos(C, fecha) {
  presupuesto(C);
  const { st, tz, prefs, desde, sim } = C, E = st.enfoque || {}, w = wd(fecha), out = [], H = habitosDe(st);
  const actual = at => at > desde, pasado = at => !actual(at);
  const sinMarca = (hecho, at) => !hecho || pasado(at);
  const inicio = aMs(fecha, '00:00', tz), delDia = t => +t > 0 && fechaEn(+t, tz) === fecha;
  const habito = id => H.find(h => h.id === id);
  const hechoAntes = (x, at) => !!x?.hecho && +x.hechoEn > 0 && +x.hechoEn <= at, sinHora = x => !!x?.hecho && !(+x.hechoEn > 0);
  // ¿Estaba encendido el tipo k a la hora at? Apagado ahora: solo lo de antes de apagarlo. Encendido: salvo el rato apagado.
  const PA = prefs.apagadoEn && typeof prefs.apagadoEn === 'object' ? prefs.apagadoEn : {}, PE = prefs.encendidoEn && typeof prefs.encendidoEn === 'object' ? prefs.encendidoEn : {};
  const tipoOn = (k, at) => { const ap = +PA[k] || 0, en = +PE[k] || 0; return prefs[k] === false ? pasado(at) && ap > at : actual(at) || !(en > at && ap > 0 && ap <= at); };
  const hayTipo = k => prefs[k] !== false || (+PA[k] || 0) > inicio;
  // El día de un hábito dejó de estar pendiente cuando se marcó (h.marcaEn, la primera marca del día) o se hizo (h.hechoEn).
  const marcaDe = h => { const t = ts(h.marcaEn); return delDia(t) ? t : 0; };
  const pendienteHabito = (h, at) => {
    const m = st.log?.[h.id]?.[fecha]; if (!m) return true;
    if (actual(at)) return false;
    const mt = marcaDe(h); if (mt) return mt > at;
    const he = ts(h.hechoEn);
    if (['full', 'min'].includes(m) && delDia(he)) return he > at;
    return !!sim;
  };
  const dudaHabito = h => { const m = st.log?.[h.id]?.[fecha]; return !!m && !marcaDe(h) && !(['full', 'min'].includes(m) && delDia(ts(h.hechoEn))); };
  // Aviso del hábito quitado (sinAviso o graduado): lo de antes de quitarlo cuenta. Vuelto a poner hoy: lo de antes no salió.
  const avisoOn = (h, at) => { if (h.sinAviso || h.graduado) return pasado(at) && ts(h.sinAvisoEn) > at; const v = ts(h.conAvisoEn); return actual(at) || !(delDia(v) && v > at); };
  // Un hábito creado hoy: lo de antes de crearlo no salió (h.altaEn).
  const existia = (h, at) => !(delDia(ts(h.altaEn)) && ts(h.altaEn) > at);
  const en = hm => aMs(fecha, hm, tz);
  if (hayTipo('manana')) {
    const hm = hmOk(prefs.hora) ? prefs.hora : '07:30';
    if (!pausaFija(C, fecha, 'resumen@' + hm, ['resumen'], ['manana']))
      out.push({ ...resumen(C, fecha), t: en(hm), clase: 2, franja: 'resumen@' + hm, apagar: APAGAR, vivo: at => tipoOn('manana', at) });
  }
  if (hayTipo('habitos')) {
    // Plan para volver (F1): lo pediste tú, así que llega aunque el aviso normal esté quitado; se apaga con «Hora de cada hábito».
    for (const h of H) {
      const rt = h.retomar;
      if (h.rutina || rt?.d !== fecha || !hmOk(rt.hora) || protegido(h, fecha) || ['full', 'min'].includes(st.log?.[h.id]?.[rt.de])) continue;
      out.push({ t: en(rt.hora), clase: 1, tag: 'rt-' + h.id, franja: 'rt-' + h.id, title: `${h.nombre} · tu plan de hoy`, body: cuerpoPlan(h, rt), url: './?v=hoy', apagar: APAGAR, limite: 60,
        vivo: at => tipoOn('habitos', at) && pendienteHabito(h, at), duda: () => dudaHabito(h) });
    }
    // Hábito a su hora, con sus fases (F21) y su pausa si no sirvió (F16). Nunca si confías en la señal o ya se graduó.
    // Una hora que se cambió hoy después de su aviso (h.horasAntes) sigue contando hasta el cambio.
    for (const h of H) {
      if (h.rutina || (h.creado && h.creado > fecha) || !programado(h, fecha) || protegido(h, fecha) || !faseDe(st, h, fecha)) continue;
      if ((h.sinAviso || h.graduado) && !(ts(h.sinAvisoEn) > inicio)) continue;
      presupuesto(C);
      const antes = acota(h.horasAntes, 12).filter(x => x.d === fecha && hmOk(x.hm) && +x.hasta > 0 && !horasDe(h).includes(x.hm)).slice(0, 6);
      for (const [hm, hasta] of [...horasDe(h).map(x => [x, 0]), ...antes.map(x => [x.hm, +x.hasta])]) {
        if ((h.retomar?.d === fecha && h.retomar.hora === hm) || pausado(C, h, hm, fecha)) continue;
        out.push({ t: en(hm), clase: 1, tag: 'h-' + h.id, franja: 'h-' + h.id + '@' + hm, title: `${h.nombre} · tu espacio ${delas(hm)}`, body: cuerpoHabito(h), url: './?v=hoy', apagar: 'No avisar este hábito', limite: 60,
          vivo: at => (!hasta || (pasado(at) && at < hasta)) && tipoOn('habitos', at) && avisoOn(h, at) && existia(h, at) && pendienteHabito(h, at), duda: () => dudaHabito(h) });
      }
    }
    // Un hábito borrado hoy después de su aviso (enfoque.horasBorradas, lo anota la app): lo ya enviado sigue contando hasta
    // que se borró. Nunca vuelve a salir.
    for (const x of acota(E.horasBorradas, 24)) if (x.d === fecha && hmOk(x.hm) && +x.hasta > 0 && typeof x.id === 'string' && !habito(x.id))
      out.push({ t: en(x.hm), clase: 1, tag: 'h-' + x.id, franja: 'h-' + x.id + '@' + x.hm, title: '', body: '', url: './?v=hoy', limite: 60, vivo: at => pasado(at) && at < +x.hasta && tipoOn('habitos', at), duda: () => true });
  }
  if (hayTipo('agenda')) {
    // Agenda del día: 10 minutos antes de cada cosa con hora que siga pendiente. Planes y eventos tienen su propio aviso,
    // y un hábito agendado a su hora de siempre lo gobierna su propio aviso (sus fases y su pausa): no se duplica.
    const A = agendaDe(C, fecha), { fuente, vivoF, texto, horaDe, borradoEn } = fuentesAg(C, fecha);
    const pendienteAg = (it, at) => { const f = fuente(it);
      if (it.hist) return true;
      if (it.tipo === 'habito') { const h = habito(it.ref); return h ? pendienteHabito(h, at) : sinMarca(['full', 'min'].includes(st.log?.[it.ref]?.[fecha]), at); }
      if (it.tipo === 'tarea') return !f?.hecha || (pasado(at) && !(+f.hechaEn > 0 && +f.hechaEn <= at));
      if (['ini', 'prio'].includes(it.tipo)) return !f?.hecho || (pasado(at) && !hechoAntes(f, at));
      return sinMarca(!!it.hecho, at); };
    const dudaAg = it => it.hist ? !!it.hecho : it.tipo === 'habito' ? !!habito(it.ref) && dudaHabito(habito(it.ref)) : false;
    const gobiernaHabito = (it, h) => { if (it.tipo !== 'habito' || prefs.habitos === false) return false; const x = habito(it.ref);
      return !!x && !x.rutina && !(x.creado && x.creado > fecha) && programado(x, fecha) && horasDe(x).includes(h); };
    for (const it of A.items) {
      const h = horaDe(it), hb = it.tipo === 'habito' && !it.hist ? fuente(it) : null, borrada = it.enFuente && !fuente(it);
      if (!hmOk(h) || ['evento', 'plan'].includes(it.tipo) || (borrada && !(borradoEn(it) > inicio)) || (hb && (hb.sinAviso || hb.graduado || protegido(hb, fecha))) || gobiernaHabito(it, h) || !menos(h, 10)) continue;
      const org = +it.org || 0, min = +it.min || 0, fant = +it.fantasma || 0;
      // Un bloque protegido (F25) recuerda, además, que la app calla mientras dura.
      out.push({ t: en(menos(h, 10)), clase: 1, tag: 'ag-' + it.id, franja: 'ag-' + it.id, title: `${texto(it)}${min ? ` · ${min} min` : ''}`, body: `Si ${sonlas(h)}, entonces empiezo: No molestar y el teléfono lejos.${it.foco ? ' Los avisos de la app callan en este bloque.' : ''}`,
        url: './?v=agenda', apagar: APAGAR, hasta: en(h), vivo: at => (!fant || (pasado(at) && at < fant)) && tipoOn('agenda', at) && (actual(at) || !org || org < 1e11 || org <= at) && vivoF(it, at) && pendienteAg(it, at),
        duda: () => dudaAg(it) });
    }
    // 2.14 · Estudio: un aviso de clase 1 por bloque de hoy con hora; la fuente es la ruta (su ítem de la agenda no avisa aparte). Tu razón y
    // una elección, sin imperativos ni XP; vivo mientras el bloque no esté hecho; la misma pausa de 3 días que los avisos fijos (abrir el
    // aviso o hacer un bloque ese día cuenta como útil). Con la app cerrada sigue igual: el plan vive en los datos.
    for (const b of estudioDe(st, fecha).bloques.slice(0, 12)) {
      if (!b.h || pausaFija(C, fecha, 'est@' + b.h, ['est-' + b.id], ['agenda'], e => estudioDe(st, e).bloques.some(x => x.hecho || abiertosDe(C, 'est-' + x.id, e).length))) continue;
      out.push({ t: en(b.h), clase: 1, tag: 'est-' + b.id, franja: 'est@' + b.h, title: `${hora12(b.h)} · Estudio · ${b.texto}`, body: `Para llegar al examen de ${b.materia || 'estudio'} con el tema visto. ¿Empiezas, lo mueves o lo dejas para mañana?`,
        url: './?v=estudio', apagar: APAGAR, limite: 60, vivo: at => tipoOn('agenda', at) && (!b.hecho || (pasado(at) && !(b.hechoEn > 0 && b.hechoEn <= at))), duda: () => b.hecho && !(b.hechoEn > 0) });
    }
    // A las 9:30, si el día no tiene hora (solo trae de vuelta a la app: cuenta como el único del día de ese tipo).
    if (!pausaFija(C, fecha, 'agenda@09:30', ['agenda'], ['agenda'], e => (E.dias?.[e]?.agenda || 0) > 0))
      out.push({ t: en('09:30'), clase: 3, soloVolver: true, tag: 'agenda', franja: 'agenda@09:30', title: 'Tu día aún no tiene hora', body: 'Dos minutos y lo importante queda con hora.', url: './?v=agenda', apagar: APAGAR,
        vivo: at => tipoOn('agenda', at) && (!A.organizado || (pasado(at) && !A.hist && A.organizadoEn > at)) });
  }
  // Plan con alguien: una hora antes. Si un silencio (o una pasada tardía) lo retrasa, el título dice la hora del plan en
  // lugar de «En 1 hora»; si el silencio acaba a menos de 20 minutos del plan (o la pasada llega a menos de 5), no sale.
  if (hayTipo('planes')) for (const p of acota(E.planes, 60)) if (p.fecha === fecha && hmOk(p.hora) && menos(p.hora, 60))
    out.push({ t: en(menos(p.hora, 60)), clase: 1, tag: 'p-' + p.id, franja: 'p-' + p.id, title: `En 1 hora: ${p.titulo}${p.con ? ' con ' + p.con : ''}`, tarde: `${mayus(alas(p.hora))}: ${p.titulo}${p.con ? ' con ' + p.con : ''}`,
      body: 'Para conectar de verdad: ¿llevas una pregunta pensada y el teléfono guardado?', url: './?v=enfoque', apagar: APAGAR, hasta: en(menos(p.hora, 20)), llega: en(menos(p.hora, 5)), vivo: at => tipoOn('planes', at) && sinMarca(p.hecho, at) });
  if (hayTipo('proyectos')) for (const pr of acota(E.proyectos, 60)) if (!pr.archivado && pr.paso && pr.cuando === fecha && hmOk(pr.hora))
    out.push({ t: en(pr.hora), clase: 1, tag: 'r-' + pr.id, franja: 'r-' + pr.id, title: `${pr.paso} · tu espacio ${delas(pr.hora)}`, body: `${pr.nombre}${pr.donde ? ' · ' + pr.donde : ''}. ¿Lo empiezas, la versión de 2 min${sinPunto(pr.minima) ? ` (${sinPunto(pr.minima)})` : ''} o lo mueves?`,
      url: './?v=enfoque', apagar: APAGAR, limite: 60, vivo: at => tipoOn('proyectos', at) });
  // Teléfono fuera del cuarto (F24): 30 min antes de tu hora de dormir.
  if (hayTipo('noche')) out.push({ t: en(deMin(aMin(hmOk(E.horaDormir) ? E.horaDormir : '23:00') - 30)), clase: 1, tag: 'dormir', franja: 'dormir', title: 'Hora de soltar el teléfono', body: 'Cárgalo fuera del cuarto. Mañana te pregunto cómo dormiste.',
    url: './?v=enfoque', apagar: APAGAR, limite: 60, vivo: at => tipoOn('noche', at) });
  // Lunes: si la revisión ya se hizo (el domingo, o hoy antes de esta hora), no sale.
  if (hayTipo('semana') && w === 0) out.push({ t: en('08:30'), clase: 3, soloVolver: true, tag: 'semana', franja: 'semana', title: 'Nuevo comienzo: revisión semanal', body: 'Diez minutos para ver lo logrado y poner día y hora a lo siguiente. ¿Ahora o en tu próxima ventana?',
    url: './?v=enfoque', apagar: APAGAR, vivo: at => tipoOn('semana', at) && (!(E.revision >= masDias(fecha, -1)) || (pasado(at) && E.revision === fecha && !(delDia(+E.revisionEn) && +E.revisionEn <= at))) });
  // Lo que no tiene hora propia sale junto, en un solo aviso, al empezar tu siguiente ventana de revisión (F16). Para una hora
  // ya pasada, cada parte solo cuenta si seguía pendiente entonces (si se hizo antes, ese aviso no salió).
  // En la simulación de un día pasado sin sus datos, cada parte se lee de sus contadores (dias) y, si no consta, queda en duda.
  const sueltos = [], D = E.dias && typeof E.dias === 'object' ? E.dias : {}, Dd = D[fecha] && typeof D[fecha] === 'object' ? D[fecha] : {};
  const I4 = E.iniciativas4?.dia === fecha ? acota(E.iniciativas4.items, 12) : null;
  if (hayTipo('mediodia')) {
    sueltos.push({ nominal: '12:00', tags: ['mediodia'], tipo: 'mediodia', parte: at => {
      if (!tipoOn('mediodia', at)) return null;
      const P0 = prioDe(E, fecha);
      if (!P0 && sim) { const hp = acota(E.agendaHist?.[fecha], 80).filter(x => x.tipo === 'prio' && sinPunto(x.t)), i = hp.findIndex(x => !x.hecho);
        if (i < 0) return { tag: 'mediodia', soloVolver: true, duda: true, corto: 'aún no tienes prioridades', title: 'Aún no tienes prioridades', body: '' };
        return { tag: 'mediodia', corto: `Tu prioridad ${i + 1} sigue libre`, title: `Tu prioridad ${i + 1} sigue libre`, body: '' }; }
      const P = (P0 || []).filter(x => x && sinPunto(x.t));
      if (!P.length) return { tag: 'mediodia', soloVolver: true, corto: 'aún no tienes prioridades', title: 'Aún no tienes prioridades', body: 'Tres como máximo, la más difícil primero. ¿Las eliges ahora o en tu próxima ventana?' };
      let i = P.findIndex(x => !x.hecho);
      if (i < 0) { if (actual(at) || P.every(x => hechoAntes(x, at))) return null; i = P.findIndex(x => !hechoAntes(x, at)); }
      const tarde = aMin(fechaHM(at, tz)) >= 15 * 60;
      return { tag: 'mediodia', duda: sim && P.some(sinHora), corto: `Tu prioridad ${i + 1} sigue libre`, title: `Tu prioridad ${i + 1} sigue libre`, body: `${sinPunto(P[i].t)}. ¿La empiezas 10 minutos ahora o ${tarde ? 'le pones hora' : 'la agendas a las 4:00 PM'}?` };
    } });
    sueltos.push({ nominal: '16:00', tags: ['ini4'], tipo: 'mediodia', parte: at => {
      if (!tipoOn('mediodia', at)) return null;
      const I = I4 || [], min = [1, 2, 3, 4].includes(+E.minIni) ? +E.minIni : 2;
      const hechas = actual(at) ? I.filter(x => x.hecho).length : I4 ? I.filter(x => hechoAntes(x, at)).length : sim ? Math.max(0, +Dd.ini4 || 0) : 0;
      if (hechas >= min && (actual(at) || I4)) return null;
      const falta = Math.max(1, min - (actual(at) ? hechas : 0)), pend = I.filter(x => x.t && !x.hecho).map(x => sinPunto(x.t)).slice(0, 2).join(' · ') || 'estudio, proyecto, laboral, social o espiritual';
      return { tag: 'ini4', duda: sim && (I4 ? I.some(sinHora) : hechas >= min), corto: falta === 1 ? 'falta una iniciativa' : `faltan ${falta} iniciativas`, title: `Iniciativas: ${min - falta} de ${min} hoy`, body: `${falta === 1 ? 'Falta una' : `Faltan ${falta}`}: ${pend}. ¿10 minutos ahora o le pones hora?` };
    } });
    sueltos.push({ nominal: '16:00', tags: ['social6'], tipo: 'mediodia', parte: at => {
      if (!tipoOn('mediodia', at)) return null;
      const minSoc = [3, 4, 5, 6, 7].includes(+E.minSocial) ? +E.minSocial : 6, lunesK = masDias(fecha, -w), soc = I4?.find(x => x.k === 'social');
      const hoyHecho = actual(at) ? (+Dd.ini_social || 0) > 0 : I4 ? hechoAntes(soc, at) : false;
      const socDias = Object.keys(D).filter(k => k >= lunesK && k < fecha && (+D[k]?.ini_social || 0) > 0).length, quedan = 7 - w;
      if (hoyHecho || !(socDias < minSoc && minSoc - socDias >= quedan)) return null;
      return { tag: 'social6', duda: sim && (I4 ? sinHora(soc) : (+Dd.ini_social || 0) > 0), corto: 'hoy cuenta para social', title: `Social: ${socDias} de ${minSoc} días esta semana`, body: 'Hoy cuenta para llegar al mínimo: ¿un mensaje, una llamada o un plan que propongas tú?' };
    } });
  }
  if (hayTipo('semana') && w === 4) sueltos.push({ nominal: '17:00', tags: ['viernes'], tipo: 'semana', parte: at => {
    if (!tipoOn('semana', at)) return null;
    const lunesK = masDias(fecha, -w), G = acota(E.personas, 300).flatMap(p => acota(p.historial, 400)).filter(x => x.tipo === 'Gracias' && x.d >= lunesK && x.d <= fecha);
    if (actual(at) ? G.length : G.some(x => x.d < fecha)) return null;
    return { tag: 'viernes', duda: sim && G.length > 0, corto: 'el gracias del viernes', title: 'Gracias del viernes', body: '¿A quién le agradeces algo concreto esta semana? Un mensaje corto basta.' };
  } });
  if (hayTipo('noche')) {
    sueltos.push({ nominal: '20:00', tags: ['esp'], tipo: 'noche', parte: at => {
      if (!tipoOn('noche', at)) return null;
      const esp = I4?.find(x => x.k === 'espiritual');
      if (actual(at) ? (+Dd.ini_esp || 0) > 0 : hechoAntes(esp, at)) return null;
      return { tag: 'esp', duda: sim && (I4 ? sinHora(esp) : (+Dd.ini_esp || 0) > 0), corto: 'tu momento espiritual', title: 'Tu momento espiritual', body: 'Unos minutos de oración, silencio, gratitud o servicio, cuando te venga bien antes de dormir.' };
    } });
    sueltos.push({ nominal: '21:00', tags: ['noche'], tipo: 'noche', parte: at => {
      if (!tipoOn('noche', at)) return null;
      const B = acota(E.buenas, 200).filter(x => x.d === fecha);
      if (actual(at) ? B.length : B.some(x => +x.en > 0 && +x.en <= at)) return null;
      // Si mañana ya está organizado, lo primero que tiene hora y sigue en pie (lo borrado o ya hecho no se da por reservado, F6).
      const m = masDias(fecha, 1), P = E.agendaPlan?.fecha === m ? E.agendaPlan : null;
      const nom = it => it.tipo === 'habito' ? habito(it.ref)?.nombre || '' : it.tipo === 'tarea' ? acota(st.tareas?.items, 2000).find(x => x.id === it.ref && !x.hecha)?.titulo || '' : it.t;
      const r = acota(P?.items, 80).filter(it => hmOk(it.h) && sinPunto(nom(it))).sort((a, b) => a.h < b.h ? -1 : 1)[0];
      const res = r ? `Mañana ${alas(r.h)} tienes reservado: ${sinPunto(nom(r))}.` : '';
      const exM = estudioDe(st, m).examenes.find(x => x.fecha === m), exT = exM ? `Mañana: examen de ${exM.materia || exM.nombre || 'estudio'}${exM.hora ? ' ' + alas(exM.hora) : ''}.` : '';   // 2.14 · Estudio
      return { tag: 'noche', duda: sim && B.some(x => !(+x.en > 0)), corto: `lo mejor de hoy${res ? ' · ' + minus(res.slice(0, -1)) : ''}`, title: '¿Qué fue lo mejor de hoy?', body: `Un minuto para cerrar con lo que avanzaste y lo mejor del día.${res ? ' ' + res : ''}${exT ? ' ' + exT : ''}` };
    } });
  }
  const V = [...new Set((Array.isArray(E.ventanas) && E.ventanas.length ? E.ventanas : ['12:30', '18:00', '21:00']).filter(hmOk))].sort().slice(0, 8);
  const lotes = new Map();
  for (const p of sueltos) { const v = V.find(x => x >= p.nominal) || ''; const k = v || p.nominal; if (!lotes.has(k)) lotes.set(k, { ventana: v, partes: [] }); lotes.get(k).partes.push(p); }
  for (const [hm, l] of lotes) {
    const tag = 'lote-' + hm.replace(':', ''), tags = [tag, ...l.partes.flatMap(p => p.tags)];
    if (pausaFija(C, fecha, 'lote@' + hm, tags, [...new Set(l.partes.map(p => p.tipo))])) continue;
    out.push({ t: en(hm), clase: 3, lote: l, tag, franja: 'lote@' + hm, vivo: () => true });
  }
  return out;
}
const fechaHM = (ms, tz) => { const p = partes(ms, tz); return `${p.hour}:${p.minute}`; };
// Un lote con una sola cosa usa su propio texto; con varias, «Para tu ventana de las…» y las partes cortas.
function armarLote(c, at, sinVolver) {
  const P = c.lote.partes.map(p => p.parte(at)).filter(x => x && !(sinVolver && x.soloVolver));
  if (!P.length) return null;
  if (P.length === 1) return { tag: P[0].tag, title: P[0].title, body: P[0].body, url: './?v=enfoque', apagar: APAGAR, soloVolver: !!P[0].soloVolver, duda: !!P[0].duda };
  const v = c.lote.ventana;
  return { tag: c.tag, title: v ? `Para tu ventana ${delas(v)}` : 'Lo que sigue pendiente hoy', body: mayus(P.map(x => x.corto).join(' · ')) + '.', url: './?v=enfoque', apagar: 'Ajustar avisos', soloVolver: P.every(x => x.soloVolver), duda: P.every(x => x.duda) };
}

// ---------- Silencio (F16 y F25): durante el enfoque, los eventos de la agenda y los bloques protegidos no llega nada.
function silencios(C, fecha) {
  const E = C.st.enfoque || {}, S = [];
  for (const x of acota(E.enfoqueLog, 40).slice(-12)) if (+x.b > +x.a) S.push({ a: +x.a, b: +x.b });
  const eh = +E.enfoqueHasta || 0;
  // Sesión en curso sin su tramo (llegó solo enfoqueHasta): calla desde esta pasada, sin tocar lo que ya salió.
  if (eh > C.ahora && !S.some(x => x.a <= C.ahora && x.b >= eh - 1000)) S.push({ a: C.desde + 1, b: eh });
  for (const it of agendaDe(C, fecha).items) {
    if (it.fantasma || !hmOk(it.h) || !(+it.min > 0) || !(it.tipo === 'evento' || it.tipo === 'plan' || it.foco)) continue;
    const a = aMs(fecha, it.h, C.tz);
    // En un bloque protegido solo puede sonar su propio aviso, al empezar. El silencio vale para lo que ya pasó solo si
    // el evento ya se conocía a esa hora (it.org: cuándo entró a la agenda); si no, lo ya enviado no se mueve.
    S.push({ a, b: a + Math.min(720, +it.min) * 60000, propio: it.foco ? (it.tipo === 'estudio' ? 'est-' + it.ref : 'ag-' + it.id) : '', ag: true, org: +it.org > 1e11 ? +it.org : +it.org > 0 ? 1 : 0 });
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
    // Lo que sale en esta pasada llega ahora: si ya no llega a tiempo (c.llega), no sale.
    const ahoraSale = t > C.desde && t <= C.ahora;
    if (c.llega && ahoraSale && C.ahora > c.llega) continue;
    // Retrasado por un silencio o por la pasada: el plan dice su hora («A las 4:30 PM: …») en lugar de «En 1 hora».
    L.push({ ...c, t, ...(c.tarde && (t !== c.t || (ahoraSale && C.ahora - c.t > 10 * 60000)) ? { title: c.tarde } : {}) });
  }
  L.sort((a, b) => a.t - b.t || a.clase - b.clase);
  // Un día pasado se simula con el tope que tenía entonces (prefs.maxAntes: el de antes del último cambio y hasta cuándo valió).
  const max = C.sim && +C.prefs.maxAntes?.hasta > fin ? topeDe({ max: C.prefs.maxAntes.v }) : topeDe(C.prefs), env = [];
  let volver = false;
  for (let i = 0; i < L.length && env.length < max; i++) {
    if (i % 50 === 0) presupuesto(C);
    const c = L[i], at = c.t;
    const a = c.lote ? armarLote(c, at, volver) : c.vivo(at) ? c : null;
    if (!a || (a.soloVolver && volver)) continue;
    const clase = a.soloVolver ? 4 : c.clase;
    const reservados = clase === 1 ? 0 : L.slice(i + 1).filter(d => d.t > at && (d.lote ? clase === 4 && !!armarLote(d, at, true)
      : (d.soloVolver ? 4 : d.clase) < clase && d.vivo(at))).length;
    if (env.length + 1 + reservados > max) continue;
    env.push({ t: at, tag: a.tag, title: a.title, body: a.body, url: a.url, ...(a.apagar ? { apagar: a.apagar } : {}), franja: c.franja, seguro: !(C.sim && (c.lote ? a.duda : c.duda?.(at))) });
    if (a.soloVolver) volver = true;
  }
  return env.map((a, i) => ({ ...a, body: `${a.body}\n(aviso ${i + 1} de ${max} de hoy)` }));
}
function avisos(st, tz, prefs, desde, hasta) {
  const C = { st: st && typeof st === 'object' ? st : {}, tz, prefs: prefs && typeof prefs === 'object' ? prefs : {}, desde, ahora: hasta, t0: performance.now() }, out = [];
  for (const fecha of [...new Set([fechaEn(desde, tz), fechaEn(hasta, tz)])])
    for (const a of planDia(C, fecha)) if (a.t > desde && a.t <= hasta) { const { t, franja, seguro, ...x } = a; out.push(x); }
  return out;
}

// ---------- Pasada
const ahora = Date.now();
const subs = await rest('push_subs?select=*');
const uids = [...new Set(subs.map(s => s.user_id))];
const estados = uids.length ? await rest(`estados?select=user_id,data&user_id=in.(${uids.join(',')})`) : [];
const datos = Object.fromEntries(estados.map(e => [e.user_id, e.data]));
let enviados = 0, esperan = 0;
// Cada cuenta va aparte: un estado raro, una cuenta que pide demasiado trabajo (tope de tiempo en avisos) o un envío que no
// responde (10 s cada uno, 30 s por cuenta) no frenan ni dejan sin avisos a las demás. Si aun así la pasada se alarga, las
// cuentas que no alcanzan esperan a la siguiente sin perder nada (su `ultimo` no cambia y la ventana llega hasta 2 h) y,
// como van primero las que llevan más tiempo sin pasada, nunca se quedan siempre las mismas al final.
const LIMITE = 180000, t0 = performance.now();
subs.sort((a, b) => (Date.parse(a.ultimo || '') || 0) - (Date.parse(b.ultimo || '') || 0));
for (const s of subs) {
  if (performance.now() - t0 > LIMITE) { esperan++; continue; }
  try {
    const desde = Math.max(s.ultimo ? Date.parse(s.ultimo) : ahora - 20 * 60000, ahora - 2 * 3600e3);
    let lista = [];
    try { lista = datos[s.user_id] ? avisos(datos[s.user_id], s.tz || 'UTC', s.prefs || {}, desde, ahora) : []; } catch (e) { console.error('Error al calcular los avisos:', e.message); }
    const filtro = `push_subs?endpoint=eq.${encodeURIComponent(s.endpoint)}`, envio0 = performance.now();
    let viva = true;
    for (const a of lista) {
      if (performance.now() - envio0 > 30000) { console.error('Error al enviar: el servicio de avisos de esta suscripción no responde; lo demás queda sin enviar.'); break; }
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(a), { TTL: 3600, timeout: 10000 }); enviados++; }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) { await rest(filtro, { method: 'DELETE' }); viva = false; break; } console.error('Error al enviar:', e.statusCode || e.message); }
    }
    if (viva) await rest(filtro, { method: 'PATCH', body: JSON.stringify({ ultimo: new Date(ahora).toISOString() }) });
  } catch (e) { console.error('Error con una suscripción:', e.message); }
}
console.log(`${subs.length} suscripciones, ${enviados} avisos enviados.`);
if (esperan) console.log(`${esperan} suscripciones quedan para la próxima pasada (esta se alargó).`);
