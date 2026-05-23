import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs";

// DOM Elements
const setupViewEl = document.getElementById("setup-view");
const playViewEl = document.getElementById("play-view");
const loadingTextEl = document.getElementById("loading-text");

const videoEl = document.getElementById("input_video");
const overlayCanvasEl = document.getElementById("overlay_canvas");
const canvasCtx = overlayCanvasEl.getContext("2d");
const captureImageEl = document.getElementById("capture_image");

const countdownOverlayEl = document.getElementById("countdown-overlay");
const countdownNumberEl = document.getElementById("countdown-number");

const cameraErrorOverlayEl = document.getElementById("camera-error-overlay");
const retryCameraBtnEl = document.getElementById("retry-camera-btn");

const gestureBadgeEl = document.getElementById("gesture-badge");
const detectedGestureTextEl = document.getElementById("detected-gesture-text");
const gestureBadgeEmojiEl = document.getElementById("gesture-badge-emoji");

const computerEmojiEl = document.getElementById("computer-emoji");
const computerStatusEl = document.getElementById("computer-status");

const playBtnEl = document.getElementById("play-btn");
const cameraSelectEl = document.getElementById("camera_select");
const resetBtnEl = document.getElementById("reset-btn");

const resultBannerEl = document.getElementById("result-banner");
const resultTextEl = document.getElementById("result-text");
const compUserEmojiEl = document.getElementById("comp-user-emoji");
const compMachineEmojiEl = document.getElementById("comp-machine-emoji");
const resultDetailEl = document.getElementById("result-detail");

const userScoreEl = document.getElementById("user-score");
const tiesScoreEl = document.getElementById("ties-score");
const computerScoreEl = document.getElementById("computer-score");

// Game State Variables
let userScore = 0;
let tiesScore = 0;
let computerScore = 0;

let handLandmarker = null;
let activeStream = null;
let isGameRunning = false;
let currentDetectedGesture = "Ninguno";
let lastDetectionResult = null;

// Gesture configurations
const gesturesMap = {
  "Piedra": { emoji: "✊", name: "Piedra" },
  "Papel": { emoji: "🖐️", name: "Papel" },
  "Tijera": { emoji: "✌️", name: "Tijera" },
  "Ninguno": { emoji: "❓", name: "No detectado" }
};

// Web Audio API Synthesis
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(frequency, duration, type = 'sine', volume = 0.1) {
  try {
    initAudio();
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    // Smooth volume decay
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

// Camera shutter sound click
function playCaptureSound() {
  try {
    initAudio();
    if (!audioCtx) return;
    
    const bufferSize = audioCtx.sampleRate * 0.08; // 80ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // white noise
    }
    
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseNode.start();
  } catch (e) {
    console.warn("Capture sound failed:", e);
  }
}

function playWinSound() {
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 arpeggio
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playTone(freq, 0.35, 'triangle', 0.15);
    }, index * 80);
  });
}

function playLoseSound() {
  const notes = [392.00, 311.13, 220.00]; // G4, Eb4, A3 down chord
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playTone(freq, 0.5, 'sawtooth', 0.12);
    }, index * 150);
  });
}

function playTieSound() {
  playTone(293.66, 0.15, 'sine', 0.15); // D4
  setTimeout(() => {
    playTone(293.66, 0.15, 'sine', 0.15);
  }, 120);
}

// Distance utility for gesture analysis
function getDistance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

