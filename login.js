/* ═══════════════════════════════════════
   login.js — Firebase Auth Login / Register / Logout
   ใช้แทนระบบ demo login เดิม
   ═══════════════════════════════════════ */

import {
  registerUser,
  loginUser,
  logoutUser,
  observeAuth,
  getUserRole
} from "./firebase.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase.js";
import {
  recordAttempt,
  getRemainingBlock,
  resetAttempts,
  formatRemaining,
} from "./rateLimit.js";

let currentFirebaseUser = null;
let currentRole = "user";
let authObserverStarted = false;

function $(id) {
  return document.getElementById(id);
}

function setLoginError(message = "") {
  const el = $("loginError");
  if (el) el.textContent = message;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getEmailInput() {
  return $("loginUsername");
}

function getPasswordInput() {
  return $("loginPassword");
}

export function isLoggedIn() {
  return !!currentFirebaseUser;
}

export function currentUser() {
  return currentFirebaseUser?.email || "";
}

export function currentUserRole() {
  return currentRole || "user";
}

export function showLoginScreen() {
  const loginOverlay = $("loginOverlay");
  const appShell = $("appShell");
  const landingEl = $("landingPage");
  if (landingEl) landingEl.style.display = "none";

  if (loginOverlay) loginOverlay.style.display = "flex";
  if (appShell) appShell.style.display = "none";

  setLoginError("");

  const emailInput = getEmailInput();
  const passwordInput = getPasswordInput();

  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";

  document.body.classList.remove("admin-mode");
}

export function showApp() {
  const loginOverlay = $("loginOverlay");
  const appShell = $("appShell");
  const loggedInUser = $("loggedInUser");

  if (loginOverlay) loginOverlay.style.display = "none";
  if (appShell) appShell.style.display = "block";
  if (loggedInUser) loggedInUser.textContent = currentUser();

  if (currentRole === "admin") {
    document.body.classList.add("admin-mode");
    window.__autoAdmin__ = true;
  } else {
    document.body.classList.remove("admin-mode");
    window.__autoAdmin__ = false;
  }
}

export async function handleLogin() {
  const email    = normalizeEmail(getEmailInput()?.value);
  const password = getPasswordInput()?.value || "";

  if (!email || !password) {
    setLoginError("กรุณากรอกอีเมลและรหัสผ่าน");
    return;
  }

  /* ── Rate Limit ── */
  const blockMs = getRemainingBlock();
  if (blockMs > 0) {
    setLoginError(`⛔ พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ ${formatRemaining(blockMs)} วินาที`);
    return;
  }
  const rl = recordAttempt();
  if (rl.blocked) {
    setLoginError(`⛔ พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ ${formatRemaining(rl.remaining)} วินาที`);
    return;
  }

  try {
    setLoginError("กำลังเข้าสู่ระบบ...");
    await loginUser(email, password);
    resetAttempts();   // login สำเร็จ → รีเซ็ต counter
    // onAuthStateChanged จะจัดการ showApp + initApp ต่อเอง
  } catch (err) {
    console.error("[login] login error:", err);
    const attemptsLeft = rl.attemptsLeft - 1;
    let msg = firebaseErrorToThai(err);
    if (attemptsLeft > 0) msg += ` (เหลืออีก ${attemptsLeft} ครั้ง)`;
    setLoginError(msg);

    const passwordInput = getPasswordInput();
    if (passwordInput) passwordInput.value = "";
  }
}

export async function handleRegister() {
  const email = normalizeEmail(getEmailInput()?.value);
  const password = getPasswordInput()?.value || "";

  if (!email || !password) {
    setLoginError("กรุณากรอกอีเมลและรหัสผ่านก่อนสมัครสมาชิก");
    return;
  }

  if (password.length < 6) {
    setLoginError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    return;
  }

  try {
    setLoginError("กำลังสมัครสมาชิก...");
    await registerUser(email, password);
    // onAuthStateChanged จะจัดการ showApp + initApp ต่อเอง
  } catch (err) {
    console.error("[login] register error:", err);
    setLoginError(firebaseErrorToThai(err));
  }
}

export async function doLogout() {
  try {
    await logoutUser();
  } catch (err) {
    console.warn("[login] logout error:", err);
  }

  currentFirebaseUser = null;
  currentRole = "user";
  window.__aslAppReady = false;
  showLoginScreen();
}

export function initAuthObserver() {
  if (authObserverStarted) return;
  authObserverStarted = true;

  observeAuth(async (user) => {
    currentFirebaseUser = user || null;

    if (!user) {
      currentRole = "user";
      window.__aslAppReady = false;
      showLoginScreen();
      return;
    }

    try {
      const role = await getUserRole(user.uid);
      currentRole = role || "user";
    } catch (err) {
      console.warn("[login] get role failed:", err);
      currentRole = "user";
    }

    showApp();

    if (typeof window.__initApp__ === "function") {
      await window.__initApp__();
    }
  });
}

function ensureRegisterButton() {
  // HTML structure is now static in index.html — just wire up the button
  const registerBtn = $("registerBtn");
  if (registerBtn) registerBtn.onclick = handleRegister;
}

function firebaseErrorToThai(err) {
  const code = err?.code || "";

  switch (code) {
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/email-already-in-use":
      return "อีเมลนี้ถูกสมัครไว้แล้ว";
    case "auth/weak-password":
      return "รหัสผ่านอ่อนเกินไป ควรมีอย่างน้อย 6 ตัวอักษร";
    case "auth/network-request-failed":
      return "เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต";
    case "auth/too-many-requests":
      return "พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่";
    default:
      return err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
  }
}

export async function handleForgotPassword() {
  const email = normalizeEmail(getEmailInput()?.value);
  const msg   = $("loginError");

  if (!email) {
    if (msg) { msg.style.color = "var(--red)"; msg.textContent = "กรุณากรอกอีเมลก่อนกดลืมรหัสผ่าน"; }
    getEmailInput()?.focus();
    return;
  }

  try {
    if (msg) { msg.style.color = "var(--accent)"; msg.textContent = "กำลังส่งอีเมล..."; }
    await sendPasswordResetEmail(auth, email);
    if (msg) { msg.style.color = "var(--green)"; msg.textContent = "✅ ส่งลิงก์รีเซ็ตไปที่ " + email + " แล้ว กรุณาตรวจสอบอีเมล"; }
  } catch (err) {
    console.error("[login] forgot password error:", err);
    const code = err?.code || "";
    let errMsg = "ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่";
    if (code === "auth/user-not-found" || code === "auth/invalid-credential")
      errMsg = "ไม่พบบัญชีที่ใช้อีเมลนี้";
    else if (code === "auth/invalid-email")
      errMsg = "รูปแบบอีเมลไม่ถูกต้อง";
    else if (code === "auth/too-many-requests")
      errMsg = "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่";
    if (msg) { msg.style.color = "var(--red)"; msg.textContent = errMsg; }
  }
}

window.handleLogin          = handleLogin;
window.handleRegister       = handleRegister;
window.doLogout             = doLogout;
window.handleForgotPassword = handleForgotPassword;

document.addEventListener("DOMContentLoaded", () => {
  ensureRegisterButton();
  initAuthObserver();
});
