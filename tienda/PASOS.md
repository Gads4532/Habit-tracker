# Subir Habit Tracker a Google Play (paso a paso)

La app de la tienda es un envoltorio (Trusted Web Activity) que abre
https://gads4532.github.io/Habit-tracker/ a pantalla completa. Cada vez que se
publica en GitHub, la app de la tienda se actualiza sola.

## 1. Cuenta de desarrollador (una vez)
1. https://play.google.com/console → «Crear cuenta» → cuenta personal.
2. Pago único de 25 USD con tarjeta y verificación de identidad con documento.
3. Verifica correo y teléfono. Puede tardar 1–2 días en aprobarse.

## 2. Generar el paquete Android
1. Entra en https://www.pwabuilder.com y pega `https://gads4532.github.io/Habit-tracker/`.
2. «Package for stores» → Android. Opciones:
   - Package ID: `io.github.gads4532.habittracker`
   - App name: Habit Tracker · Launcher name: Habit Tracker
   - Display mode: Standalone · Status bar y nav bar: #0e0e0e
   - Signing key: «Create new» (PWABuilder genera la clave)
3. Descarga el zip. Dentro hay:
   - `app-release-bundle.aab` → esto se sube a Play
   - `signing-key.keystore` + contraseñas → **guárdalos en un sitio seguro para siempre**
   - `assetlinks.json` con la huella SHA-256 ya puesta

## 3. Verificación del dominio
1. Crea en GitHub un repositorio público llamado exactamente `gads4532.github.io`.
2. Sube ahí el archivo en la ruta `.well-known/assetlinks.json` (el de PWABuilder,
   o `tienda/assetlinks.json` con la huella pegada).
3. Comprueba que abre: https://gads4532.github.io/.well-known/assetlinks.json
Sin esto la app abre con la barra de Chrome visible.

## 4. Crear la app en Play Console
1. «Crear app» → nombre Habit Tracker · Aplicación · Gratis · español.
2. Ficha de la tienda: textos de `ficha.md`, icono `../icon-512.png`,
   portada `portada-1024x500.png`, capturas `captura-*.png`.
3. Política de privacidad: https://gads4532.github.io/Habit-tracker/privacidad.html
4. Contenido de la app: Seguridad de datos, Clasificación, Público objetivo,
   Anuncios (no), Acceso a la app (sin restricciones). Respuestas en `ficha.md`.

## 5. Prueba cerrada obligatoria (cuentas nuevas)
1. Pruebas → Prueba cerrada → crear versión → subir el `.aab`.
2. Añade al menos **12 testers** por correo (Gmail) y comparte el enlace.
3. Deben instalarla y mantenerla **14 días**. Luego pide «Solicitar acceso a producción».

## 6. Producción
Producción → crear versión → el mismo `.aab` → revisar y publicar.
La revisión de Google tarda de horas a 7 días.

## Actualizar después
- Cambios en la app: solo publicar en GitHub, como hasta ahora. Nada que subir.
- Solo hay que subir un `.aab` nuevo si cambia el icono, el nombre o el package ID.
