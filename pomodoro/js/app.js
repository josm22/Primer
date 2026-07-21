const STORAGE_KEY = "foco-settings-v1";
const STATS_KEY = "foco-stats-v1";
const HISTORY_KEY = "foco-history-v1";
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const PHASES = {
  focus: {
    key: "focus",
    label: "Enfoque",
    support: "Un bloque para concentrarte sin distracciones.",
    setting: "focusMins",
  },
  short: {
    key: "short",
    label: "Descanso corto",
    support: "Levántate un momento y suelta la mirada.",
    setting: "shortMins",
  },
  long: {
    key: "long",
    label: "Descanso largo",
    support: "Respira. Has completado un ciclo completo.",
    setting: "longMins",
  },
};

const DEFAULTS = {
  focusMins: 25,
  shortMins: 5,
  longMins: 15,
  roundsUntilLong: 4,
  sound: true,
  notify: true,
  autoAdvance: true,
};

const LIMITS = {
  focusMins: [1, 90],
  shortMins: [1, 30],
  longMins: [1, 60],
  roundsUntilLong: [2, 8],
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
  autoToggle: document.getElementById("autoToggle"),
  taskInput: document.getElementById("taskInput"),
  toast: document.getElementById("toast"),
  metaTheme: document.getElementById("metaTheme"),
  weekFocusCount: document.getElementById("weekFocusCount"),
  weekFocusMins: document.getElementById("weekFocusMins"),
  weekChart: document.getElementById("weekChart"),
  historyList: document.getElementById("historyList"),
  historyEmpty: document.getElementById("historyEmpty"),
  outputs: {
    focusMins: document.getElementById("focusMins"),
    shortMins: document.getElementById("shortMins"),
    longMins: document.getElementById("longMins"),
    roundsUntilLong: document.getElementById("roundsUntilLong"),
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

function recordFocusSession(minutes) {
  const now = new Date();
  const task = state.task.trim();
  state.history.unshift({
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    date: todayKey(now),
    minutes,
    task: task || null,
    endedAt: now.toISOString(),
  });
  saveHistory();
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

function playChime() {
  if (!state.settings.sound) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  // Campanilla suave en dos tonos (sin archivos externos).
  playTone(ctx, 784, t, 0.22, 0.08);
  playTone(ctx, 1046.5, t + 0.16, 0.34, 0.07);
}

function hapticPulse() {
  if (navigator.vibrate) navigator.vibrate([70, 40, 90]);
}

function countTodayFocus() {
  const key = todayKey();
  return state.history.filter((s) => s.date === key).length;
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

function setPhase(phase, { resetTime = true } = {}) {
  state.phase = phase;
  els.body.dataset.phase = phase;
  const info = PHASES[phase];
  els.phaseLabel.textContent = info.label;
  els.supportText.textContent = info.support;
  if (resetTime) {
    state.totalMs = phaseDurationMs(phase);
    state.remainingMs = state.totalMs;
    state.endAt = null;
  }
  updateThemeColor();
  render();
}

function updateThemeColor() {
  const colors = {
    focus: "#e7f0eb",
    short: "#e4f1ed",
    long: "#e6eef4",
  };
  els.metaTheme.content = colors[state.phase] || colors.focus;
}

function renderWeekChart() {
  const { days, count, minutes } = weekSummary();
  const max = Math.max(1, ...days.map((d) => d.count));
  els.weekFocusCount.textContent = String(count);
  els.weekFocusMins.textContent = String(minutes);

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
      return `
      <li class="history-item">
        <strong>${title}</strong>
        <span>${detail}</span>
      </li>
    `;
    })
    .join("");
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
  renderHistoryList();
}

function render() {
  els.timeDisplay.textContent = formatTime(state.remainingMs);
  const progress = state.totalMs > 0 ? 1 - state.remainingMs / state.totalMs : 0;
  els.ring.style.strokeDashoffset = String(Math.min(1, Math.max(0, progress)));
  els.primaryBtn.textContent = state.running ? "Pausa" : state.remainingMs < state.totalMs ? "Continuar" : "Empezar";
  els.shell.classList.toggle("is-running", state.running);
  const rounds = state.settings.roundsUntilLong;
  const current = Math.min(state.completedInCycle + 1, rounds);
  els.roundDisplay.textContent = `${current}/${rounds}`;
  els.todayDisplay.textContent = String(countTodayFocus());
  els.outputs.focusMins.value = state.settings.focusMins;
  els.outputs.shortMins.value = state.settings.shortMins;
  els.outputs.longMins.value = state.settings.longMins;
  els.outputs.roundsUntilLong.value = state.settings.roundsUntilLong;
  els.notifyToggle.setAttribute("aria-checked", String(state.settings.notify));
  els.soundToggle.setAttribute("aria-checked", String(state.settings.sound));
  els.autoToggle.setAttribute("aria-checked", String(state.settings.autoAdvance));
  if (document.activeElement !== els.taskInput) {
    els.taskInput.value = state.task;
  }
  els.taskInput.closest(".task-field").hidden = state.phase !== "focus";
  if (state.openSheet === "stats") renderStatsPanel();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => els.toast.classList.remove("is-show"), 2400);
}

async function requestNotifyPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function notifyEnd() {
  playChime();
  hapticPulse();
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
    clearInterval(state.tickId);
    state.tickId = null;
  }
}

