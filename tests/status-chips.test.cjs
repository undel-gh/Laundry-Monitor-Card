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

function fakeElement() {
  const classes = new Set();
  const attributes = new Map();
  return {
    hidden: false,
    textContent: "",
    title: "",
    style: {},
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
      contains(name) { return classes.has(name); },
    },
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name); },
  };
}

function setup() {
  const registered = new Map();
  class Element {
    constructor() {
      this.isConnected = true;
      this.attachShadow = () => ({});
    }
  }
  const context = {
    HTMLElement: Element,
    window: {},
    console: { info() {}, error() {} },
    customElements: {
      get(name) { return registered.get(name); },
      define(name, klass) { registered.set(name, klass); },
    },
  };
  vm.runInNewContext(source, context, { filename: "Laundry-Monitor-Card.js" });
  const card = new (registered.get("laundry-monitor-card"))();
  card._config = {
    cycle_state_entity: "sensor.cycle",
    running_entity: "binary_sensor.running",
    final_spin_entity: "binary_sensor.final_spin",
    finished_entity: "binary_sensor.finished",
    last_cycle_duration_entity: "sensor.last_duration",
  };
  card._hass = {
    language: "en",
    states: {},
    formatEntityState(obj) { return obj.state; },
  };
  card._els = Object.fromEntries(
    [
      "title", "state", "icon", "leakBadge", "leakBadgeText",
      "chipRunning", "chipSpin", "chipFinished",
      "durMetric", "durVal", "ampMetric", "ampVal", "pwrMetric", "pwrVal",
      "tracking", "present", "presentText", "unloadBtn", "unloadBtnText",
      "diagToggleLabel",
    ].map((key) => [key, fakeElement()])
  );
  card._diagSignature = () => "unchanged";
  card._diagSig = "unchanged";
  card._diagRows = [];

  const state = (entityId, value, friendlyName = entityId) => {
    card._hass.states[entityId] = {
      state: value,
      attributes: { friendly_name: friendlyName },
    };
  };
  const indicators = () => {
    card._update();
    return ["chipRunning", "chipSpin", "chipFinished"].map((key) => {
      const chip = card._els[key];
      const active = chip.classList.contains("on");
      assert.equal(chip.getAttribute("aria-pressed"), String(active));
      return active;
    });
  };
  return { card, state, indicators };
}

for (const [phase, expected] of [
  ["idle", [false, false, false]],
  ["armed", [false, false, false]],
  ["running", [true, false, false]],
  ["final_spin", [true, true, false]],
  ["finished", [false, false, true]],
  ["error", [false, false, false]],
]) {
  test(`enum phase ${phase} overrides historical or contradictory binary values`, () => {
    const s = setup();
    s.state("sensor.cycle", phase);
    // Deliberately contradictory binary values: the enum is authoritative.
    s.state("binary_sensor.running", "on");
    s.state("binary_sensor.final_spin", "on");
    s.state("binary_sensor.finished", "on");
    assert.deepEqual(s.indicators(), expected);
    assert.equal(s.card._hass.states["binary_sensor.final_spin"].state, "on");
  });
}

test("latched final-spin sensor is unchanged through finished, idle and next cycle", () => {
  const s = setup();
  s.state("binary_sensor.running", "off");
  s.state("binary_sensor.final_spin", "on", "Final spin detected");
  s.state("binary_sensor.finished", "on");
  s.state("sensor.cycle", "final_spin");
  assert.deepEqual(s.indicators(), [true, true, false]);
  assert.equal(s.card._els.chipSpin.title, "Final spin detected");

  s.state("sensor.cycle", "finished");
  assert.deepEqual(s.indicators(), [false, false, true]);
  s.state("sensor.cycle", "idle");
  assert.deepEqual(s.indicators(), [false, false, false]);
  assert.equal(s.card._hass.states["binary_sensor.final_spin"].state, "on");

  s.state("sensor.cycle", "running");
  s.state("binary_sensor.running", "on");
  s.state("binary_sensor.final_spin", "off");
  s.state("binary_sensor.finished", "off");
  assert.deepEqual(s.indicators(), [true, false, false]);
  s.state("sensor.cycle", "final_spin");
  s.state("binary_sensor.final_spin", "on");
  assert.deepEqual(s.indicators(), [true, true, false]);
});

for (const [running, spin, finished, expected] of [
  ["off", "on", "off", [false, false, false]], // Previous cycle's latched spin.
  ["on", "off", "off", [true, false, false]],
  ["on", "on", "off", [true, true, false]],
  ["off", "on", "on", [false, false, true]],
  ["on", "on", "on", [true, false, true]], // No spin on contradictory finish.
  ["unavailable", "on", "off", [false, false, false]],
]) {
  test(`binary-only fallback: running=${running}, spin=${spin}, finished=${finished}`, () => {
    const s = setup();
    s.card._config.cycle_state_entity = "";
    s.state("binary_sensor.running", running);
    s.state("binary_sensor.final_spin", spin);
    s.state("binary_sensor.finished", finished);
    assert.deepEqual(s.indicators(), expected);
  });
}

for (const stateValue of ["unknown", "unavailable", "", "new_future_value"]) {
  test(`unusable cycle enum (${stateValue || "empty"}) uses conservative binary fallback`, () => {
    const s = setup();
    s.state("sensor.cycle", stateValue);
    s.state("binary_sensor.running", "off");
    s.state("binary_sensor.final_spin", "on");
    s.state("binary_sensor.finished", "off");
    assert.deepEqual(s.indicators(), [false, false, false]);
    s.state("binary_sensor.running", "on");
    assert.deepEqual(s.indicators(), [true, true, false]);
  });
}

test("missing or unavailable spin entity remains safe and does not become a fake chip", () => {
  const s = setup();
  s.state("sensor.cycle", "final_spin");
  s.state("binary_sensor.running", "on");
  s.state("binary_sensor.finished", "off");
  assert.deepEqual(s.indicators(), [true, false, false]);
  assert.equal(s.card._els.chipSpin.hidden, true);

  s.state("binary_sensor.final_spin", "unavailable");
  assert.deepEqual(s.indicators(), [true, true, false]);
  assert.equal(s.card._els.chipSpin.hidden, false);
  // The current-phase enum wins even if the evidence sensor is unavailable.
});
