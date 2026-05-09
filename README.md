# Piedra, Papel o Tijera Interactivo (con IA)

¡Bienvenido al juego interactivo de Piedra, Papel o Tijera! Este proyecto utiliza inteligencia artificial y visión por computadora para detectar los gestos de tu mano a través de tu cámara web y jugar en tiempo real contra la computadora.

## 🚀 Tecnologías Utilizadas

Este proyecto es una aplicación web del lado del cliente (Frontend) y utiliza las siguientes tecnologías:

- **HTML5, CSS3 y JavaScript (ES6):** Estructura, estilos y lógica del juego.
- **[Google MediaPipe (Tasks Vision)](https://developers.google.com/mediapipe):** Modelos de Machine Learning (IA) preentrenados que se ejecutan directamente en tu navegador para detectar y clasificar gestos de manos (`GestureRecognizer`).
- **[Material Components Web](https://m3.material.io/):** Utilizado para el diseño de botones y elementos de interfaz limpios.
- **APIs Nativas del Navegador (`getUserMedia`):** Para acceder al flujo de video de las webcams disponibles de manera fluida y permitir la selección multicámara.

## 📋 Requisitos Previos

Para ejecutar este proyecto de forma local, **debes utilizar un servidor web local**. 

> [!WARNING]
> Si abres el archivo `index.html` dándole doble clic directamente desde tu explorador de archivos (usando el protocolo `file://`), **el juego no funcionará**. Los navegadores modernos bloquean el acceso a la cámara web y la carga de módulos ES6 (`<script type="module">`) por motivos de seguridad (Políticas CORS).

## 🛠️ Cómo ejecutar el proyecto localmente

Puedes usar cualquiera de las siguientes opciones para levantar un servidor local y jugar:

### Opción 1: Usando Visual Studio Code (Recomendado)
1. Abre la carpeta del proyecto (`PPT`) en Visual Studio Code.
2. Instala la extensión **Live Server** (por Ritwick Dey).
3. Haz clic derecho sobre el archivo `index.html` y selecciona **"Open with Live Server"**.
4. Tu navegador se abrirá automáticamente en una dirección como `http://127.0.0.1:5500`.

### Opción 2: Usando Python
Si tienes Python instalado en tu computadora, puedes levantar un servidor con un solo comando:
1. Abre tu terminal.
2. Navega hasta la carpeta del proyecto:
   ```bash
   cd /ruta/a/tu/carpeta/PPT
   ```
3. Ejecuta el siguiente comando:
   ```bash
   python3 -m http.server 8000
   ```
   *(Si usas Windows o una versión antigua de Python, intenta con `python -m http.server 8000`)*
4. Abre tu navegador web y entra a [http://localhost:8000](http://localhost:8000).

### Opción 3: Usando Node.js (npx)
Si tienes Node.js instalado, puedes usar el paquete `serve`:
1. Abre tu terminal en la carpeta del proyecto.
2. Ejecuta:
   ```bash
   npx serve .
   ```
3. Abre la dirección web que te indica la consola (generalmente `http://localhost:3000`).

## 🎮 Cómo Jugar
1. Abre la aplicación en tu servidor local.
2. Concede los **permisos de cámara** cuando el navegador te lo solicite.
3. Elige tu cámara preferida en el menú desplegable (útil si tienes múltiples webcams).
4. Haz clic en **"Empezar"**.
5. Sigue la cuenta regresiva en pantalla ("Piedra... Papel... o Tijeras... 1... 2... 3... ¡Ya!") y muestra tu gesto a la cámara. ¡Suerte!
