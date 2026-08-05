# Laundry Monitor Card

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
опциональные (ток, энергия, протечка, трекинг белья) при отсутствии просто
скрываются. Полный пример — в [`example-config.yaml`](example-config.yaml).

```yaml
type: custom:laundry-monitor-card
title: Стиралка
cycle_state_entity: sensor.stiralka_cycle_state
running_entity: binary_sensor.stiralka_running
final_spin_entity: binary_sensor.stiralka_final_spin_detected
finished_entity: binary_sensor.stiralka_finished
power_entity: sensor.stiralka_current_power
current_entity: sensor.kukhnia_stiralka_current_draw
```

### Поведение блоков

- **Трекинг белья** (строка «Бельё в машине» + кнопка «Бельё выгружено»)
  отображается только когда соответствующие сущности доступны. Если трекинг в
  интеграции выключен и сущности `unavailable` — блок скрыт.
- **Протечка** показывается как красный бейдж в шапке только при срабатывании.
- **Диагностика** свёрнута по умолчанию; раскрывается по клику. Внутри — секции
  «Активность», «Финальный отжим», «Завершение цикла», «Переходы состояния».
- Клик по строке или чипу открывает стандартное окно `more-info` сущности.

## Совместимость

Разработано для интеграции Laundry Monitor. Идентификаторы сущностей по умолчанию
соответствуют типовой установке; при необходимости укажите свои в редакторе.
