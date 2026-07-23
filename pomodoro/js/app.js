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

const BREAK_ACTIVITIES = {
  stretch: { label: "Estirar", tip: "Cuello y hombros. 30 segundos." },
  water: { label: "Agua", tip: "Un vaso ahora vale más que dos después." },
  walk: { label: "Caminar", tip: "Da diez pasos lejos de la pantalla." },
};

const CATEGORY_PRESETS = {
  trabajo: { focusMins: 25, shortMins: 5, longMins: 15, roundsUntilLong: 4 },
  estudio: { focusMins: 50, shortMins: 10, longMins: 20, roundsUntilLong: 4 },
  personal: { focusMins: 25, shortMins: 5, longMins: 15, roundsUntilLong: 3 },
  extra: { focusMins: 15, shortMins: 3, longMins: 10, roundsUntilLong: 3 },
};

const SOUND_THEMES = {
  soft: {
    label: "Suave",
    focusEnd: [659.25, 523.25, 392],
    breakEnd: [523.25, 659.25, 784],
    start: 880,
    warn: 698.46,
    soft: [784, 1046.5],
    osc: "sine",
  },
  bell: {
    label: "Campana",
    focusEnd: [880, 659.25, 523.25],
    breakEnd: [659.25, 880, 1046.5],
    start: 988,
    warn: 740,
    soft: [880, 1174.66],
    osc: "triangle",
  },
  wood: {
    label: "Madera",
    focusEnd: [329.63, 261.63, 196],
    breakEnd: [261.63, 329.63, 392],
    start: 440,
    warn: 349.23,
    soft: [392, 523.25],
    osc: "sine",
  },
};

const STREAK_MILESTONES = [3, 7, 14, 30];
const MILESTONE_KEY = "foco-streak-milestones-v1";
const FREEZE_KEY = "foco-streak-freeze-v1";
const PRESET_OVERRIDES_KEY = "foco-category-overrides-v1";
const INTENTION_KEY = "foco-intention-v1";
const QUEUE_KEY = "foco-queue-v1";
const SPRINTS_KEY = "foco-sprints-v1";
const BAND_GOAL_KEY = "foco-band-goals-celebrated-v1";

const ATMOSPHERES = {
  slate: {
    label: "Pizarra",
    vars: {
      "--bg-a": "#e2e4df",
      "--bg-b": "#c5c9c0",
      "--bg-c": "#eceee9",
      "--ink": "#101411",
      "--ink-soft": "#4a524c",
      "--paper": "#f3f4f0",
      "--surface": "rgba(243, 244, 240, 0.55)",
    },
  },
  olive: {
    label: "Olivo",
    vars: {
      "--bg-a": "#dde3d4",
      "--bg-b": "#b9c4a8",
      "--bg-c": "#e8eee0",
      "--ink": "#1a2216",
      "--ink-soft": "#4f5a45",
      "--paper": "#f1f4ea",
      "--surface": "rgba(241, 244, 234, 0.58)",
    },
  },
  dusk: {
    label: "Crepúsculo",
    vars: {
      "--bg-a": "#ddd6d0",
      "--bg-b": "#b8ada4",
      "--bg-c": "#ebe4de",
      "--ink": "#1c1612",
      "--ink-soft": "#5a5048",
      "--paper": "#f5efe9",
      "--surface": "rgba(245, 239, 233, 0.58)",
    },
  },
  mist: {
    label: "Bruma",
    vars: {
      "--bg-a": "#d7e0e4",
      "--bg-b": "#aebcc4",
      "--bg-c": "#e5eef1",
      "--ink": "#12181c",
      "--ink-soft": "#4a555c",
      "--paper": "#eef4f6",
      "--surface": "rgba(238, 244, 246, 0.58)",
    },
  },
};

const DEFAULTS = {
  focusMins: 25,
  shortMins: 5,
  longMins: 15,
  roundsUntilLong: 4,
  dailyGoal: 8,
  weeklyGoal: 40,
  morningGoal: 3,
  afternoonGoal: 3,
  eveningGoal: 2,
  nightGoal: 0,
  sprintShortMins: 3,
  sound: true,
  haptic: true,
  notify: true,
  autoAdvance: true,
  deepFocus: false,
  nightSoft: true,
  quietHours: false,
  category: "trabajo",
  categoryPresets: true,
  soundTheme: "soft",
  atmosphere: "slate",
  queueOnly: false,
  peakNudge: true,
};

const SPRINT_OPTIONS = [2, 3, 4];

const LIMITS = {
  focusMins: [1, 90],
  shortMins: [1, 30],
  longMins: [1, 60],
  roundsUntilLong: [2, 8],
  dailyGoal: [1, 20],
  weeklyGoal: [5, 100],
  morningGoal: [0, 12],
  afternoonGoal: [0, 12],
  eveningGoal: [0, 12],
  nightGoal: [0, 12],
  sprintShortMins: [1, 15],
};

const els = {
  body: document.body,
  shell: document.getElementById("timerShell"),
  ring: document.getElementById("ringProgress"),
  phaseLabel: document.getElementById("phaseLabel"),
  timeDisplay: document.getElementById("timeDisplay"),
  supportText: document.getElementById("supportText"),
  breakActivities: document.getElementById("breakActivities"),
  etaText: document.getElementById("etaText"),
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
  toastSecondary: document.getElementById("toastSecondary"),
  greeting: document.getElementById("greeting"),
  todayStrip: document.getElementById("todayStrip"),
  offlineBadge: document.getElementById("offlineBadge"),
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
  focusScoreValue: document.getElementById("focusScoreValue"),
  focusScoreCopy: document.getElementById("focusScoreCopy"),
  focusScoreRing: document.getElementById("focusScoreRing"),
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
  categoryPresetsToggle: document.getElementById("categoryPresetsToggle"),
  soundThemeRow: document.getElementById("soundThemeRow"),
  streakFreezeRow: document.getElementById("streakFreezeRow"),
  streakFreezeCopy: document.getElementById("streakFreezeCopy"),
  streakFreezeBtn: document.getElementById("streakFreezeBtn"),
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
  dayOverlay: document.getElementById("dayOverlay"),
  dayKicker: document.getElementById("dayKicker"),
  dayTitle: document.getElementById("dayTitle"),
  dayText: document.getElementById("dayText"),
  dayClose: document.getElementById("dayClose"),
  recapTip: document.getElementById("recapTip"),
  recapTipText: document.getElementById("recapTipText"),
  recapShareBtn: document.getElementById("recapShareBtn"),
  recapCloseBtn: document.getElementById("recapCloseBtn"),
  repeatLastBtn: document.getElementById("repeatLastBtn"),
  categoryBreakdown: document.getElementById("categoryBreakdown"),
  streakMilestoneRow: document.getElementById("streakMilestoneRow"),
  streakMilestoneText: document.getElementById("streakMilestoneText"),
  streakMilestoneFill: document.getElementById("streakMilestoneFill"),
  exportWeekPngBtn: document.getElementById("exportWeekPngBtn"),
  shortcutsOverlay: document.getElementById("shortcutsOverlay"),
  shortcutsClose: document.getElementById("shortcutsClose"),
  monthFocusCount: document.getElementById("monthFocusCount"),
  monthFocusMins: document.getElementById("monthFocusMins"),
  allFocusCount: document.getElementById("allFocusCount"),
  allFocusMins: document.getElementById("allFocusMins"),
  historyFilter: document.getElementById("historyFilter"),
  savePresetBtn: document.getElementById("savePresetBtn"),
  resetPresetBtn: document.getElementById("resetPresetBtn"),
  intentionOverlay: document.getElementById("intentionOverlay"),
  intentionInput: document.getElementById("intentionInput"),
  intentionBlocks: document.getElementById("intentionBlocks"),
  intentionSave: document.getElementById("intentionSave"),
  intentionSkip: document.getElementById("intentionSkip"),
  intentionChip: document.getElementById("intentionChip"),
  cycleEta: document.getElementById("cycleEta"),
  printDayBtn: document.getElementById("printDayBtn"),
  printReport: document.getElementById("printReport"),
  wallClock: document.getElementById("wallClock"),
  taskQueue: document.getElementById("taskQueue"),
  queueInput: document.getElementById("queueInput"),
  queueAddBtn: document.getElementById("queueAddBtn"),
  queueList: document.getElementById("queueList"),
  atmosphereRow: document.getElementById("atmosphereRow"),
  queueOnlyToggle: document.getElementById("queueOnlyToggle"),
  peakNudgeToggle: document.getElementById("peakNudgeToggle"),
  queueClearDoneBtn: document.getElementById("queueClearDoneBtn"),
  hourChart: document.getElementById("hourChart"),
  hourInsight: document.getElementById("hourInsight"),
  sprintRow: document.getElementById("sprintRow"),
  sprintChip: document.getElementById("sprintChip"),
  sprintStopBtn: document.getElementById("sprintStopBtn"),
  suggestSprint: document.getElementById("suggestSprint"),
  suggestSprintText: document.getElementById("suggestSprintText"),
  suggestSprintBtn: document.getElementById("suggestSprintBtn"),
  suggestSprintDismiss: document.getElementById("suggestSprintDismiss"),
  sprintHistory: document.getElementById("sprintHistory"),
  sprintHistoryEmpty: document.getElementById("sprintHistoryEmpty"),
  sprintWeekStat: document.getElementById("sprintWeekStat"),
  bandGoalRow: document.getElementById("bandGoalRow"),
  outputs: {
    focusMins: document.getElementById("focusMins"),
    shortMins: document.getElementById("shortMins"),
    longMins: document.getElementById("longMins"),
    roundsUntilLong: document.getElementById("roundsUntilLong"),
    dailyGoal: document.getElementById("dailyGoal"),
    weeklyGoal: document.getElementById("weeklyGoal"),
    morningGoal: document.getElementById("morningGoal"),
    afternoonGoal: document.getElementById("afternoonGoal"),
    eveningGoal: document.getElementById("eveningGoal"),
    nightGoal: document.getElementById("nightGoal"),
    sprintShortMins: document.getElementById("sprintShortMins"),
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
  toastSecondaryHandler: null,
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
  historyFilter: "all",
  breakActsDone: [],
  intention: loadIntention(),
  queue: loadQueue(),
  sprint: null,
  dragQueueId: null,
  sprints: loadSprintHistory(),
  bandCelebrated: loadBandCelebrated(),
  pausedAt: null,
};

function loadIntention() {
  try {
    const raw = localStorage.getItem(INTENTION_KEY);
    if (!raw) return { date: "", text: "", blocks: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return { date: "", text: "", blocks: 0 };
    return {
      date: parsed.date,
      text: typeof parsed.text === "string" ? parsed.text.slice(0, 48) : "",
      blocks: Number(parsed.blocks) || 0,
    };
  } catch {
    return { date: "", text: "", blocks: 0 };
  }
}

function saveIntention(data) {
  state.intention = data;
  localStorage.setItem(INTENTION_KEY, JSON.stringify(data));
}

function clearIntentionIfStale() {
  if (state.intention.date && state.intention.date !== todayKey()) {
    state.intention = { date: "", text: "", blocks: 0 };
  }
}

function loadQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return { date: todayKey(), items: [] };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return { date: todayKey(), items: [] };
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .filter((item) => item && typeof item.text === "string" && item.text.trim())
          .map((item, index) => ({
            id: item.id || `q-${Date.now()}-${index}`,
            text: item.text.trim().slice(0, 48),
            done: Boolean(item.done),
          }))
          .slice(0, 12)
      : [];
    return { date: parsed.date, items };
  } catch {
    return { date: todayKey(), items: [] };
  }
}

