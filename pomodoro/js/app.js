const STORAGE_KEY = "foco-settings-v1";
const STATS_KEY = "foco-stats-v1";
const HISTORY_KEY = "foco-history-v1";
const SESSION_KEY = "foco-session-v1";
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const PHASES = {
  focus: {
    key: "focus",
    label: "Enfoque",
    support: "Un bloque. Nada más importa.",
    setting: "focusMins",
  },
  short: {
    key: "short",
    label: "Pausa corta",
    support: "Suelta la mirada. Vuelve entero.",
    setting: "shortMins",
  },
  long: {
    key: "long",
    label: "Pausa larga",
    support: "Ciclo cerrado. Respira de verdad.",
    setting: "longMins",
  },
};

const BREAK_TIPS = {
  short: [
    "Levántate y mira a lo lejos unos segundos.",
    "Estira cuello y hombros con calma.",
    "Bebe un poco de agua.",
    "Respira: 4 segundos inhala, 4 exhala.",
    "Suelta la mirada de la pantalla un momento.",
  ],
  long: [
    "Da un paseo corto y vuelve con la mente fresca.",
    "Estira piernas y espalda antes del siguiente ciclo.",
    "Cierra los ojos un minuto y respira despacio.",
    "Revisa qué vas a atacar en el próximo enfoque.",
    "Sal un momento de la silla: el cuerpo también cuenta.",
  ],
};

const FOCUS_IDLE_LINES = [
  "Un bloque. Nada más importa.",
  "Elige una sola cosa y protégela.",
  "El sello espera tu decisión.",
  "Menos pestañas. Más presencia.",
  "Empieza imperfecto. Sigue entero.",
  "Hoy también se construye a bloques.",
];

const DAY_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const CATEGORIES = {
  trabajo: { key: "trabajo", label: "Trabajo" },
  estudio: { key: "estudio", label: "Estudio" },
  personal: { key: "personal", label: "Personal" },
  extra: { key: "extra", label: "Extra" },
};

const STREAK_MILESTONES = [3, 7, 14, 30];
const MILESTONE_KEY = "foco-streak-milestones-v1";

const DEFAULTS = {
  focusMins: 25,
  shortMins: 5,
  longMins: 15,
  roundsUntilLong: 4,
  dailyGoal: 8,
  weeklyGoal: 40,
  sound: true,
  haptic: true,
  notify: true,
  autoAdvance: true,
  deepFocus: false,
  nightSoft: true,
  quietHours: false,
  category: "trabajo",
};

const LIMITS = {
  focusMins: [1, 90],
  shortMins: [1, 30],
  longMins: [1, 60],
  roundsUntilLong: [2, 8],
  dailyGoal: [1, 20],
  weeklyGoal: [5, 100],
};

const els = {
  body: document.body,
  shell: document.getElementById("timerShell"),
  ring: document.getElementById("ringProgress"),
  phaseLabel: document.getElementById("phaseLabel"),
  timeDisplay: document.getElementById("timeDisplay"),
  supportText: document.getElementById("supportText"),
  primaryBtn: document.getElementById("primaryBtn"),
  skipBtn: document.getElementById("skipBtn"),
  extendBtn: document.getElementById("extendBtn"),
  resetBtn: document.getElementById("resetBtn"),
  roundDisplay: document.getElementById("roundDisplay"),
  todayDisplay: document.getElementById("todayDisplay"),
  settingsBtn: document.getElementById("settingsBtn"),
  statsBtn: document.getElementById("statsBtn"),
  settingsSheet: document.getElementById("settingsSheet"),
  statsSheet: document.getElementById("statsSheet"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  closeStatsBtn: document.getElementById("closeStatsBtn"),
  notifyToggle: document.getElementById("notifyToggle"),
  soundToggle: document.getElementById("soundToggle"),
  hapticToggle: document.getElementById("hapticToggle"),
  autoToggle: document.getElementById("autoToggle"),
  taskInput: document.getElementById("taskInput"),
  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toastMessage"),
  toastAction: document.getElementById("toastAction"),
  greeting: document.getElementById("greeting"),
  todayStrip: document.getElementById("todayStrip"),
  metaTheme: document.getElementById("metaTheme"),
  weekFocusCount: document.getElementById("weekFocusCount"),
  weekFocusMins: document.getElementById("weekFocusMins"),
  weekChart: document.getElementById("weekChart"),
  historyList: document.getElementById("historyList"),
  historyEmpty: document.getElementById("historyEmpty"),
  streakDisplay: document.getElementById("streakDisplay"),
  streakStat: document.getElementById("streakStat"),
  goalStat: document.getElementById("goalStat"),
  goalFill: document.getElementById("goalFill"),
  weekGoalStat: document.getElementById("weekGoalStat"),
  weekGoalFill: document.getElementById("weekGoalFill"),
  bestDay: document.getElementById("bestDay"),
  presets: document.getElementById("presets"),
  goalOverlay: document.getElementById("goalOverlay"),
  goalOverlayTitle: document.getElementById("goalOverlayTitle"),
  goalOverlayText: document.getElementById("goalOverlayText"),
  goalOverlayClose: document.getElementById("goalOverlayClose"),
  noteOverlay: document.getElementById("noteOverlay"),
  noteInput: document.getElementById("noteInput"),
  noteSave: document.getElementById("noteSave"),
  noteSkip: document.getElementById("noteSkip"),
  updateTip: document.getElementById("updateTip"),
  updateTipBtn: document.getElementById("updateTipBtn"),
  deepToggle: document.getElementById("deepToggle"),
  nightToggle: document.getElementById("nightToggle"),
  quietToggle: document.getElementById("quietToggle"),
  resetDataBtn: document.getElementById("resetDataBtn"),
  shareWeekBtn: document.getElementById("shareWeekBtn"),
  exportBtn: document.getElementById("exportBtn"),
  exportIcsBtn: document.getElementById("exportIcsBtn"),
  importInput: document.getElementById("importInput"),
  pasteImportBtn: document.getElementById("pasteImportBtn"),
  recentTasks: document.getElementById("recentTasks"),
  categoryRow: document.getElementById("categoryRow"),
  insightText: document.getElementById("insightText"),
  heatmap: document.getElementById("heatmap"),
  taskSuggestions: document.getElementById("taskSuggestions"),
  roundDots: document.getElementById("roundDots"),
  todayTimeline: document.getElementById("todayTimeline"),
  todayEmpty: document.getElementById("todayEmpty"),
  confirmOverlay: document.getElementById("confirmOverlay"),
  confirmTitle: document.getElementById("confirmTitle"),
  confirmText: document.getElementById("confirmText"),
  confirmCancel: document.getElementById("confirmCancel"),
  confirmOk: document.getElementById("confirmOk"),
  ritualOverlay: document.getElementById("ritualOverlay"),
  ritualTask: document.getElementById("ritualTask"),
  ritualStart: document.getElementById("ritualStart"),
  ritualSkip: document.getElementById("ritualSkip"),
  outputs: {
    focusMins: document.getElementById("focusMins"),
    shortMins: document.getElementById("shortMins"),
    longMins: document.getElementById("longMins"),
    roundsUntilLong: document.getElementById("roundsUntilLong"),
    dailyGoal: document.getElementById("dailyGoal"),
    weeklyGoal: document.getElementById("weeklyGoal"),
  },
};

const state = {
  settings: loadSettings(),
  history: loadHistory(),
  phase: "focus",
  remainingMs: 0,
  totalMs: 0,
  running: false,
  completedInCycle: 0,
  endAt: null,
  tickId: null,
  wakeLock: null,
  toastTimer: null,
  openSheet: null,
  audioCtx: null,
  task: "",
  category: "trabajo",
  waitingWorker: null,
  goalCelebratedDate: localStorage.getItem("foco-goal-celebrated") || "",
  celebratedMilestones: loadCelebratedMilestones(),
  lastSessionId: null,
  toastActionHandler: null,
  confirmHandler: null,
  extendPressTimer: null,
  parallaxReady: false,
  prevCompletedInCycle: 0,
  completing: false,
  lastSessionSaveAt: 0,
  stampTimer: null,
  warnPlayed: false,
  idleLineTimer: null,
  idleLineIndex: 0,
  sheetFocusReturn: null,
  focusTrapHandler: null,
  lastExtendMs: 0,
  lastDisplaySecond: -1,
  roundDotsKey: "",
  pendingNoteSessionId: null,
  deferReload: false,
};

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
}

function migrateLegacyStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed?.date || !parsed.focusCount) return [];
    const sessions = [];
    for (let i = 0; i < parsed.focusCount; i += 1) {
      sessions.push({
        id: `legacy-${parsed.date}-${i}`,
        date: parsed.date,
        minutes: DEFAULTS.focusMins,
        endedAt: `${parsed.date}T12:00:00.000Z`,
      });
    }
    localStorage.removeItem(STATS_KEY);
    return sessions;
  } catch {
    return [];
  }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    let sessions = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    }
    const legacy = migrateLegacyStats();
    if (legacy.length) {
      sessions = [...sessions, ...legacy];
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ sessions }));
    }
    return pruneHistory(sessions);
  } catch {
    return [];
  }
}

function pruneHistory(sessions) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffKey = todayKey(cutoff);
  return sessions
    .filter((s) => s && s.date && s.date >= cutoffKey)
    .sort((a, b) => String(b.endedAt || b.date).localeCompare(String(a.endedAt || a.date)));
}

