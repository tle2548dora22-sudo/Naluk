/* ═══════════════════════════════════════
   camera.js — กล้อง + MediaPipe + API prediction
   รองรับทั้ง Static (A–Z) และ Dynamic gesture
   ═══════════════════════════════════════ */

import {
  API_URL, USE_MIRROR_LANDMARKS,
  REQUIRED_SAME_COUNT, MIN_CONFIDENCE,
  SEND_INTERVAL_MS, ACCEPT_COOLDOWN_MS, API_TIMEOUT_MS,
} from "./config.js";
import { t } from "./i18n.js";
import { setStatus, addLetterToSentence } from "./sentence.js";
import {
  pushFrame,
  clearFrameBuffer,
  enableGesture,
  disableGesture,
} from "./gesture.js";

const video           = document.getElementById("video");
const outputCanvas    = document.getElementById("outputCanvas");
const outputCtx       = outputCanvas.getContext("2d");
const currentLetterEl = document.getElementById("currentLetter");
const confidenceEl    = document.getElementById("confidenceText");
const cameraStatusEl  = document.getElementById("cameraStatus");
const systemBadgeEl   = document.getElementById("systemBadge");
const startBtn        = document.getElementById("startBtn");
const overlayEl       = document.getElementById("permissionOverlay");
const skeletonHint    = document.getElementById("skeletonHint");
const confidenceBarWrap = document.getElementById("confidenceBarWrap");
const confidenceBarFill = document.getElementById("confidenceBarFill");

let cameraObj       = null;
let handsObj        = null;
export let isCameraRunning = false;

let lastSentTime    = 0;
let lastSeenLetter  = "";
let sameLetterCount = 0;
let acceptCooldown  = false;

let detectionMode = localStorage.getItem("asl_detection_mode") || "both";

function setBadge(key) {
  if (systemBadgeEl) {
    systemBadgeEl.textContent = t(window.__lang__, key);
    systemBadgeEl.dataset.i18nKey = key;
  }
}
function setCamStatus(key) {
  if (cameraStatusEl) cameraStatusEl.textContent = t(window.__lang__, key);
}

function updateConfidenceBar(confidence) {
  if (!confidenceBarWrap || !confidenceBarFill) return;
  if (confidence == null || confidence <= 0) {
    confidenceBarWrap.style.display = "none";
    return;
  }
  confidenceBarWrap.style.display = "block";
  const pct = Math.round(confidence * 100);
  confidenceBarFill.style.width = `${pct}%`;

  let color, level, labelKey;
  if (confidence > 0.75) {
    color = "var(--green)"; level = "high"; labelKey = "high";
  } else if (confidence > 0.5) {
    color = "var(--yellow)"; level = "medium"; labelKey = "medium";
  } else {
    color = "var(--red)"; level = "low"; labelKey = "low";
  }
  confidenceBarFill.style.background = color;

  // Animated label (feature [2])
  const labelEl = document.getElementById("confidenceBarLabel");
  if (labelEl) {
    const levelText = { high: "HIGH ✓", medium: "MEDIUM", low: "LOW ✗" };
    labelEl.textContent = `${levelText[labelKey]} — ${pct}%`;
    labelEl.className = `confidence-bar-label level-${level}`;
  }
}

export function setDetectionMode(mode) {
  detectionMode = ["static", "dynamic", "both"].includes(mode) ? mode : "both";
  localStorage.setItem("asl_detection_mode", detectionMode);

  if (detectionMode === "dynamic" || detectionMode === "both") enableGesture();
  else disableGesture();

  lastSeenLetter  = "";
  sameLetterCount = 0;
  acceptCooldown  = false;

  const lang = window.__lang__ || "th";
  const modeKey = { static: "modeStatusStatic", dynamic: "modeStatusDynamic", both: "modeStatusBoth" }[detectionMode];
  setStatus(t(lang, modeKey));
}

export function getDetectionMode() {
  return detectionMode;
}

export async function startCameraFromOverlay() {
  const ok = await startCamera();
  if (ok && overlayEl) overlayEl.style.display = "none";
}

