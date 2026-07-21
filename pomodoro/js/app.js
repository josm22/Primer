const STORAGE_KEY = "foco-settings-v1";
const STATS_KEY = "foco-stats-v1";

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
  settingsSheet: document.getElementById("settingsSheet"),
  sheetBackdrop: document.getElementById("sheetBackdrop"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  notifyToggle: document.getElementById("notifyToggle"),
  autoToggle: document.getElementById("autoToggle"),
  toast: document.getElementById("toast"),
  metaTheme: document.getElementById("metaTheme"),
  outputs: {
    focusMins: document.getElementById("focusMins"),
    shortMins: document.getElementById("shortMins"),
    longMins: document.getElementById("longMins"),
    roundsUntilLong: document.getElementById("roundsUntilLong"),
  },
};

const state = {
  settings: loadSettings(),
  phase: "focus",
  remainingMs: 0,
  totalMs: 0,
  running: false,
  completedInCycle: 0,
  endAt: null,
  tickId: null,
  wakeLock: null,
  toastTimer: null,
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { date: todayKey(), focusCount: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return { date: todayKey(), focusCount: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), focusCount: 0 };
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
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

function render() {
  els.timeDisplay.textContent = formatTime(state.remainingMs);
  const progress = state.totalMs > 0 ? 1 - state.remainingMs / state.totalMs : 0;
  // Empieza lleno y se vacía con el tiempo restante.
  els.ring.style.strokeDashoffset = String(Math.min(1, Math.max(0, progress)));
  els.primaryBtn.textContent = state.running ? "Pausa" : state.remainingMs < state.totalMs ? "Continuar" : "Empezar";
  els.shell.classList.toggle("is-running", state.running);
  const rounds = state.settings.roundsUntilLong;
  const current = Math.min(state.completedInCycle + 1, rounds);
  els.roundDisplay.textContent = `${current}/${rounds}`;
  els.todayDisplay.textContent = String(loadStats().focusCount);
  els.outputs.focusMins.value = state.settings.focusMins;
  els.outputs.shortMins.value = state.settings.shortMins;
  els.outputs.longMins.value = state.settings.longMins;
  els.outputs.roundsUntilLong.value = state.settings.roundsUntilLong;
  els.notifyToggle.setAttribute("aria-checked", String(state.settings.notify));
  els.autoToggle.setAttribute("aria-checked", String(state.settings.autoAdvance));
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
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
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
  pause();
  state.remainingMs = 0;
  render();
  notifyEnd();

  if (finished === "focus") {
    const stats = loadStats();
    stats.focusCount += 1;
    saveStats(stats);
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
    // Skip does not count as a completed focus session.
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

function openSettings() {
  els.settingsSheet.classList.add("is-open");
  els.settingsSheet.setAttribute("aria-hidden", "false");
  els.settingsBtn.setAttribute("aria-expanded", "true");
}

function closeSettings() {
  els.settingsSheet.classList.remove("is-open");
  els.settingsSheet.setAttribute("aria-hidden", "true");
  els.settingsBtn.setAttribute("aria-expanded", "false");
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
  els.primaryBtn.addEventListener("click", () => {
    if (state.running) pause();
    else start();
  });

  els.resetBtn.addEventListener("click", resetCurrent);
  els.skipBtn.addEventListener("click", skipPhase);

  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  els.sheetBackdrop.addEventListener("click", closeSettings);

  document.querySelectorAll("[data-setting]").forEach((btn) => {
    btn.addEventListener("click", () => {
      adjustSetting(btn.dataset.setting, Number(btn.dataset.delta));
    });
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
    if (event.key === "Escape" && els.settingsSheet.classList.contains("is-open")) {
      closeSettings();
    }
  });
}

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function init() {
  bindEvents();
  setPhase("focus", { resetTime: true });
  registerSW();
}

init();
