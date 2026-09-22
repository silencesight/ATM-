# English Classroom Credit Cards — Offline Edition

Sistema didáctico de tarjetas de crédito y préstamos para el aula de
inglés, con devolución de préstamos mediante tareas y control del
profesor.

Esta app corre **enteramente en tu propia computadora**. No llama a
ningún servicio de IA en línea y no necesita internet para funcionar
— solo lo necesitó una vez, para descargar sus componentes.

## En Windows (recomendado): solo 2 pasos

**Paso 1 — Instalar (una sola vez, necesita internet):**
Haz doble clic en **`1_INSTALAR (una sola vez).bat`**.
Esto descarga lo necesario, compila la app y crea automáticamente un
ícono **"Credit Card App"** en tu Escritorio. Al terminar, abre la app
por ti.

Si no tienes Node.js instalado, el script te lo va a pedir con un
enlace a https://nodejs.org — instálalo (Next, Next, Finish) y vuelve
a hacer doble clic en el mismo archivo.

**Paso 2 — Usar la app (todas las veces siguientes, SIN internet):**
Haz doble clic en el ícono **"Credit Card App"** de tu Escritorio
(o directamente en **`2_ABRIR_APP.bat`**).

Eso es todo. No vuelvas a necesitar internet ni a tocar los otros
archivos.

> Truco: haz clic derecho sobre el ícono del Escritorio para anclarlo
> al Inicio o a la barra de tareas de Windows.

## En Mac / Linux

1. Instala Node.js si no lo tienes: https://nodejs.org
2. Abre una terminal en esta carpeta y ejecuta:
   ```
   npm install
   npm run build
   npm run preview
   ```
   Abre la dirección que aparece (normalmente `http://localhost:4173`).

## Tus datos

- Todo (estudiantes, préstamos, historial de crédito) se guarda
  automáticamente en el almacenamiento local del navegador con cada
  acción — no necesita internet.
- Dentro de la app, ve a **Configuración → Respaldo de datos** en
  cualquier momento para descargar un archivo `.json` de respaldo, o
  para restaurar uno. Hazlo con regularidad, y siempre antes de borrar
  los datos del navegador o de cambiar de computadora.
- Usa siempre el mismo ícono/comando para abrir la app: los datos están
  ligados a esa dirección del navegador (`http://localhost:4173`).

## Notas técnicas

- Las fuentes personalizadas (Cinzel, Outfit, Space Mono) se cargaban
  originalmente desde Google Fonts; eso se eliminó para que la página
  no haga ninguna solicitud de red. La app usa fuentes del sistema
  como respaldo automático — se ve casi idéntica.
- El SDK `@google/genai` y la `GEMINI_API_KEY` de la plantilla
  original de AI Studio nunca fueron usados por el código de esta app,
  así que se eliminaron junto con los paquetes `express`/`dotenv` que
  no se usaban.
- Si por algún motivo `npm run preview` no funciona en tu equipo,
  puedes abrir manualmente el archivo `dist/index.html` con Firefox
  (Chrome y Edge no permiten abrir apps de este tipo con doble clic
  directo por una restricción de seguridad propia del navegador,
  por eso el script usa un pequeño servidor local).
