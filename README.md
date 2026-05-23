# 🪨📄✂️ Piedra, Papel o Tijera IA - MediaPipe Hand Tracking

¡Bienvenido al juego interactivo de **Piedra, Papel o Tijera** potenciado por visión computacional! Esta aplicación web corre directamente en tu navegador y utiliza inteligencia artificial para detectar y clasificar en tiempo real los gestos de tu mano, permitiéndote jugar partidas dinámicas contra un oponente virtual.

El repositorio oficial de este proyecto se encuentra en: **[https://github.com/maureenbarahona/piedra-papel-tijera-mediapipe](https://github.com/maureenbarahona/piedra-papel-tijera-mediapipe)**

La versión del juego desplegada en producción y jugable de forma gratuita en la nube es:
👉 **[https://ppt-mediapipe-ia-mb.web.app](https://ppt-mediapipe-ia-mb.web.app)**

---

## 🚀 Características Clave

### 1. Interfaz de Pantalla Dividida y Diseño Prémium
- **Diseño Glassmorphism:** Estética moderna de ciencia ficción utilizando fondos semitraslúcidos con desenfoque de fondo (`backdrop-filter: blur(16px)`), bordes luminosos y sombras de neón.
- **HUD de Puntajes:** Un marcador superior flotante que rastrea tus victorias, empates y derrotas de forma reactiva.
- **Distribución de Pantalla:**
  - **Mitad Izquierda (Cámara):** Muestra el flujo de video en tiempo real de tu cámara web, superpone el esqueleto de tu mano con colores diferenciados por dedo y proyecta una cuenta regresiva gigante con beeps sonoros.
  - **Mitad Derecha (IA):** Panel interactivo de la máquina con animaciones de "barajado" rápido de emojis durante la cuenta atrás, deteniéndose en su elección exacta en el segundo cero.
- **Diseño Altamente Responsivo:** Se adapta de forma fluida a dispositivos móviles y de escritorio mediante Flexbox y CSS Grid.

### 2. Reconocimiento de Gestos Heurístico e Invariante a la Rotación
En lugar de depender de modelos de clasificación de gestos de terceros que suelen ser inestables y pesados, este proyecto utiliza la biblioteca oficial de **Google MediaPipe Hand Landmarker** junto a un **clasificador matemático personalizado en JavaScript**:
- Se calculan las **distancias euclidianas** bidimensionales desde la muñeca (punto clave 0) hasta las puntas de los dedos principales (8, 12, 16, 20) y sus articulaciones PIP/nudillos (6, 10, 14, 18).
- Un dedo está abierto si la punta está más lejos de la muñeca que su articulación. De lo contrario, está cerrado.
- **Piedra (✊):** Todos los dedos principales están cerrados.
- **Papel (🖐️):** Todos los dedos principales están abiertos.
- **Tijera (✌️):** Dedos índice y medio abiertos; anular y meñique cerrados.
- El algoritmo posee un sistema de tolerancia estadístico que evalúa el recuento de dedos para asegurar una detección fiable inclusive si la mano está rotada, de lado o a diferentes distancias.

### 3. Sistema de Autocuración de Cámaras (Self-Healing Fallback)
Diseñado para entornos con múltiples cámaras de video (ej. cámara interna de laptop y una webcam USB externa):
- **Bucle de Autodescubrimiento:** Si la cámara por defecto del sistema falla al inicializarse (por estar ocupada en otra aplicación o por no ser compatible), el script realiza un barrido automático de todos los dispositivos de video disponibles en el selector hasta encender una cámara funcional.
- **Sincronización:** El menú desplegable ubicado directamente debajo de la pantalla de video se actualiza y selecciona automáticamente el dispositivo activo. El usuario puede alternar la cámara en cualquier momento sin alterar el flujo del juego.

### 4. Síntesis de Sonidos con Web Audio API
El juego genera su propia banda sonora acústica retro de forma interactiva y nativa en el navegador, evitando la necesidad de cargar archivos de sonido `.mp3` externos y previniendo errores de carga:
- **Cuenta atrás:** Beeps de tono senoidal medio (523Hz).
- **Captura (Foto):** Tono de alta frecuencia (880Hz) + ráfaga de ruido blanco para imitar el obturador de una cámara.
- **Victoria (🏆):** Un arpegio alegre ascendente de onda de triángulo.
- **Derrota (💥):** Un acorde menor descendente de onda de diente de sierra.
- **Empate (🤝):** Dos beeps cortos de onda senoidal de tono medio.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 (Semántico):** Estructura del documento web.
- **CSS3 (Custom Properties & Keyframes):** Maquetación responsiva, efectos de neón y glassmorphic overlays.
- **Vanilla JavaScript (ES6 Modules):** Lógica principal del motor de juego y manipulación de Web APIs.
- **[Google MediaPipe Tasks Vision CDN](https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/):** Inicialización de la red neuronal `HandLandmarker` para rastrear las coordenadas tridimensionales de las manos de forma local mediante WebAssembly (`WASM`) optimizado para CPU.
- **Web Audio API:** Síntesis nativa de efectos de sonido.

---

## 📋 Requisitos Previos

Para ejecutar y jugar, **debes abrir la aplicación mediante un servidor web local**. 

> [!WARNING]
> Si abres el archivo `index.html` haciendo doble clic directamente desde tu explorador de archivos (usando el protocolo `file://`), **el juego no funcionará**. Los navegadores modernos bloquean el acceso a la cámara web (`getUserMedia`) y la carga de módulos ES6 (`import`) en entornos locales sin servidor por motivos de seguridad (Políticas CORS).

---

## 🎮 Cómo Levantar el Servidor Local y Jugar

Puedes usar cualquiera de las siguientes opciones para levantar un servidor local en tu carpeta del proyecto:

### Opción 1: Extensión Live Server de VS Code (Recomendado)
1. Abre la carpeta `PPT` en tu editor Visual Studio Code.
2. Instala la extensión **Live Server** (creada por Ritwick Dey).
3. Haz clic derecho sobre `index.html` y selecciona **"Open with Live Server"**.
4. Tu navegador se abrirá en `http://127.0.0.1:5500`.

### Opción 2: Usando Python
Si posees Python en tu computadora, abre tu terminal y ejecuta:
```bash
cd /ruta/a/tu/carpeta/PPT
python3 -m http.server 8000
```
Luego abre tu navegador y entra a: **[http://localhost:8000](http://localhost:8000)**.

### Opción 3: Usando Node.js (npx)
Si usas Node.js, ejecuta en tu consola:
```bash
npx serve .
```
E ingresa a la dirección indicada por la consola (generalmente `http://localhost:3000`).

---

## 🕹️ Mecánica del Juego

1. Una vez abierto en tu servidor local, concede los **permisos de cámara** si el navegador lo solicita.
2. Si tienes varias cámaras, el selector que se encuentra debajo de tu video te indicará cuál está en uso y te permitirá alternarlas.
3. Haz clic en **"Iniciar Ronda"**.
4. Comenzará una cuenta regresiva visual y sonora de **5 segundos**. Coloca tu mano frente a la cámara web.
5. Al llegar a cero, se tomará una **fotografía de tu pose** (congelando tu imagen y dibujando el esqueleto de tu mano).
6. El oponente virtual elegirá un gesto aleatorio (`🪨`, `📄`, `✂️`).
7. El banner se desplegará mostrando si ganaste (**"¡Ganaste!"**), perdiste (**"Ganó la máquina"**) o empataste (**"¡Empate!"**) junto al efecto de sonido respectivo.
8. Transcurridos 4 segundos, el banner se cerrará y el juego volverá a estar listo para otra ronda.
9. Puedes presionar **"Reiniciar Puntos"** en cualquier momento para restablecer los marcadores a cero.