function saveQueue() {
  state.queue.date = todayKey();
  localStorage.setItem(QUEUE_KEY, JSON.stringify(state.queue));
}

function ensureQueueFresh() {
  if (state.queue.date !== todayKey()) {
    state.queue = { date: todayKey(), items: [] };
  }
}

function addQueueItem(text) {
  ensureQueueFresh();
  const clean = text.trim().slice(0, 48);
  if (!clean) return;
  if (state.queue.items.some((item) => item.text.toLocaleLowerCase("es") === clean.toLocaleLowerCase("es") && !item.done)) {
    showToast("Ya está en la cola");
    return;
  }
  state.queue.items.push({
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: clean,
    done: false,
  });
  saveQueue();
  renderTaskQueue();
  showToast("Añadido a la cola");
}

function toggleQueueItem(id) {
  ensureQueueFresh();
  const item = state.queue.items.find((q) => q.id === id);
  if (!item) return;
  item.done = !item.done;
  saveQueue();
  renderTaskQueue();
}

function removeQueueItem(id) {
  ensureQueueFresh();
  state.queue.items = state.queue.items.filter((q) => q.id !== id);
  saveQueue();
  renderTaskQueue();
}

function moveQueueItem(id, direction) {
  ensureQueueFresh();
  const index = state.queue.items.findIndex((q) => q.id === id);
  if (index < 0) return;
  const target = index + direction;
  if (target < 0 || target >= state.queue.items.length) return;
  const items = state.queue.items;
  const [item] = items.splice(index, 1);
  items.splice(target, 0, item);
  saveQueue();
  renderTaskQueue();
}

function reorderQueueById(fromId, toId) {
  ensureQueueFresh();
  if (!fromId || !toId || fromId === toId) return;
  const from = state.queue.items.findIndex((q) => q.id === fromId);
  const to = state.queue.items.findIndex((q) => q.id === toId);
  if (from < 0 || to < 0) return;
  const items = state.queue.items;
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item);
  saveQueue();
  renderTaskQueue();
}

function restoreAutoAdvanceFromSprint(sprint) {
  if (!sprint || typeof sprint.prevAutoAdvance !== "boolean") return;
  if (state.settings.autoAdvance === sprint.prevAutoAdvance) return;
  state.settings.autoAdvance = sprint.prevAutoAdvance;
  saveSettings();
}

function startSprint(total) {
  const n = clamp(Number(total) || 0, [2, 8]);
  if (state.sprint) restoreAutoAdvanceFromSprint(state.sprint);
  state.sprint = {
    total: n,
    done: 0,
    startedAt: Date.now(),
    focusMinutes: 0,
    prevAutoAdvance: state.settings.autoAdvance,
  };
  state.settings.autoAdvance = true;
  saveSettings();
  saveSession({ force: true });
  render();
  showToast(`Sprint ×${n} · pausas de ${state.settings.sprintShortMins} min`);
  if (!state.running && state.phase === "focus") {
    start();
  }
}

function stopSprint({ toast = true } = {}) {
  if (!state.sprint) return;
  restoreAutoAdvanceFromSprint(state.sprint);
  state.sprint = null;
  saveSession({ force: true });
  render();
  if (toast) showToast("Sprint cancelado");
}

