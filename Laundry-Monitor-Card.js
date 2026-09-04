/**
 * Laundry Monitor Card
 * Кастомная карточка Lovelace для интеграции "Laundry Monitor" (Home Assistant).
 *
 * Особенности реализации:
 *  - Чистый Custom Element без внешних зависимостей (кроме встроенных
 *    ha-card / ha-icon / ha-form из самого Home Assistant).
 *  - DOM карточки строится ОДИН РАЗ (при первом получении hass), дальше только
 *    точечно обновляются значения — это исключает лишние перерисовки.
 *  - Визуальный редактор использует нативный ha-form и HA selectors.
 *  - Поддержка переводов: подписи сущностей берутся из их friendly_name, а
 *    значение состояния цикла — через hass.formatEntityState(), поэтому текст
 *    следует языку интерфейса HA (интеграция поставляет en/ru). Немногочисленные
 *    собственные подписи карточки берутся из встроенного словаря по hass.language.
 */
const CARD_VERSION = "1.0.4-rc2-patched";
const CARD_TAG = "laundry-monitor-card";
const EDITOR_TAG = "laundry-monitor-card-editor";

const DEFAULT_CONFIG = {
  title: "",
  icon: "mdi:washing-machine",
  // основные
  cycle_state_entity: "",
  running_entity: "",
  final_spin_entity: "",
  finished_entity: "",
  current_cycle_duration_entity: "",
  last_cycle_duration_entity: "",
  last_cycle_energy_entity: "",
  power_entity: "",
  current_entity: "",
  leak_entity: "",
  // трекинг белья
  laundry_present_entity: "",
  mark_unloaded_entity: "",
  last_unloaded_entity: "",
  // диагностика
  activity_entity: "",
  power_activity_entity: "",
  current_activity_entity: "",
  last_activity_entity: "",
  last_power_activity_entity: "",
  last_current_activity_entity: "",
  final_spin_confidence_entity: "",
  final_spin_evidence_entity: "",
  final_spin_confirmation_path_entity: "",
  spin_electrical_candidate_entity: "",
  spin_power_rolling_median_entity: "",
  spin_current_rolling_median_entity: "",
  spin_electrical_candidate_since_entity: "",
  finish_since_entity: "",
  finish_deadline_entity: "",
  finish_remaining_entity: "",
  last_state_change_entity: "",
  last_transition_reason_entity: "",
  last_rejected_entity: "",
  rejected_count_entity: "",
};

