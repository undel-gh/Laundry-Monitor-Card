"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "Laundry-Monitor-Card.js"),
  "utf8"
);

function setup() {
  const elements = new Map();
  const timers = new Map();
  let nextTimerId = 0;
  let now = Date.parse("2026-11-12T14:00:00Z");
  class Element {
    constructor() {
      this.isConnected = true;
      this.attachShadow = () => ({});
    }
  }
  class ClockDate extends Date {
    static now() {
      return now;
    }
  }
  const context = {
    HTMLElement: Element,
    Date: ClockDate,
    window: {},
    console: { info() {}, error() {} },
    customElements: {
      get(tag) { return elements.get(tag); },
      define(tag, klass) { elements.set(tag, klass); },
    },
    setInterval(fn, ms) {
      assert.equal(ms, 1000);
      const id = ++nextTimerId;
      timers.set(id, fn);
      return id;
    },
    clearInterval(id) {
      timers.delete(id);
    },
  };
  vm.runInNewContext(source, context, { filename: "Laundry-Monitor-Card.js" });
  const Card = elements.get("laundry-monitor-card");
  const card = new Card();
  card._config = {
    cycle_state_entity: "sensor.cycle_state",
    cycle_started_at_entity: "sensor.started_at",
    current_cycle_duration_entity: "sensor.current_duration",
    last_cycle_duration_entity: "sensor.last_duration",
    running_entity: "binary_sensor.running",
    final_spin_entity: "binary_sensor.final_spin",
  };
  card._hass = {
    states: {},
    formatEntityState(state) { return state.state; },
  };
  card._els = {
    durVal: { textContent: "—" },
    durMetric: { hidden: false },
  };
  card._durationStartedAtMs = null;
  const state = (entityId, value, attrs = {}) => {
    card._hass.states[entityId] = { state: value, attributes: attrs };
  };
  const tick = () => {
    for (const fn of [...timers.values()]) fn();
  };
  return {
    card,
    Editor: elements.get("laundry-monitor-card-editor"),
    timers,
    state,
    tick,
    setNow(value) { now = Date.parse(value); },
  };
}

test("live clock updates locally without HA state writes or extra timers", () => {
  const s = setup();
  s.state("sensor.cycle_state", "running");
  s.state("sensor.started_at", "2026-11-12T16:59:50+03:00");
  s.state("sensor.current_duration", "7", { unit_of_measurement: "s" });
  s.state("sensor.last_duration", "7200", { unit_of_measurement: "s" });
  s.card._updateDuration();
  assert.equal(s.card._els.durVal.textContent, "0:10");
  assert.equal(s.timers.size, 1);
  s.setNow("2026-11-12T14:00:53Z");
  s.tick();
  assert.equal(s.card._els.durVal.textContent, "1:03");
  // Unrelated HA updates must not allocate a new interval.
  s.card._updateDuration();
  assert.equal(s.timers.size, 1);
  s.setNow("2026-11-12T15:00:00Z");
  s.tick();
  assert.equal(s.card._els.durVal.textContent, "1:00:10");
});

test("final spin continues the same clock and finish shows last duration", () => {
  const s = setup();
  s.state("sensor.cycle_state", "running");
  s.state("sensor.started_at", "2026-11-12T13:59:00Z");
  s.card._updateDuration();
  assert.equal(s.card._els.durVal.textContent, "1:00");
  s.state("sensor.cycle_state", "final_spin");
  s.setNow("2026-11-12T14:02:00Z");
  s.card._updateDuration();
  assert.equal(s.card._els.durVal.textContent, "3:00");
  assert.equal(s.timers.size, 1);
  s.state("sensor.cycle_state", "finished");
  s.state("sensor.started_at", "unknown");
  s.state("sensor.last_duration", "195", { unit_of_measurement: "s" });
  s.card._updateDuration();
  assert.equal(s.timers.size, 0);
  assert.equal(s.card._els.durVal.textContent, "3:15");
  s.setNow("2026-11-12T15:00:00Z");
  s.tick();
  assert.equal(s.card._els.durVal.textContent, "3:15");
});

