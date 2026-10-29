# Habit Tracker

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
