/**
 * Laundry Monitor Card
 * Кастомная карточка Lovelace для интеграции "Laundry Monitor" (Home Assistant).
 *
 * Особенности реализации:
 *  - Чистый Custom Element без внешних зависимостей (кроме встроенных
 *    ha-card / ha-icon / ha-entity-picker из самого Home Assistant).
 *  - DOM карточки строится ОДИН РАЗ (при первом получении hass), дальше только
 *    точечно обновляются значения — это исключает лишние перерисовки.
 *  - DOM редактора строится ОДИН РАЗ. hass присваивается пикерам сущностей
 *    (ha-entity-picker) только при первом построении редактора.
 *  - Поддержка переводов: подписи сущностей берутся из их friendly_name, а
 *    значение состояния цикла — через hass.formatEntityState(), поэтому текст
 *    следует языку интерфейса HA (интеграция поставляет en/ru). Немногочисленные
 *    собственные подписи карточки берутся из встроенного словаря по hass.language.
 */

const CARD_TAG = "laundry-monitor-card";
const EDITOR_TAG = "laundry-monitor-card-editor";

const DEFAULT_CONFIG = {
  title: "",
  icon: "mdi:washing-machine",
  // основные
  cycle_state_entity: "sensor.stiralka_cycle_state",
  running_entity: "binary_sensor.stiralka_running",
  final_spin_entity: "binary_sensor.stiralka_final_spin_detected",
  finished_entity: "binary_sensor.stiralka_finished",
  current_cycle_duration_entity: "sensor.stiralka_current_cycle_duration",
  last_cycle_duration_entity: "sensor.stiralka_last_cycle_duration",
  last_cycle_energy_entity: "",
  power_entity: "sensor.stiralka_current_power",
  current_entity: "sensor.kukhnia_stiralka_current_draw",
  leak_entity: "binary_sensor.stiralka_leak",
  // трекинг белья
  laundry_present_entity: "binary_sensor.stiralka_laundry_present",
  mark_unloaded_entity: "button.stiralka_mark_unloaded",
  last_unloaded_entity: "sensor.stiralka_last_unloaded_at",
  // диагностика
  activity_entity: "binary_sensor.stiralka_activity_detected",
  power_activity_entity: "binary_sensor.kukhnia_stiralka_power_activity_detected",
  current_activity_entity: "binary_sensor.kukhnia_stiralka_current_activity_detected",
  last_activity_entity: "sensor.stiralka_last_activity",
  last_power_activity_entity: "sensor.kukhnia_stiralka_last_power_activity",
  last_current_activity_entity: "sensor.kukhnia_stiralka_last_current_activity",
  final_spin_confidence_entity: "sensor.stiralka_final_spin_confidence",
  final_spin_evidence_entity: "sensor.stiralka_final_spin_evidence_count",
  final_spin_confirmation_path_entity: "",
  spin_electrical_candidate_entity: "",
  spin_power_rolling_median_entity: "",
  spin_current_rolling_median_entity: "",
  spin_electrical_candidate_since_entity: ""
  finish_since_entity: "sensor.stiralka_finish_inactivity_since",
  finish_deadline_entity: "sensor.stiralka_finish_confirmation_deadline",
  finish_remaining_entity: "sensor.stiralka_finish_confirmation_remaining",
  last_state_change_entity: "sensor.stiralka_last_state_change",
  last_transition_reason_entity: "sensor.stiralka_last_transition_reason",
  last_rejected_entity: "sensor.stiralka_last_rejected_transition",
  rejected_count_entity: "sensor.stiralka_rejected_transition_count",
};

// Встроенный словарь для собственных подписей карточки (не имён сущностей).
const STRINGS = {
  en: {
    diagnostics: "Diagnostics",
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
  },
  ru: {
    diagnostics: "Диагностика",
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
  },
};

