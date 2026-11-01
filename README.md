# Organización Personal

Antes «Habit Tracker» (la dirección y los datos no cambian). 
Tracker de hábitos minimalista: rachas, rutinas, calendario con justificaciones y
beneficios/contras por hábito. Un solo archivo, sin dependencias.

Desde 2.7.0 abre en **Enfoque**: herramientas basadas en estudios para usar menos el teléfono,
erradicar el FOMO y tomar la iniciativa (prioridades del día, puerta con espera antes de las redes,
sesiones de enfoque, personas y planes, proyectos con WOOP, misiones sociales, iniciativa laboral,
intervenciones según el momento y «Tus datos»). Las fuentes están en la propia app («Por qué funciona»)
y en `IDEAS.md`. Las **Tareas** se sincronizan con **Google Tasks** en los dos sentidos (se conecta con
un ID de cliente propio de Google Cloud; los pasos están en la app).

Se instala desde Chrome («Instalar aplicación») y funciona sin conexión. Los datos
se guardan en el teléfono; «Guardar copia» exporta todo a un archivo .json.
Con una cuenta (correo y contraseña) el progreso se sincroniza entre teléfonos a
través de Supabase; `supabase.sql` prepara la tabla una sola vez.

Desarrollada con Claude a partir de *Hábitos Atómicos* y otros libros; el banco de
ideas vive en [Gads4532/Skills](https://github.com/Gads4532/Skills/tree/main/apps/habit-tracker).

Desde 2.8.0 se llama **Organización Personal** (brevemente fue «Rumbo») y tiene un **Asistente** (pestaña propia) que usa la API de Claude con la clave
de cada persona (solo en su teléfono): conversa, revisa el día y coordina la app con herramientas (prioridades,
tareas, proyectos, personas, planes, sesiones de enfoque y Google Calendar). El SDK oficial
(`@anthropic-ai/sdk` 0.134.0) va empaquetado en `vendor/` para que funcione sin CDN.
**Google Calendar**: la pestaña Enfoque muestra la agenda de hoy, los planes se crean directamente en el
calendario y el asistente puede ver y crear eventos (requiere activar la API de Google Calendar en el proyecto
de Google Cloud).

**Notion**, **XP** y **notificaciones** (2.9.0): el diario y las pizarras se envían a Notion a través de la función `supabase/functions/notion`; cada acción suma XP con niveles y meta diaria; y una tarea programada de GitHub (`.github/workflows/notificaciones.yml`) envía avisos push aunque la app esté cerrada (necesita `push.sql` en Supabase y los secretos `SUPABASE_SERVICE_KEY` y `VAPID_PRIVATE_KEY`). Detalles en `IDEAS.md`.

**Agenda, SMART y Journaling** (2.10.0): la pestaña **Agenda** junta en una lista con hora los hábitos de hoy, las tareas, las 5 iniciativas, las prioridades, los planes y los eventos del calendario; «Organizar mi día» la arma en cuatro pasos con todo preseleccionado (y crea hábitos y tareas en el momento); desde las 6 PM se puede dejar mañana organizado, y al día siguiente aparece solo. «¿Día sin rumbo?» ofrece esa versión breve además del plan de rescate. Todo lo que entra es **SMART** (específico, medible, alcanzable, relevante y con tiempo): plantillas por categoría de iniciativa, un formulario propio por categoría que compone el título y la señal de hecho, un indicador S·M·A·R·T en cada ítem, **objetivos** de semanas o meses con métrica, fecha límite y avance, y una ficha de XP que explica qué pide cada nivel. La pestaña **Journaling** envía cada entrada a la base «📓 Journaling» de Notion con fecha, tipo y estado, y el asistente puede ordenarla (lo aprendido, eficiencia, avances y próximos pasos). El asistente tiene herramientas para ver y organizar la agenda y para crear objetivos y registrar avances; los avisos push recuerdan cada cosa de la agenda 10 minutos antes.

**Gratificación con evidencia** (2.11.0): volver tras un fallo vale +15 XP (Milkman et al., 2021, Nature) y la racha se puede reparar; cada hábito guarda lo que disfrutas al hacerlo; una sorpresa acotada de XP (1 de 6, máximo dos al día); XP de hábito una vez al día; mensajes que elogian la acción; «llevas/te faltan» en las barras; «Estoy procrastinando» con cuatro salidas; cierre del día con lo mejor; y «veces que volviste» en Análisis. Detalles y citas en `IDEAS.md`.

**Correcciones** (2.11.1): la agenda sigue el texto y la hora de cada hábito, tarea o iniciativa aunque los edites; el plan de la víspera no se pierde con dos dispositivos ni pasada la medianoche; los avisos no recuerdan lo que borraste; y el envío del Journaling a Notion reintenta cuando Notion pide esperar, nunca deja una página vacía ni la duplica, no toca las páginas semanales de la 2.9 y manda «Tal cual» como texto plano. Detalles en `IDEAS.md`.

**Todo el plan de la investigación** (2.12.0): un informe final concilió los seis informes de investigación y sus verificaciones en 25 funciones y trece reglas, y la app las aplica: un plan corto «si… entonces» para volver tras cada «Hoy no», días protegidos, bajar un escalón cuando un hábito pesa, crear cada hábito con una señal y su versión de 2 minutos, hábitos «por gusto» sin XP, consolidación por automaticidad (el hábito se gradúa y su aviso se retira), semanas con tu meta (+30, +40, +50) en vez de una racha diaria que se rompe, celebración a la medida, día corto tras una mala noche, cierre del día en orden pico-final, pausas sin pantalla, una puerta que pregunta para qué, compartir la semana con una persona, presupuesto desde tu dato real, «Tus datos» que comparan lo que te funciona, bloque protegido en la Agenda y avisos con tu razón y una elección, con tope diario, en lotes y callados durante el enfoque. «Por qué funciona» solo da cifras con cita verificada y no usa mitos como los «21 días». Detalles y citas en `IDEAS.md`.

**Identidad** (2.13.0): la pestaña, primera en la barra y vista de inicio por defecto, donde defines hasta seis identidades («Soy una persona que …»); cada hábito, objetivo, proyecto, iniciativa, prioridad y práctica puede votar por una, y los votos se cuentan desde lo que de verdad hiciste, sin porcentajes ni promesas (la identidad por sustantivo no se replicó; lo que se sostiene es que las metas que encajan con lo que valoras se persiguen con más constancia: Sheldon y Elliot, 1999). Desde ahí se llega a todo: «Un voto ahora» con la acción de 2 minutos, atajos a Hábitos, Objetivos, Proyectos, Iniciativas y Bienestar, «Añadir…» con la identidad ya puesta, «Traer de tus hábitos» y «Empezar desde la base» en tres pasos. Detalles y fuentes en `IDEAS.md`.

**Bienestar** (pestaña): mente (mindfulness y herramientas cognitivas con evidencia) y espíritu (vida cristiana práctica) juntos, con prácticas guiadas de 1 a 15 minutos y escenarios (esperanza, consolación, confianza, paz, fortaleza, dirección, perdón, gratitud) que unen la Palabra, una oración guiada y una herramienta para la mente. **Ahora**: en Enfoque siempre hay una cosa siguiente con propósito, y el descanso también se elige (descanso con propósito). Detalles y fuentes en `IDEAS.md` y en la app («Por qué funciona»).