function loadSprintHistory() {
  try {
    const raw = localStorage.getItem(SPRINTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

function saveSprintHistory() {
  localStorage.setItem(SPRINTS_KEY, JSON.stringify(state.sprints.slice(0, 30)));
}

function recordSprintComplete(sprint) {
  const entry = {
    id: `sp-${Date.now()}`,
    date: todayKey(),
    total: sprint.total,
    minutes: sprint.focusMinutes || sprint.total * state.settings.focusMins,
    endedAt: new Date().toISOString(),
  };
  state.sprints.unshift(entry);
  saveSprintHistory();
}

function loadBandCelebrated() {
  try {
    const raw = localStorage.getItem(BAND_GOAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveBandCelebrated() {
  localStorage.setItem(BAND_GOAL_KEY, JSON.stringify(state.bandCelebrated));
}

function bandGoalFor(key) {
  if (key === "morning") return Number(state.settings.morningGoal) || 0;
  if (key === "afternoon") return Number(state.settings.afternoonGoal) || 0;
  if (key === "evening") return Number(state.settings.eveningGoal) || 0;
  if (key === "night") return Number(state.settings.nightGoal) || 0;
  return 0;
}

function bandLabel(key) {
  if (key === "morning") return "mañana";
  if (key === "afternoon") return "tarde";
  if (key === "evening") return "noche";
  return "madrugada";
}

function maybeCelebrateBandGoal(bandKey, todayCount) {
  const goal = bandGoalFor(bandKey);
  if (!goal || todayCount < goal) return false;
  const day = todayKey();
  const stamp = `${day}:${bandKey}`;
  if (state.bandCelebrated[stamp]) return false;
  state.bandCelebrated[stamp] = 1;
  saveBandCelebrated();
  showToast(`Meta de ${bandLabel(bandKey)} sellada · ${todayCount}/${goal}`, { duration: 4200 });
  return true;
}

function advanceSprintOnFocus(minutes = 0) {
  if (!state.sprint) return false;
  state.sprint.done += 1;
  state.sprint.focusMinutes = (state.sprint.focusMinutes || 0) + (Number(minutes) || 0);
  if (state.sprint.done >= state.sprint.total) {
    const finished = { ...state.sprint };
    restoreAutoAdvanceFromSprint(finished);
    state.sprint = null;
    recordSprintComplete(finished);
    showToast(`Sprint ×${finished.total} completado`, { duration: 4200 });
    return true;
  }
  return false;
}

function renderSprint() {
  if (els.sprintRow) {
    const show =
      state.phase === "focus" &&
      !state.running &&
      state.remainingMs === state.totalMs &&
      !state.sprint &&
      !(state.settings.deepFocus && state.running);
    els.sprintRow.hidden = !show;
  }
  if (els.sprintChip) {
    if (!state.sprint) {
      els.sprintChip.hidden = true;
    } else {
      els.sprintChip.hidden = false;
      els.sprintChip.textContent = `Sprint ${state.sprint.done}/${state.sprint.total}`;
    }
  }
  if (els.sprintStopBtn) {
    els.sprintStopBtn.hidden = !state.sprint;
  }
  els.body.classList.toggle("is-sprint", Boolean(state.sprint));
}

function clearDoneQueueItems() {
  ensureQueueFresh();
  const before = state.queue.items.length;
  state.queue.items = state.queue.items.filter((q) => !q.done);
  if (state.queue.items.length === before) {
    showToast("No hay hechos que limpiar");
    return;
  }
  saveQueue();
  renderTaskQueue();
  showToast("Cola limpia");
}

function pullQueueItem(id) {
  ensureQueueFresh();
  const item = state.queue.items.find((q) => q.id === id);
  if (!item || state.running) return;
  state.task = item.text;
  els.taskInput.value = item.text;
  saveSession({ force: true });
  render();
  showToast("Tarea lista");
}

function markQueueDoneByTask(task) {
  ensureQueueFresh();
  const clean = (task || "").trim().toLocaleLowerCase("es");
  if (!clean) return;
  const item = state.queue.items.find(
    (q) => !q.done && q.text.toLocaleLowerCase("es") === clean
  );
  if (!item) return;
  item.done = true;
  saveQueue();
}

function nextQueueItem() {
  ensureQueueFresh();
  return state.queue.items.find((q) => !q.done) || null;
}

function applyAtmosphere(name = state.settings.atmosphere) {
  const theme = ATMOSPHERES[name] || ATMOSPHERES.slate;
  state.settings.atmosphere = ATMOSPHERES[name] ? name : "slate";
  els.body.dataset.atmosphere = state.settings.atmosphere;
  for (const [key, value] of Object.entries(theme.vars)) {
    document.documentElement.style.setProperty(key, value);
  }
}

function renderAtmosphere() {
  if (!els.atmosphereRow) return;
  const current = ATMOSPHERES[state.settings.atmosphere] ? state.settings.atmosphere : "slate";
  els.atmosphereRow.querySelectorAll("[data-atmosphere]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.atmosphere === current);
    btn.setAttribute("aria-pressed", String(btn.dataset.atmosphere === current));
  });
}

function renderWallClock() {
  if (!els.wallClock) return;
  const now = new Date();
  els.wallClock.textContent = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderTaskQueue() {
  if (!els.taskQueue || !els.queueList) return;
  ensureQueueFresh();
  const deepActive = state.settings.deepFocus && state.running && state.phase === "focus";
  const show = state.phase === "focus" && !deepActive;
  els.taskQueue.hidden = !show;
  if (!show) return;

  const items = state.queue.items;
  const doneCount = items.filter((q) => q.done).length;
  if (els.queueClearDoneBtn) {
    els.queueClearDoneBtn.hidden = doneCount === 0;
  }

  if (!items.length) {
    els.queueList.innerHTML = `<li class="queue-empty">${
      state.settings.queueOnly
        ? "Cola vacía. En modo solo cola, añade lo que vas a sellar."
        : "Cola vacía. Añade lo que quieres sellar hoy."
    }</li>`;
    return;
  }

  els.queueList.innerHTML = items
    .map((item, index) => {
      const doneClass = item.done ? " is-done" : "";
      const upDisabled = index === 0 ? " disabled" : "";
      const downDisabled = index === items.length - 1 ? " disabled" : "";
      return `
        <li class="queue-item${doneClass}" data-id="${escapeHtml(item.id)}">
          <button type="button" class="queue-handle" data-drag="${escapeHtml(item.id)}" aria-label="Arrastrar">⋮⋮</button>
          <button type="button" class="queue-check" data-toggle="${escapeHtml(item.id)}" aria-label="${item.done ? "Marcar pendiente" : "Marcar hecho"}">${item.done ? "✓" : ""}</button>
          <button type="button" class="queue-text" data-pull="${escapeHtml(item.id)}">${escapeHtml(item.text)}</button>
          <div class="queue-move">
            <button type="button" class="queue-move-btn" data-move="${escapeHtml(item.id)}" data-dir="-1" aria-label="Subir"${upDisabled}>↑</button>
            <button type="button" class="queue-move-btn" data-move="${escapeHtml(item.id)}" data-dir="1" aria-label="Bajar"${downDisabled}>↓</button>
          </div>
          <button type="button" class="queue-del" data-remove="${escapeHtml(item.id)}" aria-label="Quitar">×</button>
        </li>
      `;
    })
    .join("");
}

function hourBucketsForWeek() {
  const { days } = weekSummary();
  const keys = new Set(days.map((d) => d.key));
  const buckets = [
    { key: "morning", label: "Mañana", range: "6–12", count: 0, today: 0 },
    { key: "afternoon", label: "Tarde", range: "12–18", count: 0, today: 0 },
    { key: "evening", label: "Noche", range: "18–24", count: 0, today: 0 },
    { key: "night", label: "Madrugada", range: "0–6", count: 0, today: 0 },
  ];
  const today = todayKey();
  for (const session of state.history) {
    if (!keys.has(session.date)) continue;
    const date = session.endedAt ? new Date(session.endedAt) : null;
    if (!date || Number.isNaN(date.getTime())) continue;
    const hour = date.getHours();
    let idx = 3;
    if (hour >= 6 && hour < 12) idx = 0;
    else if (hour >= 12 && hour < 18) idx = 1;
    else if (hour >= 18) idx = 2;
    buckets[idx].count += 1;
    if (session.date === today) buckets[idx].today += 1;
  }
  return buckets;
}

function currentHourBand() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18) return "evening";
  return "night";
}

function renderHourChart() {
  if (!els.hourChart) return;
  const buckets = hourBucketsForWeek();
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const nowBand = currentHourBand();
  els.hourChart.innerHTML = buckets
    .map((bucket) => {
      const height = Math.max(4, Math.round((bucket.count / max) * 100));
      const current = bucket.key === nowBand ? " is-current" : "";
      const goal = bandGoalFor(bucket.key);
      const goalText = goal
        ? `<div class="hour-goal ${bucket.today >= goal ? "is-met" : ""}">${bucket.today}/${goal}</div>`
        : `<div class="hour-today">Hoy ${bucket.today}</div>`;
      return `
        <div class="hour-col${current}" title="${bucket.label}: ${bucket.count} · hoy ${bucket.today}${goal ? ` · meta ${goal}` : ""}">
          <div class="hour-bar-wrap">
            <div class="hour-bar" style="height:${bucket.count ? height : 4}%"></div>
          </div>
          <div class="hour-count">${bucket.count || "·"}</div>
          <div class="hour-name">${bucket.label}</div>
          <div class="hour-range">${bucket.range}</div>
          ${goalText}
        </div>
      `;
    })
    .join("");

  if (els.bandGoalRow) {
    const morning = buckets.find((b) => b.key === "morning");
    const afternoon = buckets.find((b) => b.key === "afternoon");
    const evening = buckets.find((b) => b.key === "evening");
    const night = buckets.find((b) => b.key === "night");
    const mGoal = bandGoalFor("morning");
    const aGoal = bandGoalFor("afternoon");
    const eGoal = bandGoalFor("evening");
    const nGoal = bandGoalFor("night");
    const bits = [];
    if (mGoal) bits.push(`Mañana ${morning?.today || 0}/${mGoal}`);
    if (aGoal) bits.push(`Tarde ${afternoon?.today || 0}/${aGoal}`);
    if (eGoal) bits.push(`Noche ${evening?.today || 0}/${eGoal}`);
    if (nGoal) bits.push(`Madrugada ${night?.today || 0}/${nGoal}`);
    els.bandGoalRow.hidden = !bits.length;
    els.bandGoalRow.textContent = bits.join(" · ");
  }

  if (els.hourInsight) {
    if (!total) {
      els.hourInsight.textContent = "Cuando completes sellos verás tu franja fuerte.";
      return;
    }
    const top = buckets.reduce((acc, b) => (b.count > (acc?.count || 0) ? b : acc), null);
    const now = buckets.find((b) => b.key === nowBand);
    const parts = [];
    if (top && top.count) {
      parts.push(`Suele irte bien de ${top.label.toLowerCase()} (${top.range}h)`);
    }
    if (now) {
      const goal = bandGoalFor(now.key);
      if (goal) {
        parts.push(`ahora ${now.today}/${goal} en ${now.label.toLowerCase()}`);
      } else {
        parts.push(`ahora ${now.today} en ${now.label.toLowerCase()}`);
      }
    }
    els.hourInsight.textContent = `${parts.join(" · ")}.`;
  }
}

function weekSprintSummary() {
  const { days } = weekSummary();
  const keys = new Set(days.map((d) => d.key));
  const weekSprints = state.sprints.filter((s) => keys.has(s.date));
  return {
    count: weekSprints.length,
    blocks: weekSprints.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
    minutes: weekSprints.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0),
  };
}

function renderSprintHistory() {
  if (!els.sprintHistory) return;
  const week = weekSprintSummary();
  if (els.sprintWeekStat) {
    if (week.count > 0) {
      els.sprintWeekStat.hidden = false;
      els.sprintWeekStat.textContent = `Esta semana: ${week.count} sprint${week.count === 1 ? "" : "s"} · ${week.blocks} bloques · ${week.minutes} min`;
    } else {
      els.sprintWeekStat.hidden = true;
    }
  }
  const recent = state.sprints.slice(0, 6);
  if (els.sprintHistoryEmpty) els.sprintHistoryEmpty.hidden = recent.length > 0;
  els.sprintHistory.innerHTML = recent
    .map((sprint) => {
      const when = sprint.endedAt
        ? new Date(sprint.endedAt).toLocaleString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : sprint.date;
      return `
        <li class="sprint-history-item">
          <strong>Sprint ×${sprint.total}</strong>
          <span>${sprint.minutes || 0} min · ${escapeHtml(when)}</span>
        </li>
      `;
    })
    .join("");
}

function strongestBandKey() {
  const buckets = hourBucketsForWeek();
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  if (total < 3) return null;
  return buckets.reduce((acc, b) => (b.count > (acc?.count || 0) ? b : acc), null)?.key || null;
}

function peakNudgeStorageKey(band = currentHourBand()) {
  return `foco-peak-nudge-${todayKey()}-${band}`;
}

function peakNudgeSnoozeKey(band = currentHourBand()) {
  return `foco-peak-snooze-${band}`;
}

function isPeakNudgeSuppressed(band = currentHourBand()) {
  if (localStorage.getItem(peakNudgeStorageKey(band)) === "1") return true;
  const until = Number(localStorage.getItem(peakNudgeSnoozeKey(band)) || 0);
  return until > Date.now();
}

function suppressPeakNudge(band = currentHourBand()) {
  localStorage.setItem(peakNudgeStorageKey(band), "1");
  localStorage.removeItem(peakNudgeSnoozeKey(band));
}

function snoozePeakNudge(hours = 2, band = currentHourBand()) {
  const until = Date.now() + hours * 60 * 60 * 1000;
  localStorage.setItem(peakNudgeSnoozeKey(band), String(until));
}

function isToastOpen() {
  return Boolean(els.toast && !els.toast.hidden && els.toast.classList.contains("is-show"));
}

function maybeNudgePeakBand() {
  if (!state.settings.peakNudge) return;
  if (state.running || state.sprint) return;
  if (isQuietHours()) return;
  if (isToastOpen()) return;
  if (els.ritualOverlay && !els.ritualOverlay.hidden) return;
  if (els.intentionOverlay && !els.intentionOverlay.hidden) return;
  const peak = strongestBandKey();
  const now = currentHourBand();
  if (!peak || peak !== now) return;
  if (isPeakNudgeSuppressed(now)) return;
  const buckets = hourBucketsForWeek();
  const band = buckets.find((b) => b.key === now);
  const goal = bandGoalFor(now);
  if (!band) return;
  if (goal && band.today >= goal) return;
  if (!goal && band.today >= 2) return;
  const remaining = goal ? Math.max(0, goal - band.today) : 0;
  const copy = goal
    ? `Tu franja fuerte: ${bandLabel(now)}. Te faltan ${remaining}.`
    : `Estás en tu franja fuerte (${bandLabel(now)}). Un bloque ahora suma.`;
  showToast(copy, {
    actionLabel: "Empezar",
    onAction: () => {
      suppressPeakNudge(now);
      if (state.phase !== "focus") setPhase("focus", { resetTime: true });
      start();
    },
    secondaryLabel: "Más tarde",
    onSecondary: () => {
      snoozePeakNudge(2, now);
      showToast("Aviso silenciado 2 horas");
    },
    onTimeout: () => {
      snoozePeakNudge(1.5, now);
    },
    duration: 8000,
  });
}

function suggestDismissKey() {
  return `foco-suggest-dismiss-${todayKey()}`;
}

function isSuggestDismissed() {
  return localStorage.getItem(suggestDismissKey()) === "1";
}

function dismissSuggestSprint() {
  localStorage.setItem(suggestDismissKey(), "1");
  renderSuggestSprint();
  showToast("Sugerencia ocultada por hoy");
}

function suggestedSprintSize() {
  if (isSuggestDismissed()) return null;
  ensureQueueFresh();
  const pendingQueue = state.queue.items.filter((q) => !q.done).length;
  const today = countTodayFocus();
  const dailyLeft = Math.max(0, state.settings.dailyGoal - today);
  const band = currentHourBand();
  const bandGoal = bandGoalFor(band);
  const buckets = hourBucketsForWeek();
  const bandToday = buckets.find((b) => b.key === band)?.today || 0;
  const bandLeft = bandGoal ? Math.max(0, bandGoal - bandToday) : 0;

  let size = 0;
  let reason = "";
  if (pendingQueue >= 2) {
    size = Math.min(4, Math.max(2, pendingQueue));
    reason = `${pendingQueue} en cola`;
  } else if (bandLeft >= 2) {
    size = Math.min(4, bandLeft);
    reason = `meta de ${bandLabel(band)}`;
  } else if (dailyLeft >= 2) {
    size = Math.min(4, dailyLeft);
    reason = "meta del día";
  } else {
    return null;
  }
  if (size < 2) return null;
  return { size, reason };
}

function renderSuggestSprint() {
  if (!els.suggestSprint) return;
  const deepActive = state.settings.deepFocus && state.running && state.phase === "focus";
  const showIdle =
    state.phase === "focus" &&
    !state.running &&
    state.remainingMs === state.totalMs &&
    !state.sprint &&
    !deepActive;
  const suggestion = showIdle ? suggestedSprintSize() : null;
  if (!suggestion) {
    els.suggestSprint.hidden = true;
    return;
  }
  els.suggestSprint.hidden = false;
  if (els.suggestSprintText) {
    els.suggestSprintText.textContent = `Próximo sprint sugerido: ×${suggestion.size} · ${suggestion.reason}`;
  }
  if (els.suggestSprintBtn) {
    els.suggestSprintBtn.dataset.sprint = String(suggestion.size);
    els.suggestSprintBtn.textContent = `Lanzar ×${suggestion.size}`;
  }
}

function maybeNudgeResumePause() {
  if (state.running || state.completing) return;
  if (!state.pausedAt) return;
  if (state.remainingMs <= 0 || state.remainingMs >= state.totalMs) return;
  if (Date.now() - state.pausedAt < 3 * 60_000) return;
  if (isToastOpen()) return;
  if (els.ritualOverlay && !els.ritualOverlay.hidden) return;
  if (els.intentionOverlay && !els.intentionOverlay.hidden) return;
  const key = `foco-pause-nudge-${Math.floor(state.pausedAt / 60_000)}`;
  if (sessionStorage.getItem(key) === "1") return;
  sessionStorage.setItem(key, "1");
  const left = formatTime(state.remainingMs);
  showToast(`Llevas pausa · quedan ${left}`, {
    actionLabel: "Continuar",
    onAction: () => start(),
    secondaryLabel: "Dejar",
    onSecondary: () => {
      state.pausedAt = null;
    },
    duration: 7000,
  });
}

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
    const settings = { ...DEFAULTS, ...JSON.parse(raw) };
    if (!SOUND_THEMES[settings.soundTheme]) settings.soundTheme = "soft";
    if (!ATMOSPHERES[settings.atmosphere]) settings.atmosphere = "slate";
    return settings;
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

function loadPresetOverrides() {
  try {
    const raw = localStorage.getItem(PRESET_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePresetOverrides(overrides) {
  localStorage.setItem(PRESET_OVERRIDES_KEY, JSON.stringify(overrides));
}

function getCategoryPreset(category) {
  const base = CATEGORY_PRESETS[category];
  if (!base) return null;
  const overrides = loadPresetOverrides();
  return { ...base, ...(overrides[category] || {}) };
}

function persistCategoryOverride() {
  if (!state.settings.categoryPresets || !CATEGORIES[state.category]) return;
  const overrides = loadPresetOverrides();
  overrides[state.category] = {
    focusMins: state.settings.focusMins,
    shortMins: state.settings.shortMins,
    longMins: state.settings.longMins,
    roundsUntilLong: state.settings.roundsUntilLong,
  };
  savePresetOverrides(overrides);
}

function saveCurrentAsCategoryPreset() {
  if (!CATEGORIES[state.category]) return;
  persistCategoryOverride();
  showToast(`Plantilla ${categoryLabel(state.category).toLowerCase()} guardada`);
}

function resetCategoryPreset(category = state.category) {
  if (!CATEGORIES[category]) return;
  const overrides = loadPresetOverrides();
  delete overrides[category];
  savePresetOverrides(overrides);
  if (state.settings.categoryPresets && !state.running) {
    applyCategoryPreset(category);
  }
  render();
  showToast(`Plantilla ${categoryLabel(category).toLowerCase()} restaurada`);
}

function applyCategoryPreset(category) {
  if (!state.settings.categoryPresets || state.running) return false;
  const preset = getCategoryPreset(category);
  if (!preset) return false;
  Object.assign(state.settings, preset);
  saveSettings();
  setPhase(state.phase, { resetTime: true });
  return true;
}

function setCategory(category, { toast = true } = {}) {
  if (!CATEGORIES[category]) return;
  state.category = category;
  state.settings.category = category;
  saveSettings();
  const applied = applyCategoryPreset(category);
  saveSession({ force: true });
  renderCategories();
  if (toast && applied) {
    showToast(`Plantilla ${categoryLabel(category).toLowerCase()}`);
  }
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

function playTone(ctx, frequency, startAt, duration, gainValue, type = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
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
  const theme = SOUND_THEMES[state.settings.soundTheme] || SOUND_THEMES.soft;
  const t = ctx.currentTime;
  const osc = theme.osc;
  if (kind === "focus-end") {
    const [a, b, c] = theme.focusEnd;
    playTone(ctx, a, t, 0.16, 0.09, osc);
    playTone(ctx, b, t + 0.13, 0.2, 0.08, osc);
    playTone(ctx, c, t + 0.3, 0.42, 0.07, osc);
    return;
  }
  if (kind === "break-end") {
    const [a, b, c] = theme.breakEnd;
    playTone(ctx, a, t, 0.14, 0.07, osc);
    playTone(ctx, b, t + 0.12, 0.18, 0.08, osc);
    playTone(ctx, c, t + 0.28, 0.34, 0.07, osc);
    return;
  }
  if (kind === "start") {
    playTone(ctx, theme.start, t, 0.1, 0.05, osc);
    return;
  }
  if (kind === "warn") {
    playTone(ctx, theme.warn, t, 0.12, 0.05, osc);
    playTone(ctx, theme.warn, t + 0.18, 0.18, 0.045, osc);
    return;
  }
  const [a, b] = theme.soft;
  playTone(ctx, a, t, 0.22, 0.08, osc);
  playTone(ctx, b, t + 0.16, 0.34, 0.07, osc);
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

function weekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return todayKey(d);
}

function loadStreakFreeze() {
  try {
    const raw = localStorage.getItem(FREEZE_KEY);
    if (!raw) return { week: weekKey(), usedDate: null };
    const parsed = JSON.parse(raw);
    if (parsed.week !== weekKey()) return { week: weekKey(), usedDate: null };
    return { week: parsed.week, usedDate: parsed.usedDate || null };
  } catch {
    return { week: weekKey(), usedDate: null };
  }
}

function saveStreakFreeze(data) {
  localStorage.setItem(FREEZE_KEY, JSON.stringify(data));
}

function focusDaysSet() {
  const days = new Set(state.history.map((s) => s.date));
  const freeze = loadStreakFreeze();
  if (freeze.usedDate) days.add(freeze.usedDate);
  return days;
}

function currentStreak() {
  const daysWithFocus = focusDaysSet();
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

function canUseStreakFreeze() {
  const today = todayKey();
  if (countTodayFocus() > 0) return false;
  const freeze = loadStreakFreeze();
  if (freeze.usedDate) return false;
  const yesterday = shiftDayKey(today, -1);
  const daysWithFocus = new Set(state.history.map((s) => s.date));
  if (!daysWithFocus.has(yesterday)) return false;
  return currentStreak() >= 1;
}

function useStreakFreeze() {
  if (!canUseStreakFreeze()) return;
  saveStreakFreeze({ week: weekKey(), usedDate: todayKey() });
  render();
  renderStatsPanel();
  showToast("Racha protegida por hoy");
}

function nextStreakMilestone() {
  const streak = currentStreak();
  const next = STREAK_MILESTONES.find((m) => m > streak);
  if (!next) return null;
  return { next, remaining: next - streak, streak };
}

function lastFocusSession() {
  return state.history.find((s) => Number(s.minutes) > 0) || null;
}

function repeatLastBlock() {
  if (state.running || state.phase !== "focus") return;
  const last = lastFocusSession();
  if (!last) return;
  if (last.task) {
    state.task = last.task;
    els.taskInput.value = last.task;
  }
  if (CATEGORIES[last.category]) {
    setCategory(last.category, { toast: false });
  }
  if (last.minutes && last.minutes !== state.settings.focusMins) {
    state.settings.focusMins = clamp(last.minutes, LIMITS.focusMins);
    saveSettings();
    persistCategoryOverride();
    setPhase("focus", { resetTime: true });
  }
  saveSession({ force: true });
  render();
  const label = last.task ? `«${last.task}»` : "Último bloque";
  showToast(`${label} listo`);
}

function showShortcuts() {
  if (!els.shortcutsOverlay) return;
  els.shortcutsOverlay.hidden = false;
  const card = els.shortcutsOverlay.querySelector(".goal-card");
  if (card) {
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "-1");
    trapFocus(card);
  }
}

function hideShortcuts() {
  if (!els.shortcutsOverlay) return;
  clearFocusTrap();
  els.shortcutsOverlay.hidden = true;
}

function weekCategoryBreakdown() {
  const { days } = weekSummary();
  const keys = new Set(days.map((d) => d.key));
  const counts = {};
  for (const session of state.history) {
    if (!keys.has(session.date)) continue;
    const cat = session.category || "extra";
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthSummary(date = new Date()) {
  const key = monthKey(date);
  const sessions = state.history.filter((s) => String(s.date || "").startsWith(key));
  return {
    count: sessions.length,
    minutes: sessions.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0),
  };
}

function lifetimeSummary() {
  return {
    count: state.history.length,
    minutes: state.history.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0),
  };
}

function formatEta(ms) {
  const end = new Date(Date.now() + Math.max(0, ms));
  return end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function renderEta() {
  if (!els.etaText) return;
  const show = state.running && state.remainingMs > 0;
  els.etaText.hidden = !show;
  if (!show) return;
  const label = state.phase === "focus" ? "Termina" : "Vuelve";
  els.etaText.textContent = `${label} a las ${formatEta(state.remainingMs)}`;
}

function estimateCycleRemainingMs() {
  const focusMs = state.settings.focusMins * 60_000;
  const shortMs = state.sprint
    ? (Number(state.settings.sprintShortMins) || 3) * 60_000
    : state.settings.shortMins * 60_000;
  const longMs = state.settings.longMins * 60_000;
  const rounds = state.settings.roundsUntilLong;
  let remaining = Math.max(0, state.remainingMs);
  let phase = state.phase;
  let done = state.completedInCycle;

  if (phase === "focus") {
    const afterThis = done + 1;
    if (afterThis >= rounds) {
      remaining += longMs;
    } else {
      remaining += shortMs;
      for (let i = afterThis; i < rounds; i += 1) {
        remaining += focusMs + (i + 1 >= rounds ? longMs : shortMs);
      }
    }
  } else if (phase === "short") {
    for (let i = done; i < rounds; i += 1) {
      remaining += focusMs + (i + 1 >= rounds ? longMs : shortMs);
    }
  } else {
    remaining += focusMs;
  }
  return remaining;
}

function estimateSprintRemainingMs() {
  if (!state.sprint) return 0;
  const left = Math.max(0, state.sprint.total - state.sprint.done);
  if (left <= 0) return Math.max(0, state.remainingMs);
  const focusMs = state.settings.focusMins * 60_000;
  const shortMs = (Number(state.settings.sprintShortMins) || 3) * 60_000;
  let remaining = Math.max(0, state.remainingMs);
  if (state.phase === "focus") {
    for (let i = 1; i < left; i += 1) {
      remaining += shortMs + focusMs;
    }
  } else {
    for (let i = 0; i < left; i += 1) {
      remaining += focusMs;
      if (i < left - 1) remaining += shortMs;
    }
  }
  return remaining;
}

function estimateQueueRemainingMs() {
  ensureQueueFresh();
  const pending = state.queue.items.filter((q) => !q.done).length;
  if (pending < 2) return 0;
  const focusMs = state.settings.focusMins * 60_000;
  const shortMs = state.sprint
    ? (Number(state.settings.sprintShortMins) || 3) * 60_000
    : state.settings.shortMins * 60_000;
  let remaining = 0;
  let blocks = pending;
  if (state.running) {
    remaining = Math.max(0, state.remainingMs);
    if (state.phase === "focus") {
      blocks = Math.max(0, pending - 1);
      for (let i = 0; i < blocks; i += 1) {
        remaining += shortMs + focusMs;
      }
    } else {
      for (let i = 0; i < blocks; i += 1) {
        remaining += focusMs;
        if (i < blocks - 1) remaining += shortMs;
      }
    }
  } else {
    for (let i = 0; i < blocks; i += 1) {
      remaining += focusMs;
      if (i < blocks - 1) remaining += shortMs;
    }
  }
  return remaining;
}

function renderCycleEta() {
  if (!els.cycleEta) return;
  const deepActive = state.settings.deepFocus && state.running && state.phase === "focus";
  if (deepActive || !state.running) {
    els.cycleEta.hidden = true;
    return;
  }
  if (state.sprint) {
    const sprintMs = estimateSprintRemainingMs();
    if (sprintMs < state.remainingMs + 30_000) {
      els.cycleEta.hidden = true;
      return;
    }
    els.cycleEta.hidden = false;
    els.cycleEta.textContent = `Sprint ~ ${formatEta(sprintMs)}`;
    return;
  }
  ensureQueueFresh();
  const pending = state.queue.items.filter((q) => !q.done).length;
  if (pending >= 2) {
    const queueMs = estimateQueueRemainingMs();
    if (queueMs > state.remainingMs + 60_000) {
      els.cycleEta.hidden = false;
      els.cycleEta.textContent = `Cola (${pending}) ~ ${formatEta(queueMs)}`;
      return;
    }
  }
  const ms = estimateCycleRemainingMs();
  if (ms < state.remainingMs + 60_000) {
    els.cycleEta.hidden = true;
    return;
  }
  els.cycleEta.hidden = false;
  els.cycleEta.textContent = `Ciclo ~ ${formatEta(ms)}`;
}

function renderIntentionChip() {
  if (!els.intentionChip) return;
  clearIntentionIfStale();
  const text = (state.intention.text || "").trim();
  const deepActive = state.settings.deepFocus && state.running && state.phase === "focus";
  if (!text || deepActive) {
    els.intentionChip.hidden = true;
    return;
  }
  const today = countTodayFocus();
  const planned = state.intention.blocks || 0;
  const progress = planned > 0 ? ` · ${today}/${planned}` : "";
  els.intentionChip.hidden = false;
  els.intentionChip.textContent = `Hoy: ${text}${progress}`;
}

function showIntentionPrompt() {
  if (!els.intentionOverlay) return;
  if (els.intentionInput) els.intentionInput.value = state.intention.text || state.task || "";
  if (els.intentionBlocks) {
    els.intentionBlocks.value = String(state.intention.blocks || state.settings.dailyGoal || 4);
  }
  els.intentionOverlay.hidden = false;
  const card = els.intentionOverlay.querySelector(".goal-card");
  if (card) {
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "-1");
    trapFocus(card);
  }
  setTimeout(() => els.intentionInput?.focus(), 250);
}

function hideIntentionPrompt() {
  if (!els.intentionOverlay) return;
  clearFocusTrap();
  els.intentionOverlay.hidden = true;
}

function commitIntention({ skip = false } = {}) {
  const key = todayKey();
  if (skip) {
    saveIntention({ date: key, text: "", blocks: 0 });
    localStorage.setItem(`foco-intention-skip-${key}`, "1");
    hideIntentionPrompt();
    render();
    return;
  }
  const text = (els.intentionInput?.value || "").trim().slice(0, 48);
  const blocks = clamp(Number(els.intentionBlocks?.value) || 0, [0, 20]);
  saveIntention({ date: key, text, blocks });
  if (text && !state.task && state.phase === "focus" && !state.running) {
    state.task = text;
    els.taskInput.value = text;
    saveSession({ force: true });
  }
  hideIntentionPrompt();
  render();
  showToast(text ? "Intención sellada" : "Día sin intención escrita");
}

function maybeShowIntention() {
  const hour = new Date().getHours();
  if (hour >= 14) return;
  const key = todayKey();
  if (localStorage.getItem(`foco-intention-skip-${key}`) === "1") return;
  if (state.intention.date === key && (state.intention.text || state.intention.blocks)) return;
  if (els.ritualOverlay && !els.ritualOverlay.hidden) return;
  if (state.running) return;
  showIntentionPrompt();
}

function buildPrintReportHtml() {
  const key = todayKey();
  const sessions = state.history.filter((s) => s.date === key);
  const minutes = sessions.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);
  const intention = (state.intention.text || "").trim();
  const planned = state.intention.blocks || 0;
  const streak = currentStreak();
  const score = computeFocusScore().score;
  const rows = sessions
    .map((s) => {
      const time = s.endedAt
        ? new Date(s.endedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : "—";
      const task = s.task || "Enfoque";
      const note = s.note ? ` — ${s.note}` : "";
      return `<li><strong>${time}</strong> · ${escapeHtml(task)} · ${s.minutes} min · ${categoryLabel(s.category || "extra")}${escapeHtml(note)}</li>`;
    })
    .join("");
  return `
    <div class="print-brand">FOCO</div>
    <h1>Resumen del ${new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</h1>
    ${intention ? `<p class="print-intention">Intención: ${escapeHtml(intention)}${planned ? ` · meta ${planned}` : ""}</p>` : ""}
    <p class="print-stats">${sessions.length} enfoques · ${minutes} min · racha ${streak}${score ? ` · score ${score}` : ""}</p>
    <ol class="print-list">${rows || "<li>Sin sellos hoy.</li>"}</ol>
    <p class="print-foot">Tu tiempo · tu sello</p>
  `;
}

function printDayReport() {
  if (!els.printReport) {
    window.print();
    return;
  }
  els.printReport.innerHTML = buildPrintReportHtml();
  els.printReport.hidden = false;
  document.body.classList.add("is-printing");
  const cleanup = () => {
    document.body.classList.remove("is-printing");
    els.printReport.hidden = true;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => window.print(), 50);
}

function toggleDeepFocus() {
  state.settings.deepFocus = !state.settings.deepFocus;
  saveSettings();
  render();
  showToast(state.settings.deepFocus ? "Modo profundo activado" : "Modo profundo desactivado");
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
    pausedAt: !state.running && state.pausedAt ? state.pausedAt : null,
    sprint: state.sprint
      ? {
          total: state.sprint.total,
          done: state.sprint.done,
          startedAt: state.sprint.startedAt,
          focusMinutes: state.sprint.focusMinutes || 0,
          prevAutoAdvance:
            typeof state.sprint.prevAutoAdvance === "boolean"
              ? state.sprint.prevAutoAdvance
              : true,
        }
      : null,
    savedAt: now,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function hydrateSprintFromSession(saved) {
  if (!saved?.sprint || typeof saved.sprint !== "object") {
    state.sprint = null;
    return;
  }
  const total = clamp(Number(saved.sprint.total) || 0, [2, 8]);
  const done = clamp(Number(saved.sprint.done) || 0, [0, total]);
  if (done >= total) {
    state.sprint = null;
    return;
  }
  state.sprint = {
    total,
    done,
    startedAt: Number(saved.sprint.startedAt) || Date.now(),
    focusMinutes: Number(saved.sprint.focusMinutes) || 0,
    prevAutoAdvance:
      typeof saved.sprint.prevAutoAdvance === "boolean" ? saved.sprint.prevAutoAdvance : true,
  };
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || !PHASES[saved.phase]) return false;

    state.phase = saved.phase;
    state.completedInCycle = Number(saved.completedInCycle) || 0;
    state.task = typeof saved.task === "string" ? saved.task : "";
    state.category = CATEGORIES[saved.category] ? saved.category : "trabajo";
    hydrateSprintFromSession(saved);
    state.totalMs = Number(saved.totalMs) || phaseDurationMs(saved.phase);
    state.pausedAt =
      !saved.running && Number(saved.pausedAt) > 0 ? Number(saved.pausedAt) : null;

    if (saved.running && saved.endAt) {
      const left = Math.max(0, Number(saved.endAt) - Date.now());
      els.body.dataset.phase = state.phase;
      els.phaseLabel.textContent = PHASES[state.phase].label;
      els.supportText.textContent = PHASES[state.phase].support;
      updateThemeColor();
      state.pausedAt = null;
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
    if (state.remainingMs <= 0 || state.remainingMs >= state.totalMs) {
      state.pausedAt = null;
    }
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
  if (phase === "short" && state.sprint) {
    return (Number(state.settings.sprintShortMins) || 3) * 60 * 1000;
  }
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
  if (phase === "focus") {
    swapText(els.supportText, info.support);
  } else {
    state.breakActsDone = [];
    swapText(els.supportText, pickBreakTip(phase));
  }
  if (resetTime) {
    state.totalMs = phaseDurationMs(phase);
    state.remainingMs = state.totalMs;
    state.endAt = null;
    state.warnPlayed = false;
    state.pausedAt = null;
  }
  updateThemeColor();
  syncIdleLines();
  render();
}

function renderBreakActivities() {
  if (!els.breakActivities) return;
  const onBreak = state.phase !== "focus";
  els.breakActivities.hidden = !onBreak;
  if (!onBreak) return;
  els.breakActivities.querySelectorAll(".break-act").forEach((btn) => {
    const key = btn.dataset.act;
    btn.classList.toggle("is-done", state.breakActsDone.includes(key));
  });
}

function toggleBreakActivity(key) {
  if (!BREAK_ACTIVITIES[key] || state.phase === "focus") return;
  if (state.breakActsDone.includes(key)) {
    state.breakActsDone = state.breakActsDone.filter((k) => k !== key);
    swapText(els.supportText, pickBreakTip(state.phase));
  } else {
    state.breakActsDone.push(key);
    swapText(els.supportText, BREAK_ACTIVITIES[key].tip);
  }
  renderBreakActivities();
  if (state.breakActsDone.length === Object.keys(BREAK_ACTIVITIES).length) {
    showToast("Descanso activo completo");
  }
}

function computeFocusScore() {
  const today = countTodayFocus();
  const goal = state.settings.dailyGoal;
  const { count: weekCount } = weekSummary();
  const weekGoal = state.settings.weeklyGoal || 40;
  const streak = currentStreak();

  if (!today && !weekCount) return { score: 0, label: "Empieza un bloque para calcularla." };

  const dailyPart = Math.min(40, Math.round((today / Math.max(1, goal)) * 40));
  const weeklyPart = Math.min(30, Math.round((weekCount / Math.max(1, weekGoal)) * 30));
  const streakPart = Math.min(20, Math.round((streak / 14) * 20));
  const activePart = today > 0 ? 10 : 0;
  const score = Math.min(100, dailyPart + weeklyPart + streakPart + activePart);

  let label = "Ritmo en construcción.";
  if (score >= 85) label = "Ritmo excelente. Sigue sellando.";
  else if (score >= 65) label = "Buen impulso. La constancia suma.";
  else if (score >= 40) label = "Vas encaminado. Un bloque más.";
  else if (today > 0) label = "Has empezado. Eso ya cuenta.";

  return { score, label };
}

function renderFocusScore() {
  if (!els.focusScoreValue) return;
  const { score, label } = computeFocusScore();
  els.focusScoreValue.textContent = score > 0 ? String(score) : "—";
  if (els.focusScoreCopy) els.focusScoreCopy.textContent = label;
  if (els.focusScoreRing) {
    els.focusScoreRing.dataset.score = String(score);
    const alpha = 0.15 + (score / 100) * 0.65;
    els.focusScoreRing.style.borderColor = score > 0
      ? `rgba(214, 40, 24, ${alpha})`
      : "";
  }
}

function daySummaryFor(dateKey) {
  const sessions = state.history.filter((s) => s.date === dateKey);
  const count = sessions.length;
  const minutes = sessions.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);
  const cats = sessions.reduce((acc, s) => {
    const k = s.category || "extra";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  const lastNote = sessions.find((s) => s.note)?.note || null;
  return { count, minutes, topCat, lastNote };
}

function showDaySummary(forKey, { kicker = "Resumen del día" } = {}) {
  if (!els.dayOverlay) return;
  const summary = daySummaryFor(forKey);
  if (!summary.count) return;

  const goal = state.settings.dailyGoal;
  const isToday = forKey === todayKey();
  const yesterdayKey = shiftDayKey(forKey, -1);
  const yesterday = daySummaryFor(yesterdayKey).count;
  const catLabel = summary.topCat ? categoryLabel(summary.topCat[0]).toLowerCase() : "foco";

  let compare = "";
  if (yesterday > 0 && summary.count !== yesterday) {
    compare =
      summary.count > yesterday
        ? ` Más que ayer (+${summary.count - yesterday}).`
        : ` Menos que ayer (${summary.count - yesterday}).`;
  }

  if (els.dayKicker) els.dayKicker.textContent = kicker;
  if (els.dayTitle) {
    els.dayTitle.textContent = isToday ? "Tu día en foco" : "Ayer en foco";
  }
  if (els.dayText) {
    els.dayText.textContent = [
      `${summary.count} enfoques · ${summary.minutes} min`,
      isToday ? `Meta: ${summary.count}/${goal}.${compare}` : compare.trim(),
      `Más en ${catLabel}.`,
      summary.lastNote ? `Nota: «${summary.lastNote}»` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }
  els.dayOverlay.hidden = false;
  localStorage.setItem(`foco-day-summary-${forKey}`, "1");
}

function hideDaySummary() {
  if (!els.dayOverlay) return;
  els.dayOverlay.hidden = true;
}

function maybeShowDaySummary() {
  const hour = new Date().getHours();
  const key = todayKey();
  const shownToday = localStorage.getItem(`foco-day-summary-${key}`) === "1";

  if (hour >= 20 && !shownToday) {
    const today = daySummaryFor(key);
    if (today.count > 0) {
      showDaySummary(key);
      return;
    }
  }

  if (hour < 12) {
    const yesterday = shiftDayKey(key, -1);
    if (localStorage.getItem(`foco-day-summary-${yesterday}`) === "1") return;
    const y = daySummaryFor(yesterday);
    if (y.count > 0) {
      showDaySummary(yesterday, { kicker: "Ayer en Foco" });
    }
  }
}

function weekRecapKey() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? 0 : day;
  d.setDate(d.getDate() - diff);
  return todayKey(d);
}

function setupWeeklyRecap() {
  if (!els.recapTip) return;
  const key = weekRecapKey();
  if (localStorage.getItem(`foco-week-recap-${key}`) === "1") return;
  if (new Date().getDay() !== 0) return;

  const { count, minutes } = weekSummary();
  if (count < 2) return;

  const streak = currentStreak();
  if (els.recapTipText) {
    els.recapTipText.textContent = `${count} enfoques · ${minutes} min · racha ${streak}`;
  }
  els.recapTip.hidden = false;

  els.recapCloseBtn?.addEventListener("click", () => {
    els.recapTip.hidden = true;
    localStorage.setItem(`foco-week-recap-${key}`, "1");
  });

  els.recapShareBtn?.addEventListener("click", () => {
    shareWeek();
    els.recapTip.hidden = true;
    localStorage.setItem(`foco-week-recap-${key}`, "1");
  });
}

function setupOfflineBadge() {
  if (!els.offlineBadge) return;
  const sync = () => {
    els.offlineBadge.hidden = navigator.onLine;
  };
  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  sync();
}

function streakMilestoneCopy(hit) {
  if (hit >= 30) return "Constancia de nivel alto. Esto ya es un hábito.";
  if (hit >= 14) return "Dos semanas de racha. Imparable.";
  if (hit >= 7) return "Una semana entera de foco. Sigue así.";
  return "Tres días seguidos. El hábito empieza aquí.";
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
  const intention = (state.intention.text || "").trim();
  if (state.running && state.phase === "focus") return "El sello está en marcha.";
  if (state.running && state.phase !== "focus") return "Pausa con intención.";
  if (today >= goal) return "Meta sellada. Qué bien.";
  if (intention && today === 0 && hour < 14) return `Hoy: ${intention}`;
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
  const { score } = computeFocusScore();
  if (score > 0) {
    parts.push(`<span class="today-pill today-score">Foco <strong>${score}</strong></span>`);
  }
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
  const filter = state.historyFilter || "all";
  const filtered =
    filter === "all"
      ? state.history
      : state.history.filter((s) => (s.category || "extra") === filter);
  const recent = filtered.slice(0, 10);
  els.historyEmpty.hidden = recent.length > 0;
  if (els.historyEmpty) {
    els.historyEmpty.innerHTML =
      filter === "all"
        ? "Aún no hay sellos.<br><span>Termina tu primer enfoque para verlo aquí.</span>"
        : `Sin sellos en ${categoryLabel(filter).toLowerCase()}.<br><span>Prueba otra categoría.</span>`;
  }
  if (els.historyFilter) {
    els.historyFilter.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.filter === filter);
      btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter));
    });
  }
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

function renderLifetimeStats() {
  const month = monthSummary();
  const all = lifetimeSummary();
  if (els.monthFocusCount) els.monthFocusCount.textContent = String(month.count);
  if (els.monthFocusMins) els.monthFocusMins.textContent = String(month.minutes);
  if (els.allFocusCount) els.allFocusCount.textContent = String(all.count);
  if (els.allFocusMins) els.allFocusMins.textContent = String(all.minutes);
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
      localStorage.removeItem(FREEZE_KEY);
      localStorage.removeItem(PRESET_OVERRIDES_KEY);
      localStorage.removeItem(SPRINTS_KEY);
      localStorage.removeItem(BAND_GOAL_KEY);
      state.sprints = [];
      state.bandCelebrated = {};
      state.sprint = null;
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
      const note = session.note
        ? `<span class="history-note">${escapeHtml(session.note)}</span>`
        : "";
      return `
        <li class="timeline-item">
          <div class="timeline-time">${time}</div>
          <div class="timeline-body">
            <strong>${title}</strong>
            <span>${session.minutes} min</span>
            ${note}
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

function renderSoundThemes() {
  if (!els.soundThemeRow) return;
  const theme = SOUND_THEMES[state.settings.soundTheme] ? state.settings.soundTheme : "soft";
  els.soundThemeRow.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.theme === theme);
    btn.setAttribute("aria-pressed", String(btn.dataset.theme === theme));
  });
}

function renderStreakFreeze() {
  if (!els.streakFreezeRow) return;
  const freeze = loadStreakFreeze();
  const canUse = canUseStreakFreeze();
  const usedToday = freeze.usedDate === todayKey();
  els.streakFreezeRow.hidden = !canUse && !usedToday;
  if (els.streakFreezeCopy) {
    if (usedToday) {
      els.streakFreezeCopy.textContent = "Racha protegida hoy. Una vez por semana.";
    } else if (canUse) {
      els.streakFreezeCopy.textContent = `Sin enfoque hoy. Protege tu racha de ${currentStreak()} días.`;
    }
  }
  if (els.streakFreezeBtn) {
    els.streakFreezeBtn.hidden = !canUse;
    els.streakFreezeBtn.disabled = !canUse;
  }
}

function renderStreakMilestone() {
  if (!els.streakMilestoneRow) return;
  const info = nextStreakMilestone();
  if (!info || info.streak < 1) {
    els.streakMilestoneRow.hidden = true;
    return;
  }
  els.streakMilestoneRow.hidden = false;
  if (els.streakMilestoneText) {
    els.streakMilestoneText.textContent =
      info.remaining === 1
        ? `Mañana puedes llegar a ${info.next} días de racha.`
        : `Siguiente hito: ${info.next} días · faltan ${info.remaining}.`;
  }
  if (els.streakMilestoneFill) {
    const prev = STREAK_MILESTONES.filter((m) => m <= info.streak).pop() || 0;
    const span = info.next - prev;
    const progress = span > 0 ? (info.streak - prev) / span : 1;
    els.streakMilestoneFill.style.width = `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`;
  }
}

function renderCategoryBreakdown() {
  if (!els.categoryBreakdown) return;
  const rows = weekCategoryBreakdown();
  if (!rows.length) {
    els.categoryBreakdown.hidden = true;
    els.categoryBreakdown.innerHTML = "";
    return;
  }
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  els.categoryBreakdown.hidden = false;
  els.categoryBreakdown.innerHTML = rows
    .map(([cat, count]) => {
      const pct = Math.round((count / total) * 100);
      return `
        <div class="cat-breakdown-item">
          <div class="cat-breakdown-head">
            ${categoryTag(cat)}
            <span>${count} · ${pct}%</span>
          </div>
          <div class="cat-breakdown-track" aria-hidden="true">
            <div class="cat-breakdown-fill tag-${cat}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRepeatLast() {
  if (!els.repeatLastBtn) return;
  const last = lastFocusSession();
  const show =
    last &&
    state.phase === "focus" &&
    !state.running &&
    state.remainingMs === state.totalMs &&
    !(state.settings.deepFocus && state.running);
  els.repeatLastBtn.hidden = !show;
  if (show && last.task) {
    els.repeatLastBtn.textContent = `Repetir «${last.task.slice(0, 18)}${last.task.length > 18 ? "…" : ""}»`;
  } else if (show) {
    els.repeatLastBtn.textContent = "Repetir último";
  }
}

function renderStatsPanel() {
  renderWeekChart();
  renderTodayTimeline();
  renderHeatmap();
  renderHistoryList();
  renderBestDay();
  renderFocusScore();
  renderInsight();
  renderStreakFreeze();
  renderStreakMilestone();
  renderCategoryBreakdown();
  renderLifetimeStats();
  renderHourChart();
  renderSprintHistory();
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
  renderBreakActivities();
  renderRepeatLast();
  renderSprint();
  renderSuggestSprint();
  renderEta();
  renderCycleEta();
  renderIntentionChip();
  renderPresets();
  renderRecentTasks();
  renderCategories();
  els.outputs.focusMins.value = state.settings.focusMins;
  els.outputs.shortMins.value = state.settings.shortMins;
  els.outputs.longMins.value = state.settings.longMins;
  els.outputs.roundsUntilLong.value = state.settings.roundsUntilLong;
  els.outputs.dailyGoal.value = state.settings.dailyGoal;
  if (els.outputs.weeklyGoal) els.outputs.weeklyGoal.value = state.settings.weeklyGoal;
  if (els.outputs.morningGoal) els.outputs.morningGoal.value = state.settings.morningGoal;
  if (els.outputs.afternoonGoal) els.outputs.afternoonGoal.value = state.settings.afternoonGoal;
  if (els.outputs.eveningGoal) els.outputs.eveningGoal.value = state.settings.eveningGoal;
  if (els.outputs.nightGoal) els.outputs.nightGoal.value = state.settings.nightGoal;
  if (els.outputs.sprintShortMins) els.outputs.sprintShortMins.value = state.settings.sprintShortMins;
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
  if (els.categoryPresetsToggle) {
    els.categoryPresetsToggle.setAttribute("aria-checked", String(state.settings.categoryPresets));
  }
  if (els.queueOnlyToggle) {
    els.queueOnlyToggle.setAttribute("aria-checked", String(state.settings.queueOnly));
  }
  if (els.peakNudgeToggle) {
    els.peakNudgeToggle.setAttribute("aria-checked", String(state.settings.peakNudge));
  }
  renderSoundThemes();
  renderAtmosphere();
  renderWallClock();
  renderTaskQueue();
  renderTaskSuggestions();
  const deepActive = state.settings.deepFocus && state.running && state.phase === "focus";
  els.body.classList.toggle("is-deep-focus", deepActive);
  els.body.classList.toggle("is-queue-only", Boolean(state.settings.queueOnly));
  updateThemeColor();
  els.shell.setAttribute("aria-label", state.running ? "Pausar temporizador" : "Empezar o continuar temporizador");
  if (document.activeElement !== els.taskInput) {
    els.taskInput.value = state.task;
  }
  const taskField = els.taskInput.closest(".task-field");
  if (taskField) {
    taskField.hidden = state.phase !== "focus" || state.settings.queueOnly;
  }
  if (state.openSheet === "stats") renderStatsPanel();
}

function renderTimerChrome() {
  els.timeDisplay.textContent = formatTime(state.remainingMs);
  const progress = state.totalMs > 0 ? 1 - state.remainingMs / state.totalMs : 0;
  els.ring.style.strokeDashoffset = String(Math.min(1, Math.max(0, progress)));
  updateRingTicks(progress);
  els.shell.classList.toggle("is-ending", state.running && state.remainingMs > 0 && state.remainingMs <= 60_000);
  updateDocumentTitle();
  renderEta();
  renderCycleEta();
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

async function downloadWeekCard() {
  try {
    const file = await buildWeekCardFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Tarjeta semanal descargada");
  } catch {
    showToast("No se pudo generar la tarjeta");
  }
}

async function buildWeekCardFile() {
  const { count, minutes, days } = weekSummary();
  const today = countTodayFocus();
  const streak = currentStreak();
  const theme = ATMOSPHERES[state.settings.atmosphere] || ATMOSPHERES.slate;
  const vars = theme.vars;
  const ink = vars["--ink"] || "#101411";
  const soft = vars["--ink-soft"] || "#4a524c";
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, vars["--bg-c"] || "#eceee9");
  bg.addColorStop(0.45, vars["--bg-a"] || "#e2e4df");
  bg.addColorStop(1, vars["--bg-b"] || "#c5c9c0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1350);

  ctx.fillStyle = "rgba(214,40,24,0.14)";
  ctx.beginPath();
  ctx.arc(840, 180, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = ink;
  ctx.font = "800 96px Syne, sans-serif";
  ctx.fillText("FOCO", 88, 170);
  ctx.font = "600 28px Sora, sans-serif";
  ctx.fillStyle = soft;
  ctx.fillText("RESUMEN DE LA SEMANA", 92, 220);

  ctx.fillStyle = ink;
  ctx.font = "italic 120px 'Instrument Serif', serif";
  ctx.fillText(String(count), 88, 400);
  ctx.font = "500 36px Sora, sans-serif";
  ctx.fillStyle = soft;
  ctx.fillText("enfoques", 88, 455);

  ctx.fillStyle = ink;
  ctx.font = "italic 84px 'Instrument Serif', serif";
  ctx.fillText(`${minutes}`, 520, 400);
  ctx.font = "500 36px Sora, sans-serif";
  ctx.fillStyle = soft;
  ctx.fillText("minutos", 520, 455);

  ctx.font = "500 34px Sora, sans-serif";
  ctx.fillStyle = ink;
  ctx.fillText(`Hoy ${today}/${state.settings.dailyGoal}  ·  Racha ${streak}`, 88, 540);

  const max = Math.max(1, ...days.map((d) => d.count));
  const barW = 96;
  const gap = 28;
  const baseX = 88;
  const baseY = 1080;
  days.forEach((day, i) => {
    const h = Math.round((day.count / max) * 320);
    const x = baseX + i * (barW + gap);
    if (day.isToday) {
      ctx.fillStyle = "#d62818";
    } else {
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.18;
    }
    ctx.fillRect(x, baseY - h, barW, Math.max(8, h));
    ctx.globalAlpha = 1;
    ctx.fillStyle = soft;
    ctx.font = "700 26px Syne, sans-serif";
    ctx.fillText(day.label, x + 18, baseY + 48);
    ctx.font = "500 24px Sora, sans-serif";
    ctx.fillText(String(day.count), x + 34, baseY - h - 18);
  });

  ctx.fillStyle = soft;
  ctx.font = "500 28px Sora, sans-serif";
  ctx.fillText(`Tu tiempo · tu sello · ${theme.label}`, 88, 1260);

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

  applyAtmosphere(state.settings.atmosphere);
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
  persistCategoryOverride();
  setPhase("focus", { resetTime: true });
  saveSession();
  showToast(`Enfoque a ${minutes} min`);
}

function showToast(
  message,
  {
    actionLabel = null,
    onAction = null,
    secondaryLabel = null,
    onSecondary = null,
    onTimeout = null,
    duration = 2400,
  } = {}
) {
  els.toast.hidden = false;
  els.toastMessage.textContent = message;
  state.toastActionHandler = onAction;
  state.toastSecondaryHandler = onSecondary;
  if (actionLabel && onAction) {
    els.toastAction.hidden = false;
    els.toastAction.textContent = actionLabel;
  } else {
    els.toastAction.hidden = true;
  }
  if (els.toastSecondary) {
    if (secondaryLabel && onSecondary) {
      els.toastSecondary.hidden = false;
      els.toastSecondary.textContent = secondaryLabel;
    } else {
      els.toastSecondary.hidden = true;
    }
  }
  els.toast.classList.add("is-show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    els.toast.classList.remove("is-show");
    if (typeof onTimeout === "function") onTimeout();
    state.toastActionHandler = null;
    state.toastSecondaryHandler = null;
    els.toastAction.hidden = true;
    if (els.toastSecondary) els.toastSecondary.hidden = true;
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

function notifyEnd(kind = "soft", { phase = state.phase, task = state.task } = {}) {
  playChime(kind);
  hapticPulse(kind === "soft" ? "end" : kind);
  if (isQuietHours()) return;
  if (!state.settings.notify || !("Notification" in window) || Notification.permission !== "granted") return;
  const taskLabel = (task || "").trim();
  let title;
  let body;
  if (phase === "focus") {
    title = taskLabel ? `«${taskLabel}» sellado` : "Enfoque terminado";
    body = taskLabel ? "Bloque completado. Toca para el descanso." : "Toca para empezar el descanso.";
  } else {
    title = "Descanso terminado";
    body = "Cuando quieras, vuelve al enfoque.";
  }
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
  if (state.settings.queueOnly && state.phase === "focus") {
    ensureQueueFresh();
    if (!(state.task || "").trim()) {
      const next = nextQueueItem();
      if (next) {
        state.task = next.text;
        if (els.taskInput) els.taskInput.value = next.text;
      } else {
        showToast("Añade una tarea a la cola para empezar");
        return;
      }
    }
  }
  if (state.remainingMs <= 0) {
    state.totalMs = phaseDurationMs();
    state.remainingMs = state.totalMs;
  }
  state.running = true;
  state.pausedAt = null;
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
  state.pausedAt = Date.now();
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
  const finishedTask = state.task;
  state.completing = true;
  state.running = false;
  state.endAt = null;
  state.pausedAt = null;
  clearTick();
  releaseWakeLock();
  state.remainingMs = 0;

  if (finished === "focus") {
    recordFocusSession(minutes);
    markQueueDoneByTask(finishedTask);
    advanceSprintOnFocus(minutes);
    const upcoming = nextQueueItem();
    if (
      upcoming &&
      (!finishedTask ||
        finishedTask.trim().toLocaleLowerCase("es") !== upcoming.text.toLocaleLowerCase("es"))
    ) {
      state.task = upcoming.text;
      if (els.taskInput) els.taskInput.value = upcoming.text;
    }
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
  els.goalOverlayText.textContent = streakMilestoneCopy(hit);
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
  if ((state.settings.autoAdvance || state.sprint) && !state.running) {
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
  const finishedTask = state.task;
  notifyEnd(chimeKind, { phase: finished, task: finishedTask });

  let celebratedSomething = false;
  let recorded = null;
  let sprintFinished = false;
  let pulledFromQueue = false;
  if (finished === "focus") {
    recorded = recordFocusSession(minutes);
    markQueueDoneByTask(finishedTask);
    sprintFinished = advanceSprintOnFocus(minutes);
    const band = currentHourBand();
    const buckets = hourBucketsForWeek();
    const bandToday = buckets.find((b) => b.key === band)?.today || 0;
    maybeCelebrateBandGoal(band, bandToday);
    const upcoming = nextQueueItem();
    if (
      upcoming &&
      (!finishedTask ||
        finishedTask.trim().toLocaleLowerCase("es") !== upcoming.text.toLocaleLowerCase("es"))
    ) {
      state.task = upcoming.text;
      if (els.taskInput) els.taskInput.value = upcoming.text;
      pulledFromQueue = true;
    }
    const today = countTodayFocus();
    const goal = state.settings.dailyGoal;
    if (today >= goal) {
      showGoalCelebration(today, goal);
      celebratedSomething = true;
    } else if (maybeCelebrateStreak()) {
      celebratedSomething = true;
    } else if (!sprintFinished) {
      const sprintLabel = state.sprint
        ? ` · sprint ${state.sprint.done}/${state.sprint.total}`
        : "";
      const message = pulledFromQueue
        ? `Listo · sigue «${state.task}»`
        : `Enfoque completado · ${today}/${goal}${sprintLabel}`;
      showToast(message, {
        actionLabel: "Deshacer",
        onAction: undoLastFocusSession,
        secondaryLabel: pulledFromQueue ? "Sin tarea" : null,
        onSecondary: pulledFromQueue
          ? () => {
              state.task = "";
              if (els.taskInput) els.taskInput.value = "";
              saveSession({ force: true });
              render();
            }
          : null,
        duration: 5000,
      });
    }
  } else {
    showToast(state.sprint ? `Descanso · sprint ${state.sprint.done}/${state.sprint.total}` : "Descanso completado");
  }

  const next = nextPhaseAfter(finished);
  setPhase(next, { resetTime: true });
  saveSession({ force: true });
  state.completing = false;

  if (finished === "focus" && recorded && !celebratedSomething && !state.sprint && !sprintFinished) {
    openNotePrompt(recorded.id);
    return;
  }

  if (celebratedSomething && recorded) {
    state.pendingNoteSessionId = recorded.id;
  }

  if ((state.settings.autoAdvance || state.sprint) && !celebratedSomething) {
    start({ silent: true });
  }
}

function doSkipPhase() {
  const finished = state.phase;
  pause();
  if (finished === "focus") {
    const next = nextPhaseAfter("focus");
    setPhase(next, { resetTime: true });
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
  if (["focusMins", "shortMins", "longMins", "roundsUntilLong"].includes(key)) {
    persistCategoryOverride();
  }
  if (key === "dailyGoal" || key === "weeklyGoal" || key === "morningGoal" || key === "afternoonGoal" || key === "eveningGoal" || key === "nightGoal") {
    render();
    return;
  }
  if (key === "sprintShortMins") {
    if (!state.running || state.phase === "short") {
      if (!state.running) setPhase(state.phase, { resetTime: true });
      else render();
    } else {
      render();
    }
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
      const handler = state.toastActionHandler;
      clearTimeout(state.toastTimer);
      els.toast.classList.remove("is-show");
      state.toastActionHandler = null;
      state.toastSecondaryHandler = null;
      els.toastAction.hidden = true;
      if (els.toastSecondary) els.toastSecondary.hidden = true;
      handler();
    }
  });

  if (els.toastSecondary) {
    els.toastSecondary.addEventListener("click", () => {
      if (typeof state.toastSecondaryHandler === "function") {
        const handler = state.toastSecondaryHandler;
        clearTimeout(state.toastTimer);
        els.toast.classList.remove("is-show");
        state.toastActionHandler = null;
        state.toastSecondaryHandler = null;
        els.toastAction.hidden = true;
        els.toastSecondary.hidden = true;
        handler();
      }
    });
  }

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

  if (els.dayClose) {
    els.dayClose.addEventListener("click", hideDaySummary);
  }
  els.dayOverlay?.addEventListener("click", (event) => {
    if (event.target === els.dayOverlay) hideDaySummary();
  });

  if (els.breakActivities) {
    els.breakActivities.addEventListener("click", (event) => {
      const btn = event.target.closest(".break-act");
      if (!btn) return;
      toggleBreakActivity(btn.dataset.act);
    });
  }

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
    toggleDeepFocus();
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
        setCategory(match.category, { toast: false });
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

  if (els.exportWeekPngBtn) {
    els.exportWeekPngBtn.addEventListener("click", () => {
      downloadWeekCard();
    });
  }

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

  if (els.categoryPresetsToggle) {
    els.categoryPresetsToggle.addEventListener("click", () => {
      state.settings.categoryPresets = !state.settings.categoryPresets;
      saveSettings();
      render();
      showToast(state.settings.categoryPresets ? "Plantillas por categoría on" : "Plantillas por categoría off");
    });
  }

  if (els.queueOnlyToggle) {
    els.queueOnlyToggle.addEventListener("click", () => {
      state.settings.queueOnly = !state.settings.queueOnly;
      saveSettings();
      if (state.settings.queueOnly && !(state.task || "").trim()) {
        const next = nextQueueItem();
        if (next) {
          state.task = next.text;
          if (els.taskInput) els.taskInput.value = next.text;
          saveSession({ force: true });
        }
      }
      render();
      showToast(state.settings.queueOnly ? "Modo solo cola on" : "Modo solo cola off");
    });
  }

  if (els.peakNudgeToggle) {
    els.peakNudgeToggle.addEventListener("click", () => {
      state.settings.peakNudge = !state.settings.peakNudge;
      saveSettings();
      render();
      showToast(state.settings.peakNudge ? "Aviso de franja fuerte on" : "Aviso de franja fuerte off");
    });
  }

  if (els.suggestSprintBtn) {
    els.suggestSprintBtn.addEventListener("click", () => {
      const size = Number(els.suggestSprintBtn.dataset.sprint) || 0;
      if (size >= 2) startSprint(size);
    });
  }

  if (els.suggestSprintDismiss) {
    els.suggestSprintDismiss.addEventListener("click", dismissSuggestSprint);
  }

  if (els.queueClearDoneBtn) {
    els.queueClearDoneBtn.addEventListener("click", clearDoneQueueItems);
  }

  if (els.soundThemeRow) {
    els.soundThemeRow.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-theme]");
      if (!btn || !SOUND_THEMES[btn.dataset.theme]) return;
      state.settings.soundTheme = btn.dataset.theme;
      saveSettings();
      render();
      ensureAudio();
      playChime("soft");
    });
  }

  if (els.atmosphereRow) {
    els.atmosphereRow.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-atmosphere]");
      if (!btn || !ATMOSPHERES[btn.dataset.atmosphere]) return;
      applyAtmosphere(btn.dataset.atmosphere);
      saveSettings();
      render();
      showToast(`Atmósfera ${ATMOSPHERES[btn.dataset.atmosphere].label.toLowerCase()}`);
    });
  }

  if (els.queueAddBtn) {
    els.queueAddBtn.addEventListener("click", () => {
      addQueueItem(els.queueInput?.value || "");
      if (els.queueInput) els.queueInput.value = "";
    });
  }
  els.queueInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addQueueItem(els.queueInput.value || "");
      els.queueInput.value = "";
    }
  });
  if (els.queueList) {
    els.queueList.addEventListener("click", (event) => {
      if (state.dragQueueId) return;
      const toggle = event.target.closest("[data-toggle]");
      if (toggle) {
        toggleQueueItem(toggle.dataset.toggle);
        return;
      }
      const move = event.target.closest("[data-move]");
      if (move) {
        moveQueueItem(move.dataset.move, Number(move.dataset.dir) || 0);
        return;
      }
      const pull = event.target.closest("[data-pull]");
      if (pull) {
        pullQueueItem(pull.dataset.pull);
        return;
      }
      const remove = event.target.closest("[data-remove]");
      if (remove) {
        removeQueueItem(remove.dataset.remove);
      }
    });

    let dragFrom = null;
    els.queueList.addEventListener("pointerdown", (event) => {
      const handle = event.target.closest("[data-drag]");
      if (!handle) return;
      event.preventDefault();
      dragFrom = handle.dataset.drag;
      state.dragQueueId = dragFrom;
      handle.closest(".queue-item")?.classList.add("is-dragging");
      handle.setPointerCapture?.(event.pointerId);
    });
    els.queueList.addEventListener("pointermove", (event) => {
      if (!dragFrom) return;
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const over = el?.closest?.(".queue-item");
      els.queueList.querySelectorAll(".queue-item.is-drop").forEach((node) => {
        node.classList.remove("is-drop");
      });
      if (over && over.dataset.id !== dragFrom) over.classList.add("is-drop");
    });
    const endDrag = (event) => {
      if (!dragFrom) return;
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const over = el?.closest?.(".queue-item");
      if (over?.dataset.id) reorderQueueById(dragFrom, over.dataset.id);
      else renderTaskQueue();
      dragFrom = null;
      state.dragQueueId = null;
    };
    els.queueList.addEventListener("pointerup", endDrag);
    els.queueList.addEventListener("pointercancel", () => {
      dragFrom = null;
      state.dragQueueId = null;
      renderTaskQueue();
    });
  }

  if (els.sprintRow) {
    els.sprintRow.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-sprint]");
      if (!btn) return;
      startSprint(Number(btn.dataset.sprint));
    });
  }
  if (els.sprintStopBtn) {
    els.sprintStopBtn.addEventListener("click", () => stopSprint());
  }

  if (els.streakFreezeBtn) {
    els.streakFreezeBtn.addEventListener("click", () => {
      askConfirm({
        title: "¿Proteger la racha?",
        text: "Cuenta hoy como día de racha sin enfoque. Solo una vez por semana.",
        okLabel: "Proteger",
        onConfirm: useStreakFreeze,
      });
    });
  }

  if (els.repeatLastBtn) {
    els.repeatLastBtn.addEventListener("click", repeatLastBlock);
  }

  if (els.shortcutsClose) {
    els.shortcutsClose.addEventListener("click", hideShortcuts);
  }
  els.shortcutsOverlay?.addEventListener("click", (event) => {
    if (event.target === els.shortcutsOverlay) hideShortcuts();
  });

  if (els.historyFilter) {
    els.historyFilter.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-filter]");
      if (!btn) return;
      state.historyFilter = btn.dataset.filter;
      renderHistoryList();
    });
  }

  if (els.savePresetBtn) {
    els.savePresetBtn.addEventListener("click", saveCurrentAsCategoryPreset);
  }
  if (els.resetPresetBtn) {
    els.resetPresetBtn.addEventListener("click", () => {
      askConfirm({
        title: "¿Restaurar plantilla?",
        text: `Vuelve a los minutos por defecto de ${categoryLabel(state.category)}.`,
        okLabel: "Restaurar",
        onConfirm: () => resetCategoryPreset(),
      });
    });
  }

  if (els.intentionSave) {
    els.intentionSave.addEventListener("click", () => commitIntention());
  }
  if (els.intentionSkip) {
    els.intentionSkip.addEventListener("click", () => commitIntention({ skip: true }));
  }
  els.intentionInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitIntention();
    }
  });
  els.intentionChip?.addEventListener("click", () => {
    showIntentionPrompt();
  });

  if (els.printDayBtn) {
    els.printDayBtn.addEventListener("click", printDayReport);
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
    setCategory(btn.dataset.category);
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
      setCategory(match.category, { toast: false });
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
      } else {
        maybeNudgeResumePause();
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
      if (els.dayOverlay && !els.dayOverlay.hidden) {
        hideDaySummary();
        return;
      }
      if (els.shortcutsOverlay && !els.shortcutsOverlay.hidden) {
        hideShortcuts();
        return;
      }
      if (els.intentionOverlay && !els.intentionOverlay.hidden) {
        commitIntention({ skip: true });
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
    if (els.dayOverlay && !els.dayOverlay.hidden) return;
    if (els.shortcutsOverlay && !els.shortcutsOverlay.hidden) return;
    if (els.intentionOverlay && !els.intentionOverlay.hidden) return;
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
      showShortcuts();
      return;
    }
    if (key === "l") {
      event.preventDefault();
      repeatLastBlock();
      return;
    }
    if (key === "d") {
      event.preventDefault();
      toggleDeepFocus();
      return;
    }
    if (key === "i") {
      event.preventDefault();
      showIntentionPrompt();
      return;
    }
    if (key === "p") {
      event.preventDefault();
      printDayReport();
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
  setTimeout(maybeShowIntention, 500);
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

function scheduleDaySummary() {
  setTimeout(() => {
    if (els.ritualOverlay && !els.ritualOverlay.hidden) return;
    maybeShowDaySummary();
  }, 1400);
}

function maybeNudgeStreak() {
  const hour = new Date().getHours();
  if (hour < 17 || hour >= 22) return;
  if (countTodayFocus() > 0) return;
  if (!canUseStreakFreeze()) return;
  const key = `foco-streak-nudge-${todayKey()}`;
  if (localStorage.getItem(key) === "1") return;
  localStorage.setItem(key, "1");
  showToast(`Racha en riesgo · ${currentStreak()} días`, {
    actionLabel: "Proteger",
    onAction: () => {
      askConfirm({
        title: "¿Proteger la racha?",
        text: "Cuenta hoy como día de racha sin enfoque. Solo una vez por semana.",
        okLabel: "Proteger",
        onConfirm: useStreakFreeze,
      });
    },
    duration: 7000,
  });
}

function init() {
  if (CATEGORIES[state.settings.category]) {
    state.category = state.settings.category;
  }
  applyAtmosphere(state.settings.atmosphere);
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
  renderWallClock();
  setInterval(renderWallClock, 15_000);
  setInterval(() => {
    if (!state.running) maybeNudgeResumePause();
  }, 45_000);
  setInterval(maybeNudgePeakBand, 10 * 60_000);
  registerSW();
  setupOfflineBadge();
  setupRitual();
  setupInstallTip();
  setupWeeklyRecap();
  scheduleDaySummary();
  setTimeout(maybeNudgeStreak, 2200);
  setTimeout(maybeNudgePeakBand, 2800);
  setTimeout(maybeNudgeResumePause, 3200);
  setTimeout(() => {
    if (els.ritualOverlay && !els.ritualOverlay.hidden) return;
    maybeShowIntention();
  }, 1800);
}

init();
