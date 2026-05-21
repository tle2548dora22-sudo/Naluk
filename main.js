/* ═══════════════════════════════════════
   main.js — Entry point
   ═══════════════════════════════════════ */

import { initNav } from "./nav.js";
import { t }       from "./i18n.js";
import {
  loadSentenceState,
  renderHistory,
  setStatus,
  addWordToSentence,
} from "./sentence.js";
import { initClips, renderClips } from "./clips.js";
import { isLoggedIn, showLoginScreen, showApp } from "./login.js";
import { setOnPrediction, setOnStatus } from "./gesture.js";
import { setDetectionMode, getDetectionMode } from "./camera.js";

let lang = localStorage.getItem("asl_lang") || "th";
window.__lang__ = lang;

/* ─── [8] Render warm-up ping ─── */
let _warmupDone = false;
async function warmupServer() {
  if (_warmupDone) return;
  const { API_URL } = await import("./config.js");
  const healthUrl = API_URL.replace(/\/predict.*$/, "/health");
  const warmupBar = document.getElementById("warmupBar");
  const warmupText = document.getElementById("warmupText");

  try {
    if (warmupBar) warmupBar.style.display = "flex";
    if (warmupText) warmupText.textContent = t(lang, "warmingUp") || "Warming up AI server…";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    await fetch(healthUrl, { method: "GET", signal: controller.signal }).catch(() =>
      // fallback: ping base URL
      fetch(API_URL.replace(/\/predict.*$/, "/"), { method: "GET", signal: controller.signal })
    );
    clearTimeout(timer);
  } catch (_) {
    // Silently ignore — server may not have /health
  } finally {
    _warmupDone = true;
    if (warmupBar) {
      warmupBar.style.opacity = "0";
      setTimeout(() => { if (warmupBar) warmupBar.style.display = "none"; }, 500);
    }
  }
}