// Встроенный словарь для собственных подписей карточки (не имён сущностей).
const STRINGS = {
  en: {    
    activity: "Activity",
    final_spin: "Final spin",
    electrical_hybrid: "Electrical / hybrid",
    completion: "Cycle completion",
    transitions: "State transitions",
    timing: "Timing & power",
    tracking: "Laundry",
    mark_unloaded: "Mark unloaded",
    duration: "Duration",
    show_more: "Diagnostics",
    unavailable: "unavailable",
    editor_group_primary: "Primary entities",
    editor_group_tracking: "Laundry tracking",
    editor_group_diagnostics: "Diagnostics",
    configuration_required: "Configure at least Cycle state or Running.",
    editor_title: "Card title (optional)",
    editor_icon: "Icon",
    field_cycle_state: "Cycle state",
    field_running: "Running",
    field_final_spin: "Final spin detected",
    field_finished: "Finished",
    field_current_cycle_duration: "Current cycle duration",
    field_last_cycle_duration: "Last cycle duration",
    field_last_cycle_energy: "Last cycle energy (optional)",
    field_power: "Current power",
    field_current: "Current draw (optional)",
    field_leak: "Leak (optional)",
    field_laundry_present: "Laundry present (optional)",
    field_mark_unloaded: "Mark unloaded button (optional)",
    field_last_unloaded: "Last unloaded (optional)",
    field_activity: "Activity detected",
    field_power_activity: "Power activity",
    field_current_activity: "Current activity",
    field_last_activity: "Last activity",
    field_last_power_activity: "Last power activity",
    field_last_current_activity: "Last current activity",
    field_final_spin_confidence: "Final spin confidence",
    field_final_spin_evidence: "Final spin evidence count",
    field_final_spin_confirmation_path: "Final spin confirmation path (optional)",
    field_spin_electrical_candidate: "Electrical spin candidate (optional)",
    field_spin_power_rolling_median: "Spin power rolling median (optional)",
    field_spin_current_rolling_median: "Spin current rolling median (optional)",
    field_spin_electrical_candidate_since: "Electrical spin candidate since (optional)",
    field_finish_since: "Finish inactivity since",
    field_finish_deadline: "Finish confirmation deadline",
    field_finish_remaining: "Finish confirmation remaining",
    field_last_state_change: "Last state change",
    field_last_transition_reason: "Last transition reason",
    field_last_rejected: "Last rejected transition",
    field_rejected_count: "Rejected transition count",
    action_failed: "Action failed",
  },
  ru: {    
    activity: "Активность",
    final_spin: "Финальный отжим",
    electrical_hybrid: "Электрика / hybrid",
    completion: "Завершение цикла",
    transitions: "Переходы состояния",
    timing: "Длительность и питание",
    tracking: "Бельё",
    mark_unloaded: "Бельё выгружено",
    duration: "Длительность",
    show_more: "Диагностика",
    unavailable: "недоступно",
    editor_group_primary: "Основные сущности",
    editor_group_tracking: "Трекинг белья",
    editor_group_diagnostics: "Диагностика",
    configuration_required: "Настройте хотя бы «Состояние цикла» или «Стирка выполняется».",
    editor_title: "Заголовок карточки (опц.)",
    editor_icon: "Иконка",
    field_cycle_state: "Состояние цикла",
    field_running: "Стирка выполняется",
    field_final_spin: "Финальный отжим",
    field_finished: "Стирка завершена",
    field_current_cycle_duration: "Текущая длительность цикла",
    field_last_cycle_duration: "Длительность последнего цикла",
    field_last_cycle_energy: "Энергия последнего цикла (опц.)",
    field_power: "Текущая мощность",
    field_current: "Потребляемый ток (опц.)",
    field_leak: "Протечка (опц.)",
    field_laundry_present: "Бельё в машине (опц.)",
    field_mark_unloaded: "Кнопка «Бельё выгружено» (опц.)",
    field_last_unloaded: "Последняя выгрузка (опц.)",
    field_activity: "Обнаружена активность",
    field_power_activity: "Активность по мощности",
    field_current_activity: "Активность по току",
    field_last_activity: "Последняя активность",
    field_last_power_activity: "Последняя активность по мощности",
    field_last_current_activity: "Последняя активность по току",
    field_final_spin_confidence: "Уверенность в отжиме",
    field_final_spin_evidence: "Количество признаков отжима",
    field_final_spin_confirmation_path: "Путь подтверждения финального отжима (опц.)",
    field_spin_electrical_candidate: "Электрический кандидат отжима (опц.)",
    field_spin_power_rolling_median: "Скользящая медиана мощности отжима (опц.)",
    field_spin_current_rolling_median: "Скользящая медиана тока отжима (опц.)",
    field_spin_electrical_candidate_since: "Электрический кандидат отжима с (опц.)",
    field_finish_since: "Отсутствие активности с",
    field_finish_deadline: "Срок подтверждения завершения",
    field_finish_remaining: "До подтверждения завершения",
    field_last_state_change: "Последнее изменение состояния",
    field_last_transition_reason: "Причина последнего перехода",
    field_last_rejected: "Последний отклонённый переход",
    field_rejected_count: "Отклонённых переходов",
    action_failed: "Не удалось выполнить действие",
  },
};

// Порядок и группировка сущностей в редакторе.
const ENTITY_FIELDS = [
  { key: "cycle_state_entity", labelKey: "field_cycle_state", domains: ["sensor"] },
  { key: "running_entity", labelKey: "field_running", domains: ["binary_sensor"] },
  { key: "final_spin_entity", labelKey: "field_final_spin", domains: ["binary_sensor"] },
  { key: "finished_entity", labelKey: "field_finished", domains: ["binary_sensor"] },
  { key: "current_cycle_duration_entity", labelKey: "field_current_cycle_duration", domains: ["sensor"] },
  { key: "last_cycle_duration_entity", labelKey: "field_last_cycle_duration", domains: ["sensor"] },
  { key: "last_cycle_energy_entity", labelKey: "field_last_cycle_energy", domains: ["sensor"] },
  { key: "power_entity", labelKey: "field_power", domains: ["sensor"] },
  { key: "current_entity", labelKey: "field_current", domains: ["sensor"] },
  { key: "leak_entity", labelKey: "field_leak", domains: ["binary_sensor"] },
  { key: "laundry_present_entity", labelKey: "field_laundry_present", domains: ["binary_sensor"] },
  { key: "mark_unloaded_entity", labelKey: "field_mark_unloaded", domains: ["button"] },
  { key: "last_unloaded_entity", labelKey: "field_last_unloaded", domains: ["sensor"] },
  { key: "activity_entity", labelKey: "field_activity", domains: ["binary_sensor"] },
  { key: "power_activity_entity", labelKey: "field_power_activity", domains: ["binary_sensor"] },
  { key: "current_activity_entity", labelKey: "field_current_activity", domains: ["binary_sensor"] },
  { key: "last_activity_entity", labelKey: "field_last_activity", domains: ["sensor"] },
  { key: "last_power_activity_entity", labelKey: "field_last_power_activity", domains: ["sensor"] },
  { key: "last_current_activity_entity", labelKey: "field_last_current_activity", domains: ["sensor"] },
  { key: "final_spin_confidence_entity", labelKey: "field_final_spin_confidence", domains: ["sensor"] },
  { key: "final_spin_evidence_entity", labelKey: "field_final_spin_evidence", domains: ["sensor"] },
  { key: "final_spin_confirmation_path_entity", labelKey: "field_final_spin_confirmation_path", domains: ["sensor"] },
  { key: "spin_electrical_candidate_entity", labelKey: "field_spin_electrical_candidate", domains: ["binary_sensor"] },
  { key: "spin_power_rolling_median_entity", labelKey: "field_spin_power_rolling_median", domains: ["sensor"] },
  { key: "spin_current_rolling_median_entity", labelKey: "field_spin_current_rolling_median", domains: ["sensor"] },
  { key: "spin_electrical_candidate_since_entity", labelKey: "field_spin_electrical_candidate_since", domains: ["sensor"] },
  { key: "finish_since_entity", labelKey: "field_finish_since", domains: ["sensor"] },
  { key: "finish_deadline_entity", labelKey: "field_finish_deadline", domains: ["sensor"] },
  { key: "finish_remaining_entity", labelKey: "field_finish_remaining", domains: ["sensor"] },
  { key: "last_state_change_entity", labelKey: "field_last_state_change", domains: ["sensor"] },
  { key: "last_transition_reason_entity", labelKey: "field_last_transition_reason", domains: ["sensor"] },
  { key: "last_rejected_entity", labelKey: "field_last_rejected", domains: ["sensor"] },
  { key: "rejected_count_entity", labelKey: "field_rejected_count", domains: ["sensor"] },
];

