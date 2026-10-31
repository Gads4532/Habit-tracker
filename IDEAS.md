# Habit Tracker — banco de ideas

Cada función sale de un principio concreto de un libro. Si una función no se puede
justificar con uno, sobra.

## Requisito base

**Cada hábito tiene dos apartados obligatorios:**

- **Beneficios** — título en **verde**. Lo que gano al hacerlo.
- **Contras de no hacerlo** — título en **rojo**. Lo que pierdo si lo salto.

No son decoración: se enseñan en el momento en que cuentan.

| Momento | Qué se muestra | Por qué |
|---|---|---|
| Al marcar el hábito como hecho | Beneficios | Recompensa inmediata (4ª ley de Clear: hacerlo satisfactorio) |
| Al pulsar «Hoy no» | Contras de no hacerlo, y hay que confirmar | Fricción y «señalar y nombrar»: decir la consecuencia antes de actuar |
| En la ficha del hábito | Los dos | El «anhelo» de Duhigg: la recompensa tiene que estar clara |

## Diseño

- **100% minimalista**: líneas finas, nada de tarjetas; los detalles aparecen al tocar el hábito.
- **Símbolo y color por hábito**: 17 símbolos de línea y 8 colores. El color tiñe el círculo de marcar y la cadena de días. ✅
- **Fuego de racha (estilo Duolingo)**: al hacer un hábito, la pantalla entera celebra. El fuego se enciende con un rebote, el número de la racha rueda hacia arriba, el día de hoy se marca en la fila de la semana y sale un mensaje motivador. El botón de abajo es «Continuar». ✅
- **Guardado en la nube**: publicada como página privada de Claude, cada persona guarda su progreso en su propio espacio y lo ve desde cualquier dispositivo. Abierta como archivo suelto, guarda solo en ese dispositivo. ✅
- **Exportar a Notion**: se quitó en 2.4.0. No aportaba en el uso diario y la app ya guarda en su propia nube. ❌
- **App instalable sin VPN y sin internet**: publicada en GitHub Pages como PWA desde el repositorio público [Gads4532/habitos](https://github.com/Gads4532/habitos) (este repositorio es privado y Pages gratis exige uno público). Chrome la instala con icono propio y a pantalla completa; el service worker la guarda en el teléfono y abre sin conexión. Los datos viven en el teléfono, con «Guardar copia» y «Restaurar copia» (archivo .json). ✅
- **Días y horas por hábito**: eliges qué días de la semana toca (chips L–D) y una o varias horas en 12 h. Los días que no tocan no rompen la racha ni cuentan como fallo; en Hoy salen apagados bajo «Otros días» y en el calendario en gris claro. ✅
- **Modos**: *Marcar* (un toque), *Veces* (meta diaria; cada toque suma uno y el anillo se llena) y *Cronómetro* (minutos diarios; toque para arrancar o pausar, se completa solo al llegar). ✅
- **Tareas**: pestaña aparte al estilo Google Tasks. Listas ilimitadas, añadir con Enter, completar con un toque, completadas plegadas, editar con fecha y detalle, renombrar y borrar listas. ✅
- **Tareas recurrentes**: en la tarea, «Repetir»: cada día, días laborables, cada semana, cada 2 semanas, cada mes, cada año o días concretos de la semana. Al completarla nace la siguiente con su fecha (nunca atrasada; el 31 pasa a fin de mes si hace falta). Si la desmarcas, la siguiente desaparece. Las repetidas llevan ↻ junto a la fecha. ✅
- **Actualizar versión**: la app muestra su versión, «Buscar actualización» y un aviso «Hay una versión nueva» con botón Actualizar. Los datos viven aparte y nunca se tocan al actualizar. ✅
- **Cuenta y nube propia (Supabase)**: en la versión instalable, «Crear cuenta o iniciar sesión» con correo y contraseña. El progreso se guarda en la tabla `estados` del proyecto Supabase (una fila por persona, protegida por RLS) y se ve en cualquier teléfono. Si hay datos en los dos sitios, la app pregunta cuáles conservar. Sin conexión sigue guardando en el teléfono y sube al volver la red. El SQL de preparación está en `supabase.sql`. ✅
- **Saludo con nombre**: en vez de «Hoy», la cabecera dice «Buenos días / Buenas tardes / Buenas noches, Nombre» según la hora (antes de las 12, antes de las 19, después). El nombre (solo el primero, sin apellido) se pide al crear la cuenta y también se puede poner o cambiar tocando el saludo. ✅
- **Análisis**: pestaña con gráficas propias en SVG, sin librerías. Periodo (30 días, 90 días, todo) y filtro por hábito. Cuatro números arriba (acierto, días hechos, mejor racha, votos), acierto por semana (barras), días hechos acumulados (línea), acierto por día de la semana, acierto y mejor racha por hábito, y «Por qué no»: los motivos apuntados, contados y agrupados, con los últimos al detalle. Tocar una barra o un punto enseña su valor. ✅
- **Motivo de un día no hecho**: en «Hoy no» hay un campo opcional «¿Por qué no?», y en el calendario, al tocar un día sin marcar, se puede apuntar qué pasó (o justificarlo si quedan). El día sigue sin marcar: el motivo es solo para entenderte en Análisis. ✅
- **Animaciones en tareas**: al completar, el círculo rebota con resorte, el check se dibuja, una línea tacha el título y la fila se recoge hacia Completadas; las nuevas entran deslizándose y, al vaciar la lista, sale «Todo hecho. Lista limpia». ✅
- **Identidad en la tarjeta**: bajo cada hábito, «N votos · Soy una persona que…» en vez del multiplicador 1,01ⁿ. ✅
- **Canción de Spotify al completar**: conectas tu Spotify (app gratuita en developer.spotify.com + Client ID, una vez), eliges una canción por hábito y, al marcarlo, la app le pide a tu Spotify que la reproduzca en el teléfono (Spotify Connect; hace falta Premium y la app de Spotify abierta o reciente). Si no puede, la celebración ofrece abrirla en Spotify. ✅
- **Hora en 12 h**: hora, minutos y un botón AM | PM. ✅
- **Racha en el dashboard**: cada hábito lleva su fueguito con los días seguidos. Arriba a la derecha está la racha general (días seguidos con al menos un hábito hecho) y el % de acierto de los últimos 7 días. ✅
- **Animaciones con física real**: resortes de verdad (`linear()` de CSS con masa, rigidez y amortiguación), no curvas aproximadas. La celebración sigue la secuencia de Duolingo: anticipación (fuego gris que se posa), squash & stretch al encenderse, sunburst tenue y chispas de brasa en canvas con gravedad, contador que rueda con resorte, día de la semana que se rellena con un anillo, y cascada final. Un solo color sobre fondo limpio. Se apagan solas con «reducir movimiento». ✅
- **Calendario**: una pestaña con el mes de cada hábito. Los días salen en verde (hecho; verde suave si fue la versión de 2 min), con un aro neutro (sin hacer; desde 2.12.0 ya no en rojo) o en gris (justificado o protegido). Debajo están el % de acierto del mes, los días hechos y las justificaciones que te quedan. ✅
- **Justificaciones**: 2 al mes por hábito. Tocas un día sin marcar, escribes el motivo y queda en gris sin romper la racha. También se puede justificar hoy desde «Hoy no». ✅
- **Rutinas**: una rutina (p. ej. «Rutina matutina») agrupa hábitos. Se abre con un toque y muestra cuántos llevas hoy (2/4). Los hábitos nuevos dentro de una rutina toman su color. ✅

## Hábitos Atómicos — James Clear

| Idea del libro | Función en la app | Prototipo |
|---|---|---|
| Identidad antes que resultados | Cada hábito empieza por «Soy una persona que…». Al cumplirlo: «+1 voto por tu identidad», con el total acumulado | ✅ |
| Intención de implementación | Campo «Haré [conducta] a las [hora] en [lugar]», que se enseña tal cual en la tarjeta | ✅ |
| Acumulación de hábitos | Campo «Después de [hábito actual]…»; los hábitos encadenados se ordenan juntos | ✅ (campo) |
| Regla de los dos minutos | Versión mínima obligatoria. En un mal día se puede marcar «Hice la versión de 2 min», y cuenta | ✅ |
| Nunca dejes que pase dos veces | Si ayer no se hizo, la tarjeta sale en ámbar: «Ayer fallaste. Hoy no puede pasar dos veces» | ✅ |
| No romper la cadena / tracker | Cadena de los últimos 14 días y racha actual | ✅ |
| 1% mejor cada día | La curva de días hechos acumulados en Análisis | ✅ |
| Meseta del potencial latente | Mensaje entre los días 10 y 40: «Los resultados llegan con retraso; sigue votando» | ✅ |
| Regla de Ricitos de Oro | Con 14 días de racha propone subir un poco la dificultad | ✅ |
| Acumulación de tentaciones | Campo «Después de hacerlo, me doy [algo que quiero]» | ✅ (campo) |
| Diseño del ambiente | Checklist por hábito: «¿Qué señal visible pongo? ¿Qué tentación quito de la vista?» | ⏳ |
| Romper malos hábitos (4 leyes al revés) | Tipo «Dejar de…», con invisible / poco atractivo / difícil / insatisfactorio | ⏳ |
| Registro de hábitos (+ / – / =) | Diagnóstico inicial: apuntar el día y marcar cada conducta | ⏳ |
| Contrato de hábitos y socio | Exportar un contrato firmado y compartir la racha con un socio | ⏳ |
| No más de un hábito grande nuevo a la vez | Límite de 3 hábitos «en construcción»; uno pasa a «consolidado» con 66 días | ✅ (aviso) |

## El poder de los hábitos — Charles Duhigg

- **Bucle señal → rutina → recompensa**: la ficha separa los tres campos.
- **Hábitos clave (keystone)**: estrella para el hábito que arrastra a los demás; sale arriba del todo. ✅
- **Regla de oro del cambio**: para un mal hábito se mantienen la señal y la recompensa y solo se cambia la rutina. Asistente: «¿Qué te da realmente?». ⏳
- **Diario de antojos**: cuando aparece el impulso, se apuntan lugar, hora, estado emocional, personas y acción previa, para encontrar la señal real. ⏳

## Tiny Habits — BJ Fogg

- **Celebración inmediata (shine)**: al marcar, animación y la frase de celebración que elegiste («¡Así se hace!»). ✅
- **Ancla**: es lo mismo que el apilamiento de Clear y usa el mismo campo. ✅
- **B = MAP**: si fallas 3 veces, la app no te pide «más motivación». Te pregunta si el recordatorio (prompt) o la dificultad (habilidad) están mal y te propone reducir el hábito. ⏳

## Encuentra tu persona vitamina / Cómo hacer que te pasen cosas buenas — Marian Rojas Estapé

- Plantillas de beneficios y contras con el lenguaje del cuerpo: *dopamina, serotonina, oxitocina* frente a *cortisol*. Ej.: ejercicio → «baja el cortisol» / no hacerlo → «el cortisol se queda alto, peor sueño». ⏳
- **Socio vitamina**: el socio corresponsable de Clear, elegido entre las personas que te suben. ⏳

## Otros libros

| Libro | Idea | Función |
|---|---|---|
| *Los 7 hábitos* — Covey | Empezar con un fin en mente | Los hábitos se agrupan por rol (estudiante, amigo, cuerpo…) ⏳ |
| *Esencialismo* — McKeown | Menos pero mejor | El límite de 3 hábitos en construcción ✅ |
| *Indistractable* — Nir Eyal | Disparadores internos y pactos de precompromiso | Botón «Siento el impulso de saltarlo» que lleva a los contras y a esperar 10 minutos ⏳ |
| *La regla de los 5 segundos* — Mel Robbins | 5-4-3-2-1 y a moverse | Cuenta atrás de 5 s al abrir un hábito pendiente ⏳ |
| *Mindset* — Carol Dweck | Mentalidad de crecimiento | Los fallos no se tachan en rojo: «Todavía no». El rojo queda solo para los contras ✅ |
| *Un pequeño paso puede cambiar tu vida* — Maurer (kaizen) | Pasos absurdamente pequeños | Refuerza la regla de los dos minutos ✅ |
| *Cómo ganar amigos* — Carnegie | Reconocimiento sincero | Resumen semanal que celebra lo hecho antes de mirar lo que falta ⏳ |

## Revisión semanal (ritmo de la skill coach-habitos-atomicos)

Cada domingo:
1. Los votos de la semana por identidad.
2. Qué hábito falló dos veces seguidas y por qué (B = MAP).
3. Ajuste Ricitos de Oro: subir, mantener o reducir.
4. Una sola mejora del ambiente para la semana siguiente.

⏳ = todavía no está en el prototipo

## Enfoque (desde 2.7.0)

Pestaña que se abre primero: la pregunta «¿Para qué tomaste el teléfono?» antes del feed. Dos prioridades:
**erradicar el FOMO** y **tomar la iniciativa** (conversaciones, reuniones, planes, proyectos). Cada función sale de
un estudio; la lista completa con fuentes está en la app («Por qué funciona»). Vive en un Shadow DOM para no mezclar
estilos; sus datos van en `state.enfoque` y se sincronizan con la cuenta (unión por id; por día, el mayor de cada
contador). La sesión de enfoque y la salida en curso son de cada teléfono (`habit-enfoque-local`).

| Frente | Función | Evidencia |
|---|---|---|
| Intervenir | Un mensaje del momento según hora, día y datos (prioridades por la mañana, revisión los lunes, gracias los viernes, tres cosas buenas por la noche, presupuesto agotado, proyecto parado, misión social, iniciativa laboral, ventana de revisión, emoción más frecuente) | Señal en el momento correcto (Gollwitzer y Sheeran 2006) |
| Prioridades | Tres al día, la más difícil primero; prioridad alta/media/baja por proyecto | Zhu et al. 2018; Habbert y Schroeder 2020 |
| FOMO | Puerta con espera creciente y «Mejor no» | Grüning et al. 2023 |
| FOMO | Presupuesto de 30 min y reto de 21 días | Hunt et al. 2018; Burnell et al. 2025 |
| FOMO | Tres ventanas de revisión; fuera, espera doble | Fitz et al. 2019; Kushlev y Dunn 2015 |
| FOMO | Emoción en la puerta con consejo | Throuvala et al. 2020 |
| FOMO | «Hablar» vs. «solo mirar»; recordatorio de escala de grises | Verduyn et al. 2015; Zimmermann y Sobolev 2023 |
| FOMO | Prueba de realidad al volver y al terminar una sesión | Experimento conductual (TCC) |
| FOMO | Configurar el teléfono (7 pasos) | Olson et al. 2022 |
| FOMO | Pacto semanal con consecuencia, compartible | Bryan, Karlan y Nelson 2010 |
| Iniciativa | Personas por círculos, plantillas (saludo, gracias, plan), predicción vs. resultado | Liu et al. 2023; Kumar y Epley 2018; Masi et al. 2011; Dunbar |
| Iniciativa | Planes con día y hora, preguntas profundas y de Aron, brecha de agrado | Epley y Schroeder 2014; Kardas et al. 2022; Aron et al. 1997; Boothby et al. 2018 |
| Iniciativa | Misión social del día y reto de 7 días con desconocidos | Hall et al. 2023; Sandstrom et al. 2022 |
| Iniciativa | Horas juntos hacia 50 / 90 / 200 h | Hall 2019 |
| Iniciativa | Iniciativa laboral semanal: propuesta, reunión, problema anticipado | Parker et al. 2010; Campos et al. 2017 |
| Proyectos | WOOP, paso con día/hora/lugar, versión de 2 min, «Estoy procrastinando», pequeñas victorias, «dónde lo dejaste», recompensa ligada, revisión semanal | Oettingen; Milkman et al. 2011; Rozental et al. 2018; Wohl et al. 2010; Harkin et al. 2016; Dai et al. 2014 |
| Enfoque | Sesiones con interrupciones, ánimo antes/después, «surfear el impulso», aviso al terminar si el sistema lo permite | Mark et al. 2008; Ekers et al. 2014 |
| Cierre del día | Tres cosas buenas | Seligman et al. 2005 |
| Datos | «Tus datos»: todo lo recogido en un lugar | Harkin et al. 2016 |

**Límites honestos**: una web no puede bloquear otras apps ni medir su tiempo; la app interviene cuando se abre
(por eso sustituye a las redes en la pantalla de inicio). Los avisos del sistema solo salen si el teléfono deja la
app viva en segundo plano. No se hace: desintoxicaciones de 1–3 días, apagar todas las notificaciones, «brain drain»,
vender Pomodoro/GTD como ciencia, rachas que castigan.

## Google Tasks (desde 2.7.0)

Sincronización en los dos sentidos de listas y tareas (título, notas, fecha, completada; altas y bajas) con la API de
Google Tasks, usando un ID de cliente OAuth propio (Google Cloud, tipo «Aplicación web», origen
`https://gads4532.github.io`). El permiso dura una hora y vive solo en el teléfono (`habit-gtasks`); con él vivo, cada
cambio se sincroniza solo. Regla de conflicto: si la tarea cambió aquí desde la última sincronización, sube; si no,
manda Google. Las repeticiones de la app llegan a Google como tareas sueltas (la API no permite crear repeticiones).

## Organización Personal 2.8.0: asistente con Claude y Google Calendar

- **Nombre**: la app pasa a llamarse **Organización Personal** (Habit Tracker es ahora la pestaña Hábitos). URL, claves de almacenamiento y datos no cambian.
- **Asistente** (pestaña propia): chat con Claude Opus 5.5 por defecto (Sonnet 5.5 y Haiku 5.5 elegibles), con la clave de la API de cada persona guardada solo en su teléfono. Streaming, esfuerzo `medium`, caché automática de prompts y reintento automático con otro modelo si el filtro declina (`fallbacks: "default"`).
  Herramientas: `ver_estado`, `gestionar_prioridad`, `crear_tarea`, `completar_tarea`, `proyecto_paso`, `crear_proyecto`, `registrar_contacto`, `crear_plan`, `calendario_ver`, `calendario_crear`, `iniciar_enfoque`. Hace lo que se le pide; lo que propone por su cuenta lo pregunta antes.
  La conversación vive en el teléfono (`rumbo-chat`), solo se añade al final y, si una vuelta falla, se deshace entera.
- **Google Calendar**: mismo permiso que Google Tasks con el alcance `calendar.events`. Agenda de hoy en Enfoque, «Crear en mi Google Calendar» en los planes y herramientas del asistente.

## 2.9.0: notificaciones, Ideas (diario y pizarras), plan de rescate

- **Notificaciones push** sin abrir la app: `.github/workflows/notificaciones.yml` corre `notificar.mjs` cada 15 minutos; lee `push_subs` (`push.sql`) y `estados`, calcula los avisos en la zona horaria de cada teléfono y los envía con Web Push (claves VAPID; la privada y la clave de servicio de Supabase van en los secretos del repositorio). Avisos: resumen de la mañana, hora de cada hábito, una hora antes de cada plan, paso de proyecto a su hora, prioridad al mediodía, cierre del día, lunes y viernes. Se eligen en Ajustes de Enfoque → Notificaciones.
- **Ideas** (pestaña): **diario** con pregunta guía, ánimo y «Enviar a Notion» (menú de compartir o copia en Markdown, con las tres cosas buenas del día); **pizarras** en SVG con notas, texto, lápiz, flechas, zonas, zoom y plantillas (lluvia de ideas, mapa de mi vida, importante/urgente, semana, proyecto). El asistente puede escribir notas en una pizarra (`pizarra_agregar`).
- **Plan de rescate** («¿Día sin rumbo?»): un minuto de suspiros cíclicos (Balban et al. 2023), vaciar la cabeza por escrito (Masicampo y Baumeister 2011), elegir una sola cosa, primer paso de 2 minutos; el resto va a Tareas y la elegida pasa a prioridad 1. Aparece también como intervención cuando a las 11 no hay prioridades ni enfoque.
- **Barra de cinco pestañas**: Enfoque, Asistente, Hábitos, Tareas, Ideas. Calendario y Análisis se abren desde Hábitos.

## 2.9.0 (continuación): Notion, XP y prioridades extra

- **Notion**: la API no admite llamadas desde el navegador, así que `supabase/functions/notion/index.ts` hace de puente (verifica la sesión de Supabase y reenvía a api.notion.com con el token de integración, que vive solo en el teléfono). Se despliega una vez desde el panel de Supabase (Edge Functions → Deploy → via Editor, nombre «notion»). En Ideas: «Conectar Notion» pide el secreto de una integración interna y deja elegir la página destino entre las que la integración ve. El diario (entrada o última semana) y las pizarras se crean como páginas hijas; las pizarras se convierten en encabezados (zonas) con viñetas (notas); dibujos y flechas no se exportan. Sin Notion conectado sigue el menú de compartir / copiar en Markdown.
- **XP y niveles**: cada acción buena suma XP y nunca se resta (Sailer y Homner 2020: la gamificación mueve motivación y conducta con efectos pequeños a moderados; se evita castigar). Tarjeta arriba de Enfoque con nivel (Novato → Leyenda), barra al siguiente nivel, XP de hoy frente a la meta diaria (50–200, en Ajustes) y racha de días con meta. Niveles a 50·L·(L−1) XP. Puntos: rana 40, prioridad 25, extra 30, las tres del día +50, paso de proyecto 30, hábito 10 (2 min: 5), tarea 5, enfoque 1/min (+20 sin interrupciones), resistir 15, alternativa 10, contacto 20 (gracias 25), plan 25, misión social 25, iniciativa laboral 30, tres cosas buenas 10, diario 10, rescate 20. Aviso flotante «+25 XP · motivo», hoja al subir de nivel, y el asistente puede contar el nivel (`ver_estado`).
- **Prioridades extra**: tres como máximo mientras haya pendientes; cuando las tres están hechas se pueden añadir extras (una a una), marcadas «Extra · +30 XP». También desde el asistente.
- La hoja, el aviso corto y las pantallas completas viven ahora en `#view-overlays`, fuera de la pestaña Enfoque, para funcionar desde cualquier pestaña.

## Las 4 iniciativas del día

Sustituye a la «iniciativa laboral»: cada día hay cuatro frentes con el mismo peso y el mismo XP (30 cada una): **estudio**, **proyecto**, **laboral** y **social**. Reglas: **mínimo 2 al día** (+40 XP al llegar; las cuatro, +50) y **social al menos 6 días a la semana** (+60 al cumplirlo). Los mínimos se cambian en Ajustes. La app avisa a las 4 PM si falta el mínimo y, desde el mediodía, si la social de hoy es necesaria para llegar a los 6 días; también por notificación push. Racha de días con el mínimo; el historial diario va en `dias[k].ini4` / `ini_social` e `iniHist`. Cada una lleva qué, por qué importa, primer paso de 5 minutos y día y hora (Milkman et al. 2011), con sugerencias tomadas de la app (siguiente paso de proyectos, personas a las que toca escribir, hábitos de estudio) y botón para agendar. Aparecen en Enfoque, en la revisión semanal, como intervención del miércoles y del viernes si faltan, como aviso push el miércoles al mediodía, y el asistente puede definirlas o marcarlas (`iniciativa_semana`).

### Opciones, iniciativas propias y Notion

- **Catálogo**: 12 ideas concretas por tipo (estudio, proyecto, laboral, social), en formato acción, para elegir en un toque («Elegir de la lista»).
- **Mis iniciativas** («Crear la mía»): estructura que asegura el cumplimiento: acción concreta, por qué, primer paso de 5 min, hora y lugar, obstáculo probable con plan «si…, entonces…» (Gollwitzer y Sheeran 2006) y señal de hecha (Locke y Latham 2002). Se guardan en `catalogoIni[tipo]` (sincronizado), cuentan las veces usadas y se reutilizan.
- **Desde Notion**: elige una página; cada viñeta, número, casilla, encabezado o párrafo corto se convierte en opción marcable y se guarda en «Mis iniciativas» con origen «Notion · página».
- El asistente ve `mis_iniciativas` y puede definir una con la estructura completa y guardarla como reutilizable.

## Bienestar (pestaña): mente y espíritu, juntos

Prácticas guiadas de 1 a 15 minutos con pantalla propia (pasos con tiempo o patrón de respiración con círculo), evidencia en cada una, registro (`practicas`, `estado`) y XP. Cualquier práctica espiritual completa deja hecha la **iniciativa espiritual del día** (que es diaria).

- **Mente** (mindfulness y herramientas cognitivas): suspiro cíclico (Balban 2023), atención a la respiración y escaneo corporal (Goyal 2014), respiración en caja (Zaccaro 2018), pausa STOP (Albulescu 2022), desfusión (A-Tjak 2015), reestructurar un pensamiento (Cuijpers 2023), soltar una preocupación con hora fija (Borkovec 1983), chequeo de ánimo (Harkin 2016), pausa de autocompasión (Ferrari 2019), mejor yo posible (Meevissen 2011), afirmar lo que valoro (Cohen y Sherman 2014), plan contra la tentación (Gollwitzer y Sheeran 2006), decidir con distancia (Grossmann y Kross 2014).
- **Espíritu** (vida cristiana práctica): oración de la mañana, lectura de la Palabra (lectio divina con pasaje del día y enlace a YouVersion RVR1960), examen del día, oración por otros (sugiere personas de la app; Lambert 2010), perdonar (Wade 2014), gracias a Dios (Emmons y McCullough 2003), versículo de la semana (RV1909, dominio público; repetición espaciada, Cepeda 2006), acto de servicio (Curry 2018), oración de la noche (Koenig 2012).
- **Escenarios** («¿Qué necesitas ahora?»): General, Esperanza, Consolación, Confianza (Autoridad · Autoestima · Visión de mí mismo, cada una con sus versículos, «Declaro» y oración), Paz, Fortaleza, Dirección, Perdón, Gratitud. Cada uno: la Palabra (RV1909 con enlace), una oración guiada de 3–4 minutos y una herramienta de la mente con evidencia.
- «Ahora te conviene» elige la práctica por hora y por lo hecho; la tarjeta «Ahora» de Enfoque manda a Bienestar cuando falta la espiritual.
- Nota de límites: las prácticas acompañan; si el malestar pesa o dura, hablar con un profesional.

## Ahora, descanso con propósito y espiritual diaria

- **«Ahora»** en Enfoque: siempre una cosa siguiente con propósito (prioridad → iniciativa con hora → mínimo de iniciativas → espiritual → social en riesgo → hábito → tarea → prioridades → tres cosas buenas → descanso con propósito). Es imposible quedarse sin saber qué hacer, y la alternativa al scroll es siempre un descanso elegido.
- **Descansar con propósito**: quinta respuesta a «¿Para qué tomaste el teléfono?» y botón en «Ahora»: tipo (siesta, caminar, respirar, no hacer nada sin pantalla, música, estirar, comer sin pantalla, leer por placer) y tiempo; corre como sesión, registra `descanso` y da XP (Albulescu 2022; Kaplan 1995).
- **Iniciativa espiritual**: quinta iniciativa, diaria, con catálogo cristiano; racha propia y bonus cada 7 días; aviso a las 7 PM en la app y a las 8 PM por push si falta.

## 2.9.1: clave del asistente por enlace, corazón en Bienestar

- **Clave por enlace de un toque.** Abrir la app con `#clave=sk-ant-…` guarda la clave del asistente en ese teléfono y la borra de la barra de direcciones. Va en el fragmento (`#`), que el navegador nunca envía al servidor, así que no queda en registros de GitHub Pages. Sirve para pasar la clave desde un chat privado sin escribirla a mano.
- **Formato de clave.** La consola de Claude emite claves `sk-ant-api…` y también `sk-ant-usr…`; la app acepta cualquier clave `sk-ant-` larga en vez de exigir `sk-ant-api`.
- **Pestaña Bienestar:** corazón sencillo, sin la línea central.

## 2.10.0: Agenda, todo SMART, objetivos y Journaling

- **Pestaña Agenda.** Una sola lista con hora para el día: hábitos de hoy, tareas, las 5 iniciativas, prioridades, planes y eventos de Google Calendar. Marcar hecho desde la agenda cuenta en su fuente (el hábito en Hábitos, la tarea en Tareas y en Google Tasks, la iniciativa con su XP). Marcador «Ahora», ítems con hora pasada en ámbar, ficha por ítem (empezar sesión, hecha, hora, señal de hecho, para qué, objetivo, quitar) y «+ Añadir». Los eventos del calendario se pueden ocultar del día y no vuelven con la sincronización.
- **Organizar mi día (2 min).** Cuatro pasos con todo preseleccionado y filas que se marcan tocando cualquier parte: hábitos de hoy (crear uno ahí mismo), tareas de hoy y vencidas (crear una ahí mismo), iniciativas por categoría (con una propuesta SMART ya puesta para llegar al mínimo del día, la espiritual siempre; «Cambiar» abre plantillas, las tuyas, ideas o una nueva) y horas. El reparto respeta lo que tiene hora elegida (si dos chocan, la segunda pasa al siguiente hueco) y reparte lo demás desde ahora en bloques, sin pisar planes ni eventos. Reorganizar nunca borra lo que ya estaba (lo añadido aparte o lo hecho). Si la hoja se cierra a medias, la próxima vez empieza de cero. +20 XP «Día organizado» una vez al día; +25 si al final todo queda hecho (también una vez al día). «Copiar la de ayer» repite la agenda anterior.
- **Organizar mañana (la víspera).** Desde las 6 PM, la Agenda, Enfoque y «¿Día sin rumbo?» ofrecen dejar mañana organizado con el mismo flujo: los hábitos que tocan mañana, las tareas que vencen, las iniciativas y la rana de mañana (lo más importante, primero), con horas desde las 7 AM. Al día siguiente la agenda aparece sola, con las iniciativas puestas y la rana como prioridad 1. Los avisos push usan ese plan aunque la app aún no se haya abierto. +20 XP «Mañana organizado» una vez al día.
- **Rescate breve.** «¿Día sin rumbo?» ofrece dos salidas: solo agendar el día (este flujo) o el plan de rescate completo de 5 pasos; el paso 1 del rescate también tiene el atajo.
- **SMART en todo.** Indicador S·M·A·R·T en cada ítem de la agenda y en las iniciativas (específico: verbo + qué; medible: señal de hecho, una cantidad o un verbo que ya lo dice, como «Enviar» o «Pagar»; alcanzable: minutos ≤ 90, primer paso o versión de 2 minutos; relevante: para qué u objetivo; con tiempo: hora). Planes y eventos no se evalúan. Lo que falte se completa desde la ficha del ítem. Crear un hábito pide verbo + qué con cantidad (o versión de 2 minutos), hora y para qué; crear una tarea pide verbo + qué y, si el verbo no lo dice, cuándo estará hecha; una prioridad pide verbo + qué. Iniciativas propias con un formulario distinto por categoría que compone el título y la señal de hecho; ocho plantillas SMART por categoría (la mitad listas para usar, la otra con uno o dos huecos); toda iniciativa lleva señal de hecho (las ideas rápidas, la de su categoría); iniciativa SMART completa cumplida: +10 XP.
- **Objetivos SMART.** Metas de semanas o meses: qué, cómo se mide, meta numérica y unidad, primer paso o rutina semanal, área, por qué y fecha límite (todo obligatorio). Avance manual (+1, cantidad, nota) o automático al cumplir iniciativas, tareas o prioridades ligadas; deshacer el «hecho» descuenta ese avance, así que no se infla. Ritmo necesario por semana y días restantes; +15 al crear, +5 por avance (uno al día por objetivo), +100 al cumplir (una vez). Ejemplos listos para empezar.
- **Niveles y meta del día explicados.** La tarjeta de XP abre una ficha con el nivel, lo que falta para el siguiente (50 × L × (L − 1)), la meta de hoy como objetivo SMART («100 XP antes de dormir») y la tabla completa de cómo se gana XP, con los valores de tus ajustes.
- **Journaling (pestaña propia).** «Nueva entrada» siempre disponible (varias al día) y acceso a las de hoy; día vivido elegible (de madrugada se propone el de ayer); tipos (Diario, Trabajo, Matutino, Nocturno, Reflexión, Semanal, Deporte, Inglés, General), pregunta guía, ánimo. Con Notion conectado, cada entrada se envía al guardar a la base «📓 Journaling» como fila con Entrada («Journaling dd/mm/aaaa» o «Journaling de trabajo dd/mm/aaaa»), Fecha, Tipo y Estado = Completado, con el encabezado «*(fecha — día)*» y «📝 Tal cual»; los textos largos llegan completos (en bloques de hasta 2000 caracteres). Volver a guardar actualiza la misma página (misma URL); si se editó en Notion después, pregunta antes de reemplazar. «Ordenar con el asistente» corrige solo la ortografía (sin tocar la voz) y arma la versión ordenada: en Trabajo, «🎯 Lo que aprendí hoy», «⚙️ Análisis de eficiencia», «🧱 Qué avancé / entregables» y «▶️ Próximos pasos»; en el resto, «Volcado del día», bloques por área, «Lo que aprendí hoy» y preguntas para cerrar. Se puede seguir escribiendo mientras ordena; si el texto cambia después, avisa. La conexión valida el secreto antes de guardarlo y detecta sola la base cuyo título contiene «Journaling»; las pizarras siguen yendo a la página que elijas.
- **Asistente.** Sabe que todo debe ser SMART; herramientas `agenda_ver`, `agenda_organizar` (hoy o mañana; crea hábitos y tareas que falten; varias «otras cosas» no se pisan), `objetivo_crear` y `objetivo_avance`; el diario que dicta va a Journaling y a Notion.
- **Avisos.** Preferencia «Agenda del día»: 10 minutos antes de cada cosa con hora que siga pendiente («Si son las 3:30 PM, entonces empiezo»), sin duplicar el aviso de un hábito que ya tiene el suyo a esa hora, y a las 9:30 si el día no está organizado. El cierre de las 9 PM propone dejar mañana organizado si aún no lo está.
- **Datos.** `agendaHoy` (día, ítems, eventos ocultos, organizado), `agendaPlan` (mañana), `agendaHist` (21 días) y `objetivos` dentro de `state.enfoque`; fusión entre dispositivos por id y, en el mismo día, un solo ítem por tipo y referencia; ítems quitados con lápida. «Ir a…» funciona también dentro de las hojas.
- **Evidencia.** Locke y Latham (2002) y Doran (1981) para metas específicas; Gollwitzer y Sheeran (2006) para hora y lugar; Harkin et al. (2016) para registrar el avance; Pennebaker y Chung (2011) y Frattaroli (2006) para escribir sobre lo vivido.

## 2.11.0: gratificación con evidencia (neurociencia, psicología y libros de hábitos)

Investigación con informes por área (neurociencia de la recompensa, gratificación instantánea y autocontrol, hábitos y libros como Hábitos atómicos y Tiny Habits, motivación), con citas y verificación. Lo que se aplicó, con la evidencia más sólida y sin diseño de casino:

- **Volver vale más que no fallar.** Hacer un hábito el día después de no hacerlo suma +15 XP «Volviste», y la celebración lo nombra («Volviste. Eso es lo que forma el hábito.»). Igual con las iniciativas: la primera del día después de no llegar al mínimo, +15. Es la intervención ganadora del megaestudio de Penn con 61 293 personas (Milkman et al., 2021, Nature). El aviso del día siguiente dice «Ayer no salió. Hoy, volver vale +15 XP», y el «Hoy no» recuerda que un día no cambia la curva (Lally et al., 2010).
- **Reparar la racha.** En el aviso de «ayer no salió», un toque usa una de las dos justificaciones del mes para que la racha no se rompa (las rachas rotas expulsan: Silverman y Barasch, 2023).
- **Lo que disfrutas al hacerlo.** Campo nuevo en cada hábito; se ve en la ficha, en la celebración (antes que los beneficios a largo plazo) y en el aviso de la hora. Las recompensas inmediatas predicen la persistencia (Woolley y Fishbach, 2017).
- **Sorpresa acotada.** A veces, sin aviso, +10 XP al cumplir un hábito, una tarea o una iniciativa: probabilidad 1 de 6, como mucho dos al día, nunca resta, nunca se compra (error de predicción: Schultz, Dayan y Montague, 1997; incertidumbre leve: Shen, Fishbach y Hsee, 2015; lo inesperado no erosiona la motivación propia: Deci, Koestner y Ryan, 1999).
- **XP honesto.** El XP de cada hábito se gana una vez al día (deshacer y volver a marcar no suma de nuevo).
- **Elogio de la acción, no del rasgo.** Los mensajes de racha nombran lo hecho («3 días seguidos: la señal y la hora funcionan») y ya no presionan con «no rompas la cadena» (Mueller y Dweck, 1998). El asistente también: sin «debes», con razones y opciones.
- **Llevas y te faltan.** La barra de nivel y la de los objetivos dicen «Llevas X de Y» hasta la mitad y «Te faltan Z» después (Koo y Fishbach, 2012).
- **Estoy procrastinando.** En la tarjeta Ahora: cuatro salidas (hazlo más pequeño, recuérdame para qué, ponle hora, quita el teléfono), apuntando a lo concreto que se está evitando (Steel, 2007; Sirois y Pychyl, 2013).
- **Terminar con lo mejor.** Al guardar las tres cosas buenas, el día cierra con la mejor en grande, «Buenas noches» y, si falta, «Dejar mañana organizado» (regla pico-final: Kahneman et al., 1993).
- **Recompensa anunciada antes de empezar** en las sesiones de enfoque (1 XP por minuto, +20 sin interrupciones).
- **Veces que volviste**, en Análisis: lo que predice llegar no es no fallar, es volver.
- **Por qué funciona**: siete entradas nuevas con su cita.


## 2.11.1: correcciones de la segunda revisión

Una segunda revisión adversarial de 2.10.0 y 2.11.0 encontró 20 fallos, todos reproducidos y corregidos, con pruebas automáticas nuevas para cada uno (navegador y avisos).

- **La agenda lee de la fuente.** Si editas la iniciativa, la tarea, el hábito, la prioridad o el plan, la Agenda, «Ahora» y los avisos muestran el texto y la hora nuevos (antes guardaban una copia que quedaba vieja).
- **El plan de la víspera no se pierde con dos dispositivos.** Si otro teléfono abre el día con la agenda vacía, el plan que dejaste anoche se conserva y se aplica; y si terminas «Organizar mañana» pasada la medianoche, ese plan pasa a ser la agenda de hoy.
- **Otra iniciativa empieza de cero.** Al cambiar la iniciativa del día (de la lista, con el asistente o desde la agenda), no hereda el objetivo, la señal de hecho ni el primer paso de la anterior: así no suma avance a un objetivo ajeno.
- **Los objetivos de las tareas cuentan siempre.** Una tarea ligada a un objetivo suma al completarla en Tareas, en la Agenda o con el asistente, y resta si se desmarca, sin contar dos veces.
- **Horas que respetan lo elegido.** La iniciativa que cambias con su hora en el Paso 3 conserva esa hora, y un hábito de las 11 PM no se queda sin hora.
- **«Estoy procrastinando → Ponle hora hoy»** abre «Organizar mi día» sin perder lo que marcas.
- **Avisos más fieles.** El servidor no avisa de lo que borraste o vaciaste, usa el texto y la hora actuales, toma la rana elegida anoche como prioridad del día y avisa de un hábito puesto en la agenda un día que no le toca.
- **Journaling a Notion, sin duplicados ni pérdidas.** Las entradas enviadas desde la 2.9 (que podían compartir la página semanal) ya no aparecen como pendientes ni sobrescriben esa página: si las editas, van como página nueva. Al actualizar, primero se añade lo nuevo y después se archiva lo viejo, así que un fallo a mitad nunca deja la página vacía; Notion se reintenta solo cuando pide esperar, y un fallo pasajero ya no crea una segunda página. Lo que escribes durante un envío queda pendiente (no como enviado), y la versión ordenada que llega en pleno envío sale sola después. Con dos dispositivos, el enlace con Notion no se pierde.
- **«Tal cual» llega tal cual.** El texto propio va como texto plano: los asteriscos y guiones no se convierten en cursivas ni viñetas, y los cortes de 2000 caracteres no parten un emoji.
- **Ordenar con el asistente, también las entradas largas.** Va en streaming y con margen amplio; si una entrada es demasiado larga o el asistente no puede procesarla, lo dice claro.
- **Más seguro.** El ánimo y los avances se normalizan y se escapan, los enlaces solo se abren si son https, y una entrada eliminada mientras se ordena no vuelve. «Desde Notion» (iniciativas) solo necesita el secreto de la integración.

## 2.12.0: todo el plan de la investigación

Un informe final concilió los seis informes de investigación (neurociencia de la recompensa, gratificación instantánea, hábitos y libros, motivación, gamificación, atención y teléfono) y sus notas de verificación: 33 obras verificadas, un plan de 25 funciones (F1–F25), trece reglas de diseño y una lista de mitos que la app no usa. 2.12.0 lo aplica entero, en dos tandas: la primera salió de los seis informes y la segunda la alineó con el informe final. Esto es lo que queda.

### Hábitos: diseño, recuperación y consolidación

- **Un plan corto para mañana.** En «¿Hoy no?», tras «Aun así, hoy no» o «Justificar», la hoja propone una frase ya escrita y editable, «Si mañana a las {hora} {obstáculo}, entonces hago {versión de 2 minutos}», con chips de obstáculo (tus tres «¿Por qué no?» más frecuentes, «estoy cansado», «no tengo tiempo», «se me olvida», «estoy fuera de casa»), «Guardar el plan» o «Sin plan»: «Decidirlo ahora, en frío, hace más fácil volver mañana.» Al día siguiente la tarjeta dice «Ayer no salió. Tu plan: si a las …, entonces …. Volver hoy vale +15 XP.» y el aviso de esa hora lo recuerda; planear no da XP y hay un plan por hábito y día (Gollwitzer y Sheeran, 2006; Sheeran, Listrom y Gollwitzer, 2025; Lally et al., 2010).
- **Esto está pesando.** Con 3 días sin hacer entre los últimos 7 en que tocaba (sin contar justificados ni protegidos), como mucho una vez cada 14 días: «No es falta de voluntad: o la señal no llega o el paso es grande. ¿Qué cambiamos?», con «Bajar a «{versión de 2 minutos}» una semana», «Cambiar la señal» o «Dejarlo igual». Durante esa semana la versión de 2 minutos es el hábito completo (10 XP y suma a la racha); al terminar, con 5 de 7 o más propone subir un poco y, con menos, probar otra señal. La subida de los 14 días seguidos sigue, ahora con fecha: «¿Subes un poco desde el lunes?» (Lally et al., 2010; Fong, Zaleski y Leach, 2015).
- **Crear un hábito con señal.** «¿Cuándo? Elige una señal»: [Después de…] o [A una hora], con hasta 6 chips (tus hábitos de esa franja y «Después del café», «Después de cepillarme», «Al llegar a casa», «Después de comer», «Después de cenar»): «Después de algo que ya haces o a una hora fija: las dos funcionan igual. Lo que cuenta es repetir ante la misma señal.» (Keller et al., 2021); si empieza por «Antes de», sugiere «después de» (Judah, Gardner y Aunger, 2013). La versión de 2 minutos viene escrita según el verbo y nunca queda vacía; sin señal ni hora: «Sin un cuándo, las ganas suelen quedarse en ganas.» Igual en la creación rápida de la Agenda (Gollwitzer y Sheeran, 2006).
- **Ejercicio: más días y plantillas honestas.** Para un hábito de ejercicio con menos de 4 días, la app propone probar 4 días por semana con la versión de 2 minutos: en socios nuevos de gimnasio, la constancia fue lo que mejor predijo el hábito (Kaushal y Rhodes, 2015). Las plantillas de beneficios y contras dicen solo lo que sostienen los estudios: al moverte se libera dopamina, y en un estudio eso se asoció a reacciones más rápidas (Ando et al., 2024; Bastioli et al., 2022). Fuera la cifra de Milne bajo las horas: no tiene fuente verificada.
- **Por gusto, sin XP.** Al crear lectura por placer, música, descanso, oración o lectura de la Biblia, la app sugiere «Lo hago por gusto: sin XP»: sigue contando en la racha, los votos y Análisis (Deci, Koestner y Ryan, 1999).
- **Mañana no puedo.** En la ficha del hábito y desde «¿Hoy no?»: «¿Por qué? Viaje · Turno · Enfermedad · Otro» → «Protegido. Pasado mañana sigues donde lo dejaste.» Como mucho 2 al mes por hábito; no gasta justificaciones, no rompe la racha y el calendario lo pinta en gris (Silverman y Barasch, 2023).
- **Consolidados.** Cada 14 días desde el día 14, cuatro preguntas de 1 a 7 («Lo hago automáticamente · sin tener que pensarlo · sin acordarme conscientemente · antes de darme cuenta»; Gardner et al., 2012) llenan la barra «Consolidación». Con dos chequeos seguidos de media 5,5 o más y el 80 % de los días hechos en las últimas 4 semanas, el hábito se gradúa: se apaga su aviso y pasa a «Consolidados» (al final de la lista, plegado); si baja del 70 % en 14 días, vuelve solo a la lista activa. Los demás conservan el enlace para quitar el aviso a mano.
- **Un horizonte realista.** La ficha dice «La mitad de quienes lo logran tarda unos 2 meses; hay quien tarda 3 semanas y quien tarda bastante más. Lo que cuenta es repetir ante la misma señal.» y, a los 66 votos, «66 votos. A la mitad de la gente le sale solo a los 2 meses: ¿a ti ya te sale?» (Lally et al., 2010). «Dentro de un año» sale del ritmo real de las últimas 4 semanas y nunca aparece en «¿Hoy no?».
- **Solo mientras lo hago me permito…** El placer atado al hábito: si es un enlace http/https, se abre al arrancar el cronómetro («Esta lista es solo para {nombre}.»), y cada 4 semanas la ficha pregunta si el pacto sigue funcionando, porque el efecto decae (Milkman, Minson y Volpp, 2014).
- **Cargar el teléfono fuera del cuarto.** Plantilla de hábito: después de lavarme los dientes; versión de 2 minutos, dejarlo en la cocina (He et al., 2020).
- **Lo que se queda de la primera tanda.** «Siento el impulso de saltarlo» (los contras, la versión de 2 minutos y surfear 90 s), la recompensa que rota y su chequeo cada 14 días, «Mi entorno: qué pongo a la vista y qué quito» (Wood y Neal), la rutina completa (+15 una vez al día), el «Volviste» y las frases de autocompasión de «¿Hoy no?» («Todavía no. ¿Qué cambias mañana?»; Breines y Chen, 2012).

### XP, metas y celebración

- **10 por hábito, 5 por la versión de 2 minutos.** Una vez al día por hábito. Se quitan el XP que crecía con la racha (10, 12, 14), porque empuja a marcar «para no romper» (Moldon, Strohmaier y Wachs, 2021), y el «arranque ×2», un premio grande justo al empezar (Deci, Koestner y Ryan, 1999). Siguen el +15 «Volviste», la sorpresa (1 de 6, como mucho dos al día, solo después de actuar) y «por gusto».
- **Semanas con tu meta.** La tarjeta de XP cuenta semanas, no días seguidos: «Semanas con tu meta: {n} · esta: {d} de 7 días (te falta …)». El quinto día con la meta en una semana de lunes a domingo da +30 XP la primera, +40 la segunda seguida y +50 desde la tercera; una semana sin bono no resta y la siguiente vuelve a +30. «Cinco de siete: dos días libres por semana, sin romper nada.» (Mehr et al., 2025; Kivetz, Urminsky y Zheng, 2006).
- **Tareas con tope.** +5 por tarea hasta 50 al día; después cuentan igual, sin XP. «Lo que más suma es terminar lo importante: la rana, las tres prioridades y el enfoque sin interrupciones.» (Cerasoli, Nicklin y Ford, 2014). Las prácticas de Bienestar también pueden ir «por gusto».
- **Celebración a la medida.** Pantalla completa solo en el primer hábito del día, en «Volviste», en las rachas de 7, 14, 30 y 100 días y al graduarse un hábito; el resto, un check, una vibración corta y un aviso de un segundo que describe lo hecho («+10 XP · Leer · 3.er día esta semana»). Ajustes de Hábitos: «Celebración: Completa · Discreta · Solo datos»; el día 14 de uso la app pregunta una vez si la celebración ayuda o interrumpe. Doce frases por tramo de racha que no se repiten dos días seguidos; un hábito «por gusto» se celebra sin número («Bien elegido.») (Kluger y DeNisi, 1996; Bunzeck y Düzel, 2006).
- **Día corto, bajada y día protegido.** En un día corto la meta baja un 30 % (redondeada a 10) y el bonus de las tres prioridades llega con dos; durante una bajada, la versión de 2 minutos vale los 10 XP completos; y hacer el hábito después de un día protegido no es un «Volviste», porque no hubo fallo.
- **Progreso dotado honesto.** Un hábito nuevo enseña «Ya llevas 3 de 12: el hábito está diseñado (señal, plan y versión de 2 min).», con una barra hasta 12; al subir de nivel, el siguiente tramo («Lo cierras hoy si llegas a tu meta») y una línea de historia basada en actos (Nunes y Drèze, 2006).
- **El XP informa.** Ningún aviso push menciona XP, y dentro de la app solo se anuncia antes en los minutos de enfoque y en el +15 de volver.

### Enfoque, teléfono, sueño y cierre

- **Un cambio en tu teléfono por semana.** Al abrir Enfoque con todo sin configurar: «Antes de empezar, un cambio de un minuto: quita las redes de la pantalla de inicio…», con «Hecho» o «Más tarde». «Configura tu teléfono» tiene 10 pasos, entre ellos «No molestar en tus bloques de enfoque», «Grises desde las 9:00 PM» y «Quitar los numeritos de las redes», con la ruta en Android y en iPhone; +10 XP la primera vez que se marca cada uno, y la revisión semanal propone solo el siguiente pendiente (Olson et al., 2022; Stothart, Mitchum y Yehnert, 2015).
- **Cierre del día en orden pico-final.** Primero «Hoy avanzaste en…» (hasta 5 cosas hechas y los minutos de enfoque) o, si no hay ninguna, una cosa de 2 minutos; una sola línea gris, «Quedó para otro día»; después «Tres cosas buenas», cada una con su «¿Por qué pasó?» opcional; y al final «Lo mejor de hoy», el pacto de redes de mañana y «Liberaste X min» (Redelmeier, Katz y Kahneman, 2003; Seligman et al., 2005).
- **Día corto tras una mala noche.** Antes de las 12 PM, la tarjeta de XP pregunta «¿Cuánto dormiste? Menos de 6 h · 6–7 h · 7 h o más» (se puede ignorar; tres días ignorada, descansa una semana). Con menos de 6 h o uso entre la medianoche y las 5 AM: «Dormiste poco. La atención falla más aunque no lo notes: hoy, plan corto.» El plan corto pone sesiones de 25 min, la versión de 2 minutos primero, la siesta de 20 min desde las 2 PM, y sugiere no estrenar hábitos ese día (Lim y Dinges, 2010: en lapsos de atención, g = −0,78).
- **Con estrés, una sola cosa.** Con ansiedad en la puerta o en el plan de rescate, tras el minuto de suspiro cíclico: «Con estrés se planifica peor. Haz solo esto:» y un único botón con la versión de 2 minutos del hábito clave (Arnsten, 2009).
- **Pausas que restauran.** Tras 25 min o más, «Pausa de 5 min sin pantalla: estira o mira lejos.»; con 90 min de enfoque antes de las 2 PM, «Una pausa de 20 min ahora: la fatiga se acumula aunque no la notes.»; y el descanso «Mirar verde 1 min» (Albulescu et al., 2022; Lee et al., 2015). El medidor de naturaleza de Bienestar cuenta los minutos, sin meta fija.
- **La puerta.** «Mejor no» es el botón principal y lleva a una sola cosa de «Ahora»; desde la 3.ª apertura del día pide «Escribe para qué, en tres palabras»; al volver, «Al soltarlo: …» con [Empezar 25 min]; y el pie fijo «La puerta se queda: es tu seguro, no un castigo.» (Grüning, Riedel y Lorenz-Spreen, 2023; Kim et al., 2019). Siguen de la primera tanda las emociones con ruta (aburrimiento, ansiedad), «¿Valió la pena?» al volver de distraerte (querer no es disfrutar: Berridge y Robinson, 1998) y surfear el impulso midiendo antes y después (Bowen y Marlatt, 2009).
- **Compártelo.** En la revisión semanal: «¿A quién se lo cuentas? Una sola persona», con el mensaje ya escrito desde tu semana real y «Enviar a {nombre}». «Anotarlo y contárselo a alguien ayuda a cumplir: lo mostraron 138 experimentos.» (Harkin et al., 2016). Compartir no da XP ni hay rankings.
- **Presupuesto desde tu dato real.** La revisión semanal pide tu estimación y el dato de Bienestar digital, y propone una hora menos al día; «Día dentro de tu presupuesto: +10 XP» y pasarse no resta («Mañana empieza de cero.»). El reto de redes es un «reto de 3 semanas» y se cuenta «semana X de 3»: reducir sirve tanto como dejarlo, y el efecto medio es pequeño (Parry et al., 2021; Burnell et al., 2025).
- **Tus datos que te prueban qué funciona.** Cada comparación aparece con 5 datos o más por grupo: sesiones con y sin interrupciones, planes para volver («volviste el x % de las veces; sin plan, el y %»), noches con el teléfono fuera del cuarto, semanas que compartiste. «Es tu dato, no una ley: con pocos días puede cambiar.» (Harkin et al., 2016).
- **Nota de vuelta.** Al terminar una sesión: «¿Dónde lo dejas? · ¿Qué harás primero al volver?», y la siguiente sesión sobre eso lo enseña (Leroy, 2009; Leroy y Glomb, 2018).
- **Página nueva.** El lunes, el día 1, el cumpleaños (se pide una vez) y el primer día tras 5 o más sin abrir la app, con los hábitos parados 7 días o más y [Retomar con 2 min]; tras una ausencia: «Volviste a la app. No hace falta ponerse al día: elige una sola cosa para hoy.» (Dai, Milkman y Riis, 2014).
- **Moverse antes de lo difícil.** Tras marcar un hábito de ejercicio, «Ahora» propone la rana: «Después de moverte, tu cabeza rinde algo mejor durante un rato.»; si hoy no hubo movimiento, «Primero 10 min de paseo rápido; luego tu prioridad 1.»; y la sesión puede empezar con «Antes, 10 min caminando rápido» (Chang, Labban, Gapin y Etnier, 2012: efecto pequeño, g ≈ 0,1).
- **Noches sin teléfono en el cuarto.** Hora de dormir en Ajustes, «Hora de soltar el teléfono» desde 30 min antes, la pregunta de la mañana y el recuento semanal «Noches sin teléfono en el cuarto: {n} de 7.», sin racha diaria (He et al., 2020; Chang et al., 2015).
- **Teléfono fuera de tu alcance.** Las sesiones, «Ahora» y los descansos dicen «Activa No molestar y deja el teléfono fuera de tu alcance» en lugar de «boca abajo»: por fricción, porque lo que cuesta es recibir avisos y usarlo, no su mera presencia (Stothart, Mitchum y Yehnert, 2015).
- **Lo que se queda de la primera tanda.** El pacto de esta noche (el máximo de redes de mañana, decidido la víspera; Bryan, Karlan y Nelson, 2010), rehacer el WOOP cuando un proyecto lleva 7 días quieto (Stadler, Oettingen y Gollwitzer, 2009), el teléfono guardado en los planes (Dwyer, Kushlev y Dunn, 2018), «Ahora» con lo que dejaste a medias (Ghibellini y Meier, 2025), la versión corta con poca energía (Salamone y Correa, 2012) y la meta de cada sesión con su «¿Lo lograste?».

### Agenda y objetivos

- **Bloque protegido.** En las mañanas elegidas (por defecto lunes, miércoles y viernes; chips L M X J V S D en la pestaña Agenda), «Organizar mi día» ya trae «Bloque protegido · {hora}–{fin} · Prioridad 1: {texto}», de 50 a 90 min antes de las 12 PM, editable y quitable en el mismo paso: «Los avisos de la app callan en este bloque. Activa también No molestar.» «Organizar mañana» usa la rana, y la revisión semanal cuenta «Bloques protegidos: x de y.» (Perlow, 1999).
- **Día corto al organizar.** Si aún no respondiste, el paso 1 pregunta cuánto dormiste; en un día corto preselecciona las iniciativas solo hasta el mínimo, propone bloques de 25 min y pone primero las versiones de 2 minutos.
- **Ritmo de cada objetivo.** «Vas a {x} por semana (últimas 2 semanas); necesitas {y} para llegar el {fecha}», en la ficha y, en corto, en la lista (Harkin et al., 2016).
- **Lo planeado y lo hecho.** «Últimos 7 días: planificaste N, hiciste M (P %)» y, si un tipo destaca, «Lo que más se queda sin hacer: …» (DellaVigna y Malmendier, 2006).
- **Progreso dotado honesto.** Un objetivo nuevo empieza con «1 de N: definirlo ya es el primer paso.», y la barra de «Organizar mi día» llena el 40 % con el paso 1 (Nunes y Drèze, 2006; Villar, Callegaro y Yang, 2013).
- **Sin «ridículo».** La agenda vacía dice «Dos minutos y lo importante queda con hora.».

### Avisos

- **Tu razón y una elección.** Cada aviso dice para qué y deja elegir, sin imperativos, sin XP y con 3 opciones como mucho: «{hábito} · tu espacio de las 7:00 AM» / «{tu razón}. ¿Completo, la versión de 2 min ({versión}) o lo mueves?», con lo que disfrutas delante. Igual las iniciativas, la prioridad del mediodía, el día sin agenda, los 10 minutos antes de algo de la agenda («Si son las 3:30 PM, entonces empiezo: No molestar y el teléfono lejos.»), el momento espiritual, el cierre de las 9 PM con lo que tienes reservado mañana, el plan para volver («Si a las …, entonces: …. Cuenta igual para la racha.») y «Hora de soltar el teléfono» (Legault, Gutsell e Inzlicht, 2011; Milkman et al., 2021, PNAS).
- **Presupuesto de avisos.** Como mucho 4 al día por defecto (de 2 a 8), con el pie «(aviso i de 4 de hoy)»: primero lo que tiene la hora que elegiste, después el resumen de la mañana; lo que no tiene hora sale junto, en un solo aviso, al empezar tu siguiente ventana de revisión; nada durante una sesión de enfoque, un evento o un bloque protegido; y como mucho uno al día cuyo único fin sea volver a la app (Stothart, Mitchum y Yehnert, 2015; Fitz et al., 2019).
- **Lo que no sirve se pausa.** Un aviso ignorado 3 días seguidos en la misma franja (ni se abre ni se marca el hábito en 30 min) se pausa ahí, y Enfoque pregunta una vez: «¿Te viene mejor a otra hora? [Mover] · [Quitarlo] · [Dejarlo]». La app anota qué avisos se abren para saberlo (Bidargaddi et al., 2018).
- **El aviso del hábito se retira.** Diario las semanas 1 a 3 desde que se creó el hábito, en días alternos las semanas 4 a 6 y después solo si baja del 70 % en 14 días; nunca para un hábito graduado o sin aviso (Stawarz, Cox y Blandford, 2015).

### Textos, «Por qué funciona» y asistente

- **Catorce entradas nuevas con cita verificada**, al principio de «Por qué funciona»: un día no rompe el hábito, un plan para volver, reparar y proteger la racha, premios que crecen con la constancia, empezar con algo hecho, XP que informa, avisos que dejan elegir, cada aviso cuesta atención, día corto tras una mala noche, moverse antes de lo difícil, el final cuenta, sin «ayuno de dopamina», votos sin porcentajes y volver es lo que cuenta.
- **Correcciones.** La nota de one sec («uno de los autores (Riedel) creó one sec; el estudio no tuvo grupo de control»); el presupuesto de 30 minutos sin «y solo con una semana o más» y con la réplica fallida de 2026 (Bradley et al., 2026); Sheeran, Listrom y Gollwitzer (2025); una sola «Registrar el avance»; el perdón de «Estoy procrastinando» como lo dice el estudio (Wohl, Pychyl y Bennett, 2010); «unos 400 estudios, según los autores» en Metas SMART; y en «Tres ventanas», la nota sobre Ariely (coautor de Fitz et al., pendiente de comprobar que no esté retirado) y lo de apagar todos los avisos (Dekker et al., 2025).
- **Toda cifra con cita verificada.** Las entradas con fuentes sin verificar dicen el hallazgo sin la cifra; fuera las que repetían un hallazgo (pico y final, «si… entonces», WOOP, surfear, nuevo comienzo, Ovsiankina, ejercicio, activación conductual), y dos pasan a lo suyo: decidir en frío la víspera (Laibson, 1997) y el feedback sobre la tarea, no sobre la persona (Kluger y DeNisi, 1996). La cabecera dice: «Solo hay cifras cuando su fuente está comprobada. Los efectos suelen ser pequeños o medianos: pruébalo y mira tus datos.»
- **Sin mitos.** Ni «21 días» (el reto de redes es «de 3 semanas» y se cuenta por semanas), ni «ayuno» o «detox de dopamina», ni «la voluntad se agota», ni «23 minutos», ni «un par de horas» de mejor cabeza tras el ejercicio, ni «tu atención falla el doble». Los textos de ayuda y las etiquetas tampoco anuncian XP antes de actuar (las iniciativas, la prioridad extra) ni usan cifras sin verificar (el presupuesto, las ventanas, la misión social).
- **El asistente sigue las reglas.** Sin «debes», «tienes que», «no olvides», «no rompas la racha», «fallaste», «sin excusas», «fuerza de voluntad», «disciplinado» ni «eres un crack»; nombra la acción y atribuye el fallo al plan o al entorno; no promete XP ni resultados; propone el día corto tras una mala noche o con estrés, el plan «si… entonces» para volver, el cierre en orden y dejar mañana organizado, y avisos con «tu razón + una elección»; y habla de lo que el teléfono desplaza, nunca de «detox».

### Lo que no se construye

- **Ni casino ni pérdidas.** Nada de cofres, sorteos ni «habrías ganado» (el azar anunciado da más ganas de jugar, no más conducta), ni retos con puntos que bajan, ni votos regalados al crear un hábito, ni XP doble los primeros días o creciente con la racha diaria, ni normas sociales inventadas, rankings o insignias, ni retos de 30 días como «reinicio» (Deci, Koestner y Ryan, 1999; Mehr et al., 2025).

### Integración

- **Las prioridades pagan su XP una sola vez**, como las iniciativas: desmarcar y volver a marcar ya no lo repite.
- **Descansos con tope**: hasta 30 XP al día por minutos y el +10 de completarlo sin mirar el teléfono, una vez al día.
- **La sesión de tu cuenta no se pierde** si la renovación del acceso llega incompleta: se conserva y se reintenta.
- **El plan para volver no avisa** si el día del «Hoy no» lo terminaste haciendo.
- **Textos que no afirman de más**: el perdón de «Estoy procrastinando» como lo dice el estudio (correlacional; Wohl, Pychyl y Bennett, 2010) y el aviso de fin de sesión sin imperativos.

### Lista de control antes de cada versión

- [ ] «Hoy no», «Abrir igual» y apagar un aviso se ven siempre y cuestan un toque. Pueden ser secundarios, nunca estar escondidos.
- [ ] Ningún texto avergüenza ni culpa.
- [ ] No hay urgencias falsas ni cuentas atrás.
- [ ] No hay nada preseleccionado que la persona no vea y no pueda cambiar en el mismo paso. Los valores por defecto (versión de 2 min, hora propuesta, bloque protegido) se ven y se editan ahí mismo.
- [ ] Las reglas del XP están completas en «Cómo se gana XP»; nada se compra.
- [ ] No hay recompensas al azar al abrir la app, en la puerta, en «Hoy no» ni en los avisos.
- [ ] Cada aviso nuevo dice qué preferencia lo apaga y entra en el tope diario.
- [ ] Prueba de Eyal: ¿lo usaría yo? ¿Me mejora la vida? ¿Funciona igual aunque abra menos la app?
- [ ] Cada cifra nueva en «Por qué funciona» tiene una cita verificada.
