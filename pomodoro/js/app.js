const STORAGE_KEY = "foco-settings-v1";
const STATS_KEY = "foco-stats-v1";
const HISTORY_KEY = "foco-history-v1";
const SESSION_KEY = "foco-session-v1";
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
  dailyGoal: 8,
  sound: true,
  notify: true,
  autoAdvance: true,
};

const LIMITS = {
  focusMins: [1, 90],
  shortMins: [1, 30],
  longMins: [1, 60],
  roundsUntilLong: [2, 8],
  dailyGoal: [1, 20],
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
  streakDisplay: document.getElementById("streakDisplay"),
  streakStat: document.getElementById("streakStat"),
  goalStat: document.getElementById("goalStat"),
  goalFill: document.getElementById("goalFill"),
  presets: document.getElementById("presets"),
  goalOverlay: document.getElementById("goalOverlay"),
  goalOverlayTitle: document.getElementById("goalOverlayTitle"),
  goalOverlayText: document.getElementById("goalOverlayText"),
  goalOverlayClose: document.getElementById("goalOverlayClose"),
  updateTip: document.getElementById("updateTip"),
  updateTipBtn: document.getElementById("updateTipBtn"),
  outputs: {
    focusMins: document.getElementById("focusMins"),
    shortMins: document.getElementById("shortMins"),
    longMins: document.getElementById("longMins"),
    roundsUntilLong: document.getElementById("roundsUntilLong"),
    dailyGoal: document.getElementById("dailyGoal"),
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
  waitingWorker: null,
  goalCelebratedDate: localStorage.getItem("foco-goal-celebrated") || "",
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

function saveSession() {
  const payload = {
    phase: state.phase,
    remainingMs: state.remainingMs,
    totalMs: state.totalMs,
    running: state.running,
    completedInCycle: state.completedInCycle,
    endAt: state.running ? state.endAt : null,
    task: state.task,
    savedAt: Date.now(),
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
        clearTick();
        state.tickId = setInterval(tick, 250);
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

function renderPresets() {
  const show = state.phase === "focus" && !state.running && state.remainingMs === state.totalMs;
  els.presets.hidden = !show;
  els.presets.querySelectorAll("[data-preset]").forEach((btn) => {
    const mins = Number(btn.dataset.preset);
    btn.classList.toggle("is-active", mins === state.settings.focusMins);
  });
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
  renderGoalProgress();
  renderPresets();
  els.outputs.focusMins.value = state.settings.focusMins;
  els.outputs.shortMins.value = state.settings.shortMins;
  els.outputs.longMins.value = state.settings.longMins;
  els.outputs.roundsUntilLong.value = state.settings.roundsUntilLong;
  els.outputs.dailyGoal.value = state.settings.dailyGoal;
  els.notifyToggle.setAttribute("aria-checked", String(state.settings.notify));
  els.soundToggle.setAttribute("aria-checked", String(state.settings.sound));
  els.autoToggle.setAttribute("aria-checked", String(state.settings.autoAdvance));
  if (document.activeElement !== els.taskInput) {
    els.taskInput.value = state.task;
  }
  els.taskInput.closest(".task-field").hidden = state.phase !== "focus";
  if (state.openSheet === "stats") renderStatsPanel();
}

function showGoalCelebration(today, goal) {
  const key = todayKey();
  if (state.goalCelebratedDate === key) return;
  state.goalCelebratedDate = key;
  localStorage.setItem("foco-goal-celebrated", key);
  els.goalOverlayTitle.textContent = "¡Meta cumplida!";
  els.goalOverlayText.textContent = `Hoy llevas ${today} enfoques. Objetivo: ${goal}.`;
  els.goalOverlay.hidden = false;
  if (state.settings.sound) playChime();
  hapticPulse();
}

function hideGoalCelebration() {
  els.goalOverlay.hidden = true;
}

function applyFocusPreset(minutes) {
  if (state.running || state.phase !== "focus") return;
  state.settings.focusMins = clamp(minutes, LIMITS.focusMins);
  saveSettings();
  setPhase("focus", { resetTime: true });
  saveSession();
  showToast(`Enfoque a ${minutes} min`);
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
  saveSession();
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
  saveSession();
  render();
}

function pause() {
  if (!state.running) return;
  tick();
  state.running = false;
  state.endAt = null;
  clearTick();
  releaseWakeLock();
  saveSession();
  render();
}

function resetCurrent() {
  pause();
  setPhase(state.phase, { resetTime: true });
  saveSession();
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
  const plannedMinutes = state.settings[PHASES[finished].setting];
  state.running = false;
  state.endAt = null;
  clearTick();
  releaseWakeLock();
  state.remainingMs = 0;

  if (finished === "focus") {
    recordFocusSession(plannedMinutes);
  }

  const next = nextPhaseAfter(finished);
  setPhase(next, { resetTime: true });
  saveSession();
  showToast(finished === "focus" ? "Enfoque terminado mientras no estabas" : "Descanso terminado mientras no estabas");
}

function onPhaseComplete() {
  const finished = state.phase;
  const plannedMinutes = state.settings[PHASES[finished].setting];
  pause();
  state.remainingMs = 0;
  render();
  notifyEnd();

  let reachedGoal = false;
  if (finished === "focus") {
    recordFocusSession(plannedMinutes);
    const today = countTodayFocus();
    const goal = state.settings.dailyGoal;
    reachedGoal = today >= goal;
    if (reachedGoal) {
      showGoalCelebration(today, goal);
    } else {
      showToast(`Enfoque completado · ${today}/${goal}`);
    }
  } else {
    showToast("Descanso completado");
  }

  const next = nextPhaseAfter(finished);
  setPhase(next, { resetTime: true });
  saveSession();

  if (state.settings.autoAdvance && !reachedGoal) {
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
  saveSession();
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
  if (key === "dailyGoal") {
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
    } else {
      saveSession();
    }
  });

  window.addEventListener("pagehide", saveSession);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.openSheet) closeSheet();
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
        window.location.reload();
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

function init() {
  bindEvents();
  if (!restoreSession()) {
    setPhase("focus", { resetTime: true });
  } else {
    render();
  }
  registerSW();
  setupInstallTip();
}

init();
