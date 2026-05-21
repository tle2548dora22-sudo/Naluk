/* ═══════════════════════════════════════
   i18n.js — ระบบภาษา TH / EN (ครบทุก key)
   ═══════════════════════════════════════ */

export const T = {
  th: {
    /* camera / status */
    ready:              "พร้อมใช้งาน",
    running:            "กำลังทำงาน",
    stopped:            "หยุดแล้ว",
    cameraOff:          "ปิดกล้อง",
    live:               "กำลังทำงาน",
    blocked:            "ถูกบล็อก",
    loading:            "กำลังโหลดระบบตรวจจับมือ...",
    cameraStarted:      "เริ่มกล้องสำเร็จ วางมือให้อยู่ในกรอบได้เลย",
    cameraStopped:      "หยุดกล้องแล้ว",
    noHand:             "ยังไม่พบมือ กรุณาวางมือในกรอบกล้อง",
    apiSuccess:         "เชื่อมต่อ AI API สำเร็จ",
    apiTesting:         "กำลังทดสอบ API...",
    apiFailed:          "ส่งข้อมูลหา API ไม่สำเร็จ – ตรวจสอบ API และ CORS",
    lowConfidence:      "ความมั่นใจต่ำเกินไป ยังไม่เพิ่มลงประโยค",
    denied:             "ไม่ได้รับอนุญาตกล้อง กรุณากด Allow",
    notFound:           "ไม่พบกล้องบนอุปกรณ์นี้",
    notReadable:        "กล้องอาจถูกใช้โดยแอปอื่น",

    /* sentence / tts */
    noTextSpeak:        "ยังไม่มีข้อความให้อ่าน",
    noTextSave:         "ยังไม่มีข้อความให้บันทึก",
    saved:              "บันทึกลงประวัติแล้ว",
    currentLetter:      "ตัวอักษรปัจจุบัน",
    noHistory:          "ยังไม่มีประวัติ",

    /* result panel */
    skeletonHint:       "👋 วางมือในกรอบกล้องเพื่อเริ่มตรวจจับ",
    dynamicGesture:     "Dynamic Gesture",

    /* buttons */
    btnStartCamera:     "▶ เริ่มกล้อง",
    btnStopCamera:      "⏹ หยุดกล้อง",
    btnAddSpace:        "⎵ เว้นวรรค",
    btnDelete:          "⌫ ลบ",
    btnClear:           "🗑 ล้าง",
    btnSpeak:           "🔊 อ่าน",
    btnSave:            "💾 บันทึก",
    btnAutoSpeakOff:    "Auto Speak: Off",
    btnAutoSpeakOn:     "Auto Speak: On",
    btnLogout:          "🚪 ออกจากระบบ",

    /* permission overlay */
    permTitle:          "อนุญาตการใช้กล้อง",
    permBody:           "แอปนี้ต้องการสิทธิ์เข้าถึงกล้องเพื่อตรวจจับภาษามือ ASL กรุณากด \"Allow\" เมื่อเบราว์เซอร์ถามสิทธิ์",
    btnStartCameraOverlay: "📷 เริ่มใช้กล้อง",

    /* sentence section */
    sentenceTitle:      "ประโยคปัจจุบัน",

    /* nav */
    navMenu:            "เมนูหลัก",
    navHome:            "หน้าหลัก",
    navClips:           "คลิปสอนภาษา ASL",
    navLang:            "ภาษา",

    /* login */
    loginEmail:         "อีเมล",
    loginPassword:      "รหัสผ่าน",
    loginForgot:        "ลืมรหัสผ่าน?",
    loginBtn:           "เข้าสู่ระบบ",
    loginRegister:      "สมัครสมาชิก",
    loginOr:            "หรือ",
    loginHint:          "ใช้อีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ หากยังไม่มีบัญชี กด สมัครสมาชิก",
    loginSubtitle:      "เข้าสู่ระบบเพื่อใช้งาน",
    loginBadgeSafe:     "ปลอดภัย",
    loginBadgeASL:      "ASL Detection",
    loginBadgeRealtime: "Real-time",

    /* clips */
    clipsTitle:         "🎬 คลิปสอนภาษา ASL",
    clipsSubtitle:      "วิดีโอสอนภาษามือสำหรับผู้เรียน",
    clipsEmpty:         "ยังไม่มีคลิปวิดีโอ",

    /* clip card */
    btnWatchClip:       "▶ ดูวิดีโอ",
    clipModalClose:     "✕ ปิด",
    clipModalPlay:      "⏯ Play/Pause",
    clipModalFullscreen:"⛶ Fullscreen",
    clipVideo:          "วิดีโอ",

    /* mode */
    modeLabel:          "โหมด:",
    modeStatic:         "🔤 A–Z",
    modeDynamic:        "🤟 Dynamic",
    modeBoth:           "⚡ ทั้งสอง",
    modeStatusStatic:   "โหมด: A–Z เท่านั้น",
    modeStatusDynamic:  "โหมด: Dynamic เท่านั้น",
    modeStatusBoth:     "โหมด: A–Z + Dynamic",

    /* confidence bar */
    confidence:         "ความมั่นใจ",
    history:            "ประวัติ",
  },

  en: {
    ready:              "Ready",
    running:            "Running",
    stopped:            "Stopped",
    cameraOff:          "Camera Off",
    live:               "Live",
    blocked:            "Blocked",
    loading:            "Loading hand detection...",
    cameraStarted:      "Camera started. Place your hand in frame.",
    cameraStopped:      "Camera stopped.",
    noHand:             "No hand detected. Place your hand in the frame.",
    apiSuccess:         "AI API connected successfully.",
    apiTesting:         "Testing API...",
    apiFailed:          "API request failed – check API and CORS.",
    lowConfidence:      "Confidence too low – not added.",
    denied:             "Camera access denied. Please click Allow.",
    notFound:           "No camera found on this device.",
    notReadable:        "Camera may be used by another app.",

    noTextSpeak:        "No text to speak.",
    noTextSave:         "No text to save.",
    saved:              "Saved to history.",
    currentLetter:      "Current Letter",
    noHistory:          "No history yet.",

    skeletonHint:       "👋 Place your hand in frame to start detection",
    dynamicGesture:     "Dynamic Gesture",

    btnStartCamera:     "▶ Start Camera",
    btnStopCamera:      "⏹ Stop Camera",
    btnAddSpace:        "⎵ Space",
    btnDelete:          "⌫ Delete",
    btnClear:           "🗑 Clear",
    btnSpeak:           "🔊 Speak",
    btnSave:            "💾 Save",
    btnAutoSpeakOff:    "Auto Speak: Off",
    btnAutoSpeakOn:     "Auto Speak: On",
    btnLogout:          "🚪 Logout",

    permTitle:          "Camera Permission",
    permBody:           "This app needs camera access to detect ASL hand signs. Please click \"Allow\" when prompted by your browser.",
    btnStartCameraOverlay: "📷 Start Camera",

    sentenceTitle:      "Current Sentence",

    navMenu:            "Menu",
    navHome:            "Home",
    navClips:           "ASL Tutorial Clips",
    navLang:            "Language",

    loginEmail:         "Email",
    loginPassword:      "Password",
    loginForgot:        "Forgot password?",
    loginBtn:           "Sign In",
    loginRegister:      "Create Account",
    loginOr:            "or",
    loginHint:          "Use your email and password to sign in. If you don't have an account, click Create Account.",
    loginSubtitle:      "Sign in to continue",
    loginBadgeSafe:     "Secure",
    loginBadgeASL:      "ASL Detection",
    loginBadgeRealtime: "Real-time",

    /* clips */
    clipsTitle:         "🎬 ASL Tutorial Clips",
    clipsSubtitle:      "Video tutorials for ASL learners",
    clipsEmpty:         "No video clips yet",

    btnWatchClip:       "▶ Watch",
    clipModalClose:     "✕ Close",
    clipModalPlay:      "⏯ Play/Pause",
    clipModalFullscreen:"⛶ Fullscreen",
    clipVideo:          "Video",

    modeLabel:          "Mode:",
    modeStatic:         "🔤 A–Z",
    modeDynamic:        "🤟 Dynamic",
    modeBoth:           "⚡ Both",
    modeStatusStatic:   "Mode: A–Z only",
    modeStatusDynamic:  "Mode: Dynamic only",
    modeStatusBoth:     "Mode: A–Z + Dynamic",

    confidence:         "Confidence",
    history:            "History",
  },
};

export function t(lang, key) {
  return (T[lang] && T[lang][key]) || (T["en"] && T["en"][key]) || key;
}