function tick() {
  if (!state.running || state.endAt == null) return;
  state.remainingMs = Math.max(0, state.endAt - Date.now());
  render();
  if (state.remainingMs <= 0) {
    onPhaseComplete();
  }
}

function start() {
  if (state.running) return;
  if (state.remainingMs <= 0) {
    state.totalMs = phaseDurationMs();
    state.remainingMs = state.totalMs;
  }
  state.running = true;
  state.endAt = Date.now() + state.remainingMs;
  clearTick();
  state.tickId = setInterval(tick, 250);
  acquireWakeLock();
  render();
}

function pause() {
  if (!state.running) return;
  tick();
  state.running = false;
  state.endAt = null;
  clearTick();
  releaseWakeLock();
  render();
}

function resetCurrent() {
  pause();
  setPhase(state.phase, { resetTime: true });
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

function onPhaseComplete() {
  const finished = state.phase;
  const plannedMinutes = state.settings[PHASES[finished].setting];
  pause();
  state.remainingMs = 0;
  render();
  notifyEnd();

  if (finished === "focus") {
    recordFocusSession(plannedMinutes);
    showToast("Enfoque completado");
  } else {
    showToast("Descanso completado");
  }

  const next = nextPhaseAfter(finished);
  setPhase(next, { resetTime: true });

  if (state.settings.autoAdvance) {
    start();
  }
}

function skipPhase() {
  const finished = state.phase;
  pause();
  if (finished === "focus") {
    const nextCount = state.completedInCycle + 1;
    if (nextCount >= state.settings.roundsUntilLong) {
      state.completedInCycle = 0;
      setPhase("long", { resetTime: true });
    } else {
      state.completedInCycle = nextCount;
      setPhase("short", { resetTime: true });
    }
  } else {
    setPhase("focus", { resetTime: true });
  }
}

function openSheet(name) {
  closeSheet();
  state.openSheet = name;
  const sheet = name === "stats" ? els.statsSheet : els.settingsSheet;
  const btn = name === "stats" ? els.statsBtn : els.settingsBtn;
  sheet.classList.add("is-open");
  sheet.setAttribute("aria-hidden", "false");
  btn.setAttribute("aria-expanded", "true");
  if (name === "stats") renderStatsPanel();
}

function closeSheet() {
  [els.statsSheet, els.settingsSheet].forEach((sheet) => {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
  });
  els.statsBtn.setAttribute("aria-expanded", "false");
  els.settingsBtn.setAttribute("aria-expanded", "false");
  state.openSheet = null;
}

function adjustSetting(key, delta) {
  const [min, max] = LIMITS[key];
  state.settings[key] = clamp(state.settings[key] + delta, [min, max]);
  saveSettings();
  if (!state.running) {
    setPhase(state.phase, { resetTime: true });
  } else {
    render();
  }
}

function bindEvents() {
  const unlockAudio = () => ensureAudio();
  ["pointerdown", "keydown"].forEach((type) => {
    document.addEventListener(type, unlockAudio, { once: true, passive: true });
  });

  els.primaryBtn.addEventListener("click", () => {
    ensureAudio();
    if (state.running) pause();
    else start();
  });

  els.resetBtn.addEventListener("click", resetCurrent);
  els.skipBtn.addEventListener("click", skipPhase);

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

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      tick();
      if (state.running) await acquireWakeLock();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.openSheet) closeSheet();
  });
}

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
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

function init() {
  bindEvents();
  setPhase("focus", { resetTime: true });
  registerSW();
  setupInstallTip();
}

init();