function saveHistory() {
  state.history = pruneHistory(state.history);
  localStorage.setItem(HISTORY_KEY, JSON.stringify({ sessions: state.history }));
}

function loadCelebratedMilestones() {
  try {
    const raw = localStorage.getItem(MILESTONE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCelebratedMilestones() {
  localStorage.setItem(MILESTONE_KEY, JSON.stringify(state.celebratedMilestones));
}

function categoryLabel(key) {
  return CATEGORIES[key]?.label || "Extra";
}

function categoryTag(key) {
  const safe = CATEGORIES[key] ? key : "extra";
  return `<span class="tag tag-${safe}">${categoryLabel(safe)}</span>`;
}

function recordFocusSession(minutes) {
  const now = new Date();
  const task = state.task.trim();
  const session = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    date: todayKey(now),
    minutes,
    task: task || null,
    note: null,
    category: CATEGORIES[state.category] ? state.category : "extra",
    endedAt: now.toISOString(),
  };
  state.history.unshift(session);
  state.lastSessionId = session.id;
  saveHistory();
  return session;
}

function undoLastFocusSession() {
  if (!state.lastSessionId) return false;
  const before = state.history.length;
  state.history = state.history.filter((s) => s.id !== state.lastSessionId);
  if (state.history.length === before) return false;
  state.lastSessionId = null;
  saveHistory();
  render();
  showToast("Enfoque deshecho");
  return true;
}

function ensureAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!state.audioCtx) state.audioCtx = new Ctx();
  if (state.audioCtx.state === "suspended") {
    state.audioCtx.resume().catch(() => {});
  }
  return state.audioCtx;
}

function playTone(ctx, frequency, startAt, duration, gainValue) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function isQuietHours() {
  if (!state.settings.quietHours) return false;
  const hour = new Date().getHours();
  return hour >= 22 || hour < 8;
}

function playChime(kind = "soft") {
  if (!state.settings.sound || isQuietHours()) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  if (kind === "focus-end") {
    playTone(ctx, 659.25, t, 0.16, 0.09);
    playTone(ctx, 523.25, t + 0.13, 0.2, 0.08);
    playTone(ctx, 392, t + 0.3, 0.42, 0.07);
    return;
  }
  if (kind === "break-end") {
    playTone(ctx, 523.25, t, 0.14, 0.07);
    playTone(ctx, 659.25, t + 0.12, 0.18, 0.08);
    playTone(ctx, 784, t + 0.28, 0.34, 0.07);
    return;
  }
  if (kind === "start") {
    playTone(ctx, 880, t, 0.1, 0.05);
    return;
  }
  if (kind === "warn") {
    playTone(ctx, 698.46, t, 0.12, 0.05);
    playTone(ctx, 698.46, t + 0.18, 0.18, 0.045);
    return;
  }
  playTone(ctx, 784, t, 0.22, 0.08);
  playTone(ctx, 1046.5, t + 0.16, 0.34, 0.07);
}

function hapticPulse(kind = "end") {
  if (!state.settings.haptic || !navigator.vibrate || isQuietHours()) return;
  if (kind === "focus-end") {
    navigator.vibrate([40, 30, 40, 30, 90]);
    return;
  }
  if (kind === "break-end") {
    navigator.vibrate([28, 36, 70]);
    return;
  }
  if (kind === "start") {
    navigator.vibrate(16);
    return;
  }
  if (kind === "pause") {
    navigator.vibrate([12, 24, 12]);
    return;
  }
  navigator.vibrate([70, 40, 90]);
}

function playPhaseStamp() {
  els.body.classList.remove("is-stamping");
  // Force reflow so the animation can restart.
  void els.body.offsetWidth;
  els.body.classList.add("is-stamping");
  clearTimeout(state.stampTimer);
  state.stampTimer = setTimeout(() => {
    els.body.classList.remove("is-stamping");
  }, 700);
}

function sessionMinutes() {
  return Math.max(1, Math.round(state.totalMs / 60_000));
}

function countTodayFocus() {
  const key = todayKey();
  return state.history.filter((s) => s.date === key).length;
}

function shiftDayKey(key, deltaDays) {
  const date = parseDayKey(key);
  date.setDate(date.getDate() + deltaDays);
  return todayKey(date);
}

function currentStreak() {
  const daysWithFocus = new Set(state.history.map((s) => s.date));
  let cursor = todayKey();
  if (!daysWithFocus.has(cursor)) {
    cursor = shiftDayKey(cursor, -1);
    if (!daysWithFocus.has(cursor)) return 0;
  }
  let streak = 0;
  while (daysWithFocus.has(cursor)) {
    streak += 1;
    cursor = shiftDayKey(cursor, -1);
  }
  return streak;
}

function saveSession({ force = false } = {}) {
  const now = Date.now();
  if (!force && state.running && now - state.lastSessionSaveAt < 1000) return;
  state.lastSessionSaveAt = now;
  const payload = {
    phase: state.phase,
    remainingMs: state.remainingMs,
    totalMs: state.totalMs,
    running: state.running,
    completedInCycle: state.completedInCycle,
    endAt: state.running ? state.endAt : null,
    task: state.task,
    category: state.category,
    savedAt: now,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || !PHASES[saved.phase]) return false;

    state.phase = saved.phase;
    state.totalMs = Number(saved.totalMs) || phaseDurationMs(saved.phase);
    state.completedInCycle = Number(saved.completedInCycle) || 0;
    state.task = typeof saved.task === "string" ? saved.task : "";
    state.category = CATEGORIES[saved.category] ? saved.category : "trabajo";

    if (saved.running && saved.endAt) {
      const left = Math.max(0, Number(saved.endAt) - Date.now());
      els.body.dataset.phase = state.phase;
      els.phaseLabel.textContent = PHASES[state.phase].label;
      els.supportText.textContent = PHASES[state.phase].support;
      updateThemeColor();
      if (left > 0) {
        state.remainingMs = left;
        state.endAt = Number(saved.endAt);
        state.running = true;
        state.warnPlayed = left <= 60_000;
        clearTick();
        scheduleNextTick();
        acquireWakeLock();
      } else {
        // Terminó mientras la app estaba cerrada: cierra el bloque, sin autoarrancar.
        completePhaseQuietly();
      }
      return true;
    }

    state.running = false;
    state.endAt = null;
    state.remainingMs = Math.max(0, Number(saved.remainingMs) || state.totalMs);
    els.body.dataset.phase = state.phase;
    els.phaseLabel.textContent = PHASES[state.phase].label;
    els.supportText.textContent = PHASES[state.phase].support;
    updateThemeColor();
    return true;
  } catch {
    return false;
  }
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const sessions = state.history.filter((s) => s.date === key);
    days.push({
      key,
      date: d,
      label: DAY_NAMES[d.getDay()],
      count: sessions.length,
      minutes: sessions.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0),
      isToday: i === 0,
    });
  }
  return days;
}

function weekSummary() {
  const days = last7Days();
  return {
    count: days.reduce((sum, d) => sum + d.count, 0),
    minutes: days.reduce((sum, d) => sum + d.minutes, 0),
    days,
  };
}

function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, value));
}

function phaseDurationMs(phase = state.phase) {
  const key = PHASES[phase].setting;
  return state.settings[key] * 60 * 1000;
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatHistoryWhen(session) {
  const date = session.endedAt ? new Date(session.endedAt) : parseDayKey(session.date);
  if (Number.isNaN(date.getTime())) return session.date;
  const key = todayKey(date);
  const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (key === todayKey()) return `Hoy · ${time}`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === todayKey(yesterday)) return `Ayer · ${time}`;
  return `${date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · ${time}`;
}

function pickBreakTip(phase) {
  const tips = BREAK_TIPS[phase];
  if (!tips || !tips.length) return PHASES[phase].support;
  return tips[Math.floor(Math.random() * tips.length)];
}

function swapText(el, value) {
  if (el.textContent === value) return;
  el.textContent = value;
  el.classList.remove("is-swap");
  // Reinicia la animación de entrada del texto.
  void el.offsetWidth;
  el.classList.add("is-swap");
}

function setPhase(phase, { resetTime = true } = {}) {
  state.phase = phase;
  els.body.dataset.phase = phase;
  const info = PHASES[phase];
  swapText(els.phaseLabel, info.label);
  swapText(els.supportText, phase === "focus" ? info.support : pickBreakTip(phase));
  if (resetTime) {
    state.totalMs = phaseDurationMs(phase);
    state.remainingMs = state.totalMs;
    state.endAt = null;
    state.warnPlayed = false;
  }
  updateThemeColor();
  syncIdleLines();
  render();
}

function stopIdleLines() {
  if (state.idleLineTimer) {
    clearInterval(state.idleLineTimer);
    state.idleLineTimer = null;
  }
}

function syncIdleLines() {
  stopIdleLines();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const idleFocus =
    !state.running &&
    !state.completing &&
    state.phase === "focus" &&
    state.remainingMs === state.totalMs;
  if (!idleFocus || reduced) return;
  state.idleLineTimer = setInterval(() => {
    if (state.running || state.phase !== "focus") {
      stopIdleLines();
      return;
    }
    state.idleLineIndex = (state.idleLineIndex + 1) % FOCUS_IDLE_LINES.length;
    swapText(els.supportText, FOCUS_IDLE_LINES[state.idleLineIndex]);
  }, 14000);
}