const PRIMARY_ENTITY_KEYS = [
  "cycle_state_entity",
  "running_entity",
  "final_spin_entity",
  "finished_entity",
  "current_cycle_duration_entity",
  "last_cycle_duration_entity",
  "last_cycle_energy_entity",
  "power_entity",
  "current_entity",
  "leak_entity",
];

const TRACKING_ENTITY_KEYS = [
  "laundry_present_entity",
  "mark_unloaded_entity",
  "last_unloaded_entity",
];

const DIAGNOSTIC_GROUPS = [
  {
    labelKey: "activity",
    keys: [
      "activity_entity",
      "power_activity_entity",
      "current_activity_entity",
      "last_activity_entity",
      "last_power_activity_entity",
      "last_current_activity_entity",
    ],
  },
  {
    labelKey: "final_spin",
    keys: [
      "final_spin_confidence_entity",
      "final_spin_evidence_entity",
      "final_spin_confirmation_path_entity",
    ],
  },
  {
    labelKey: "electrical_hybrid",
    keys: [
      "spin_electrical_candidate_entity",
      "spin_power_rolling_median_entity",
      "spin_current_rolling_median_entity",
      "spin_electrical_candidate_since_entity",
    ],
  },
  { labelKey: "timing", keys: ["last_cycle_energy_entity"] },
  { labelKey: "tracking", keys: ["last_unloaded_entity"] },
  {
    labelKey: "completion",
    keys: ["finish_since_entity", "finish_deadline_entity", "finish_remaining_entity"],
  },
  {
    labelKey: "transitions",
    keys: [
      "last_state_change_entity",
      "last_transition_reason_entity",
      "last_rejected_entity",
      "rejected_count_entity",
    ],
  },
];

const DIAGNOSTIC_ENTITY_KEYS = [
  ...new Set(DIAGNOSTIC_GROUPS.flatMap((group) => group.keys)),
].filter(
  (key) =>
    !PRIMARY_ENTITY_KEYS.includes(key) &&
    !TRACKING_ENTITY_KEYS.includes(key)
);

const EDITOR_ENTITY_KEYS = [
  ...PRIMARY_ENTITY_KEYS,
  ...TRACKING_ENTITY_KEYS,
  ...DIAGNOSTIC_ENTITY_KEYS,
];

const ENTITY_FIELD_KEYS = ENTITY_FIELDS.map((field) => field.key);
if (
  new Set(EDITOR_ENTITY_KEYS).size !== EDITOR_ENTITY_KEYS.length ||
  EDITOR_ENTITY_KEYS.length !== ENTITY_FIELD_KEYS.length ||
  ENTITY_FIELD_KEYS.some((key) => !EDITOR_ENTITY_KEYS.includes(key))
) {
  throw new Error("Laundry Monitor Card: editor entity groups are inconsistent.");
}

const EDITOR_LABEL_KEYS = {
  title: "editor_title",
  icon: "editor_icon",
  ...Object.fromEntries(
    ENTITY_FIELDS.map((field) => [field.key, field.labelKey])
  ),
};

