

import DeviceDetector from "https://esm.sh/device-detector-js@2.2.10";

import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35";

// Game state
const loadModel = 0;
const waitHands = 1;
const countDown = 2;

let computerScore = 0;
let yourScore = 0;
let frameNoHands = 0;

let state = loadModel;
let initialState = "initial";
let noneState = "none";
let iosParam = "";

let gestureRecognizer;
// Get DOM elements
const videoEl = document.getElementById("input_video");
const restartButtonEl = document.getElementById("restart_btn");
const showHandViewEl = document.getElementById("show_hand");
const yourResultEl = document.getElementById("your_result");
const computerResultEl = document.getElementById("computer_result");
const videoContentEl = document.getElementById("video_content");
const resultEl = document.getElementById("result_text");
const nexRoundEl = document.getElementById("next_round");
const captureImageEl = document.getElementById("capture_image");
const waitingEl = document.getElementById("waiting");
const beginContentEl = document.getElementById("begin_content");
const playContentEl = document.getElementById("play_content");
const beginBtnEl = document.getElementById("begin_btn");
const loadingEl = document.getElementById("loading");
const loadViewEl = document.getElementById("load_view");
const cameraSelectEl = document.getElementById("camera_select");
let customCameraStream = null;

restartButtonEl.onclick = () => {
  restart();
};

beginBtnEl.onclick = () => {
  beginContentEl.style.display = noneState;
  playContentEl.style.display = initialState;
  startCustomCamera();
  state = waitHands;
};

async function startCustomCamera() {
  if (customCameraStream) {
    customCameraStream.getTracks().forEach(t => t.stop());
  }

  const constraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    }
  };

  if (cameraSelectEl && cameraSelectEl.value) {
    constraints.video.deviceId = { exact: cameraSelectEl.value };
  }

  try {
    customCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = customCameraStream;
    videoEl.onloadedmetadata = () => {
      videoEl.play();
      requestAnimationFrame(processVideoFrame);
    };
  } catch (err) {
    console.error("Error accessing camera:", err);
    alert("Error accessing camera: " + err.message);
  }
}

async function processVideoFrame() {
  if (!videoEl.paused && !videoEl.ended) {
    if (state == waitHands) {
      if (checkHands()) {
        frameNoHands = 0;
        startCountDown();
      } else {
        frameNoHands += 1;
        if (frameNoHands == 50) {
          showHandViewEl.style.display = initialState;
        }
        if (frameNoHands == 150) {
          if (computerScore > 0 || yourScore > 0) {
            restartButtonEl.style.display = initialState;
          }
        }
      }
    }
    requestAnimationFrame(processVideoFrame);
  }
}

// Return true if the player's hand is found on the camera
function checkHands() {
  const gestures = gestureRecognizer.recognize(videoEl);
  if (gestures.gestures.length === 0) {
    return false;
  } else {
    return true;
  }
}

// If the operating system is iOS, or the browser is Safari, you need to add some extra information to the video tag for videos to play properly
function checkOS() {
  const deviceDetector = new DeviceDetector();
  const detectedDevice = deviceDetector.parse(navigator.userAgent);
  if (detectedDevice.os.name === "iOS") {
    iosParam = "autoplay muted playsinline controls='true'";
  } else if (detectedDevice.client.name === "Safari") {
    iosParam = "autoplay muted playsinline controls='true'";
  }
}

// Checks what state the player's hand is in
// Call back the final result after 4 checks
async function checkResult(onResult) {
  let finalResult;
  let finalImage;
  let count = 0;
  let x = setInterval(async function () {
    count += 1;
    const results = await getResults();
    console.log(results[1]);
    if (results[1] != null) {
      if (
        finalResult == null ||
        finalResult == 0 ||
        results[1].categoryName != "None"
      ) {
        finalResult = results[1];
        finalImage = results[0];
      }
    }
    if (count == 4) {
      clearInterval(x);
      if (finalImage == null) {
        finalImage = results[0];
      }
      onResult(finalResult, finalImage);
    }
  }, 50);
}

// Return Result from camera
async function getResults() {
  let result;
  let canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  const results = await gestureRecognizer.recognize(canvas);
  const gestures = results.gestures;
  if (gestures.length == 1) {
    result = gestures[0][0];
  }
  if (results.landmarks.length > 0) {
    drawConnectors(ctx, results.landmarks[0], HAND_CONNECTIONS, {
      color: "#AAAAAA",
      lineWidth: 2
    });
    drawLandmarks(ctx, results.landmarks[0], {
      color: "#FFFFFF",
      fillColor: (data) => {
        const index = data.index;
        if (index === 0) return '#FF0000'; // Wrist
        if (index < 5) return '#FFE0B2'; // Thumb
        if (index < 9) return '#9C27B0'; // Index
        if (index < 13) return '#FFEB3B'; // Middle
        if (index < 17) return '#4CAF50'; // Ring
        if (index < 21) return '#2196F3'; // Pinky
        return '#FF0000';
      },
      lineWidth: 1,
      radius: 4
    });
  }
  const captureImage = canvas.toDataURL("image/jpeg");
  return [captureImage, result];
}