function buildRingTicks() {
  const ticks = document.getElementById("ringTicks");
  if (!ticks || ticks.childElementCount) return;
  const count = 24;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const outer = 46;
    const inner = i % 6 === 0 ? 41.5 : 43.2;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(50 + Math.cos(angle) * inner));
    line.setAttribute("y1", String(50 + Math.sin(angle) * inner));
    line.setAttribute("x2", String(50 + Math.cos(angle) * outer));
    line.setAttribute("y2", String(50 + Math.sin(angle) * outer));
    line.dataset.index = String(i);
    ticks.appendChild(line);
  }
}

function updateRingTicks(progress) {
  const ticks = document.getElementById("ringTicks");
  if (!ticks) return;
  const elapsed = Math.floor(Math.min(1, Math.max(0, progress)) * 24);
  ticks.querySelectorAll("line").forEach((line, index) => {
    line.classList.toggle("is-elapsed", index < elapsed);
  });
}

function applyNightMode() {
  const hour = new Date().getHours();
  const nightHours = hour >= 21 || hour < 6;
  const on = Boolean(state.settings.nightSoft && nightHours);
  els.body.classList.toggle("is-night", on);
  return on;
}

function updateThemeColor() {
  const night = applyNightMode();
  const colors = night
    ? { focus: "#cfd3cc", short: "#c5d2cc", long: "#c5ccd6" }
    : { focus: "#e2e4df", short: "#dce8e4", long: "#dce4ec" };
  els.metaTheme.content = colors[state.phase] || colors.focus;
  const grads = {
    focus: "url(#ringGradFocus)",
    short: "url(#ringGradShort)",
    long: "url(#ringGradLong)",
  };
  els.ring.setAttribute("stroke", grads[state.phase] || grads.focus);
}

function greetingText() {
  const hour = new Date().getHours();
  const today = countTodayFocus();
  const goal = state.settings.dailyGoal;
  if (state.running && state.phase === "focus") return "El sello está en marcha.";
  if (state.running && state.phase !== "focus") return "Pausa con intención.";
  if (today >= goal) return "Meta sellada. Qué bien.";
  if (hour < 12) return today ? `Buenos días · ${today}/${goal}` : "Buenos días. Empieza con calma.";
  if (hour < 19) return today ? `Buenas tardes · ${today}/${goal}` : "Buenas tardes. Un bloque y listo.";
  return today ? `Buenas noches · ${today}/${goal}` : "Buenas noches. Un último sello.";
}

function renderGreeting() {
  if (!els.greeting) return;
  const next = greetingText();
  if (els.greeting.textContent !== next) {
    els.greeting.textContent = next;
  }
}

function renderTodayStrip() {
  if (!els.todayStrip) return;
  const deepActive = state.settings.deepFocus && state.running && state.phase === "focus";
  if (deepActive) {
    els.todayStrip.hidden = true;
    return;
  }
  const today = countTodayFocus();
  const goal = state.settings.dailyGoal;
  const key = todayKey();
  const chips = [];
  const seen = new Set();
  for (const session of state.history) {
    if (session.date !== key) continue;
    const task = (session.task || "").trim();
    if (!task) continue;
    const low = task.toLocaleLowerCase("es");
    if (seen.has(low)) continue;
    seen.add(low);
    chips.push(task);
    if (chips.length >= 2) break;
  }

  if (!today && !chips.length && !state.task) {
    els.todayStrip.hidden = true;
    els.todayStrip.innerHTML = "";
    return;
  }

  const parts = [
    `<span class="today-pill">Hoy <strong>${today}/${goal}</strong></span>`,
  ];
  const { count } = weekSummary();
  const weekGoal = state.settings.weeklyGoal || 40;
  parts.push(`<span class="today-pill">Sem <strong>${count}/${weekGoal}</strong></span>`);
  for (const task of chips) {
    parts.push(
      `<button type="button" class="today-chip" data-task="${escapeHtml(task)}">${escapeHtml(task)}</button>`
    );
  }
  if (state.task && !seen.has(state.task.toLocaleLowerCase("es")) && state.phase === "focus") {
    parts.push(`<span class="today-chip" aria-current="true">${escapeHtml(state.task)}</span>`);
  }
  els.todayStrip.hidden = false;
  els.todayStrip.innerHTML = parts.join("");
}

function renderGoalProgress() {
  const today = countTodayFocus();
  const goal = state.settings.dailyGoal;
  const streak = currentStreak();
  const pct = Math.min(100, Math.round((today / Math.max(1, goal)) * 100));
  els.streakDisplay.textContent = String(streak);
  els.streakStat.textContent = String(streak);
  els.goalStat.textContent = `${today}/${goal}`;
  els.goalFill.style.width = `${pct}%`;
  els.todayDisplay.textContent = `${today}/${goal}`;

  const { count } = weekSummary();
  const weekGoal = state.settings.weeklyGoal || 40;
  const weekPct = Math.min(100, Math.round((count / Math.max(1, weekGoal)) * 100));
  if (els.weekGoalStat) els.weekGoalStat.textContent = `${count}/${weekGoal}`;
  if (els.weekGoalFill) els.weekGoalFill.style.width = `${weekPct}%`;
}

function renderBestDay() {
  const { days } = weekSummary();
  const best = days.reduce((acc, day) => (day.count > (acc?.count || 0) ? day : acc), null);
  if (!best || best.count <= 0) {
    els.bestDay.textContent = "Tu mejor día aparecerá aquí.";
    return;
  }
  els.bestDay.textContent = `Mejor día: ${best.label} · ${best.count} enfoques · ${best.minutes} min`;
}

function renderWeekChart() {
  const { days, count, minutes } = weekSummary();
  const max = Math.max(1, ...days.map((d) => d.count));
  els.weekFocusCount.textContent = String(count);
  els.weekFocusMins.textContent = String(minutes);
  renderGoalProgress();

  els.weekChart.innerHTML = days
    .map((day) => {
      const height = Math.max(4, Math.round((day.count / max) * 100));
      const classes = ["day-col"];
      if (day.isToday) classes.push("is-today");
      if (day.count > 0) classes.push("has-data");
      return `
        <div class="${classes.join(" ")}" title="${day.count} enfoques">
          <div class="day-bar-wrap">
            <div class="day-bar" style="height:${day.count ? height : 4}%"></div>
          </div>
          <div class="day-count">${day.count || "·"}</div>
          <div class="day-name">${day.label}</div>
        </div>
      `;
    })
    .join("");
}

function renderHistoryList() {
  const recent = state.history.slice(0, 8);
  els.historyEmpty.hidden = recent.length > 0;
  els.historyList.innerHTML = recent
    .map((session) => {
      const title = session.task
        ? escapeHtml(session.task)
        : `${session.minutes} min`;
      const detail = session.task
        ? `${session.minutes} min · ${formatHistoryWhen(session)}`
        : formatHistoryWhen(session);
      const note = session.note
        ? `<span class="history-note">${escapeHtml(session.note)}</span>`
        : "";
      return `
      <li class="history-item" data-id="${escapeHtml(session.id)}">
        <div class="history-main">
          <strong>${title}</strong>
          ${categoryTag(session.category || "extra")}
          ${note}
        </div>
        <span class="history-detail">${detail}</span>
        <button type="button" class="history-delete" data-del="${escapeHtml(session.id)}" aria-label="Borrar sesión">×</button>
      </li>
    `;
    })
    .join("");
}