// Цвет акцента по состоянию цикла.
const STATE_COLORS = {
  running: "var(--info-color, #2196f3)",
  final_spin: "var(--info-color, #2196f3)",
  finished: "var(--success-color, #4caf50)",
  armed: "var(--warning-color, #ffa726)",
  error: "var(--error-color, #db4437)",
};

function fmtState(hass, stateObj) {
  return hass.formatEntityState(stateObj);
}

function isUnavailable(st) {
  return !st || st.state === "unavailable" || st.state === "unknown" || st.state === "";
}

function fmtDuration(stateObj, hass) {
  if (isUnavailable(stateObj)) return "—";
  const value = Number(stateObj.state);
  if (!Number.isFinite(value)) return fmtState(hass, stateObj);

  const unit = String(stateObj.attributes?.unit_of_measurement || "s").toLowerCase();
  let seconds;
  if (["s", "sec", "second", "seconds"].includes(unit)) seconds = value;
  else if (["min", "minute", "minutes"].includes(unit)) seconds = value * 60;
  else if (["h", "hr", "hour", "hours"].includes(unit)) seconds = value * 3600;
  else return fmtState(hass, stateObj);

  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
}

function compactConfig(config) {
  const result = {};
  Object.entries(config || {}).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;
    result[key] = value;
  });
  return result;
}

function css() {
  return `
    [hidden] { display: none !important; }
    ha-card { padding: 0; overflow: hidden; }
    .lm-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 16px 8px 16px;
    }
    .lm-icon { --mdc-icon-size: 30px; }
    .lm-titles { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .lm-title {
      font-size: 0.82em; color: var(--secondary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .lm-state { font-size: 1.35em; font-weight: 600; line-height: 1.2; }
    .lm-leak-badge {
      display: none; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 12px;
      background: var(--error-color, #db4437); color: white;
      font-size: 0.8em; white-space: nowrap;
    }
    .lm-leak-badge.on { display: inline-flex; }
    .lm-leak-badge ha-icon { --mdc-icon-size: 16px; }

    /* chips */
    .lm-chips {
      display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
      padding: 4px 16px 12px 16px;
    }
    .lm-chip {
      display: inline-flex; align-items: center; justify-content: center;
      width: 38px; height: 38px; border-radius: 12px;
      background: var(--divider-color); color: var(--disabled-text-color);
      cursor: pointer; border: none; transition: all .2s; padding: 0;
    }
    .lm-chip ha-icon { --mdc-icon-size: 21px; }
    .lm-chip.on { color: white; }
    .lm-chip.c-blue.on { background: var(--info-color, #2196f3); }
    .lm-chip.c-green.on { background: var(--success-color, #4caf50); }
    .lm-spacer { flex: 1; }
    .lm-metric {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.9em; color: var(--secondary-text-color); white-space: nowrap;
    }
    .lm-metric ha-icon { --mdc-icon-size: 18px; }

    /* tracking */
    .lm-tracking {
      display: none; align-items: center; gap: 12px;
      padding: 0 16px 14px 16px;
    }
    .lm-tracking.show { display: flex; }
    .lm-present {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.9em; color: var(--secondary-text-color); flex: 1;
    }
    .lm-present ha-icon { --mdc-icon-size: 20px; }
    .lm-present.active { color: var(--primary-text-color); }
    .lm-unload-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 9px 14px; border-radius: 10px; border: none;
      background: var(--primary-color); color: white;
      font: inherit; font-size: 0.9em; font-weight: 600; cursor: pointer;
    }
    .lm-unload-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .lm-unload-btn ha-icon { --mdc-icon-size: 18px; }

    /* diagnostics */
    .lm-diag-toggle {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; cursor: pointer;
      border-top: 1px solid var(--divider-color);
      color: var(--secondary-text-color); font-size: 0.9em; user-select: none;
    }
    .lm-diag-toggle ha-icon { --mdc-icon-size: 20px; transition: transform .2s; }
    .lm-diag-toggle.open ha-icon.chevron { transform: rotate(180deg); }
    .lm-diag { display: none; padding: 0 16px 12px 16px; }
    .lm-diag.open { display: block; }
    .lm-diag-section {
      font-size: 0.72em; text-transform: uppercase; letter-spacing: .04em;
      color: var(--secondary-text-color); margin: 12px 0 4px 0;
    }
    .lm-diag-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 5px 0; cursor: pointer;
      border-bottom: 1px solid var(--divider-color);
    }
    .lm-diag-row:last-child { border-bottom: none; }
    .lm-diag-name {
      font-size: 0.88em; color: var(--primary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .lm-diag-val {
      font-size: 0.88em; color: var(--secondary-text-color);
      white-space: nowrap; text-align: right;
    }
    .lm-config-required {
      padding: 16px;
      color: var(--secondary-text-color);
      font-size: 0.95em;
      line-height: 1.4;
    }
  `;
}

class LaundryMonitorCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig() {
    return { type: `custom:${CARD_TAG}` };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid Laundry Monitor Card configuration");
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._configurationIncomplete =
      !this._config.cycle_state_entity && !this._config.running_entity;
    this._trackedEntityIds = [
      ...new Set(ENTITY_FIELDS.map((field) => this._config[field.key]).filter(Boolean)),
    ];
    this._built = false;
    if (this._hass) this._render();
  }

  set hass(hass) {
    const previous = this._hass;
    this._hass = hass;
    if (!hass || !this._config) return;
    if (!this._built) {
      this._render();
      return;
    }
    if (previous && !this._relevantStatesChanged(previous, hass)) return;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  _relevantStatesChanged(previous, current) {
    if (!previous || previous.language !== current.language) return true;
    for (const entityId of this._trackedEntityIds || []) {
      if (previous.states[entityId] !== current.states[entityId]) return true;
    }
    return false;
  }

  getCardSize() {
    const diagnosticsOpen = this._els?.diag?.classList.contains("open");
    if (!diagnosticsOpen) return 3;
    const rows = this._diagRows?.length || 0;
    return 4 + Math.ceil(rows / 2);
  }

  getGridOptions() {
    return {
      columns: 12,
      rows: "auto",
      min_columns: 6,
      min_rows: 2,
    };
  }
  connectedCallback() {
    if (this._config && this._hass && !this._built) this._render();
  }

  _t(key) {
    const lang = (this._hass && this._hass.language) || "en";
    const dict = STRINGS[lang] || STRINGS[lang.split("-")[0]] || STRINGS.en;
    return dict[key] || STRINGS.en[key] || key;
  }

  _name(entityId, fallback) {
    const st = this._hass && entityId ? this._hass.states[entityId] : null;
    return (st && st.attributes && st.attributes.friendly_name) || fallback || entityId || "";
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    );
  }

  // ---- построение DOM (один раз) ----
  _render() {
    const cfg = this._config;
    const root = this.shadowRoot;
    root.innerHTML = "";

    const style = document.createElement("style");
    style.textContent = css();
    root.appendChild(style);

    const card = document.createElement("ha-card");
    if (this._configurationIncomplete) {
      const message = document.createElement("div");
      message.className = "lm-config-required";
      message.textContent = this._t("configuration_required");
      card.appendChild(message);
      root.appendChild(card);
      this._els = { configMessage: message };
      this._diagSig = null;
      this._built = true;
      return;
    }
    // header
    const header = document.createElement("div");
    header.className = "lm-header";
    const headerIcon = document.createElement("ha-icon");
    headerIcon.className = "lm-icon";
    headerIcon.setAttribute("icon", cfg.icon || "mdi:washing-machine");
    const titles = document.createElement("div");
    titles.className = "lm-titles";
    const title = document.createElement("span");
    title.className = "lm-title";
    const state = document.createElement("span");
    state.className = "lm-state";
    state.textContent = "—";
    titles.append(title, state);
    const leakBadge = document.createElement("span");
    leakBadge.className = "lm-leak-badge";
    const leakIcon = document.createElement("ha-icon");
    leakIcon.setAttribute("icon", "mdi:water-alert");
    const leakText = document.createElement("span");
    leakBadge.append(leakIcon, leakText);
    header.append(headerIcon, titles, leakBadge);

    titles.addEventListener("click", () =>
      this._moreInfo(cfg.cycle_state_entity)
    );
    leakBadge.addEventListener("click", () =>
      this._moreInfo(cfg.leak_entity)
    );
    card.appendChild(header);

    // chips
    const chips = document.createElement("div");
    chips.className = "lm-chips";
    const mkChip = (key, entityId, icon, color) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `lm-chip ${color}`;
      b.dataset.key = key;
      b.innerHTML = `<ha-icon icon="${icon}"></ha-icon>`;
      b.addEventListener("click", () => this._moreInfo(entityId));
      b.hidden = !entityId;
      b.setAttribute("aria-pressed", "false");
      return b;
    };
    const chipRunning = mkChip("running", cfg.running_entity, "mdi:sync", "c-blue");
    const chipSpin = mkChip("spin", cfg.final_spin_entity, "mdi:autorenew", "c-blue");
    const chipFinished = mkChip("finished", cfg.finished_entity, "mdi:check-circle", "c-green");
    const spacer = document.createElement("span");
    spacer.className = "lm-spacer";
    const durMetric = document.createElement("span");
    durMetric.className = "lm-metric";
    durMetric.innerHTML = `<ha-icon icon="mdi:timer-outline"></ha-icon><span>—</span>`;
    const ampMetric = document.createElement("span");
    ampMetric.className = "lm-metric";
    ampMetric.innerHTML = `<ha-icon icon="mdi:current-ac"></ha-icon><span>—</span>`;
    const pwrMetric = document.createElement("span");
    pwrMetric.className = "lm-metric";
    pwrMetric.innerHTML = `<ha-icon icon="mdi:flash"></ha-icon><span>—</span>`;
    chips.append(chipRunning, chipSpin, chipFinished, spacer, durMetric, ampMetric, pwrMetric);
    card.appendChild(chips);

    // tracking
    const tracking = document.createElement("div");
    tracking.className = "lm-tracking";
    const present = document.createElement("span");
    present.className = "lm-present";
    present.innerHTML = `<ha-icon icon="mdi:basket-outline"></ha-icon><span></span>`;
    present.addEventListener("click", () => this._moreInfo(cfg.laundry_present_entity));
    const unloadBtn = document.createElement("button");
    unloadBtn.type = "button";
    unloadBtn.className = "lm-unload-btn";
    unloadBtn.innerHTML = `<ha-icon icon="mdi:basket-unfill"></ha-icon><span></span>`;
    unloadBtn.addEventListener("click", () => this._pressUnload());
    tracking.append(present, unloadBtn);
    card.appendChild(tracking);

    // diagnostics toggle + body
    const diagToggle = document.createElement("div");
    diagToggle.className = "lm-diag-toggle";
    diagToggle.setAttribute("role", "button");
    diagToggle.setAttribute("tabindex", "0");
    diagToggle.setAttribute("aria-expanded", "false");
    diagToggle.innerHTML = `
      <ha-icon icon="mdi:stethoscope"></ha-icon>
      <span class="lm-diag-toggle-label"></span>
      <span style="flex:1"></span>
      <ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon>
    `;
    const diag = document.createElement("div");
    diag.className = "lm-diag";
    const toggleDiagnostics = () => {
      const open = diag.classList.toggle("open");
      diagToggle.classList.toggle("open", open);
      diagToggle.setAttribute("aria-expanded", String(open));      
    };
    diagToggle.addEventListener("click", toggleDiagnostics);
    diagToggle.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleDiagnostics();
    });
    card.appendChild(diagToggle);
    card.appendChild(diag);

    root.appendChild(card);

    // сохраняем ссылки для точечных обновлений
    this._els = {
      icon: headerIcon,
      title,
      state,
      leakBadge,
      leakBadgeText: leakText,
      chipRunning,
      chipSpin,
      chipFinished,
      durMetric,
      durVal: durMetric.querySelector("span"),
      ampMetric,
      ampVal: ampMetric.querySelector("span"),
      pwrMetric,
      pwrVal: pwrMetric.querySelector("span"),
      tracking,
      present,
      presentText: present.querySelector("span"),
      unloadBtn,
      unloadBtnText: unloadBtn.querySelector("span"),
      diagToggle,
      diagToggleLabel: diagToggle.querySelector(".lm-diag-toggle-label"),
      diag,
    };
    this._diagSig = null;
    this._built = true;
    this._update();
  }

  _buildDiag() {
    const cfg = this._config;
    const wasOpen = this._els.diag.classList.contains("open");
    this._els.diag.innerHTML = "";
    this._diagRows = [];
    DIAGNOSTIC_GROUPS.forEach((g) => {
      const present = g.keys.filter((k) => cfg[k] && this._hass.states[cfg[k]]);
      if (!present.length) return;
      const sec = document.createElement("div");
      sec.className = "lm-diag-section";
      sec.textContent = this._t(g.labelKey);
      this._els.diag.appendChild(sec);
      present.forEach((k) => {
        const entityId = cfg[k];
        const row = document.createElement("div");
        row.className = "lm-diag-row";
        row.innerHTML = `<span class="lm-diag-name"></span><span class="lm-diag-val"></span>`;
        row.addEventListener("click", () => this._moreInfo(entityId));
        this._els.diag.appendChild(row);
        this._diagRows.push({
          entityId,
          name: row.querySelector(".lm-diag-name"),
          val: row.querySelector(".lm-diag-val"),
        });
      });
    });
    const hasDiagnostics = this._diagRows.length > 0;
    this._els.diagToggle.hidden = !hasDiagnostics;
    this._els.diag.hidden = !hasDiagnostics;
    if (hasDiagnostics && wasOpen) {
      this._els.diag.classList.add("open");
      this._els.diagToggle.classList.add("open");
      this._els.diagToggle.setAttribute("aria-expanded", "true");
    } else if (!hasDiagnostics) {
      this._els.diag.classList.remove("open");
      this._els.diagToggle.classList.remove("open");
      this._els.diagToggle.setAttribute("aria-expanded", "false");
    }
  }
  _diagSignature() {
    const cfg = this._config;
    const ids = ENTITY_FIELDS.map((field) => {
      const entityId = cfg[field.key];
      return entityId && this._hass.states[entityId] ? entityId : "";
    });
    return `${ids.join("|")}|${this._hass.language || "en"}`;
  }

  // ---- точечное обновление (без пересоздания DOM) ----
  _update() {
    const hass = this._hass;    
    const els = this._els;
    if (!hass || !els) return;
    if (this._configurationIncomplete) {
      if (els.configMessage) {
        els.configMessage.textContent = this._t("configuration_required");
      }
      return;
    }
    const cfg = this._config;
    // header: title + localized state + accent color
    const stateObj = hass.states[cfg.cycle_state_entity];
    els.title.textContent = cfg.title || this._name(cfg.cycle_state_entity, "Laundry");
    let stateText = "—";
    let accent = "var(--state-icon-color)";
    if (!isUnavailable(stateObj)) {
      stateText = fmtState(hass, stateObj);
      accent = STATE_COLORS[stateObj.state] || "var(--state-icon-color)";
    } else {
      stateText = this._t("unavailable");
    }
    els.state.textContent = stateText;
    els.icon.style.color = accent;

    // leak badge
    const leakSt = hass.states[cfg.leak_entity];
    const leakOn = leakSt && leakSt.state === "on";
    els.leakBadge.classList.toggle("on", !!leakOn);
    els.leakBadgeText.textContent = this._name(cfg.leak_entity, "");

    // status chips
    const setChip = (el, entityId) => {
      const st = hass.states[entityId];
      const visible = !!entityId && !!st;
      el.hidden = !visible;
      el.classList.toggle("on", !!st && st.state === "on");
      const label = this._name(entityId, "");
      el.title = label;
      el.setAttribute("aria-label", label || entityId || "");
      el.setAttribute("aria-pressed", String(!!st && st.state === "on"));
    };
    setChip(els.chipRunning, cfg.running_entity);
    setChip(els.chipSpin, cfg.final_spin_entity);
    setChip(els.chipFinished, cfg.finished_entity);

    // duration: current only while a cycle is active; otherwise last completed cycle
    const curDur = hass.states[cfg.current_cycle_duration_entity];
    const lastDur = hass.states[cfg.last_cycle_duration_entity];
    const isOn = (entityId) => hass.states[entityId]?.state === "on";
    const activeCycle =
      isOn(cfg.running_entity) ||
      isOn(cfg.final_spin_entity) ||
      (stateObj &&
        (stateObj.state === "running" || stateObj.state === "final_spin"));
    const durSrc =
      activeCycle && !isUnavailable(curDur)
        ? curDur
        : !isUnavailable(lastDur)
        ? lastDur
        : null;
    els.durMetric.hidden =
      !cfg.current_cycle_duration_entity && !cfg.last_cycle_duration_entity;
    els.durVal.textContent = durSrc ? fmtDuration(durSrc, hass) : "—";

    // current draw (optional)
    const curSt = hass.states[cfg.current_entity];
    els.ampMetric.hidden = !cfg.current_entity;
    if (cfg.current_entity && curSt) {
      els.ampVal.textContent = isUnavailable(curSt)
        ? "—"
        : fmtState(hass, curSt);
    }

    // power
    const pwrSt = hass.states[cfg.power_entity];
    els.pwrMetric.hidden = !cfg.power_entity;
    els.pwrVal.textContent =
      pwrSt && !isUnavailable(pwrSt)
        ? fmtState(hass, pwrSt)
        : "—";

    // tracking block — показываем, только если сущности доступны
    const unloadSt = hass.states[cfg.mark_unloaded_entity];
    const presentSt = hass.states[cfg.laundry_present_entity];
    const trackingAvailable =
      (cfg.mark_unloaded_entity && unloadSt && !isUnavailable(unloadSt)) ||
      (cfg.laundry_present_entity && presentSt && !isUnavailable(presentSt));
    els.tracking.classList.toggle("show", !!trackingAvailable);
    if (trackingAvailable) {
      const present = presentSt && presentSt.state === "on";
      els.present.classList.toggle("active", !!present);
      const presentName = this._name(cfg.laundry_present_entity, this._t("tracking"));
      els.presentText.textContent =
        presentSt && !isUnavailable(presentSt)
          ? `${presentName}: ${fmtState(hass, presentSt)}`
          : presentName;
      els.unloadBtn.disabled = !unloadSt || isUnavailable(unloadSt);
      els.unloadBtnText.textContent = this._t("mark_unloaded");
    }

    // diagnostics
    els.diagToggleLabel.textContent = this._t("show_more");
    const diagSig = this._diagSignature();
    if (diagSig !== this._diagSig) {
      this._diagSig = diagSig;
      this._buildDiag();
    }
    if (this._diagRows) {
      this._diagRows.forEach((r) => {
        const st = hass.states[r.entityId];
        r.name.textContent = this._name(r.entityId, r.entityId);
        r.val.textContent =
          st && !isUnavailable(st) ? fmtState(hass, st) : "—";
      });
    }
  }

  _pressUnload() {
    const cfg = this._config;
    const hass = this._hass;
    if (!hass || !cfg.mark_unloaded_entity) return;
    const button = this._els && this._els.unloadBtn;
    if (button) button.disabled = true;
    Promise.resolve(
      hass.callService("button", "press", { entity_id: cfg.mark_unloaded_entity })
    )
      .catch((error) => {
        console.error("Laundry Monitor Card: mark unloaded failed", error);
        this.dispatchEvent(
          new CustomEvent("hass-notification", {
            detail: { message: this._t("action_failed") },
            bubbles: true,
            composed: true,
          })
        );
      })
      .finally(() => {
        if (button) {
          const st = this._hass?.states[cfg.mark_unloaded_entity];
          button.disabled = !st || isUnavailable(st);
        }
      });
  }
}