// Start countdown 5 time after that game begins.
function startCountDown() {
  if (state == countDown) {
    return;
  }
  state = countDown;
  showHandViewEl.style.display = noneState;
  restartButtonEl.style.display = noneState;
  waitingEl.style.display = initialState;
  
  const chant = [
    "¡Ya! 📸",
    "3...",
    "2...",
    "1...",
    "o Tijeras...",
    "Papel...",
    "Piedra..."
  ];
  let countDownTime = chant.length - 1;
  waitingEl.innerHTML = chant[countDownTime];
  
  let x = setInterval(function () {
    if (countDownTime == 0) {
      clearInterval(x);
      waitingEl.style.display = noneState;
      if (checkHands()) {
        startRound();
      } else {
        setTimeout(() => {
          if (checkHands()) {
            startRound();
          } else {
            state = waitHands;
            showHandViewEl.style.display = initialState;
          }
        }, 50);
      }
    } else {
      countDownTime -= 1;
      waitingEl.innerHTML = chant[countDownTime];
    }
  }, 800);
}

// Random one of the 3 values corresponding to the rock paper scissors and play the corresponding video.
// After finish the video -> check the player's results and notify to the screen
function startRound() {
  const computerResult = ["Paper", "Rock", "Scissors"];
  const index = Math.floor(Math.random() * computerResult.length);
  
  let emoji = "";
  switch (computerResult[index]) {
    case "Paper":
      emoji = "📄";
      break;
    case "Rock":
      emoji = "🪨";
      break;
    case "Scissors":
      emoji = "✂️";
      break;
  }

  videoContentEl.innerHTML = `<p style="font-size: 200px; margin: 0;">${emoji}</p>`;

  // Simulate video playing delay
  setTimeout(function () {
    checkResult((result, image) => {
      if (result == null) {
        resultEl.innerText = "Cannot detect hand";
      } else {
        if (result.categoryName == "None") {
          resultEl.innerText = "Invalid gesture detected";
        } else if (computerResult[index] == result.categoryName) {
          resultEl.innerHTML =
            'Draw <p class="hand_detect_text"> You chose: ' +
            result.categoryName +
            "</p>";
        } else if (
          (computerResult[index] == "Paper" &&
            result.categoryName == "Rock") ||
          (computerResult[index] == "Rock" &&
            result.categoryName == "Scissors") ||
          (computerResult[index] == "Scissors" &&
            result.categoryName == "Paper")
        ) {
          resultEl.innerHTML =
            'Computer wins <p class="hand_detect_text"> You chose: ' +
            result.categoryName +
            "</p>";
          computerScore += 1;
          computerResultEl.innerText = computerScore.toString();
        } else {
          resultEl.innerHTML =
            'You win! <p class="hand_detect_text">You chose: ' +
            result.categoryName +
            "</p>";

          yourScore += 1;
          yourResultEl.innerText = yourScore.toString();
        }
      }
      resultEl.style.display = initialState;
      nexRoundEl.style.display = initialState;
      captureImageEl.style.display = initialState;
      captureImageEl.src = image;
      setTimeout(function () {
        resultEl.style.display = noneState;
        nexRoundEl.style.display = noneState;
        captureImageEl.style.display = noneState;
        state = waitHands;
        videoContentEl.innerHTML = '<p style="font-size: 200px;">?</p>';
      }, 5000);
    });
  }, 2500);
}

// Populate cameras
async function populateCameras() {
  try {
    // Request permission first to get labels
    const initialStream = await navigator.mediaDevices.getUserMedia({video: true});
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    
    cameraSelectEl.innerHTML = '';
    videoDevices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Camera ${cameraSelectEl.length + 1}`;
      cameraSelectEl.appendChild(option);
    });
    
    // Stop initial stream, we'll request specific one on BEGIN
    initialStream.getTracks().forEach(t => t.stop());
    
    if (videoDevices.length > 0) {
      cameraSelectEl.style.display = 'block';
    }
  } catch(e) {
    console.warn("Could not populate cameras:", e);
    // If we fail to enumerate, just hide the dropdown, it will use default camera.
  }
}

// Change UI after finish load model
function loadModelFinish() {
  populateCameras().then(() => {
    beginBtnEl.style.display = initialState;
    loadingEl.innerText = "Load completed";
    loadViewEl.style.display = noneState;
  });
}

// Restart data
function restart() {
  yourScore = 0;
  computerScore = 0;
  frameNoHands = 0;
  computerResultEl.innerText = computerScore.toString();
  yourResultEl.innerText = yourScore.toString();
  state = waitHands;
  showHandViewEl.style.display = initialState;
  restartButtonEl.style.display = noneState;
}

// Load GestureRecognizer
const loadGestureRecognizer = async () => {
  try {
    checkOS();

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://assets.codepen.io/9177687/rock_paper_scissor.task"
      },
      numHands: 1
    });
    loadModelFinish();
  } catch (error) {
    console.error("Error loading MediaPipe model:", error);
    loadingEl.innerText = "Error loading model: " + error.message;
    loadViewEl.style.display = noneState;
  }
}

loadGestureRecognizer();