// Classify gesture based on the 21 landmarks
function classifyGesture(landmarks) {
  const wrist = landmarks[0];
  
  // Calculate Euclidean distances from wrist to finger tips and PIP joints
  // Tip indices: 8 (index), 12 (middle), 16 (ring), 20 (pinky)
  // PIP joints indices: 6 (index), 10 (middle), 14 (ring), 18 (pinky)
  const dIndexTip = getDistance(landmarks[8], wrist);
  const dIndexPip = getDistance(landmarks[6], wrist);
  
  const dMiddleTip = getDistance(landmarks[12], wrist);
  const dMiddlePip = getDistance(landmarks[10], wrist);
  
  const dRingTip = getDistance(landmarks[16], wrist);
  const dRingPip = getDistance(landmarks[14], wrist);
  
  const dPinkyTip = getDistance(landmarks[20], wrist);
  const dPinkyPip = getDistance(landmarks[18], wrist);
  
  // A finger is considered extended (open) if the tip is further from the wrist than the PIP joint
  const isIndexOpen = dIndexTip > dIndexPip;
  const isMiddleOpen = dMiddleTip > dMiddlePip;
  const isRingOpen = dRingTip > dRingPip;
  const isPinkyOpen = dPinkyTip > dPinkyPip;
  
  // Simple heuristic checks
  if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
    return "Piedra";
  } else if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) {
    return "Papel";
  } else if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
    return "Tijera";
  }
  
  // Fallbacks based on total count of open fingers if user holds fingers at awkward angles
  const openCount = (isIndexOpen ? 1 : 0) + (isMiddleOpen ? 1 : 0) + (isRingOpen ? 1 : 0) + (isPinkyOpen ? 1 : 0);
  if (openCount <= 1) {
    return "Piedra";
  } else if (openCount >= 3) {
    return "Papel";
  } else {
    return "Tijera";
  }
}

// Draw the skeleton overlay on user canvas
function drawHandSkeleton(landmarks) {
  const width = overlayCanvasEl.width;
  const height = overlayCanvasEl.height;
  canvasCtx.clearRect(0, 0, width, height);
  
  // Hand skeletal connections
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [5, 9], [9, 10], [10, 11], [11, 12], // Middle
    [9, 13], [13, 14], [14, 15], [15, 16], // Ring
    [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [0, 17] // Wrist to Pinky base
  ];
  
  // 1. Draw connecting lines
  canvasCtx.strokeStyle = "rgba(0, 240, 255, 0.7)";
  canvasCtx.lineWidth = 4;
  canvasCtx.lineCap = "round";
  
  connections.forEach(([i, j]) => {
    const pt1 = landmarks[i];
    const pt2 = landmarks[j];
    canvasCtx.beginPath();
    canvasCtx.moveTo(pt1.x * width, pt1.y * height);
    canvasCtx.lineTo(pt2.x * width, pt2.y * height);
    canvasCtx.stroke();
  });
  
  // 2. Draw glowing joints
  landmarks.forEach((pt, index) => {
    canvasCtx.beginPath();
    canvasCtx.arc(pt.x * width, pt.y * height, 6, 0, 2 * Math.PI);
    
    if (index === 0) canvasCtx.fillStyle = "#ff3366"; // Wrist
    else if (index <= 4) canvasCtx.fillStyle = "#ffdd00"; // Thumb
    else if (index <= 8) canvasCtx.fillStyle = "#00f0ff"; // Index
    else if (index <= 12) canvasCtx.fillStyle = "#00ff66"; // Middle
    else if (index <= 16) canvasCtx.fillStyle = "#ff00ff"; // Ring
    else canvasCtx.fillStyle = "#9d00ff"; // Pinky
    
    canvasCtx.shadowBlur = 8;
    canvasCtx.shadowColor = canvasCtx.fillStyle;
    canvasCtx.fill();
    canvasCtx.shadowBlur = 0; // reset shadow
  });
}

// Mirror snapshots to match the flipped view
function captureSnapshot() {
  const snapCanvas = document.createElement("canvas");
  snapCanvas.width = videoEl.videoWidth || 640;
  snapCanvas.height = videoEl.videoHeight || 360;
  const ctx = snapCanvas.getContext("2d");
  
  // Draw the exact unmirrored video frame & canvas overlay.
  // (CSS mirrors it visually because parent has transform: scaleX(-1))
  ctx.drawImage(videoEl, 0, 0, snapCanvas.width, snapCanvas.height);
  ctx.drawImage(overlayCanvasEl, 0, 0, snapCanvas.width, snapCanvas.height);
  
  captureImageEl.src = snapCanvas.toDataURL("image/jpeg");
  captureImageEl.style.display = "block";
}