function renderHeatmap() {
  if (!els.heatmap) return;
  const counts = new Map();
  for (const session of state.history) {
    if (!session?.date) continue;
    counts.set(session.date, (counts.get(session.date) || 0) + 1);
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = [];
  for (let i = 27; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = todayKey(d);
    days.push({ key, count: counts.get(key) || 0, date: d });
  }

  const max = Math.max(1, ...days.map((d) => d.count));
  const todayStr = todayKey(today);
  els.heatmap.innerHTML = days
    .map((d) => {
      const level = d.count === 0 ? 0 : Math.min(4, Math.ceil((d.count / max) * 4));
      const label = d.date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
      const classes = ["heat-cell"];
      if (level) classes.push(`lvl-${level}`);
      if (d.key === todayStr) classes.push("is-today");
      return `<div class="${classes.join(" ")}" title="${escapeHtml(label)}: ${d.count}"></div>`;
    })
    .join("");
}

function deleteHistoryItem(id) {
  const before = state.history.length;
  state.history = state.history.filter((s) => s.id !== id);
  if (state.history.length === before) return;
  if (state.lastSessionId === id) state.lastSessionId = null;
  saveHistory();
  render();
  renderStatsPanel();
  showToast("Sesión borrada");
}

function resetStatsData() {
  askConfirm({
    title: "¿Borrar historial?",
    text: "Se borran enfoques, rachas y logros. Los ajustes de minutos se mantienen.",
    okLabel: "Borrar",
    onConfirm: () => {
      state.history = [];
      state.lastSessionId = null;
      state.celebratedMilestones = [];
      state.goalCelebratedDate = "";
      saveHistory();
      saveCelebratedMilestones();
      localStorage.removeItem("foco-goal-celebrated");
      clearSession();
      render();
      renderStatsPanel();
      showToast("Historial y rachas borrados");
    },
  });
}

function renderTodayTimeline() {
  const key = todayKey();
  const todaySessions = state.history.filter((s) => s.date === key).slice(0, 12);
  els.todayEmpty.hidden = todaySessions.length > 0;
  els.todayTimeline.innerHTML = todaySessions
    .map((session) => {
      const date = session.endedAt ? new Date(session.endedAt) : parseDayKey(session.date);
      const time = Number.isNaN(date.getTime())
        ? "--:--"
        : date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      const title = session.task ? escapeHtml(session.task) : "Enfoque";
      return `
        <li class="timeline-item">
          <div class="timeline-time">${time}</div>
          <div class="timeline-body">
            <strong>${title}</strong>
            <span>${session.minutes} min</span>
            ${categoryTag(session.category || "extra")}
          </div>
        </li>
      `;
    })
    .join("");
}

function renderInsight() {
  if (!els.insightText) return;
  const { count, minutes, days } = weekSummary();
  const today = countTodayFocus();
  const goal = state.settings.dailyGoal;
  const streak = currentStreak();
  const avg = count ? Math.round(minutes / count) : 0;
  const weekCats = days.flatMap((d) =>
    state.history.filter((s) => s.date === d.key).map((s) => s.category || "extra")
  );
  const topCategory = Object.entries(
    weekCats.reduce((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  const yesterdayKey = shiftDayKey(todayKey(), -1);
  const yesterday = state.history.filter((s) => s.date === yesterdayKey).length;

  if (!count && !today) {
    els.insightText.textContent = "Empieza un enfoque para ver tu ritmo.";
    return;
  }
  if (today >= goal) {
    els.insightText.textContent = `Meta sellada. Media ${avg || state.settings.focusMins} min · racha ${streak}.`;
    return;
  }
  const remaining = Math.max(0, goal - today);
  if (yesterday > 0 && today < yesterday) {
    els.insightText.textContent = `Ayer ${yesterday}, hoy ${today}. Te faltan ${remaining} para la meta.`;
    return;
  }
  const cat = topCategory ? categoryLabel(topCategory[0]).toLowerCase() : "foco";
  const best = days.reduce((acc, day) => (day.count > (acc?.count || 0) ? day : acc), null);
  if (best && best.count > 0) {
    const dayName = DAY_LONG[best.date.getDay()];
    els.insightText.textContent = `Te faltan ${remaining}. Suele irte bien el ${dayName}. Esta semana gana ${cat}.`;
    return;
  }
  els.insightText.textContent = `Te faltan ${remaining} para la meta. Media: ${avg || state.settings.focusMins} min.`;
}

function renderCategories() {
  if (!els.categoryRow) return;
  const show = state.phase === "focus";
  els.categoryRow.hidden = !show;
  els.categoryRow.querySelectorAll("[data-category]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.category === state.category);
  });
}

function renderRoundDots() {
  const rounds = state.settings.roundsUntilLong;
  const done = state.completedInCycle;
  const current = state.phase === "focus" ? Math.min(done + 1, rounds) : null;
  const popped = done > state.prevCompletedInCycle ? done : 0;
  const key = `${rounds}:${done}:${current}:${popped}`;
  if (key === state.roundDotsKey && els.roundDots.childElementCount === rounds) {
    state.prevCompletedInCycle = done;
    return;
  }
  state.roundDotsKey = key;
  els.roundDots.innerHTML = Array.from({ length: rounds }, (_, index) => {
    const n = index + 1;
    const classes = ["round-dot"];
    if (n <= done) classes.push("is-done");
    if (current && n === current) classes.push("is-current");
    if (popped && n === popped) classes.push("is-pop");
    return `<span class="${classes.join(" ")}"></span>`;
  }).join("");
  state.prevCompletedInCycle = done;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderStatsPanel() {
  renderWeekChart();
  renderTodayTimeline();
  renderHeatmap();
  renderHistoryList();
  renderBestDay();
  renderInsight();
}

function recentTaskNames() {
  const seen = new Set();
  const names = [];
  for (const session of state.history) {
    const task = (session.task || "").trim();
    if (!task) continue;
    const key = task.toLocaleLowerCase("es");
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(task);
    if (names.length >= 8) break;
  }
  return names;
}

function renderTaskSuggestions() {
  if (!els.taskSuggestions) return;
  const names = recentTaskNames();
  els.taskSuggestions.innerHTML = names
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
}

function renderRecentTasks() {
  const show =
    state.phase === "focus" &&
    !state.running &&
    !(state.settings.deepFocus && state.running);
  const names = show ? recentTaskNames() : [];
  if (!names.length || state.phase !== "focus") {
    els.recentTasks.hidden = true;
    els.recentTasks.innerHTML = "";
    return;
  }
  els.recentTasks.hidden = false;
  els.recentTasks.innerHTML = names
    .map(
      (name) =>
        `<button type="button" class="recent-task" data-task="${escapeHtml(name)}">${escapeHtml(name)}</button>`
    )
    .join("");
}

function renderPresets() {
  const show = state.phase === "focus" && !state.running && state.remainingMs === state.totalMs;
  els.presets.hidden = !show;
  els.presets.querySelectorAll("[data-preset]").forEach((btn) => {
    const mins = Number(btn.dataset.preset);
    btn.classList.toggle("is-active", mins === state.settings.focusMins);
  });
}

function updateDocumentTitle() {
  const time = formatTime(state.remainingMs);
  const label = PHASES[state.phase].label;
  if (state.running) {
    document.title = `${time} · ${label}`;
    return;
  }
  if (state.remainingMs > 0 && state.remainingMs < state.totalMs) {
    document.title = `${time} · pausa`;
    return;
  }
  document.title = "Foco — Pomodoro";
}

function render() {
  els.timeDisplay.textContent = formatTime(state.remainingMs);
  const progress = state.totalMs > 0 ? 1 - state.remainingMs / state.totalMs : 0;
  els.ring.style.strokeDashoffset = String(Math.min(1, Math.max(0, progress)));
  updateRingTicks(progress);
  els.primaryBtn.textContent = state.running ? "Pausa" : state.remainingMs < state.totalMs ? "Continuar" : "Empezar";
  els.shell.classList.toggle("is-running", state.running);
  els.shell.classList.toggle("is-ending", state.running && state.remainingMs > 0 && state.remainingMs <= 60_000);
  els.body.classList.toggle("is-timer-running", state.running);
  updateDocumentTitle();
  const rounds = state.settings.roundsUntilLong;
  const current = Math.min(state.completedInCycle + 1, rounds);
  els.roundDisplay.textContent = `${current}/${rounds}`;
  renderRoundDots();
  renderGoalProgress();
  renderGreeting();
  renderTodayStrip();
  renderPresets();
  renderRecentTasks();
  renderCategories();
  els.outputs.focusMins.value = state.settings.focusMins;
  els.outputs.shortMins.value = state.settings.shortMins;
  els.outputs.longMins.value = state.settings.longMins;
  els.outputs.roundsUntilLong.value = state.settings.roundsUntilLong;
  els.outputs.dailyGoal.value = state.settings.dailyGoal;
  if (els.outputs.weeklyGoal) els.outputs.weeklyGoal.value = state.settings.weeklyGoal;
  els.notifyToggle.setAttribute("aria-checked", String(state.settings.notify));
  els.soundToggle.setAttribute("aria-checked", String(state.settings.sound));
  els.hapticToggle.setAttribute("aria-checked", String(state.settings.haptic));
  els.autoToggle.setAttribute("aria-checked", String(state.settings.autoAdvance));
  els.deepToggle.setAttribute("aria-checked", String(state.settings.deepFocus));
  if (els.nightToggle) {
    els.nightToggle.setAttribute("aria-checked", String(state.settings.nightSoft));
  }
  if (els.quietToggle) {
    els.quietToggle.setAttribute("aria-checked", String(state.settings.quietHours));
  }
  renderTaskSuggestions();
  const deepActive = state.settings.deepFocus && state.running && state.phase === "focus";
  els.body.classList.toggle("is-deep-focus", deepActive);
  updateThemeColor();
  els.shell.setAttribute("aria-label", state.running ? "Pausar temporizador" : "Empezar o continuar temporizador");
  if (document.activeElement !== els.taskInput) {
    els.taskInput.value = state.task;
  }
  els.taskInput.closest(".task-field").hidden = state.phase !== "focus";
  if (state.openSheet === "stats") renderStatsPanel();
}

function renderTimerChrome() {
  els.timeDisplay.textContent = formatTime(state.remainingMs);
  const progress = state.totalMs > 0 ? 1 - state.remainingMs / state.totalMs : 0;
  els.ring.style.strokeDashoffset = String(Math.min(1, Math.max(0, progress)));
  updateRingTicks(progress);
  els.shell.classList.toggle("is-ending", state.running && state.remainingMs > 0 && state.remainingMs <= 60_000);
  updateDocumentTitle();
}

function weekShareText() {
  const { count, minutes, days } = weekSummary();
  const today = countTodayFocus();
  const streak = currentStreak();
  const bars = days
    .map((d) => `${d.label} ${"●".repeat(d.count)}${d.count ? "" : "·"} (${d.count})`)
    .join("\n");
  return [
    "Foco — resumen semanal",
    `${count} enfoques · ${minutes} min`,
    `Hoy ${today}/${state.settings.dailyGoal} · racha ${streak}`,
    "",
    bars,
  ].join("\n");
}

async function shareWeek() {
  const text = weekShareText();
  const file = await buildWeekCardFile().catch(() => null);

  try {
    if (navigator.share) {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Foco — semana", text, files: [file] });
        return;
      }
      await navigator.share({ title: "Foco — semana", text });
      return;
    }
  } catch (err) {
    if (err && err.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Resumen copiado");
  } catch {
    showToast("No se pudo compartir");
  }
}

async function buildWeekCardFile() {
  const { count, minutes, days } = weekSummary();
  const today = countTodayFocus();
  const streak = currentStreak();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, "#eceee9");
  bg.addColorStop(0.45, "#e2e4df");
  bg.addColorStop(1, "#c5c9c0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1350);

  ctx.fillStyle = "rgba(214,40,24,0.14)";
  ctx.beginPath();
  ctx.arc(840, 180, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#101411";
  ctx.font = "800 96px Syne, sans-serif";
  ctx.fillText("FOCO", 88, 170);
  ctx.font = "600 28px Sora, sans-serif";
  ctx.fillStyle = "#4a524c";
  ctx.fillText("RESUMEN DE LA SEMANA", 92, 220);

  ctx.fillStyle = "#101411";
  ctx.font = "italic 120px 'Instrument Serif', serif";
  ctx.fillText(String(count), 88, 400);
  ctx.font = "500 36px Sora, sans-serif";
  ctx.fillStyle = "#4a524c";
  ctx.fillText("enfoques", 88, 455);

  ctx.fillStyle = "#101411";
  ctx.font = "italic 84px 'Instrument Serif', serif";
  ctx.fillText(`${minutes}`, 520, 400);
  ctx.font = "500 36px Sora, sans-serif";
  ctx.fillStyle = "#4a524c";
  ctx.fillText("minutos", 520, 455);

  ctx.font = "500 34px Sora, sans-serif";
  ctx.fillStyle = "#101411";
  ctx.fillText(`Hoy ${today}/${state.settings.dailyGoal}  ·  Racha ${streak}`, 88, 540);

  const max = Math.max(1, ...days.map((d) => d.count));
  const barW = 96;
  const gap = 28;
  const baseX = 88;
  const baseY = 1080;
  days.forEach((day, i) => {
    const h = Math.round((day.count / max) * 320);
    const x = baseX + i * (barW + gap);
    ctx.fillStyle = day.isToday ? "#d62818" : "rgba(16,20,17,0.18)";
    ctx.fillRect(x, baseY - h, barW, Math.max(8, h));
    ctx.fillStyle = "#4a524c";
    ctx.font = "700 26px Syne, sans-serif";
    ctx.fillText(day.label, x + 18, baseY + 48);
    ctx.font = "500 24px Sora, sans-serif";
    ctx.fillText(String(day.count), x + 34, baseY - h - 18);
  });

  ctx.fillStyle = "#4a524c";
  ctx.font = "500 28px Sora, sans-serif";
  ctx.fillText("Tu tiempo · tu sello", 88, 1260);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png");
  });
  return new File([blob], `foco-semana-${todayKey()}.png`, { type: "image/png" });
}

async function exportBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    sessions: state.history,
  };
  const json = JSON.stringify(payload, null, 2);
  const filename = `foco-backup-${todayKey()}.json`;

  try {
    if (navigator.share && navigator.canShare) {
      const file = new File([json], filename, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Backup Foco" });
        return;
      }
    }
  } catch (err) {
    if (err && err.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(json);
    showToast("Backup copiado");
  } catch {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup descargado");
  }
}

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildIcs() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Foco//Pomodoro//ES",
    "CALSCALE:GREGORIAN",
  ];
  for (const session of state.history.slice(0, 120)) {
    const end = session.endedAt ? new Date(session.endedAt) : parseDayKey(session.date);
    if (Number.isNaN(end.getTime())) continue;
    const start = new Date(end.getTime() - Math.max(1, Number(session.minutes) || 25) * 60_000);
    const title = (session.task || "Enfoque").replace(/[,;\\]/g, " ");
    const note = (session.note || "").replace(/[,;\\]/g, " ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${session.id}@foco`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:Foco · ${title}`,
      note ? `DESCRIPTION:${note}` : "DESCRIPTION:Sesión de enfoque",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

async function exportIcs() {
  if (!state.history.length) {
    showToast("Aún no hay sesiones para exportar");
    return;
  }
  const ics = buildIcs();
  const filename = `foco-${todayKey()}.ics`;
  try {
    if (navigator.share && navigator.canShare) {
      const file = new File([ics], filename, { type: "text/calendar" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Foco calendario" });
        return;
      }
    }
  } catch (err) {
    if (err && err.name === "AbortError") return;
  }
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Calendario exportado");
}

function importBackupText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    showToast("Archivo no válido");
    return false;
  }

  const sessions = Array.isArray(parsed?.sessions)
    ? parsed.sessions
    : Array.isArray(parsed)
      ? parsed
      : null;
  if (!sessions) {
    showToast("Backup sin sesiones");
    return false;
  }

  const normalized = sessions
    .filter((s) => s && s.date && Number(s.minutes) > 0)
    .map((s, index) => ({
      id: s.id || `import-${Date.now()}-${index}`,
      date: String(s.date),
      minutes: Number(s.minutes) || 0,
      task: s.task || null,
      note: typeof s.note === "string" ? s.note.slice(0, 80) : null,
      category: CATEGORIES[s.category] ? s.category : "extra",
      endedAt: s.endedAt || `${s.date}T12:00:00.000Z`,
    }));

  if (!normalized.length) {
    showToast("No había enfoques que importar");
    return false;
  }

  const byId = new Map(state.history.map((s) => [s.id, s]));
  for (const session of normalized) {
    byId.set(session.id, session);
  }
  state.history = pruneHistory([...byId.values()]);
  saveHistory();

  if (parsed.settings && typeof parsed.settings === "object") {
    state.settings = {
      ...state.settings,
      ...Object.fromEntries(
        Object.entries(parsed.settings).filter(([key]) => key in DEFAULTS)
      ),
    };
    saveSettings();
  }

  render();
  showToast(`Importados ${normalized.length} enfoques`);
  return true;
}

async function handleImportFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    importBackupText(text);
  } catch {
    showToast("No se pudo leer el archivo");
  }
}