// ------------------------------------------------------------------
// РЕДАКТОР КАРТОЧКИ
// Использует нативный ha-form с text/icon/entity selectors.
// ------------------------------------------------------------------
class LaundryMonitorCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._syncForm();
  }

  set hass(hass) {
    const previousLanguage = this._hass?.language;
    this._hass = hass;
    if (!hass) return;
    if (!this._form && this._config) {
      this._buildForm();
      return;
     }
    if (!this._form) return;
    this._form.hass = hass;
    if (previousLanguage !== hass.language) {
      this._form.schema = this._editorSchema();
    }
  }
  connectedCallback() {
    if (this._config && this._hass && !this._form) this._buildForm();
  }
  _t(key) {
    const lang = (this._hass && this._hass.language) || "en";
    const dict = STRINGS[lang] || STRINGS[lang.split("-")[0]] || STRINGS.en;
    return dict[key] || STRINGS.en[key] || key;
  }

  _computeLabel(schema) {
    const key = EDITOR_LABEL_KEYS[schema.name];
    return key ? this._t(key) : schema.name;
  }

  _fieldsFor(keys) {
    const allowed = new Set(keys);
    return ENTITY_FIELDS.filter((field) => allowed.has(field.key)).map((field) => ({
      name: field.key,
      selector: { entity: { domain: field.domains } },
    }));
  }

  _editorSchema() {
    return [
      { name: "title", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      {
        name: "",
        type: "expandable",
        title: this._t("editor_group_primary"),
        schema: this._fieldsFor(PRIMARY_ENTITY_KEYS),
      },
      {
        name: "",
        type: "expandable",
        title: this._t("editor_group_tracking"),
        schema: this._fieldsFor(TRACKING_ENTITY_KEYS),
      },
      {
        name: "",
        type: "expandable",
        title: this._t("editor_group_diagnostics"),
        schema: this._fieldsFor(DIAGNOSTIC_ENTITY_KEYS),
      },
    ];
  }

  _formData() {
    const data = compactConfig(this._config);
    delete data.type;
    return data;
  }

  _buildForm() {
    if (!this._hass || !this._config || this._form) return;
    const form = document.createElement("ha-form");
    form.hass = this._hass;
    form.data = this._formData();
    form.schema = this._editorSchema();
    form.computeLabel = (schema) => this._computeLabel(schema);
    form.addEventListener("value-changed", (event) => {
      event.stopPropagation();
      const value = event.detail?.value || {};
      this._config = {
        ...DEFAULT_CONFIG,
        ...value,
        type: value.type || this._config.type || `custom:${CARD_TAG}`,
      };
      this._fireConfigChanged();
    });

    this.shadowRoot.replaceChildren(form);
    this._form = form;
  }


  _syncForm() {
    if (!this._form) {
      if (this._hass && this.isConnected) this._buildForm();
      return;
    }
    this._form.data = this._formData();
  }

  _fireConfigChanged() {
    const config = compactConfig(this._config);
    if (config.icon === DEFAULT_CONFIG.icon) delete config.icon;
    config.type = config.type || `custom:${CARD_TAG}`;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, LaundryMonitorCard);
}
if (!customElements.get(EDITOR_TAG)) {
  customElements.define(EDITOR_TAG, LaundryMonitorCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Laundry Monitor Card",
  description:
    "Lovelace card for Laundry Monitor: cycle state, status, power, laundry tracking and diagnostics.",
  preview: false,
});

console.info(`%c Laundry Monitor Card %c ${CARD_VERSION} `, "color:#03a9f4;font-weight:bold", "");