export async function startCamera() {
  if (isCameraRunning) {
    setStatus(t(window.__lang__, "cameraStarted"));
    return true;
  }

  setStatus(t(window.__lang__, "loading"));
  if (startBtn) startBtn.disabled = true;

  // [6] Show camera skeleton while loading
  if (typeof window.showCameraSkeleton === "function") window.showCameraSkeleton();

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Browser/HTTPS not supported");
      return false;
    }
    if (typeof Hands === "undefined" || typeof Camera === "undefined") {
      setStatus("MediaPipe not loaded – check internet connection");
      return false;
    }

    await destroyMediaPipe();

    handsObj = new Hands({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });
    handsObj.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    handsObj.onResults(onHandResults);

    cameraObj = new Camera(video, {
      onFrame: async () => {
        if (handsObj && isCameraRunning) {
          await handsObj.send({ image: video });
        }
      },
      width: 640,
      height: 480,
    });

    await cameraObj.start();

    isCameraRunning = true;
    lastSentTime    = 0;
    sameLetterCount = 0;
    lastSeenLetter  = "";
    acceptCooldown  = false;

    if (detectionMode === "dynamic" || detectionMode === "both") enableGesture();

    // [6] Hide skeleton, show camera
    if (typeof window.hideCameraSkeleton === "function") window.hideCameraSkeleton(true);

    setCamStatus("live");
    setBadge("running");
    setStatus(t(window.__lang__, "cameraStarted"));
    return true;

  } catch (err) {
    // [6] Hide skeleton, show error state
    if (typeof window.hideCameraSkeleton === "function") window.hideCameraSkeleton(false);
    setCamStatus("blocked");
    setBadge("stopped");
    const errMap = {
      NotAllowedError:  "denied",
      NotFoundError:    "notFound",
      NotReadableError: "notReadable",
    };
    setStatus(t(window.__lang__, errMap[err.name] || "apiFailed") || err.message);
    return false;
  } finally {
    if (startBtn) startBtn.disabled = false;
  }
}

export async function destroyMediaPipe() {
  isCameraRunning = false;
  disableGesture();

  if (cameraObj) {
    try { cameraObj.stop(); } catch (_) {}
    cameraObj = null;
  }
  if (handsObj) {
    try { await handsObj.close(); } catch (_) {}
    handsObj = null;
  }

  await new Promise(r => setTimeout(r, 80));
}

export async function stopCamera() {
  await destroyMediaPipe();

  lastSentTime    = 0;
  sameLetterCount = 0;
  lastSeenLetter  = "";
  acceptCooldown  = false;

  // [6] Show off state when camera stops
  if (typeof window.hideCameraSkeleton === "function") window.hideCameraSkeleton(false);

  if (currentLetterEl) currentLetterEl.textContent = "-";
  if (confidenceEl)    confidenceEl.textContent    = "Confidence: -";
  updateConfidenceBar(null);
  if (skeletonHint) skeletonHint.classList.remove("hidden");

  setCamStatus("cameraOff");
  setBadge("stopped");
  setStatus(t(window.__lang__, "cameraStopped"));
}

function onHandResults(results) {
  if (!isCameraRunning) return;

  outputCanvas.width  = results.image.width;
  outputCanvas.height = results.image.height;

  outputCtx.save();
  outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  outputCtx.drawImage(results.image, 0, 0, outputCanvas.width, outputCanvas.height);

  if (results.multiHandLandmarks?.length > 0) {
    const lms = results.multiHandLandmarks[0];

    drawConnectors(outputCtx, lms, HAND_CONNECTIONS, { color: "#3b82f6", lineWidth: 4 });
    drawLandmarks(outputCtx, lms, { color: "#f59e0b", lineWidth: 2 });

    if (skeletonHint) skeletonHint.classList.add("hidden");

    const normalized = normalizeLandmarks(lms);

    if (detectionMode === "static" || detectionMode === "both") {
      maybeSendToApi(lms);
    }
    if (detectionMode === "dynamic" || detectionMode === "both") {
      pushFrame(normalized);
    }
  } else {
    if (currentLetterEl) currentLetterEl.textContent = "-";
    if (confidenceEl)    confidenceEl.textContent    = "Confidence: -";
    updateConfidenceBar(null);
    setStatus(t(window.__lang__, "noHand"));
    sameLetterCount = 0;
    lastSeenLetter  = "";
    clearFrameBuffer();
    if (skeletonHint) skeletonHint.classList.remove("hidden");
  }

  outputCtx.restore();
}

