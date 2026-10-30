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
