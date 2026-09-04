# Laundry Monitor Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
![License](https://img.shields.io/github/license/undel-gh/HA-Laundry-Monitor)

A single Lovelace card for integrating **[Laundry Monitor](https://github.com/undel-gh/HA-Laundry-Monitor)**
into Home Assistant: wash cycle status, statuses (wash/final spin/
complete), cycle duration, current and power consumption, laundry tracking with a
"Laundry unloaded" button, and a collapsible diagnostics block—all on one card.

Example of a collapsed view:

<img width="412" height="157" alt="image" src="https://github.com/user-attachments/assets/6eb8e0df-bd03-423c-90e9-2bf75736fca6" />

Example of a view with expanded diagnostics:

<img width="406" height="691" alt="image" src="https://github.com/user-attachments/assets/7375d7a8-9aa1-42eb-809f-a429eb71ce1c" />

Example of a view with laundry unloading tracking:

<img width="412" height="205" alt="image" src="https://github.com/user-attachments/assets/e0486bc9-c567-4bc3-9bae-fa7b798f2917" />

The card doesn't require assembly: it's a pure Custom Element with no external dependencies
(except for the built-in `ha-card` / `ha-icon` / `ha-entity-picker` from Home Assistant itself).
No button-card, Mushroom, or card-mod are needed.

## Translation Support

The card follows the Home Assistant interface language:

- the cycle state value is displayed via `hass.formatEntityState()` —
"Ready / Washing / Final Spin..." or "Armed / Running / Final Spin..."
depending on the language (the translations are provided by the integration itself);
- string labels are taken from the `friendly_name` of the entities, meaning they are also translated;
- Custom card labels (section titles, "Laundry Unloaded") are taken from the
built-in `ru`/`en` dictionary for `hass.language`.

Nothing is hardcoded—when changing the HA language, the card switches automatically.

## Installation

### Manual
1. Copy `Laundry-Monitor-Card.js` to `config/www/Laundry-Monitor-Card.js`.
2. Settings → Panels → Resources → Add resource:
- URL: `/local/Laundry-Monitor-Card.js`
- Resource type: JavaScript module

### Via HACS (custom repository)
1. HACS → Frontend → menu (⋮) → Custom repositories.
2. Add the repository URL, category **Lovelace**.
3. Install the `Laundry Monitor Card`; the resource will be connected automatically.

## Configuration

The card can be configured using the visual editor (the "Edit" button on the card)
or in YAML. The minimum required entities are cycle state, status, and power;
optional entities (current, energy, leakage, laundry tracking, and electrical/hybrid
diagnostics) are simply hidden if missing. A full example is in
[`example-config.yaml`](example-config.yaml).

New cards do not assume any entity IDs. Select the entities that belong to your
Laundry Monitor device in the visual editor or configure them explicitly in YAML.
The visual editor follows the Home Assistant interface language (English/Russian).

The card and its visual editor use isolated Shadow DOM styles. User-provided icon
configuration is applied as an element attribute rather than interpolated into HTML.
Diagnostics update dynamically when configured entities appear or disappear.
```yaml
type: custom:laundry-monitor-card
title: Washing Machine
cycle_state_entity: sensor.washing_machine_cycle_state
running_entity: binary_sensor.washing_machine_running
final_spin_entity: binary_sensor.washing_machine_final_spin_detected
finished_entity: binary_sensor.washing_machine_finished
power_entity: sensor.washing_machine_current_power
current_entity: sensor.washing_machine_current_draw
```

### Block Behavior

- **Laundry Tracking** (row "Laundry in machine" + button "Laundry unloaded")
is displayed only when the corresponding entities are available. If tracking is disabled in the
integration and the entity is 'unavailable', the block is hidden.
- **Leak** is shown as a red badge in the header only when triggered.
- **Diagnostics** is collapsed by default; expands on click. It can contain
  "Activity," "Final Spin," "Electrical / hybrid," "Timing & power," "Laundry,"
  "Cycle Completion," and "State Transitions" sections.
- Electrical/hybrid diagnostic entities are disabled by default by the Laundry Monitor
  integration. Enable the desired entities in Home Assistant and select them in the card
  editor before expecting those rows to appear.
- Clicking on a row or chip opens the standard `more-info` window for the entity.

## Compatibility

Designed for Laundry Monitor integration. Default entity IDs
correspond to a typical installation; if necessary, enter your own in the editor.

# Карточка Laundry Monitor

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
![License](https://img.shields.io/github/license/undel-gh/HA-Laundry-Monitor)

Единая Lovelace-карточка для интеграции **[Laundry Monitor](https://github.com/undel-gh/HA-Laundry-Monitor)**
в Home Assistant: состояние цикла стирки, статусы (стирка / финальный отжим /
завершено), длительность цикла, потребляемый ток и мощность, трекинг белья с
кнопкой «Бельё выгружено» и сворачиваемый блок диагностики — всё на одной карточке.

Пример свернутого вида:

<img width="412" height="157" alt="image" src="https://github.com/user-attachments/assets/6eb8e0df-bd03-423c-90e9-2bf75736fca6" />

Пример вида с развернутой диагностикой:

<img width="406" height="691" alt="image" src="https://github.com/user-attachments/assets/7375d7a8-9aa1-42eb-809f-a429eb71ce1c" />

Пример вида с трекингом выгрузки белья:

<img width="412" height="205" alt="image" src="https://github.com/user-attachments/assets/e0486bc9-c567-4bc3-9bae-fa7b798f2917" />


Карточка не требует сборки: чистый Custom Element без внешних зависимостей
(кроме встроенных `ha-card` / `ha-icon` / `ha-entity-picker` из самого Home Assistant).
Не нужны ни button-card, ни Mushroom, ни card-mod.

## Поддержка переводов

Карточка следует языку интерфейса Home Assistant:

- значение состояния цикла отображается через `hass.formatEntityState()` —
  «Готовность / Стирка / Финальный отжим …» или «Armed / Running / Final spin …»
  в зависимости от языка (переводы поставляет сама интеграция);
- подписи строк берутся из `friendly_name` сущностей, то есть тоже переведены;
- собственные подписи карточки (заголовки секций, «Бельё выгружено») берутся из
  встроенного словаря `ru`/`en` по `hass.language`.

Ничего не захардкожено — при смене языка HA карточка переключается сама.

## Установка

### Вручную
1. Скопируйте `Laundry-Monitor-Card.js` в `config/www/Laundry-Monitor-Card.js`.
2. Настройки → Панели → Ресурсы → Добавить ресурс:
   - URL: `/local/Laundry-Monitor-Card.js`
   - Тип ресурса: JavaScript-модуль

### Через HACS (кастомный репозиторий)
1. HACS → Frontend → меню (⋮) → Custom repositories.
2. Добавьте URL репозитория, категория **Lovelace**.
3. Установите `Laundry Monitor Card`, ресурс подключится автоматически.

## Конфигурация

Карточку можно настроить визуальным редактором (кнопка «Изменить» на карточке)
или в YAML. Минимально нужны сущности состояния цикла, статусов и мощности;
опциональные (ток, энергия, протечка, трекинг белья и electrical/hybrid
diagnostics) при отсутствии просто скрываются. Полный пример —
в [`example-config.yaml`](example-config.yaml).

Новые карточки не предполагают никаких заранее заданных entity ID. Выберите
сущности своего устройства Laundry Monitor в визуальном редакторе или задайте
их явно в YAML. Язык визуального редактора следует языку интерфейса Home Assistant.

Стили карточки и визуального редактора изолированы через Shadow DOM. Пользовательская
настройка иконки назначается как атрибут элемента и не подставляется в HTML.
Диагностические строки динамически обновляются при появлении или исчезновении
настроенных сущностей.
```yaml
type: custom:laundry-monitor-card
title: Стиралка
cycle_state_entity: sensor.stiralka_cycle_state
running_entity: binary_sensor.stiralka_running
final_spin_entity: binary_sensor.stiralka_final_spin_detected
finished_entity: binary_sensor.stiralka_finished
power_entity: sensor.stiralka_current_power
current_entity: sensor.stiralka_current_draw
```

### Поведение блоков

- **Трекинг белья** (строка «Бельё в машине» + кнопка «Бельё выгружено»)
  отображается только когда соответствующие сущности доступны. Если трекинг в
  интеграции выключен и сущности `unavailable` — блок скрыт.
- **Протечка** показывается как красный бейдж в шапке только при срабатывании.
- **Диагностика** свёрнута по умолчанию; раскрывается по клику. Внутри — секции
  «Активность», «Финальный отжим», «Электрика / hybrid»,
  «Длительность и питание», «Бельё», «Завершение цикла» и
  «Переходы состояния».
- Диагностические сущности electrical/hybrid по умолчанию отключены самой
  интеграцией Laundry Monitor. Сначала включите нужные сущности в Home Assistant,
  затем выберите их в редакторе карточки.
- Клик по строке или чипу открывает стандартное окно `more-info` сущности.

## Совместимость

Разработано для интеграции Laundry Monitor. Идентификаторы сущностей по умолчанию
соответствуют типовой установке; при необходимости укажите свои в редакторе.