function burstGoalSparks() {
  const host = document.getElementById("goalSparks");
  if (!host) return;
  host.innerHTML = "";
  for (let i = 0; i < 14; i += 1) {
    const spark = document.createElement("span");
    spark.className = "goal-spark";
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.2;
    const dist = 70 + Math.random() * 90;
    spark.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    spark.style.animationDelay = `${i * 0.02}s`;
    host.appendChild(spark);
  }
}

function showGoalCelebration(today, goal) {
  const key = todayKey();
  if (state.goalCelebratedDate === key) return;
  state.goalCelebratedDate = key;
  localStorage.setItem("foco-goal-celebrated", key);
  els.goalOverlayTitle.textContent = "Sello del día";
  els.goalOverlayText.textContent = `${today} enfoques. Meta: ${goal}. Hoy ya es tuyo.`;
  els.goalOverlay.hidden = false;
  burstGoalSparks();
}

function hideGoalCelebration() {
  els.goalOverlay.hidden = true;
  const host = document.getElementById("goalSparks");
  if (host) host.innerHTML = "";
  if (state.lastSessionId) {
    showToast("Enfoque guardado", {
      actionLabel: "Deshacer",
      onAction: undoLastFocusSession,
      duration: 5000,
    });
  }
  if (state.pendingNoteSessionId) {
    openNotePrompt(state.pendingNoteSessionId);
  } else if (state.settings.autoAdvance && !state.running) {
    start({ silent: true });
  }
}

function applyFocusPreset(minutes) {
  if (state.running || state.phase !== "focus") return;
  state.settings.focusMins = clamp(minutes, LIMITS.focusMins);
  saveSettings();
  setPhase("focus", { resetTime: true });
  saveSession();
  showToast(`Enfoque a ${minutes} min`);
}

function showToast(message, { actionLabel = null, onAction = null, duration = 2400 } = {}) {
  els.toast.hidden = false;
  els.toastMessage.textContent = message;
  state.toastActionHandler = onAction;
  if (actionLabel && onAction) {
    els.toastAction.hidden = false;
    els.toastAction.textContent = actionLabel;
  } else {
    els.toastAction.hidden = true;
  }
  els.toast.classList.add("is-show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    els.toast.classList.remove("is-show");
    state.toastActionHandler = null;
    els.toastAction.hidden = true;
    state.toastTimer = setTimeout(() => {
      if (!els.toast.classList.contains("is-show")) els.toast.hidden = true;
    }, 320);
  }, duration);
}

function extendMinutes(mins) {
  const ms = mins * 60_000;
  state.remainingMs += ms;
  state.totalMs += ms;
  state.lastExtendMs = ms;
  if (state.running) {
    state.endAt = Date.now() + state.remainingMs;
  }
  if (state.remainingMs > 60_000) state.warnPlayed = false;
  saveSession({ force: true });
  render();
  showToast(mins === 1 ? "+1 minuto" : `+${mins} minutos`, {
    actionLabel: "Deshacer",
    onAction: undoExtend,
    duration: 4000,
  });
}