// Порядок и группировка сущностей в редакторе.
const ENTITY_FIELDS = [
  { key: "cycle_state_entity", label: "Состояние цикла", domains: ["sensor"] },
  { key: "running_entity", label: "Стирка выполняется", domains: ["binary_sensor"] },
  { key: "final_spin_entity", label: "Финальный отжим", domains: ["binary_sensor"] },
  { key: "finished_entity", label: "Стирка завершена", domains: ["binary_sensor"] },
  { key: "current_cycle_duration_entity", label: "Текущая длительность цикла", domains: ["sensor"] },
  { key: "last_cycle_duration_entity", label: "Длительность последнего цикла", domains: ["sensor"] },
  { key: "last_cycle_energy_entity", label: "Энергия последнего цикла (опц.)", domains: ["sensor"] },
  { key: "power_entity", label: "Текущая мощность", domains: ["sensor"] },
  { key: "current_entity", label: "Потребляемый ток (опц.)", domains: ["sensor"] },
  { key: "leak_entity", label: "Протечка (опц.)", domains: ["binary_sensor"] },
  { key: "laundry_present_entity", label: "Бельё в машине (опц.)", domains: ["binary_sensor"] },
  { key: "mark_unloaded_entity", label: "Кнопка «Бельё выгружено» (опц.)", domains: ["button"] },
  { key: "last_unloaded_entity", label: "Последняя выгрузка (опц.)", domains: ["sensor"] },
  { key: "activity_entity", label: "Обнаружена активность", domains: ["binary_sensor"] },
  { key: "power_activity_entity", label: "Активность по мощности", domains: ["binary_sensor"] },
  { key: "current_activity_entity", label: "Активность по току", domains: ["binary_sensor"] },
  { key: "last_activity_entity", label: "Последняя активность", domains: ["sensor"] },
  { key: "last_power_activity_entity", label: "Последняя активность по мощности", domains: ["sensor"] },
  { key: "last_current_activity_entity", label: "Последняя активность по току", domains: ["sensor"] },
  { key: "final_spin_confidence_entity", label: "Уверенность в отжиме", domains: ["sensor"] },
  { key: "final_spin_evidence_entity", label: "Признаков отжима", domains: ["sensor"] },
  { key: "final_spin_confirmation_path_entity", label: "Путь подтверждения финального отжима (опц.)", domains: ["sensor"] },
  { key: "spin_electrical_candidate_entity", label: "Электрический кандидат отжима (опц.)", domains: ["binary_sensor"] },
  { key: "spin_power_rolling_median_entity", label: "Скользящая медиана мощности отжима (опц.)", domains: ["sensor"] },
  { key: "spin_current_rolling_median_entity", label: "Скользящая медиана тока отжима (опц.)", domains: ["sensor"] },
  { key: "spin_electrical_candidate_since_entity", label: "Электрический кандидат отжима с (опц.)", domains: ["sensor"] },
  { key: "finish_since_entity", label: "Отсутствие активности с", domains: ["sensor"] },
  { key: "finish_deadline_entity", label: "Срок подтверждения завершения", domains: ["sensor"] },
  { key: "finish_remaining_entity", label: "До подтверждения завершения", domains: ["sensor"] },
  { key: "last_state_change_entity", label: "Последнее изменение состояния", domains: ["sensor"] },
  { key: "last_transition_reason_entity", label: "Причина последнего перехода", domains: ["sensor"] },
  { key: "last_rejected_entity", label: "Последний отклонённый переход", domains: ["sensor"] },
  { key: "rejected_count_entity", label: "Отклонённых переходов", domains: ["sensor"] },
];

// Цвет акцента по состоянию цикла.
const STATE_COLORS = {
  running: "var(--info-color, #2196f3)",
  final_spin: "var(--info-color, #2196f3)",
  finished: "var(--success-color, #4caf50)",
  armed: "var(--warning-color, #ffa726)",
  error: "var(--error-color, #db4437)",
};

function isUnavailable(st) {
  return !st || st.state === "unavailable" || st.state === "unknown" || st.state === "";
}

function fmtDuration(seconds) {
  const s = Math.round(Number(seconds));
  if (!isFinite(s)) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
}

function css() {
  return `
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
  `;
}

class LaundryMonitorCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig() {
    return { type: `custom:${CARD_TAG}`, ...DEFAULT_CONFIG };
  }

  setConfig(config) {
    if (!config) throw new Error("Некорректная конфигурация карточки");
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._built = false;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) this._render();
    else this._update();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 5;
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
    this.innerHTML = "";

    const style = document.createElement("style");
    style.textContent = css();
    this.appendChild(style);

    const card = document.createElement("ha-card");

    // header
    const header = document.createElement("div");
    header.className = "lm-header";
    header.innerHTML = `
      <ha-icon class="lm-icon" icon="${cfg.icon}"></ha-icon>
      <div class="lm-titles">
        <span class="lm-title"></span>
        <span class="lm-state">—</span>
      </div>
      <span class="lm-leak-badge"><ha-icon icon="mdi:water-alert"></ha-icon><span></span></span>
    `;
    header.querySelector(".lm-titles").addEventListener("click", () =>
      this._moreInfo(cfg.cycle_state_entity)
    );
    header.querySelector(".lm-leak-badge").addEventListener("click", () =>
      this._moreInfo(cfg.leak_entity)
    );
    card.appendChild(header);

    // chips
    const chips = document.createElement("div");
    chips.className = "lm-chips";
    const mkChip = (key, entityId, icon, color) => {
      const b = document.createElement("button");
      b.className = `lm-chip ${color}`;
      b.dataset.key = key;
      b.innerHTML = `<ha-icon icon="${icon}"></ha-icon>`;
      b.addEventListener("click", () => this._moreInfo(entityId));
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
    unloadBtn.className = "lm-unload-btn";
    unloadBtn.innerHTML = `<ha-icon icon="mdi:basket-unfill"></ha-icon><span></span>`;
    unloadBtn.addEventListener("click", () => this._pressUnload());
    tracking.append(present, unloadBtn);
    card.appendChild(tracking);

    // diagnostics toggle + body
    const diagToggle = document.createElement("div");
    diagToggle.className = "lm-diag-toggle";
    diagToggle.innerHTML = `
      <ha-icon icon="mdi:stethoscope"></ha-icon>
      <span class="lm-diag-toggle-label"></span>
      <span style="flex:1"></span>
      <ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon>
    `;
    const diag = document.createElement("div");
    diag.className = "lm-diag";
    diagToggle.addEventListener("click", () => {
      const open = diag.classList.toggle("open");
      diagToggle.classList.toggle("open", open);
    });
    card.appendChild(diagToggle);
    card.appendChild(diag);

    this.appendChild(card);

    // сохраняем ссылки для точечных обновлений
    this._els = {
      icon: header.querySelector(".lm-icon"),
      title: header.querySelector(".lm-title"),
      state: header.querySelector(".lm-state"),
      leakBadge: header.querySelector(".lm-leak-badge"),
      leakBadgeText: header.querySelector(".lm-leak-badge span"),
      chipRunning,
      chipSpin,
      chipFinished,
      durVal: durMetric.querySelector("span"),
      ampMetric,
      ampVal: ampMetric.querySelector("span"),
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
    this._diagBuilt = false;
    this._built = true;
    this._update();
  }

  _buildDiag() {
    const cfg = this._config;
    const groups = [
      {
        label: this._t("activity"),
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
        label: this._t("final_spin"),
        keys: [
          "final_spin_confidence_entity",
          "final_spin_evidence_entity",
          "final_spin_confirmation_path_entity",
        ],
      },
      {
        label: this._t("electrical_hybrid"),
        keys: [
          "spin_electrical_candidate_entity",
          "spin_power_rolling_median_entity",
          "spin_current_rolling_median_entity",
          "spin_electrical_candidate_since_entity",
        ],
       },
      {
        label: this._t("timing"),
        keys: ["last_cycle_energy_entity"],
      },
      {
        label: this._t("tracking"),
        keys: ["last_unloaded_entity"],
      },
      {
        label: this._t("completion"),
        keys: ["finish_since_entity", "finish_deadline_entity", "finish_remaining_entity"],
      },
      {
        label: this._t("transitions"),
        keys: [
          "last_state_change_entity",
          "last_transition_reason_entity",
          "last_rejected_entity",
          "rejected_count_entity",
        ],
      },
    ];

    this._els.diag.innerHTML = "";
    this._diagRows = [];
    groups.forEach((g) => {
      const present = g.keys.filter((k) => cfg[k] && this._hass.states[cfg[k]]);
      if (!present.length) return;
      const sec = document.createElement("div");
      sec.className = "lm-diag-section";
      sec.textContent = g.label;
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
    this._diagBuilt = true;
  }

  // ---- точечное обновление (без пересоздания DOM) ----
  _update() {
    const hass = this._hass;
    const cfg = this._config;
    const els = this._els;
    if (!hass || !els) return;

    // header: title + localized state + accent color
    const stateObj = hass.states[cfg.cycle_state_entity];
    els.title.textContent = cfg.title || this._name(cfg.cycle_state_entity, "Laundry");
    let stateText = "—";
    let accent = "var(--state-icon-color)";
    if (!isUnavailable(stateObj)) {
      stateText = hass.formatEntityState
        ? hass.formatEntityState(stateObj)
        : stateObj.state;
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
      el.classList.toggle("on", !!st && st.state === "on");
      el.title = this._name(entityId, "");
    };
    setChip(els.chipRunning, cfg.running_entity);
    setChip(els.chipSpin, cfg.final_spin_entity);
    setChip(els.chipFinished, cfg.finished_entity);

    // duration: running cycle if present, else last cycle
    const curDur = hass.states[cfg.current_cycle_duration_entity];
    const lastDur = hass.states[cfg.last_cycle_duration_entity];
    let durSrc = !isUnavailable(curDur) ? curDur : !isUnavailable(lastDur) ? lastDur : null;
    els.durVal.textContent = durSrc ? fmtDuration(durSrc.state) : "—";

    // current draw (optional)
    const curSt = hass.states[cfg.current_entity];
    if (cfg.current_entity && curSt) {
      els.ampMetric.style.display = "";
      els.ampVal.textContent = isUnavailable(curSt)
        ? "—"
        : hass.formatEntityState
        ? hass.formatEntityState(curSt)
        : `${curSt.state} A`;
    } else {
      els.ampMetric.style.display = "none";
    }

    // power
    const pwrSt = hass.states[cfg.power_entity];
    els.pwrVal.textContent =
      pwrSt && !isUnavailable(pwrSt)
        ? hass.formatEntityState
          ? hass.formatEntityState(pwrSt)
          : `${pwrSt.state} W`
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
          ? `${presentName}: ${hass.formatEntityState ? hass.formatEntityState(presentSt) : presentSt.state}`
          : presentName;
      els.unloadBtn.disabled = !unloadSt || isUnavailable(unloadSt);
      els.unloadBtnText.textContent = this._t("mark_unloaded");
    }

    // diagnostics
    els.diagToggleLabel.textContent = this._t("show_more");
    if (!this._diagBuilt) this._buildDiag();
    if (this._diagRows) {
      this._diagRows.forEach((r) => {
        const st = hass.states[r.entityId];
        r.name.textContent = this._name(r.entityId, r.entityId);
        r.val.textContent =
          st && !isUnavailable(st)
            ? hass.formatEntityState
              ? hass.formatEntityState(st)
              : st.state
            : "—";
      });
    }
  }

  _pressUnload() {
    const cfg = this._config;
    const hass = this._hass;
    if (!hass || !cfg.mark_unloaded_entity) return;
    hass.callService("button", "press", { entity_id: cfg.mark_unloaded_entity });
  }
}

// ------------------------------------------------------------------
// РЕДАКТОР КАРТОЧКИ
// DOM строится один раз. hass присваивается ha-entity-picker'ам только при
// первом построении — далее пикеры не пересоздаются и не сбрасываются.
// ------------------------------------------------------------------
class LaundryMonitorCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    if (this._built) this._syncFormValues();
    else if (this._hass) this._buildForm();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built && this._config) this._buildForm();
  }

  connectedCallback() {
    if (this._config && this._hass && !this._built) this._buildForm();
  }

  _buildForm() {
    this.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = `
      .lm-editor { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
      .lm-editor-field input {
        width: 100%; padding: 10px; border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color); font: inherit;
      }
      .lm-editor-label {
        font-size: 0.8em; color: var(--secondary-text-color); margin-bottom: 2px;
      }
    `;
    this.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "lm-editor";

    // title
    const titleField = document.createElement("div");
    titleField.className = "lm-editor-field";
    titleField.innerHTML = `<div class="lm-editor-label">Заголовок карточки (опц.)</div>`;
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = this._config.title || "";
    titleInput.addEventListener("change", () => {
      this._config = { ...this._config, title: titleInput.value };
      this._fireConfigChanged();
    });
    titleField.appendChild(titleInput);
    wrap.appendChild(titleField);
    this._titleInput = titleInput;

    // icon
    const iconField = document.createElement("div");
    iconField.className = "lm-editor-field";
    iconField.innerHTML = `<div class="lm-editor-label">Иконка</div>`;
    const iconInput = document.createElement("input");
    iconInput.type = "text";
    iconInput.value = this._config.icon || "";
    iconInput.addEventListener("change", () => {
      this._config = { ...this._config, icon: iconInput.value };
      this._fireConfigChanged();
    });
    iconField.appendChild(iconInput);
    wrap.appendChild(iconField);
    this._iconInput = iconInput;

    // entity pickers
    this._pickers = {};
    ENTITY_FIELDS.forEach((field) => {
      const fieldWrap = document.createElement("div");
      const label = document.createElement("div");
      label.className = "lm-editor-label";
      label.textContent = field.label;
      fieldWrap.appendChild(label);

      const picker = document.createElement("ha-entity-picker");
      picker.hass = this._hass;
      picker.allowCustomEntity = true;
      if (field.domains) picker.includeDomains = field.domains;
      picker.value = this._config[field.key] || "";
      picker.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._config = { ...this._config, [field.key]: ev.detail.value };
        this._fireConfigChanged();
      });

      fieldWrap.appendChild(picker);
      wrap.appendChild(fieldWrap);
      this._pickers[field.key] = picker;
    });

    this.appendChild(wrap);
    this._built = true;
  }

  _syncFormValues() {
    if (!this._built) return;
    if (this._titleInput && this._titleInput.value !== (this._config.title || "")) {
      this._titleInput.value = this._config.title || "";
    }
    if (this._iconInput && this._iconInput.value !== (this._config.icon || "")) {
      this._iconInput.value = this._config.icon || "";
    }
    ENTITY_FIELDS.forEach((field) => {
      const picker = this._pickers[field.key];
      const val = this._config[field.key] || "";
      if (picker && picker.value !== val) picker.value = val;
    });
  }

  _fireConfigChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
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
    "Карточка для интеграции Laundry Monitor: состояние цикла, статусы (стирка/отжим/завершено), длительность, ток и мощность, трекинг белья и сворачиваемая диагностика.",
  preview: false,
});
