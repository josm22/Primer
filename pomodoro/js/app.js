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

const DEFAULTS = {
  focusMins: 25,
  shortMins: 5,
  longMins: 15,
  roundsUntilLong: 4,
  dailyGoal: 8,
  sound: true,
  haptic: true,
  notify: true,
  autoAdvance: true,
  deepFocus: false,
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
  bestDay: document.getElementById("bestDay"),
  presets: document.getElementById("presets"),
  goalOverlay: document.getElementById("goalOverlay"),
  goalOverlayTitle: document.getElementById("goalOverlayTitle"),
  goalOverlayText: document.getElementById("goalOverlayText"),
  goalOverlayClose: document.getElementById("goalOverlayClose"),
  updateTip: document.getElementById("updateTip"),
  updateTipBtn: document.getElementById("updateTipBtn"),
  deepToggle: document.getElementById("deepToggle"),
  shareWeekBtn: document.getElementById("shareWeekBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  recentTasks: document.getElementById("recentTasks"),
  roundDots: document.getElementById("roundDots"),
  todayTimeline: document.getElementById("todayTimeline"),
  todayEmpty: document.getElementById("todayEmpty"),
  confirmOverlay: document.getElementById("confirmOverlay"),
  confirmTitle: document.getElementById("confirmTitle"),
  confirmText: document.getElementById("confirmText"),
  confirmCancel: document.getElementById("confirmCancel"),
  confirmOk: document.getElementById("confirmOk"),
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
  lastSessionId: null,
  toastActionHandler: null,
  confirmHandler: null,
  extendPressTimer: null,
  parallaxReady: false,
  prevCompletedInCycle: 0,
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
  const session = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    date: todayKey(now),
    minutes,
    task: task || null,
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
  if (!state.settings.haptic) return;
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
  }
  updateThemeColor();
  render();
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
    ticks.appendChild(line);
  }
}

function updateThemeColor() {
  const colors = {
    focus: "#e7f0eb",
    short: "#e4f1ed",
    long: "#e6eef4",
  };
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
  if (state.running && state.phase === "focus") return "Concéntrate. Yo cuido el tiempo.";
  if (state.running && state.phase !== "focus") return "Respira. El siguiente foco espera.";
  if (today >= goal) return "Meta del día cumplida. Qué bien.";
  if (hour < 12) return today ? `Buenos días · ${today}/${goal} hoy` : "Buenos días. Empieza con calma.";
  if (hour < 19) return today ? `Buenas tardes · ${today}/${goal} hoy` : "Buenas tardes. Un bloque y listo.";
  return today ? `Buenas noches · ${today}/${goal} hoy` : "Buenas noches. Un último foco.";
}