function undoExtend() {
  if (!state.lastExtendMs) return false;
  const ms = state.lastExtendMs;
  const elapsed = Math.max(0, state.totalMs - state.remainingMs);
  const nextTotal = Math.max(elapsed + 1000, state.totalMs - ms);
  const removed = state.totalMs - nextTotal;
  state.totalMs = nextTotal;
  state.remainingMs = Math.max(1000, state.remainingMs - removed);
  if (state.running) state.endAt = Date.now() + state.remainingMs;
  state.lastExtendMs = 0;
  saveSession({ force: true });
  render();
  showToast("Tiempo deshecho");
  return true;
}

function askConfirm({ title, text, okLabel = "Confirmar", onConfirm }) {
  els.confirmTitle.textContent = title;
  els.confirmText.textContent = text;
  els.confirmOk.textContent = okLabel;
  state.confirmHandler = onConfirm;
  state.sheetFocusReturn = state.sheetFocusReturn || document.activeElement;
  els.confirmOverlay.hidden = false;
  const card = els.confirmOverlay.querySelector(".goal-card");
  if (card) {
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "-1");
    trapFocus(card);
  }
}

function hideConfirm() {
  clearFocusTrap();
  els.confirmOverlay.hidden = true;
  state.confirmHandler = null;
  if (!state.openSheet && state.sheetFocusReturn?.focus) {
    state.sheetFocusReturn.focus();
    state.sheetFocusReturn = null;
  } else if (state.openSheet) {
    const sheet = state.openSheet === "stats" ? els.statsSheet : els.settingsSheet;
    const panel = sheet.querySelector(".sheet-panel");
    if (panel) trapFocus(panel);
  }
}

function toggleTimer() {
  ensureAudio();
  if (state.running) pause();
  else start();
}

async function requestNotifyPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function notifyEnd(kind = "soft") {
  playChime(kind);
  hapticPulse(kind === "soft" ? "end" : kind);
  if (isQuietHours()) return;
  if (!state.settings.notify || !("Notification" in window) || Notification.permission !== "granted") return;
  const title = state.phase === "focus" ? "Enfoque terminado" : "Descanso terminado";
  const body =
    state.phase === "focus"
      ? "Toca para empezar el descanso."
      : "Cuando quieras, vuelve al enfoque.";
  try {
    new Notification(title, { body, icon: "./icon.svg", tag: "foco-phase-end" });
  } catch {
    // iOS may ignore Notification constructor outside service worker in some contexts.
  }
}

async function acquireWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
    state.wakeLock.addEventListener("release", () => {
      state.wakeLock = null;
      if (!state.running || document.visibilityState !== "visible") return;
      setTimeout(() => {
        if (state.running && document.visibilityState === "visible" && !state.wakeLock) {
          acquireWakeLock().catch(() => {});
        }
      }, 900);
    });
  } catch {
    // User denied or unsupported in background tab.
  }
}

async function releaseWakeLock() {
  if (!state.wakeLock) return;
  try {
    await state.wakeLock.release();
  } catch {
    // ignore
  }
  state.wakeLock = null;
}

function clearTick() {
  if (state.tickId) {
    clearTimeout(state.tickId);
    clearInterval(state.tickId);
    state.tickId = null;
  }
}

function scheduleNextTick() {
  clearTick();
  if (!state.running) return;
  const delay =
    document.visibilityState === "hidden"
      ? 2000
      : Math.min(1000, Math.max(200, 1000 - (Date.now() % 1000)));
  state.tickId = setTimeout(() => {
    tick();
    if (state.running) scheduleNextTick();
  }, delay);
}

function tick() {
  if (!state.running || state.endAt == null || state.completing) return;
  state.remainingMs = Math.max(0, state.endAt - Date.now());
  if (!state.warnPlayed && state.remainingMs > 0 && state.remainingMs <= 60_000) {
    state.warnPlayed = true;
    playChime("warn");
    if (state.settings.haptic && navigator.vibrate) navigator.vibrate([20, 30, 20]);
  }
  const sec = Math.ceil(state.remainingMs / 1000);
  if (sec !== state.lastDisplaySecond || state.remainingMs <= 0) {
    state.lastDisplaySecond = sec;
    renderTimerChrome();
  }
  saveSession();
  if (state.remainingMs <= 0) {
    onPhaseComplete();
  }
}

function start({ silent = false } = {}) {
  if (state.running || state.completing) return;
  if (state.remainingMs <= 0) {
    state.totalMs = phaseDurationMs();
    state.remainingMs = state.totalMs;
  }
  state.running = true;
  state.endAt = Date.now() + state.remainingMs;
  state.warnPlayed = state.remainingMs <= 60_000;
  state.lastDisplaySecond = -1;
  stopIdleLines();
  scheduleNextTick();
  acquireWakeLock();
  saveSession({ force: true });
  if (!silent) {
    playChime("start");
    hapticPulse("start");
  }
  enableParallax().catch(() => {});
  render();
}

function pause() {
  if (!state.running || state.completing) return;
  if (state.endAt != null) {
    state.remainingMs = Math.max(0, state.endAt - Date.now());
  }
  state.running = false;
  state.endAt = null;
  clearTick();
  releaseWakeLock();
  saveSession({ force: true });
  hapticPulse("pause");
  syncIdleLines();
  render();
  if (state.deferReload) {
    state.deferReload = false;
    window.location.reload();
  }
}

function resetCurrent() {
  pause();
  setPhase(state.phase, { resetTime: true });
  saveSession({ force: true });
}

function nextPhaseAfter(current) {
  if (current === "focus") {
    const nextCount = state.completedInCycle + 1;
    if (nextCount >= state.settings.roundsUntilLong) {
      state.completedInCycle = 0;
      return "long";
    }
    state.completedInCycle = nextCount;
    return "short";
  }
  return "focus";
}

function completePhaseQuietly() {
  const finished = state.phase;
  const minutes = sessionMinutes();
  state.completing = true;
  state.running = false;
  state.endAt = null;
  clearTick();
  releaseWakeLock();
  state.remainingMs = 0;

  if (finished === "focus") {
    recordFocusSession(minutes);
  }

  const next = nextPhaseAfter(finished);
  setPhase(next, { resetTime: true });
  saveSession({ force: true });
  state.completing = false;
  showToast(finished === "focus" ? "Enfoque terminado mientras no estabas" : "Descanso terminado mientras no estabas");
}

function maybeCelebrateStreak() {
  const streak = currentStreak();
  const hit = STREAK_MILESTONES.find(
    (n) => streak >= n && !state.celebratedMilestones.includes(n)
  );
  if (!hit) return false;
  state.celebratedMilestones.push(hit);
  saveCelebratedMilestones();
  els.goalOverlayTitle.textContent = `Racha de ${hit} días`;
  els.goalOverlayText.textContent =
    hit >= 30
      ? "Constancia de nivel alto. Esto ya es un hábito."
      : hit >= 7
        ? "Una semana entera de foco. Sigue así."
        : "Tres días seguidos. El hábito empieza aquí.";
  els.goalOverlay.hidden = false;
  burstGoalSparks();
  return true;
}

function openNotePrompt(sessionId) {
  if (!els.noteOverlay) return;
  state.pendingNoteSessionId = sessionId;
  if (els.noteInput) els.noteInput.value = "";
  els.noteOverlay.hidden = false;
  const card = els.noteOverlay.querySelector(".goal-card");
  if (card) {
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "-1");
    trapFocus(card);
  }
  setTimeout(() => els.noteInput?.focus(), 200);
}

function closeNotePrompt() {
  if (!els.noteOverlay) return;
  clearFocusTrap();
  els.noteOverlay.hidden = true;
  state.pendingNoteSessionId = null;
}

function saveSessionNote() {
  const id = state.pendingNoteSessionId;
  const note = (els.noteInput?.value || "").trim().slice(0, 80);
  if (id && note) {
    const session = state.history.find((s) => s.id === id);
    if (session) {
      session.note = note;
      saveHistory();
    }
  }
  closeNotePrompt();
  renderStatsPanel();
  maybeStartAfterNote();
}

function skipSessionNote() {
  closeNotePrompt();
  maybeStartAfterNote();
}

function maybeStartAfterNote() {
  if (state.settings.autoAdvance && !state.running) {
    start({ silent: true });
  }
}

function onPhaseComplete() {
  if (state.completing || !state.running) return;
  state.completing = true;

  const finished = state.phase;
  const minutes = sessionMinutes();
  const chimeKind = finished === "focus" ? "focus-end" : "break-end";

  if (state.endAt != null) {
    state.remainingMs = Math.max(0, state.endAt - Date.now());
  }
  state.running = false;
  state.endAt = null;
  clearTick();
  releaseWakeLock();
  state.remainingMs = 0;
  render();
  playPhaseStamp();
  notifyEnd(chimeKind);

  let celebratedSomething = false;
  let recorded = null;
  if (finished === "focus") {
    recorded = recordFocusSession(minutes);
    const today = countTodayFocus();
    const goal = state.settings.dailyGoal;
    if (today >= goal) {
      showGoalCelebration(today, goal);
      celebratedSomething = true;
    } else if (maybeCelebrateStreak()) {
      celebratedSomething = true;
    } else {
      showToast(`Enfoque completado · ${today}/${goal}`, {
        actionLabel: "Deshacer",
        onAction: undoLastFocusSession,
        duration: 5000,
      });
    }
  } else {
    showToast("Descanso completado");
  }

  const next = nextPhaseAfter(finished);
  setPhase(next, { resetTime: true });
  saveSession({ force: true });
  state.completing = false;

  if (finished === "focus" && recorded && !celebratedSomething) {
    openNotePrompt(recorded.id);
    return;
  }

  if (celebratedSomething && recorded) {
    state.pendingNoteSessionId = recorded.id;
  }

  if (state.settings.autoAdvance && !celebratedSomething) {
    start({ silent: true });
  }
}