test("invalid timestamp is not treated as a local date and falls back to snapshot", () => {
  const s = setup();
  s.state("sensor.cycle_state", "running");
  s.state("sensor.current_duration", "24", { unit_of_measurement: "s" });
  s.state("sensor.last_duration", "3600", { unit_of_measurement: "s" });
  for (const value of ["2026-11-12T14:00:00", "unknown", "garbage", "2026-13-12T14:00:00Z"]) {
    s.state("sensor.started_at", value);
    s.card._updateDuration();
    assert.equal(s.card._els.durVal.textContent, "0:24");
    assert.equal(s.timers.size, 0);
  }
  // If legacy duration is disabled, do not display the previous cycle.
  s.state("sensor.current_duration", "unavailable");
  s.card._updateDuration();
  assert.equal(s.card._els.durVal.textContent, "—");
});

test("old configuration has snapshot-only compatibility without a live timer", () => {
  const s = setup();
  s.card._config.cycle_started_at_entity = "";
  s.state("sensor.cycle_state", "running");
  s.state("sensor.current_duration", "12", { unit_of_measurement: "s" });
  s.state("sensor.last_duration", "888", { unit_of_measurement: "s" });
  s.card._updateDuration();
  assert.equal(s.card._els.durVal.textContent, "0:12");
  assert.equal(s.timers.size, 0);
  s.state("sensor.cycle_state", "idle");
  s.card._updateDuration();
  assert.equal(s.card._els.durVal.textContent, "14:48");
});

test("cycle-state enum takes precedence over stale binary flags", () => {
  const s = setup();
  s.state("sensor.cycle_state", "finished");
  s.state("binary_sensor.running", "on");
  s.state("sensor.started_at", "2026-11-12T13:59:00Z");
  s.state("sensor.last_duration", "360", { unit_of_measurement: "s" });
  s.card._updateDuration();
  assert.equal(s.card._els.durVal.textContent, "6:00");
  assert.equal(s.timers.size, 0);
});

test("binary-sensor-only configs are supported when cycle state is missing", () => {
  const s = setup();
  s.card._config.cycle_state_entity = "";
  s.state("binary_sensor.running", "on");
  s.state("sensor.started_at", "2026-11-12T13:59:30Z");
  s.card._updateDuration();
  assert.equal(s.card._els.durVal.textContent, "0:30");
  assert.equal(s.timers.size, 1);
});

test("disconnection and reconnection suspend and restore the local interval", () => {
  const s = setup();
  s.state("sensor.cycle_state", "running");
  s.state("sensor.started_at", "2026-11-12T13:59:00Z");
  s.card._updateDuration();
  assert.equal(s.timers.size, 1);
  s.card.isConnected = false;
  s.card.disconnectedCallback();
  assert.equal(s.timers.size, 0);
  s.setNow("2026-11-12T14:01:00Z");
  s.card.isConnected = true;
  s.card._built = true;
  s.card.connectedCallback();
  assert.equal(s.card._els.durVal.textContent, "2:00");
  assert.equal(s.timers.size, 1);
});

test("reconfiguration clears the previous timer and timestamp", () => {
  const s = setup();
  s.state("sensor.cycle_state", "running");
  s.state("sensor.started_at", "2026-11-12T13:59:00Z");
  s.card._updateDuration();
  assert.equal(s.timers.size, 1);
  s.card._hass = null; // Avoid DOM rendering; assert lifecycle cleanup.
  s.card.setConfig({ cycle_state_entity: "sensor.new_state" });
  assert.equal(s.timers.size, 0);
  assert.equal(s.card._durationStartedAtMs, null);
});

test("metric hides without configured duration entities", () => {
  const s = setup();
  s.card._config.cycle_started_at_entity = "";
  s.card._config.current_cycle_duration_entity = "";
  s.card._config.last_cycle_duration_entity = "";
  s.state("sensor.cycle_state", "running");
  s.card._updateDuration();
  assert.equal(s.card._els.durMetric.hidden, true);
  assert.equal(s.card._els.durVal.textContent, "—");
  assert.equal(s.timers.size, 0);
});

test("editor exposes timestamp and optional heating diagnostics without duplicate keys", () => {
  const s = setup();
  const editor = new s.Editor();
  editor._hass = { language: "en" };
  const schema = editor._editorSchema();
  const primary = schema.find((section) => section.title === "Primary entities");
  const diagnostics = schema.find((section) => section.title === "Diagnostics");
  assert.ok(primary.schema.some((field) => field.name === "cycle_started_at_entity"));
  assert.ok(diagnostics.schema.some((field) => field.name === "heating_state_entity"));
  assert.ok(diagnostics.schema.some((field) => field.name === "heating_active_entity"));
  const keys = schema.flatMap((section) =>
    (section.schema || []).map((field) => field.name)
  );
  assert.equal(new Set(keys).size, keys.length);
});