// MediaPipe Hand Detection Loop
function mainLoop() {
  if (videoEl.readyState >= 2) {
    // Sync canvas sizing with actual video dimensions
    if (overlayCanvasEl.width !== videoEl.videoWidth || overlayCanvasEl.height !== videoEl.videoHeight) {
      overlayCanvasEl.width = videoEl.videoWidth;
      overlayCanvasEl.height = videoEl.videoHeight;
    }
    
    // Only detect if game is not frozen/waiting on a round outcome banner
    if (!captureImageEl.style.display || captureImageEl.style.display === "none") {
      const results = handLandmarker.detectForVideo(videoEl, performance.now());
      lastDetectionResult = results;
      
      if (results && results.landmarks && results.landmarks.length > 0) {
        const handLandmarks = results.landmarks[0];
        drawHandSkeleton(handLandmarks);
        
        currentDetectedGesture = classifyGesture(handLandmarks);
        
        // Update badge
        gestureBadgeEl.style.display = "flex";
        gestureBadgeEmojiEl.innerText = gesturesMap[currentDetectedGesture].emoji;
        detectedGestureTextEl.innerText = gesturesMap[currentDetectedGesture].name;
      } else {
        canvasCtx.clearRect(0, 0, overlayCanvasEl.width, overlayCanvasEl.height);
        currentDetectedGesture = "Ninguno";
        
        gestureBadgeEl.style.display = "flex";
        gestureBadgeEmojiEl.innerText = "👋";
        detectedGestureTextEl.innerText = "Buscando mano...";
      }
    }
  }
  
  requestAnimationFrame(mainLoop);
}

