# Моя Ферма — Telegram Mini App v11 Hitboxes Bugfix

Эта версия объединяет:
- наш визуальный дизайн экранов через JPG-ассеты;
- исправление iPhone/Safari высоты из v9;
- нормальную структуру файлов.

Структура:
- index.html
- styles.css
- app.js
- assets/
  - home.jpg
  - fields.jpg
  - market.jpg
  - orders.jpg
  - research.jpg
  - coop1.jpg
  - coop2.jpg
  - coop3.jpg
  - coop4.jpg
  - pigsty1.jpg
  - sheepfold1.jpg
  - cowbarn1.jpg
  - fallback.svg

## Как залить

Загружать нужно содержимое архива в корень GitHub Pages:

index.html
styles.css
app.js
assets/

После загрузки открыть с параметром:
?v=10


## v11 fixes

- Fixed invisible button zones: they now match the full art coordinate system.
- Changed screen image from `object-fit: cover` to `object-fit: fill` so iPhone/Safari does not crop the art and shift hitboxes.
- Removed duplicate visible HUD chips over the baked-in design.
- Added debug hitbox mode in Settings/Menu.
- Reworked hit zones for home cards, fields, market, orders, animal screens and bottom navigation.
- Reduced modal recursion / stale render bugs.
- Kept v9 iOS height fix.

Open after upload:
`https://xx9r4n24yr-ctrl.github.io/?v=11`