export function changeLanguage(l) {
  lang = l;
  window.__lang__ = l;
  localStorage.setItem("asl_lang", l);
  document.documentElement.lang = l;

  const langSelect = document.getElementById("languageSelect");
  if (langSelect) langSelect.value = l;

  _setText("navSectionMain",       t(l, "navMenu"));
  _setText("navLabelHome",         t(l, "navHome"));
  _setText("navLabelClips",        t(l, "navClips"));
  _setText("labelCurrentLetter",   t(l, "currentLetter"));
  _setText("labelDynamicGesture",  t(l, "dynamicGesture"));
  _setText("sentenceSectionTitle", t(l, "sentenceTitle"));
  _setText("historySectionTitle",  t(l, "history"));
  _setText("skeletonHintText",     t(l, "skeletonHint").replace("👋 ", ""));
  _setText("btnAddSpace",          t(l, "btnAddSpace"));
  _setText("btnDelete",            t(l, "btnDelete"));
  _setText("btnClear",             t(l, "btnClear"));
  _setText("btnSpeak",             t(l, "btnSpeak"));
  _setText("btnSave",              t(l, "btnSave"));
  _setText("btnStopCameraLabel",   t(l, "btnStopCamera"));
  _setText("btnLogoutLabel",       t(l, "btnLogout"));
  _setText("permTitle",            t(l, "permTitle"));
  _setText("permBody",             t(l, "permBody").replace(/"/g, '"'));
  _setText("btnStartCameraOverlay",t(l, "btnStartCameraOverlay"));
  _setText("clipsTitle",           t(l, "clipsTitle"));
  _setText("clipsSubtitle",        t(l, "clipsSubtitle"));
  _setText("btnModalPlay",         t(l, "clipModalPlay"));
  _setText("btnModalFullscreen",   t(l, "clipModalFullscreen"));
  _setText("btnModalClose",        t(l, "clipModalClose"));
  _setText("loginSubtitle",        t(l, "loginSubtitle"));
  _setText("labelEmail",           t(l, "loginEmail"));
  _setText("labelPassword",        t(l, "loginPassword"));
  _setText("loginForgotLink",      t(l, "loginForgot"));
  _setText("loginBtnLabel",        t(l, "loginBtn"));
  _setText("registerBtnLabel",     t(l, "loginRegister"));
  _setText("loginOrLabel",         t(l, "loginOr"));
  _setText("badgeSafe",            t(l, "loginBadgeSafe"));
  _setText("badgeASL",             t(l, "loginBadgeASL"));
  _setText("badgeRealtime",        t(l, "loginBadgeRealtime"));

  const startBtnLabel = document.getElementById("startBtnLabel");
  if (startBtnLabel) startBtnLabel.textContent = t(l, "btnStartCamera").replace("▶ ", "");

  const badge = document.getElementById("systemBadge");
  if (badge && badge.dataset.i18nKey) badge.textContent = t(l, badge.dataset.i18nKey);

  renderHistory(l);
  renderClips();
}

function _setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setupGestureCallbacks() {
  setOnStatus(msg => { if (msg) setStatus(msg); });

  setOnPrediction(({ prediction, confidence }) => {
    const word = String(prediction || "").trim();
    if (!word) return;

    const currentLetterEl = document.getElementById("currentLetter");
    const confidenceEl    = document.getElementById("confidenceText");
    const labelEl         = document.getElementById("labelCurrentLetter");
    const barWrap         = document.getElementById("confidenceBarWrap");
    const barFill         = document.getElementById("confidenceBarFill");
    const skeletonHint    = document.getElementById("skeletonHint");

    if (labelEl)         labelEl.textContent         = t(lang, "dynamicGesture");
    if (currentLetterEl) animateLetter(currentLetterEl, word);
    if (confidenceEl)    confidenceEl.textContent    = `${t(lang, "confidence")}: ${(confidence * 100).toFixed(1)}%`;
    if (barWrap) barWrap.style.display = "block";
    if (barFill) {
      barFill.style.width      = `${Math.round(confidence * 100)}%`;
      barFill.style.background = confidence > 0.75 ? "var(--green)" : confidence > 0.5 ? "var(--yellow)" : "var(--red)";
    }
    if (skeletonHint) skeletonHint.classList.add("hidden");

    addWordToSentence(word);
  });
}

/* [7] Animate letter prediction */
let _lastLetter = "";
export function animateLetter(el, newLetter) {
  if (!el) return;
  if (newLetter === _lastLetter) return; // avoid flicker on same prediction
  _lastLetter = newLetter;

  el.classList.remove("letter-enter");
  // Force reflow so animation restarts
  void el.offsetWidth;
  el.textContent = newLetter;
  el.classList.add("letter-enter");
  setTimeout(() => el.classList.remove("letter-enter"), 320);
}
window.animateLetter = animateLetter;

function setupModeUI() {
  const currentMode = getDetectionMode();
  const controls    = document.querySelector("#page-home .camera-box + .controls") ||
                      document.querySelector("#page-home .controls");

  // Find the controls div right after the card containing camera
  const cameraCard = document.querySelector("#page-home .card");
  const allControls = cameraCard ? cameraCard.querySelectorAll(".controls") : [];
  const targetControls = allControls[0];

  if (targetControls && !document.getElementById("modeBtn-static")) {
    const group = document.createElement("div");
    group.className = "mode-toggle-group";
    group.innerHTML = `
      <span class="mode-label" id="modeLabelEl">${t(lang, "modeLabel")}</span>
      <button id="modeBtn-static"  class="btn-mode" type="button" onclick="setDetectionMode('static')" aria-label="Static A-Z mode">${t(lang, "modeStatic")}</button>
      <button id="modeBtn-dynamic" class="btn-mode" type="button" onclick="setDetectionMode('dynamic')" aria-label="Dynamic gesture mode">${t(lang, "modeDynamic")}</button>
      <button id="modeBtn-both"    class="btn-mode" type="button" onclick="setDetectionMode('both')" aria-label="Both A-Z and dynamic mode">${t(lang, "modeBoth")}</button>
    `;
    targetControls.appendChild(group);
  }
  updateModeButtons(currentMode);
}

function updateModeButtons(mode) {
  ["static", "dynamic", "both"].forEach(m => {
    const btn = document.getElementById(`modeBtn-${m}`);
    if (btn) btn.classList.toggle("btn-mode-active", m === mode);
  });
}

const _origSetMode = window.setDetectionMode || setDetectionMode;
window.setDetectionMode = mode => { _origSetMode(mode); updateModeButtons(mode); };

/* [6] Camera skeleton show/hide helpers */
export function showCameraSkeleton() {
  const skeleton    = document.getElementById("cameraSkeleton");
  const cameraBox   = document.getElementById("cameraBox");
  const offState    = document.getElementById("cameraOffState");
  if (skeleton)  { skeleton.style.display = "flex"; }
  if (cameraBox) { cameraBox.style.display = "none"; }
  if (offState)  { offState.style.display = "none"; }
}
export function hideCameraSkeleton(success = true) {
  const skeleton  = document.getElementById("cameraSkeleton");
  const cameraBox = document.getElementById("cameraBox");
  const offState  = document.getElementById("cameraOffState");
  if (skeleton) { skeleton.style.display = "none"; }
  if (success) {
    if (cameraBox) cameraBox.style.display = "block";
    if (offState)  offState.style.display  = "none";
  } else {
    if (cameraBox) cameraBox.style.display = "none";
    if (offState)  { offState.style.display = "flex"; }
  }
}
window.showCameraSkeleton = showCameraSkeleton;
window.hideCameraSkeleton = hideCameraSkeleton;

async function init() {
  setupGestureCallbacks();

  if (!isLoggedIn()) {
    // Landing page is already visible — Firebase auth observer handles redirect
    return;
  }
}

export async function initApp() {
  if (window.__aslAppReady) { showApp(); return; }
  window.__aslAppReady = true;

  showApp();
  loadSentenceState();
  initNav();
  setupModeUI();
  changeLanguage(lang);
  initClips();

  // [8] Warm-up ping (once, non-blocking)
  setTimeout(warmupServer, 1500);

  if (typeof window.__onAppReady__ === "function") window.__onAppReady__();
}

window.changeLanguage = changeLanguage;
window.__initApp__    = initApp;

init();