// Webcam device population
async function populateCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    
    cameraSelectEl.innerHTML = '';
    
    if (videoDevices.length === 0) {
      const option = document.createElement('option');
      option.value = "";
      option.text = "Sin cámaras detectadas";
      cameraSelectEl.appendChild(option);
      return;
    }
    
    videoDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Cámara ${index + 1}`;
      cameraSelectEl.appendChild(option);
    });
  } catch (e) {
    console.warn("Could not list camera devices:", e);
    cameraSelectEl.innerHTML = '<option value="">Cámara por defecto</option>';
  }
}

// Start camera stream
async function startCamera(forceDeviceId = null, triedIds = []) {
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
  }
  
  const deviceId = forceDeviceId || null;
  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : true
  };
  
  try {
    activeStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = activeStream;
    videoEl.muted = true;
    videoEl.autoplay = true;
    
    // Hide error overlay on success
    if (cameraErrorOverlayEl) {
      cameraErrorOverlayEl.style.display = "none";
    }
    
    // Synchronize select dropdown value to show what camera is currently running
    if (deviceId) {
      cameraSelectEl.value = deviceId;
    } else if (activeStream) {
      const activeTrack = activeStream.getVideoTracks()[0];
      if (activeTrack) {
        const settings = activeTrack.getSettings();
        if (settings && settings.deviceId) {
          cameraSelectEl.value = settings.deviceId;
        }
      }
    }
    
    videoEl.onloadedmetadata = () => {
      videoEl.play().catch(e => console.warn("Video play failed:", e));
    };
  } catch (err) {
    console.error("Camera access error for device:", deviceId, err);
    
    // Add current deviceId to tried list
    triedIds.push(deviceId || "default");
    
    // Get all camera options
    const options = Array.from(cameraSelectEl.options)
      .map(o => o.value)
      .filter(val => val !== "");
      
    // Find the next camera in the dropdown options that we haven't tried yet
    const nextDevice = options.find(id => !triedIds.includes(id));
    
    if (nextDevice) {
      console.warn(`Camera failed. Trying next available camera ID: ${nextDevice}`);
      await startCamera(nextDevice, triedIds);
    } else {
      // If we tried everything and it still fails, show custom error overlay
      if (cameraErrorOverlayEl) {
        cameraErrorOverlayEl.style.display = "flex";
      }
    }
  }
}

// Game round play logic with a 5-second countdown
function playRound() {
  if (isGameRunning) return;
  isGameRunning = true;
  
  initAudio();
  
  // Reset computer side and setup states
  playBtnEl.disabled = true;
  cameraSelectEl.disabled = true;
  computerStatusEl.innerText = "Pensando...";
  computerStatusEl.classList.add("active");
  computerEmojiEl.classList.add("shuffling");
  
  // Shuffle oponente emojis high speed
  const shuffleEmojis = ["✊", "🖐️", "✌️"];
  let shuffleIndex = 0;
  const shuffleInterval = setInterval(() => {
    computerEmojiEl.innerText = shuffleEmojis[shuffleIndex];
    shuffleIndex = (shuffleIndex + 1) % shuffleEmojis.length;
  }, 100);
  
  // Show countdown overlays
  countdownOverlayEl.classList.add("active");
  
  let countdownSecs = 5;
  countdownNumberEl.innerText = countdownSecs;
  countdownNumberEl.classList.remove("pulse");
  void countdownNumberEl.offsetWidth; // trigger reflow to restart css animations
  countdownNumberEl.classList.add("pulse");
  
  playTone(523.25, 0.15, 'sine', 0.1); // Beep sound (C5)
  
  const countdownTimer = setInterval(() => {
    countdownSecs--;
    
    if (countdownSecs > 0) {
      countdownNumberEl.innerText = countdownSecs;
      countdownNumberEl.classList.remove("pulse");
      void countdownNumberEl.offsetWidth;
      countdownNumberEl.classList.add("pulse");
      playTone(523.25, 0.15, 'sine', 0.1);
    } else {
      clearInterval(countdownTimer);
      clearInterval(shuffleInterval);
      
      // End countdown beep
      playTone(880, 0.35, 'sine', 0.15); // High beep (A5)
      playCaptureSound();
      
      // Run final detection synchronously on the current video frame right before freezing
      try {
        if (handLandmarker) {
          const results = handLandmarker.detectForVideo(videoEl, performance.now());
          if (results && results.landmarks && results.landmarks.length > 0) {
            const handLandmarks = results.landmarks[0];
            drawHandSkeleton(handLandmarks);
            currentDetectedGesture = classifyGesture(handLandmarks);
          } else {
            canvasCtx.clearRect(0, 0, overlayCanvasEl.width, overlayCanvasEl.height);
            currentDetectedGesture = "Ninguno";
          }
        }
      } catch (e) {
        console.warn("Final frame detection failed:", e);
      }
      
      // Perform frozen snapshot capture
      captureSnapshot();
      countdownOverlayEl.classList.remove("active");
      computerEmojiEl.classList.remove("shuffling");
      computerStatusEl.classList.remove("active");
      
      evaluateRound();
    }
  }, 1000);
}

// Evaluate the human gesture versus the computer gesture
function evaluateRound() {
  const choices = ["Piedra", "Papel", "Tijera"];
  const comChoice = choices[Math.floor(Math.random() * choices.length)];
  const userChoice = currentDetectedGesture;
  
  // Update computer emoji display
  computerEmojiEl.innerText = gesturesMap[comChoice].emoji;
  computerStatusEl.innerText = `Elige ${gesturesMap[comChoice].name}`;
  
  let roundResult = ""; // "win", "lose", "draw", "invalid"
  let bannerText = "";
  let detailText = "";
  
  if (userChoice === "Ninguno") {
    roundResult = "invalid";
    bannerText = "No detectado";
    detailText = "La cámara no pudo reconocer tu pose de mano. ¡Inténtalo de nuevo!";
    playTieSound();
  } else if (userChoice === comChoice) {
    roundResult = "draw";
    bannerText = "¡Empate!";
    detailText = `Ambos eligieron ${gesturesMap[userChoice].name}.`;
    tiesScore++;
    tiesScoreEl.innerText = tiesScore;
    playTieSound();
  } else if (
    (userChoice === "Piedra" && comChoice === "Tijera") ||
    (userChoice === "Papel" && comChoice === "Piedra") ||
    (userChoice === "Tijera" && comChoice === "Papel")
  ) {
    roundResult = "win";
    bannerText = "¡Ganaste!";
    detailText = `${gesturesMap[userChoice].emoji} ${gesturesMap[userChoice].name} vence a ${gesturesMap[comChoice].name} ${gesturesMap[comChoice].emoji}.`;
    userScore++;
    userScoreEl.innerText = userScore;
    playWinSound();
  } else {
    roundResult = "lose";
    bannerText = "Ganó la máquina";
    detailText = `${gesturesMap[comChoice].emoji} ${gesturesMap[comChoice].name} vence a ${gesturesMap[userChoice].name} ${gesturesMap[userChoice].emoji}.`;
    computerScore++;
    computerScoreEl.innerText = computerScore;
    playLoseSound();
  }
  
  // Show Winner Banner Overlay
  resultBannerEl.className = `result-banner-container active ${roundResult}`;
  resultTextEl.innerText = bannerText;
  compUserEmojiEl.innerText = gesturesMap[userChoice].emoji;
  compMachineEmojiEl.innerText = gesturesMap[comChoice].emoji;
  resultDetailEl.innerText = detailText;
  
  // Dismiss banner and return to normal camera updates after 4 seconds
  setTimeout(() => {
    resultBannerEl.classList.remove("active");
    captureImageEl.style.display = "none";
    
    // Clear canvas just in case
    canvasCtx.clearRect(0, 0, overlayCanvasEl.width, overlayCanvasEl.height);
    
    // Reset oponente displays
    computerEmojiEl.innerText = "🤖";
    computerStatusEl.innerText = "Listo para jugar";
    
    // Re-enable interactive elements
    playBtnEl.disabled = false;
    cameraSelectEl.disabled = false;
    isGameRunning = false;
  }, 4000);
}

// Reset Score Card
function resetScores() {
  if (isGameRunning) return;
  userScore = 0;
  tiesScore = 0;
  computerScore = 0;
  
  userScoreEl.innerText = "0";
  tiesScoreEl.innerText = "0";
  computerScoreEl.innerText = "0";
  
  playTone(220, 0.2, 'sawtooth', 0.1);
}

// Load MediaPipe fileset and start
async function main() {
  try {
    // Request permission initially
    try {
      const initStream = await navigator.mediaDevices.getUserMedia({ video: true });
      initStream.getTracks().forEach(t => t.stop());
    } catch (e) {
      console.warn("Webcam permission denied or unavailable:", e);
    }
    
    // Loading Resolver WebAssembly Binaries
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
    );
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "CPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    
    // Setup complete
    setupViewEl.style.display = "none";
    playViewEl.style.display = "block";
    
    // Populate cameras list and bind webcam stream
    await populateCameras();
    await startCamera();
    
    // Start drawing loop
    requestAnimationFrame(mainLoop);
    
  } catch (error) {
    console.error("Initialization failed:", error);
    loadingTextEl.innerHTML = "<strong>Error al inicializar HandLandmarker:</strong> " + error.message;
    const loader = document.querySelector(".custom-loader");
    if (loader) loader.style.display = "none";
  }
}

// Event Bindings
playBtnEl.addEventListener("click", playRound);
cameraSelectEl.addEventListener("change", () => {
  startCamera(cameraSelectEl.value);
});
resetBtnEl.addEventListener("click", resetScores);
if (retryCameraBtnEl) {
  retryCameraBtnEl.addEventListener("click", () => {
    startCamera(cameraSelectEl.value || null);
  });
}

// Execute Main Engine
main();