function doSkipPhase() {
  const finished = state.phase;
  pause();
  // Saltar no cuenta el enfoque hacia el descanso largo.
  if (finished === "focus") {
    setPhase("short", { resetTime: true });
  } else {
    setPhase("focus", { resetTime: true });
  }
  saveSession({ force: true });
  showToast(finished === "focus" ? "Enfoque saltado" : "Pausa saltada");
}

function skipPhase() {
  const progressed = state.totalMs > 0 && state.remainingMs < state.totalMs * 0.5;
  if (progressed) {
    askConfirm({
      title: "¿Saltar este bloque?",
      text: "Ya llevas más de la mitad. ¿Seguro que quieres saltarlo?",
      okLabel: "Saltar",
      onConfirm: doSkipPhase,
    });
    return;
  }
  doSkipPhase();
}

function getFocusable(container) {
  return [...container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
  )].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

function clearFocusTrap() {
  if (state.focusTrapHandler) {
    document.removeEventListener("keydown", state.focusTrapHandler, true);
    state.focusTrapHandler = null;
  }
}

function trapFocus(container) {
  clearFocusTrap();
  const focusables = getFocusable(container);
  const target = focusables[0] || container;
  target.focus?.();
  state.focusTrapHandler = (event) => {
    if (event.key !== "Tab" || !container.isConnected) return;
    const items = getFocusable(container);
    if (!items.length) {
      event.preventDefault();
      container.focus?.();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", state.focusTrapHandler, true);
}

function openSheet(name) {
  closeSheet({ restoreFocus: false });
  state.openSheet = name;
  state.sheetFocusReturn = document.activeElement;
  const sheet = name === "stats" ? els.statsSheet : els.settingsSheet;
  const btn = name === "stats" ? els.statsBtn : els.settingsBtn;
  sheet.classList.add("is-open");
  sheet.setAttribute("aria-hidden", "false");
  btn.setAttribute("aria-expanded", "true");
  if (name === "stats") renderStatsPanel();
  const panel = sheet.querySelector(".sheet-panel");
  if (panel) {
    if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "-1");
    trapFocus(panel);
  }
}

function closeSheet({ restoreFocus = true } = {}) {
  clearFocusTrap();
  [els.statsSheet, els.settingsSheet].forEach((sheet) => {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    const panel = sheet.querySelector(".sheet-panel");
    if (panel) {
      panel.classList.remove("is-dragging");
      panel.style.transform = "";
    }
  });
  els.statsBtn.setAttribute("aria-expanded", "false");
  els.settingsBtn.setAttribute("aria-expanded", "false");
  state.openSheet = null;
  if (restoreFocus && state.sheetFocusReturn?.focus) {
    state.sheetFocusReturn.focus();
  }
  state.sheetFocusReturn = null;
}

function setupSheetGestures(sheet) {
  const panel = sheet.querySelector(".sheet-panel");
  if (!panel) return;
  let startY = 0;
  let currentY = 0;
  let dragging = false;

  panel.addEventListener(
    "pointerdown",
    (event) => {
      if (event.target.closest("button, input, a, label, .stepper, .toggle")) return;
      if (panel.scrollTop > 0) return;
      dragging = true;
      startY = event.clientY;
      currentY = 0;
      panel.classList.add("is-dragging");
      panel.setPointerCapture?.(event.pointerId);
    },
    { passive: true }
  );

  panel.addEventListener(
    "pointermove",
    (event) => {
      if (!dragging) return;
      currentY = Math.max(0, event.clientY - startY);
      panel.style.transform = `translateY(${currentY}px)`;
    },
    { passive: true }
  );

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove("is-dragging");
    if (currentY > 110) {
      panel.style.transform = "";
      closeSheet();
      return;
    }
    panel.style.transform = "translateY(0)";
    requestAnimationFrame(() => {
      panel.style.transform = "";
    });
  };

  panel.addEventListener("pointerup", endDrag);
  panel.addEventListener("pointercancel", endDrag);
}

function applyParallax(beta, gamma) {
  const x = Math.max(-18, Math.min(18, gamma || 0));
  const y = Math.max(-18, Math.min(18, (beta || 0) - 45));
  document.documentElement.style.setProperty("--tilt-x", `${x * 0.9}px`);
  document.documentElement.style.setProperty("--tilt-y", `${y * 0.7}px`);
}

async function enableParallax() {
  if (state.parallaxReady) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !window.DeviceOrientationEvent) return;

  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    const permission = await DeviceOrientationEvent.requestPermission();
    if (permission !== "granted") return;
  }

  window.addEventListener(
    "deviceorientation",
    (event) => {
      applyParallax(event.beta, event.gamma);
    },
    { passive: true }
  );
  state.parallaxReady = true;
}

function adjustSetting(key, delta) {
  const [min, max] = LIMITS[key];
  state.settings[key] = clamp(state.settings[key] + delta, [min, max]);
  saveSettings();
  if (key === "dailyGoal" || key === "weeklyGoal") {
    render();
    return;
  }
  if (!state.running) {
    setPhase(state.phase, { resetTime: true });
    saveSession();
  } else {
    render();
  }
}

