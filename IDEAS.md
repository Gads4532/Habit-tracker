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
- **Motivo de un día no hecho**: en «Hoy no» hay un campo opcional «¿Por qué no?», y en el calendario, al tocar un día rojo, se puede apuntar qué pasó (o justificarlo si quedan). El día sigue en rojo: el motivo es solo para entenderte en Análisis. ✅
- **Animaciones en tareas**: al completar, el círculo rebota con resorte, el check se dibuja, una línea tacha el título y la fila se recoge hacia Completadas; las nuevas entran deslizándose y, al vaciar la lista, sale «Todo hecho. Lista limpia». ✅
- **Identidad en la tarjeta**: bajo cada hábito, «N votos · Soy una persona que…» en vez del multiplicador 1,01ⁿ. ✅
- **Canción de Spotify al completar**: conectas tu Spotify (app gratuita en developer.spotify.com + Client ID, una vez), eliges una canción por hábito y, al marcarlo, la app le pide a tu Spotify que la reproduzca en el teléfono (Spotify Connect; hace falta Premium y la app de Spotify abierta o reciente). Si no puede, la celebración ofrece abrirla en Spotify. ✅
- **Hora en 12 h**: hora, minutos y un botón AM | PM. ✅
- **Racha en el dashboard**: cada hábito lleva su fueguito con los días seguidos. Arriba a la derecha está la racha general (días seguidos con al menos un hábito hecho) y el % de acierto de los últimos 7 días. ✅
- **Animaciones con física real**: resortes de verdad (`linear()` de CSS con masa, rigidez y amortiguación), no curvas aproximadas. La celebración sigue la secuencia de Duolingo: anticipación (fuego gris que se posa), squash & stretch al encenderse, sunburst tenue y chispas de brasa en canvas con gravedad, contador que rueda con resorte, día de la semana que se rellena con un anillo, y cascada final. Un solo color sobre fondo limpio. Se apagan solas con «reducir movimiento». ✅
- **Calendario**: una pestaña con el mes de cada hábito. Los días salen en verde (hecho; verde suave si fue la versión de 2 min), rojo (no hecho) o gris (justificado). Debajo están el % de acierto del mes, los días hechos y las justificaciones que te quedan. ✅
- **Justificaciones**: 2 al mes por hábito. Tocas un día rojo, escribes el motivo y queda en gris sin romper la racha. También se puede justificar hoy desde «Hoy no». ✅
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