function normalizeLandmarks(raw) {
  const lms = USE_MIRROR_LANDMARKS
    ? raw.map(lm => ({ x: 1 - lm.x, y: lm.y, z: lm.z }))
    : raw;

  const wrist = lms[0];
  const arr = [];
  for (const lm of lms) arr.push(lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z);
  return arr;
}

function maybeSendToApi(handLandmarks) {
  const now = Date.now();
  if (now - lastSentTime < SEND_INTERVAL_MS) return;
  lastSentTime = now;
  sendLandmarks(handLandmarks);
}

async function sendLandmarks(handLandmarks) {
  if (!isCameraRunning) return;

  const arr = normalizeLandmarks(handLandmarks);
  if (arr.length !== 63) {
    setStatus("Landmarks error: length=" + arr.length);
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landmarks: arr }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!isCameraRunning) return;

    const raw = await res.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; }
    catch (_) { throw new Error("Invalid JSON: " + raw.slice(0, 100)); }

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const letter = String(data.prediction ?? data.letter ?? data.label ?? data.class ?? "-")
      .trim().toUpperCase();

    let confidence = Number(data.confidence ?? data.score ?? data.probability ?? 0);
    if (confidence > 1) confidence /= 100;
    confidence = Math.min(1, Math.max(0, confidence));

    if (currentLetterEl) {
      const newText = letter || "-";
      if (typeof window.animateLetter === "function") {
        window.animateLetter(currentLetterEl, newText);
      } else {
        currentLetterEl.textContent = newText;
      }
    }
    if (confidenceEl)    confidenceEl.textContent    = `Confidence: ${(confidence * 100).toFixed(1)}%`;
    updateConfidenceBar(letter && letter !== "-" ? confidence : null);

    if (letter && letter !== "-") {
      if (confidence >= MIN_CONFIDENCE) {
        setStatus(t(window.__lang__, "apiSuccess"));
        handlePrediction(letter);
      } else {
        setStatus(`${t(window.__lang__, "lowConfidence")} (${(confidence * 100).toFixed(1)}%)`);
        sameLetterCount = 0;
        lastSeenLetter  = "";
      }
    }
  } catch (err) {
    if (!isCameraRunning) return;
    setStatus(err.name === "AbortError" ? "API timeout (8s)" : t(window.__lang__, "apiFailed"));
    console.warn("[camera.js]", err);
  }
}

let noHandFrames = 0;
const NO_HAND_SPACE_THRESHOLD = 12;

function handlePrediction(letter) {
  if (acceptCooldown) return;

  noHandFrames = 0;

  if (letter === lastSeenLetter) {
    sameLetterCount++;
  } else {
    lastSeenLetter = letter;
    sameLetterCount = 1;
  }

  if (sameLetterCount >= REQUIRED_SAME_COUNT) {
    addLetterToSentence(letter);
    sameLetterCount = 0;
    lastSeenLetter  = "";
    acceptCooldown  = true;
    setTimeout(() => { acceptCooldown = false; }, ACCEPT_COOLDOWN_MS);
  }
}

export function handleNoHand() {
  noHandFrames++;
  if (noHandFrames === NO_HAND_SPACE_THRESHOLD) {
    import("./sentence.js").then(m => m.addSpace()).catch(() => {});
    noHandFrames = 0;
  }
}

window.startCameraFromOverlay = startCameraFromOverlay;
window.startCamera            = startCamera;
window.stopCamera             = stopCamera;
window.setDetectionMode       = setDetectionMode;
window.getDetectionMode       = getDetectionMode;