function renderGreeting() {
  if (!els.greeting) return;
  const next = greetingText();
  if (els.greeting.textContent !== next) {
    els.greeting.textContent = next;
  }
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
      return `
      <li class="history-item">
        <strong>${title}</strong>
        <span>${detail}</span>
      </li>
    `;
    })
    .join("");
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
          </div>
        </li>
      `;
    })
    .join("");
}

function renderRoundDots() {
  const rounds = state.settings.roundsUntilLong;
  const done = state.completedInCycle;
  const current = state.phase === "focus" ? Math.min(done + 1, rounds) : null;
  const popped = done > state.prevCompletedInCycle ? done : 0;
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
  renderHistoryList();
  renderBestDay();
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
    if (names.length >= 4) break;
  }
  return names;
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

function render() {
  els.timeDisplay.textContent = formatTime(state.remainingMs);
  const progress = state.totalMs > 0 ? 1 - state.remainingMs / state.totalMs : 0;
  els.ring.style.strokeDashoffset = String(Math.min(1, Math.max(0, progress)));
  els.primaryBtn.textContent = state.running ? "Pausa" : state.remainingMs < state.totalMs ? "Continuar" : "Empezar";
  els.shell.classList.toggle("is-running", state.running);
  els.shell.classList.toggle("is-ending", state.running && state.remainingMs > 0 && state.remainingMs <= 60_000);
  const rounds = state.settings.roundsUntilLong;
  const current = Math.min(state.completedInCycle + 1, rounds);
  els.roundDisplay.textContent = `${current}/${rounds}`;
  renderRoundDots();
  renderGoalProgress();
  renderGreeting();
  renderPresets();
  renderRecentTasks();
  els.outputs.focusMins.value = state.settings.focusMins;
  els.outputs.shortMins.value = state.settings.shortMins;
  els.outputs.longMins.value = state.settings.longMins;
  els.outputs.roundsUntilLong.value = state.settings.roundsUntilLong;
  els.outputs.dailyGoal.value = state.settings.dailyGoal;
  els.notifyToggle.setAttribute("aria-checked", String(state.settings.notify));
  els.soundToggle.setAttribute("aria-checked", String(state.settings.sound));
  els.hapticToggle.setAttribute("aria-checked", String(state.settings.haptic));
  els.autoToggle.setAttribute("aria-checked", String(state.settings.autoAdvance));
  els.deepToggle.setAttribute("aria-checked", String(state.settings.deepFocus));
  const deepActive = state.settings.deepFocus && state.running && state.phase === "focus";
  els.body.classList.toggle("is-deep-focus", deepActive);
  els.shell.setAttribute("aria-label", state.running ? "Pausar temporizador" : "Empezar o continuar temporizador");
  if (document.activeElement !== els.taskInput) {
    els.taskInput.value = state.task;
  }
  els.taskInput.closest(".task-field").hidden = state.phase !== "focus";
  if (state.openSheet === "stats") renderStatsPanel();
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
  try {
    if (navigator.share) {
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
    .filter((s) => s && s.date && (s.minutes || s.minutes === 0))
    .map((s, index) => ({
      id: s.id || `import-${Date.now()}-${index}`,
      date: String(s.date),
      minutes: Number(s.minutes) || 0,
      task: s.task || null,
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
  els.goalOverlayTitle.textContent = "¡Meta cumplida!";
  els.goalOverlayText.textContent = `Hoy llevas ${today} enfoques. Objetivo: ${goal}.`;
  els.goalOverlay.hidden = false;
  burstGoalSparks();
  if (state.settings.sound) playChime();
  hapticPulse();
}

function hideGoalCelebration() {
  els.goalOverlay.hidden = true;
  const host = document.getElementById("goalSparks");
  if (host) host.innerHTML = "";
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
  }, duration);
}

function extendMinutes(mins) {
  const ms = mins * 60_000;
  state.remainingMs += ms;
  state.totalMs += ms;
  if (state.running) {
    state.endAt = Date.now() + state.remainingMs;
  }
  saveSession();
  render();
  showToast(mins === 1 ? "+1 minuto" : `+${mins} minutos`);
}

function askConfirm({ title, text, okLabel = "Confirmar", onConfirm }) {
  els.confirmTitle.textContent = title;
  els.confirmText.textContent = text;
  els.confirmOk.textContent = okLabel;
  state.confirmHandler = onConfirm;
  els.confirmOverlay.hidden = false;
}

function hideConfirm() {
  els.confirmOverlay.hidden = true;
  state.confirmHandler = null;
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
  if (state.settings.haptic && navigator.vibrate) navigator.vibrate(18);
  enableParallax().catch(() => {});
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
  if (state.settings.haptic && navigator.vibrate) navigator.vibrate([12, 24, 12]);
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
  saveSession();

  if (state.settings.autoAdvance && !reachedGoal) {
    start();
  }
}

function doSkipPhase() {
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
    if (state.settings.haptic) hapticPulse();
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

  els.shareWeekBtn.addEventListener("click", () => {
    shareWeek();
  });

  els.exportBtn.addEventListener("click", () => {
    exportBackup();
  });

  els.importInput.addEventListener("change", async () => {
    const file = els.importInput.files && els.importInput.files[0];
    await handleImportFile(file);
    els.importInput.value = "";
  });

  els.recentTasks.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-task]");
    if (!btn) return;
    state.task = btn.dataset.task.slice(0, 48);
    els.taskInput.value = state.task;
    saveSession();
    showToast("Tarea lista");
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
    if (event.key === "Escape") {
      if (!els.confirmOverlay.hidden) {
        hideConfirm();
        return;
      }
      if (state.openSheet) closeSheet();
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
  buildRingTicks();
  if (!restoreSession()) {
    setPhase("focus", { resetTime: true });
  } else {
    render();
  }
  registerSW();
  setupInstallTip();
}

init();