function bindEvents() {
  const unlockAudio = () => {
    ensureAudio();
    enableParallax().catch(() => {});
  };
  ["pointerdown", "keydown"].forEach((type) => {
    document.addEventListener(type, unlockAudio, { once: true, passive: true });
  });

  setupSheetGestures(els.statsSheet);
  setupSheetGestures(els.settingsSheet);

  els.primaryBtn.addEventListener("click", toggleTimer);

  els.shell.addEventListener("click", (event) => {
    if (event.target.closest("input, button, label, a")) return;
    toggleTimer();
  });

  els.shell.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleTimer();
    }
  });

  els.resetBtn.addEventListener("click", resetCurrent);
  els.skipBtn.addEventListener("click", skipPhase);

  let extendHoldFired = false;
  const clearExtendHold = () => {
    clearTimeout(state.extendPressTimer);
    state.extendPressTimer = null;
  };
  els.extendBtn.addEventListener("pointerdown", () => {
    extendHoldFired = false;
    clearExtendHold();
    state.extendPressTimer = setTimeout(() => {
      extendHoldFired = true;
      extendMinutes(5);
      if (navigator.vibrate && state.settings.haptic) navigator.vibrate(30);
    }, 450);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
    els.extendBtn.addEventListener(type, clearExtendHold);
  });
  els.extendBtn.addEventListener("click", () => {
    if (extendHoldFired) {
      extendHoldFired = false;
      return;
    }
    extendMinutes(1);
  });

  els.toastAction.addEventListener("click", () => {
    if (typeof state.toastActionHandler === "function") {
      state.toastActionHandler();
    }
  });

  els.confirmCancel.addEventListener("click", hideConfirm);
  els.confirmOk.addEventListener("click", () => {
    const handler = state.confirmHandler;
    hideConfirm();
    if (typeof handler === "function") handler();
  });
  els.confirmOverlay.addEventListener("click", (event) => {
    if (event.target === els.confirmOverlay) hideConfirm();
  });
  els.goalOverlayClose.addEventListener("click", hideGoalCelebration);
  els.goalOverlay.addEventListener("click", (event) => {
    if (event.target === els.goalOverlay) hideGoalCelebration();
  });

  els.presets.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => applyFocusPreset(Number(btn.dataset.preset)));
  });

  els.updateTipBtn.addEventListener("click", () => {
    if (state.waitingWorker) {
      state.waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  });

  els.settingsBtn.addEventListener("click", () => openSheet("settings"));
  els.statsBtn.addEventListener("click", () => openSheet("stats"));
  els.closeSettingsBtn.addEventListener("click", closeSheet);
  els.closeStatsBtn.addEventListener("click", closeSheet);

  document.querySelectorAll("[data-close-sheet]").forEach((el) => {
    el.addEventListener("click", closeSheet);
  });

  document.querySelectorAll("[data-setting]").forEach((btn) => {
    btn.addEventListener("click", () => {
      adjustSetting(btn.dataset.setting, Number(btn.dataset.delta));
    });
  });

  els.taskInput.addEventListener("input", () => {
    state.task = els.taskInput.value.slice(0, 48);
    saveSession();
  });

  els.taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      els.taskInput.blur();
    }
  });

  els.soundToggle.addEventListener("click", () => {
    state.settings.sound = !state.settings.sound;
    saveSettings();
    if (state.settings.sound) {
      ensureAudio();
      playChime();
    }
    render();
  });

  els.hapticToggle.addEventListener("click", () => {
    state.settings.haptic = !state.settings.haptic;
    saveSettings();
    if (state.settings.haptic) {
      if (navigator.vibrate) hapticPulse();
      else showToast("En iPhone usa el sonido; la vibración web no está disponible");
    }
    render();
  });

  els.notifyToggle.addEventListener("click", async () => {
    const next = !state.settings.notify;
    if (next) {
      const ok = await requestNotifyPermission();
      state.settings.notify = ok;
      if (!ok) showToast("Activa notificaciones en Ajustes del iPhone");
    } else {
      state.settings.notify = false;
    }
    saveSettings();
    render();
  });

  els.autoToggle.addEventListener("click", () => {
    state.settings.autoAdvance = !state.settings.autoAdvance;
    saveSettings();
    render();
  });

  els.deepToggle.addEventListener("click", () => {
    state.settings.deepFocus = !state.settings.deepFocus;
    saveSettings();
    render();
    showToast(state.settings.deepFocus ? "Modo profundo activado" : "Modo profundo desactivado");
  });

  document.querySelector(".brand")?.addEventListener("click", () => {
    if (!(state.settings.deepFocus && state.running && state.phase === "focus")) return;
    state.settings.deepFocus = false;
    saveSettings();
    render();
    showToast("Saliste del modo profundo");
  });

  if (els.todayStrip) {
    els.todayStrip.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-task]");
      if (!btn) return;
      const task = btn.dataset.task.slice(0, 48);
      state.task = task;
      els.taskInput.value = task;
      const match = state.history.find(
        (s) => (s.task || "").toLocaleLowerCase("es") === task.toLocaleLowerCase("es")
      );
      if (match && CATEGORIES[match.category]) {
        state.category = match.category;
        state.settings.category = match.category;
        saveSettings();
      }
      saveSession({ force: true });
      render();
      showToast("Tarea lista");
    });
  }

  if (els.nightToggle) {
    els.nightToggle.addEventListener("click", () => {
      state.settings.nightSoft = !state.settings.nightSoft;
      saveSettings();
      render();
      showToast(state.settings.nightSoft ? "Noche suave activada" : "Noche suave desactivada");
    });
  }

  if (els.resetDataBtn) {
    els.resetDataBtn.addEventListener("click", resetStatsData);
  }

  els.historyList.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-del]");
    if (!btn) return;
    deleteHistoryItem(btn.getAttribute("data-del"));
  });

  els.shareWeekBtn.addEventListener("click", () => {
    shareWeek();
  });

  els.exportBtn.addEventListener("click", () => {
    exportBackup();
  });

  if (els.exportIcsBtn) {
    els.exportIcsBtn.addEventListener("click", () => {
      exportIcs();
    });
  }

  if (els.noteSave) {
    els.noteSave.addEventListener("click", saveSessionNote);
  }
  if (els.noteSkip) {
    els.noteSkip.addEventListener("click", skipSessionNote);
  }
  els.noteInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveSessionNote();
    }
  });

  if (els.quietToggle) {
    els.quietToggle.addEventListener("click", () => {
      state.settings.quietHours = !state.settings.quietHours;
      saveSettings();
      render();
      showToast(state.settings.quietHours ? "Horas quietas on (22–8)" : "Horas quietas off");
    });
  }

  els.importInput.addEventListener("change", async () => {
    const file = els.importInput.files && els.importInput.files[0];
    await handleImportFile(file);
    els.importInput.value = "";
  });

  els.pasteImportBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        showToast("El portapapeles está vacío");
        return;
      }
      importBackupText(text);
    } catch {
      showToast("No se pudo leer el portapapeles");
    }
  });

  els.categoryRow.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-category]");
    if (!btn) return;
    state.category = btn.dataset.category;
    state.settings.category = state.category;
    saveSettings();
    saveSession({ force: true });
    renderCategories();
  });

  els.recentTasks.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-task]");
    if (!btn) return;
    const task = btn.dataset.task.slice(0, 48);
    state.task = task;
    els.taskInput.value = task;
    const match = state.history.find(
      (s) => (s.task || "").toLocaleLowerCase("es") === task.toLocaleLowerCase("es")
    );
    if (match && CATEGORIES[match.category]) {
      state.category = match.category;
      state.settings.category = match.category;
      saveSettings();
    }
    saveSession({ force: true });
    renderCategories();
    showToast("Tarea lista");
  });

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      tick();
      if (state.running) {
        scheduleNextTick();
        await acquireWakeLock();
      }
    } else {
      saveSession({ force: true });
      if (state.running) scheduleNextTick();
    }
  });

  window.addEventListener("pagehide", () => saveSession({ force: true }));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (els.ritualOverlay && !els.ritualOverlay.hidden) {
        dismissRitual();
        return;
      }
      if (!els.confirmOverlay.hidden) {
        hideConfirm();
        return;
      }
      if (!els.goalOverlay.hidden) {
        hideGoalCelebration();
        return;
      }
      if (els.noteOverlay && !els.noteOverlay.hidden) {
        skipSessionNote();
        return;
      }
      if (state.openSheet) closeSheet();
      return;
    }

    const typing =
      event.target &&
      (event.target.closest("input, textarea, select") || event.target.isContentEditable);
    if (typing) return;
    if (els.ritualOverlay && !els.ritualOverlay.hidden) return;
    if (!els.confirmOverlay.hidden || !els.goalOverlay.hidden) return;
    if (els.noteOverlay && !els.noteOverlay.hidden) return;
    if (state.openSheet) return;

    const key = event.key.toLowerCase();
    if (key === " " || key === "k") {
      event.preventDefault();
      toggleTimer();
      return;
    }
    if (key === "r") {
      event.preventDefault();
      resetCurrent();
      return;
    }
    if (key === "s") {
      event.preventDefault();
      skipPhase();
      return;
    }
    if (key === "+" || key === "=") {
      event.preventDefault();
      extendMinutes(1);
      return;
    }
    if (key === "1" || key === "2" || key === "3") {
      const map = { 1: 15, 2: 25, 3: 50 };
      event.preventDefault();
      applyFocusPreset(map[key]);
      return;
    }
    if (key === "?") {
      event.preventDefault();
      showToast("Espacio pausa · R reinicia · S salta · +1 · 1/2/3 presets", { duration: 4200 });
    }
  });
}

function showUpdateTip(worker) {
  state.waitingWorker = worker;
  els.updateTip.hidden = false;
  const install = document.getElementById("installTip");
  if (install) install.hidden = true;
}

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");
      if (reg.waiting) showUpdateTip(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateTip(worker);
          }
        });
      });
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (state.running) {
          state.deferReload = true;
          showToast("Actualización lista. Se aplicará al pausar.");
          return;
        }
        window.location.reload();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => {});
      });
    } catch {
      // Sin service worker seguimos en modo online.
    }
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIosSafari() {
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const isChrome = /CriOS|Chrome/.test(ua);
  const isFirefox = /FxiOS/.test(ua);
  return iOS && webkit && !isChrome && !isFirefox;
}

function setupInstallTip() {
  const tip = document.getElementById("installTip");
  const closeBtn = document.getElementById("installTipClose");
  if (!tip || !closeBtn) return;

  const dismissed = localStorage.getItem("foco-install-tip-dismissed") === "1";
  if (dismissed || isStandalone() || !isIosSafari()) return;

  tip.hidden = false;
  closeBtn.addEventListener("click", () => {
    tip.hidden = true;
    localStorage.setItem("foco-install-tip-dismissed", "1");
  });
}

const RITUAL_KEY = "foco-ritual-done";

function shouldShowRitual() {
  if (localStorage.getItem(RITUAL_KEY) === "1") return false;
  if (state.history.length > 0) return false;
  if (state.running) return false;
  if (state.remainingMs > 0 && state.remainingMs < state.totalMs) return false;
  return true;
}

function dismissRitual() {
  if (!els.ritualOverlay) return;
  els.ritualOverlay.hidden = true;
  localStorage.setItem(RITUAL_KEY, "1");
}

function setupRitual() {
  if (!els.ritualOverlay || !els.ritualStart || !els.ritualSkip) return;

  els.ritualSkip.addEventListener("click", () => {
    dismissRitual();
    showToast("Cuando quieras, empieza tu primer sello");
  });

  const begin = () => {
    const task = (els.ritualTask?.value || "").trim().slice(0, 48);
    if (task) {
      state.task = task;
      els.taskInput.value = task;
    }
    dismissRitual();
    ensureAudio();
    setPhase("focus", { resetTime: true });
    start();
    showToast(task ? "Sello en marcha" : "Primer bloque en marcha");
  };

  els.ritualStart.addEventListener("click", begin);
  els.ritualTask?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      begin();
    }
  });

  if (!shouldShowRitual()) return;
  els.ritualOverlay.hidden = false;
  const install = document.getElementById("installTip");
  if (install) install.hidden = true;
  setTimeout(() => els.ritualTask?.focus(), 350);
}

function init() {
  if (CATEGORIES[state.settings.category]) {
    state.category = state.settings.category;
  }
  bindEvents();
  buildRingTicks();
  if (!restoreSession()) {
    setPhase("focus", { resetTime: true });
  } else {
    render();
    syncIdleLines();
  }
  updateThemeColor();
  setInterval(updateThemeColor, 60_000);
  registerSW();
  setupRitual();
  setupInstallTip();
}

init();
