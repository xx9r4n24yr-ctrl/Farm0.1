(() => {
  'use strict';

  const $ = (q) => document.querySelector(q);
  const game = $('#game');
  const hitLayer = $('#hitLayer');
  const overlay = $('#modalOverlay');
  const modal = $('#modal');
  const modalTitle = $('#modalTitle');
  const modalBody = $('#modalBody');
  const closeBtn = $('#modalClose');
  const toastEl = $('#toast');

  const STORE_KEY = 'my-farm-miniapp-v4-animals-update';
  const screens = ['home', 'coop', 'pigsty', 'sheepfold', 'cowbarn', 'fields', 'market', 'orders', 'research'];

  const defaults = {
    screen: 'home',
    coins: 12450,
    gems: 320,
    energy: 78,
    level: 12,
    eggs: 18,
    milk: 120,
    wool: 9,
    meat: 4,
    wheat: 120,
    corn: 90,
    carrot: 110,
    pumpkin: 80,
    sourCream: 1,
    cottageCheese: 1,
    cheese: 1,
    chickens: 12,
    coopLevel: 3,
    coopCapacity: 12,
    pigs: 1,
    pigstyLevel: 1,
    pigstyCapacity: 1,
    sheep: 1,
    sheepfoldLevel: 1,
    sheepfoldCapacity: 1,
    cows: 1,
    cowbarnLevel: 1,
    cowbarnCapacity: 1,
    ordersDone: 1,
    research: { harvest: 2, crops: 2, energy: 1, storage: 2 },
    dailyLast: '',
    streak: 0,
    soldToday: 312,
    incomeToday: 4.68,
    tasks: { harvest: false, eggs: false, sell: false, order: false }
  };

  const prices = {
    eggs: 0.007, milk: 0.010, wool: 0.009, meat: 0.015,
    sourCream: 0.018, cottageCheese: 0.020, cheese: 0.025,
    wheat: 120, corn: 90, carrot: 110, pumpkin: 80
  };

  const productNames = {
    eggs: 'Яйцо', milk: 'Молоко', wool: 'Шерсть', meat: 'Мясо',
    sourCream: 'Сметана', cottageCheese: 'Творог', cheese: 'Сыр',
    wheat: 'Пшеница', corn: 'Кукуруза', carrot: 'Морковь', pumpkin: 'Тыква'
  };

  const icon = {
    coins: '🪙', gems: '💎', energy: '⚡', eggs: '🥚', milk: '🥛', wool: '🧶', meat: '🥩',
    sourCream: '🥣', cottageCheese: '🍚', cheese: '🧀', wheat: '🌾', corn: '🌽', carrot: '🥕', pumpkin: '🎃',
    chicken: '🐔', cow: '🐄', pig: '🐷', sheep: '🐑', shop: '🏪', friends: '👥', mail: '✉️', settings: '⚙️',
    task: '📋', gift: '🎁', trophy: '🏆', research: '🧪', truck: '🚚'
  };

  let state = load();
  let toastTimer = null;

  initTelegram();
  bindBaseEvents();
  setScreen(state.screen || 'home', false);

  function initTelegram() {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0b8fd9');
      tg.setBackgroundColor('#0b693c');
      if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes();
      if (typeof tg.requestFullscreen === 'function') tg.requestFullscreen();
    } catch (err) {
      console.warn('Telegram init warning:', err);
    }
  }

  function bindBaseEvents() {
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    document.addEventListener('touchmove', (e) => {
      if (!e.target.closest('.modal')) e.preventDefault();
    }, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return structuredClone(defaults);
      return deepMerge(structuredClone(defaults), JSON.parse(raw));
    } catch (_) {
      return structuredClone(defaults);
    }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function deepMerge(base, add) {
    for (const [k, v] of Object.entries(add || {})) {
      if (v && typeof v === 'object' && !Array.isArray(v)) base[k] = deepMerge(base[k] || {}, v);
      else base[k] = v;
    }
    return base;
  }

  function fmt(n, fraction = 0) {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: fraction, minimumFractionDigits: fraction }).format(n);
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  function setScreen(name, notice = true) {
    if (!screens.includes(name)) name = 'home';
    state.screen = name;
    screens.forEach((s) => game.classList.toggle('screen-' + s, s === name));
    game.dataset.screen = name;
    renderHits();
    save();
    if (notice) toast(screenLabel(name));
  }

  function screenLabel(name) {
    return {
      home: 'Главная ферма', coop: 'Курятник', pigsty: 'Свинарник', sheepfold: 'Овчарня', cowbarn: 'Коровник', fields: 'Поля', market: 'Рынок', orders: 'Заказы', research: 'Исследования'
    }[name] || 'Экран открыт';
  }

  function renderHits() {
    hitLayer.innerHTML = '';
    const list = zonesFor(state.screen);
    list.forEach((z) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hit';
      b.style.left = z.x + '%';
      b.style.top = z.y + '%';
      b.style.width = z.w + '%';
      b.style.height = z.h + '%';
      b.setAttribute('aria-label', z.label);
      b.addEventListener('click', z.action);
      hitLayer.appendChild(b);
    });
  }

  function zonesFor(screen) {
    const bottom = bottomZones();
    const top = topZones();
    if (screen === 'home') return [
      ...top,
      z('Квесты', 2, 12, 15, 10, showQuests),
      z('Бонусы', 82, 12, 16, 10, showDaily),
      z('Животные', 5, 58.8, 27, 13.7, showAnimals),
      z('Поля', 36.5, 58.8, 27, 13.7, () => setScreen('fields')),
      z('Рынок', 68.4, 58.8, 27, 13.7, () => setScreen('market')),
      z('Заказы', 5, 74, 27, 13.7, () => setScreen('orders')),
      z('Исследования', 36.5, 74, 27, 13.7, () => setScreen('research')),
      z('Достижения', 68.4, 74, 27, 13.7, showAchievements),
      ...bottom
    ];

    if (screen === 'coop') return [
      ...top,
      z('Назад', 1.5, 9, 10, 6, () => setScreen('home')),
      z('Улучшить курятник', 2.5, 81.8, 32, 6, upgradeCoop),
      z('Купить курицу', 36.5, 81.8, 28, 6, buyChicken),
      z('Собрать яйца', 66.8, 81.8, 30, 6, collectEggs),
      z('Ферма', 0, 91.2, 20, 8.8, () => setScreen('home')),
      z('Курятник', 20, 91.2, 20, 8.8, () => toast('Курятник уже открыт')),
      z('Свинарник', 40, 91.2, 20, 8.8, () => setScreen('pigsty')),
      z('Овчарня', 60, 91.2, 20, 8.8, () => setScreen('sheepfold')),
      z('Коровник', 80, 91.2, 20, 8.8, () => setScreen('cowbarn')),
    ];

    if (screen === 'pigsty') return animalBuildingZones('pigsty');
    if (screen === 'sheepfold') return animalBuildingZones('sheepfold');
    if (screen === 'cowbarn') return animalBuildingZones('cowbarn');

    if (screen === 'fields') return [
      ...top,
      z('Собрать всё', 55, 62.5, 39, 8, collectFields),
      z('Участок 1', 5, 75, 27, 12, () => plantPlot(1)),
      z('Участок 2', 36.5, 75, 27, 12, () => toast('Участок ещё растёт: 01:28:30')),
      z('Участок 3', 68.2, 75, 27, 12, collectFields),
      ...bottom
    ];

    if (screen === 'market') return [
      ...top,
      z('Продать яйца', 52, 39.5, 17, 5.5, () => sell('eggs')),
      z('Продать молоко', 52, 48.4, 17, 5.5, () => sell('milk')),
      z('Продать шерсть', 52, 57.1, 17, 5.5, () => sell('wool')),
      z('Продать мясо', 52, 65.7, 17, 5.5, () => sell('meat')),
      z('Продать сметану', 52, 74.4, 17, 5.5, () => sell('sourCream')),
      z('Продать творог', 52, 83.0, 17, 5.2, () => sell('cottageCheese')),
      z('Мои склады', 16, 88.3, 45, 5.4, showStorage),
      ...bottom
    ];

    if (screen === 'orders') return [
      ...top,
      z('Заказ Деда Захара', 73, 43.5, 22, 6, () => sendOrder(0)),
      z('Заказ Марии', 73, 57.2, 22, 6, () => sendOrder(1)),
      z('Заказ Семена', 73, 70.8, 22, 6, () => sendOrder(2)),
      z('Заказ Пети', 73, 84.2, 22, 6, () => sendOrder(3)),
      z('Обновить заказы', 27, 89.5, 50, 5.2, () => toast('Заказы обновлены')),
      ...bottom
    ];

    if (screen === 'research') return [
      ...top,
      z('Квесты', 2, 12, 15, 10, showQuests),
      z('Бонусы', 82, 12, 16, 10, showDaily),
      z('Изучить ускорение сбора', 74, 43.2, 22, 6, () => study('harvest')),
      z('Изучить новые культуры', 74, 56.8, 22, 6, () => study('crops')),
      z('Изучить энергию', 74, 70.4, 22, 6, () => study('energy')),
      z('Изучить склад', 74, 83.8, 22, 6, () => study('storage')),
      z('Все улучшения', 25, 88.7, 55, 5.5, showResearchList),
      ...bottom
    ];
    return [...top, ...bottom];
  }

  function z(label, x, y, w, h, action) { return { label, x, y, w, h, action }; }

  function animalBuildingZones(type) {
    const title = { pigsty: 'Свинарник', sheepfold: 'Овчарня', cowbarn: 'Коровник' }[type];
    return [
      ...topZones(),
      z('Назад', 1.5, 9, 10, 6, () => setScreen('home')),
      z('Улучшить ' + title, 4, 79, 28, 7, () => upgradeAnimal(type)),
      z('Купить животное', 36, 79, 29, 7, () => buyAnimal(type)),
      z('Собрать продукцию', 67, 79, 30, 7, () => collectAnimal(type)),
      z('Ферма', 0, 91.2, 20, 8.8, () => setScreen('home')),
      z('Курятник', 20, 91.2, 20, 8.8, () => setScreen('coop')),
      z('Свинарник', 40, 91.2, 20, 8.8, () => type === 'pigsty' ? toast('Свинарник уже открыт') : setScreen('pigsty')),
      z('Овчарня', 60, 91.2, 20, 8.8, () => type === 'sheepfold' ? toast('Овчарня уже открыта') : setScreen('sheepfold')),
      z('Коровник', 80, 91.2, 20, 8.8, () => type === 'cowbarn' ? toast('Коровник уже открыт') : setScreen('cowbarn')),
    ];
  }


  function topZones() {
    return [
      z('Профиль', 0, 0, 15, 8, showProfile),
      z('Монеты', 15, 0, 24, 7, () => showShop('coins')),
      z('Алмазы', 40, 0, 24, 7, () => showShop('gems')),
      z('Энергия', 65, 0, 21, 7, buyEnergy),
      z('Меню', 91, 0, 9, 7, showMenu),
    ];
  }

  function bottomZones() {
    return [
      z('Магазин', 0, 91, 20, 9, showShop),
      z('Друзья', 20, 91, 20, 9, showFriends),
      z('Задания', 40, 91, 20, 9, showQuests),
      z('Почта', 60, 91, 20, 9, showMail),
      z('Настройки', 80, 91, 20, 9, showSettings),
    ];
  }

  function toast(message) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    overlay.hidden = false;
    modalBody.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        const fn = actions[el.dataset.action];
        if (fn) fn(el.dataset);
      });
    });
  }

  function closeModal() { overlay.hidden = true; modalBody.innerHTML = ''; }

  const actions = {
    screen: (d) => { closeModal(); setScreen(d.screen); },
    collectFields: () => { closeModal(); collectFields(); },
    collectEggs: () => { closeModal(); collectEggs(); },
    sell: (d) => sell(d.item),
    buyEnergy: buyEnergy,
    buyChicken: buyChicken,
    upgradeCoop: upgradeCoop,
    daily: claimDaily,
    study: (d) => study(d.item),
    reset: resetGame
  };

  function resourceLine() {
    return `<div class="resource-line">
      <div class="resource">🪙 ${fmt(state.coins)}</div>
      <div class="resource">💎 ${fmt(state.gems)}</div>
      <div class="resource">⚡ ${state.energy}/100</div>
    </div>`;
  }

  function showProfile() {
    openModal('Профиль игрока', `${resourceLine()}
      <div class="card"><div class="name">Моя ферма · Уровень ${state.level}</div><div class="sub">Игровой прогресс сохранён на устройстве через localStorage.</div></div>
      <div class="grid">
        <div class="card"><div class="name">${state.chickens}/${state.coopCapacity}</div><div class="sub">куриц</div></div>
        <div class="card"><div class="name">${fmt(state.soldToday)}</div><div class="sub">продано сегодня</div></div>
        <div class="card"><div class="name">${state.ordersDone}/3</div><div class="sub">заказов до бонуса</div></div>
        <div class="card"><div class="name">${state.streak}</div><div class="sub">дней серии бонусов</div></div>
      </div>
      <button class="btn gold" data-action="reset">Сбросить тестовый прогресс</button>`);
  }

  function showMenu() {
    openModal('Меню', `${resourceLine()}
      <div class="grid">
        <button class="btn" data-action="screen" data-screen="home">Ферма</button>
        <button class="btn" data-action="screen" data-screen="fields">Поля</button>
        <button class="btn" data-action="screen" data-screen="market">Рынок</button>
        <button class="btn" data-action="screen" data-screen="orders">Заказы</button>
        <button class="btn" data-action="screen" data-screen="research">Исследования</button>
        <button class="btn" data-action="screen" data-screen="coop">Курятник</button>
        <button class="btn" data-action="screen" data-screen="pigsty">Свинарник</button>
        <button class="btn" data-action="screen" data-screen="sheepfold">Овчарня</button>
        <button class="btn" data-action="screen" data-screen="cowbarn">Коровник</button>
      </div>`);
  }

  function showAnimals() {
    openModal('Животные', `${resourceLine()}
      <div class="animal"><div class="item-left"><span class="ico">🐔</span><div><div class="name">Курятник</div><div class="sub">${state.chickens}/${state.coopCapacity} куриц · яйца каждые 12ч</div></div></div><button class="btn small" data-action="screen" data-screen="coop">Открыть</button></div>
      <div class="animal"><div class="item-left"><span class="ico">🐷</span><div><div class="name">Свинарник</div><div class="sub">${state.pigs}/${state.pigstyCapacity} свиней · мясо каждые 24ч</div></div></div><button class="btn small" data-action="screen" data-screen="pigsty">Открыть</button></div>
      <div class="animal"><div class="item-left"><span class="ico">🐑</span><div><div class="name">Овчарня</div><div class="sub">${state.sheep}/${state.sheepfoldCapacity} овец · шерсть каждые 18ч</div></div></div><button class="btn small" data-action="screen" data-screen="sheepfold">Открыть</button></div>
      <div class="animal"><div class="item-left"><span class="ico">🐄</span><div><div class="name">Коровник</div><div class="sub">${state.cows}/${state.cowbarnCapacity} коров · молоко каждые 12ч</div></div></div><button class="btn small" data-action="screen" data-screen="cowbarn">Открыть</button></div>`);
  }

  function showAnimalBuilding(title, animalIcon) {
    openModal(title, `${resourceLine()}
      <div class="card" style="text-align:center"><div style="font-size:72px">${animalIcon}</div><div class="name">Экран «${title}» будет собран следующим</div><div class="sub">Стиль уже совпадает: кремовые карточки, зелёные кнопки, фермерская графика.</div></div>`);
  }

  function showQuests() {
    const tasks = [
      ['harvest', 'Собери урожай', 'Награда: 150 монет'],
      ['eggs', 'Собери яйца в курятнике', 'Награда: 120 монет'],
      ['sell', 'Продай товар на рынке', 'Награда: 180 монет'],
      ['order', 'Отправь заказ', 'Награда: 250 монет'],
    ];
    openModal('Задания', `${resourceLine()}${tasks.map(([k, n, s]) => `
      <div class="task"><div class="item-left"><span class="ico">${state.tasks[k] ? '✅' : '📋'}</span><div><div class="name">${n}</div><div class="sub">${s}</div></div></div><span class="badge">${state.tasks[k] ? 'OK' : '!'}</span></div>`).join('')}`);
  }

  function showDaily() {
    const claimed = state.dailyLast === today();
    openModal('Ежедневный бонус', `${resourceLine()}
      <div class="bonus" style="text-align:center">
        <div style="font-size:62px">🎁</div>
        <div class="name">День ${state.streak + (claimed ? 0 : 1)}</div>
        <div class="sub">Награда: ${claimed ? 'уже забрана сегодня' : '250 монет + 5 алмазов'}</div>
        <div class="progress" style="margin:12px 0"><i style="width:${Math.min(100, (state.streak % 7) * 14 + 14)}%"></i></div>
        <button class="btn" ${claimed ? 'disabled style="filter:grayscale(1);opacity:.65"' : 'data-action="daily"'}>${claimed ? 'Забрано' : 'Забрать'}</button>
      </div>`);
  }

  function showAchievements() {
    openModal('Достижения', `${resourceLine()}
      <div class="grid">
        <div class="card"><div class="name">🏆 Первый урожай</div><div class="sub">Собрать поля один раз</div></div>
        <div class="card"><div class="name">🥚 Яичный магнат</div><div class="sub">Собрать 100 яиц</div></div>
        <div class="card"><div class="name">🚚 Доставщик</div><div class="sub">Отправить 10 заказов</div></div>
        <div class="card"><div class="name">🧪 Учёный фермер</div><div class="sub">Изучить 5 улучшений</div></div>
      </div>`);
  }

  function showFriends() {
    openModal('Друзья', `${resourceLine()}
      <div class="card"><div class="name">Приглашай друзей</div><div class="sub">За каждого активного друга: 100 монет.</div></div>
      <button class="btn">Пригласить друга</button>`);
  }

  function showMail() {
    openModal('Почта', `${resourceLine()}
      <div class="row"><div class="item-left"><span class="ico">✉️</span><div><div class="name">Добро пожаловать!</div><div class="sub">Ферма готова к тесту в Telegram Mini App.</div></div></div></div>
      <div class="row"><div class="item-left"><span class="ico">🎁</span><div><div class="name">Подарок за вход</div><div class="sub">Открой ежедневный бонус.</div></div></div></div>`);
  }

  function showSettings() {
    openModal('Настройки', `${resourceLine()}
      <div class="row"><div class="item-left"><span class="ico">🔊</span><div><div class="name">Звук</div><div class="sub">Включён</div></div></div><button class="btn small">OK</button></div>
      <div class="row"><div class="item-left"><span class="ico">📳</span><div><div class="name">Вибрация</div><div class="sub">Включена</div></div></div><button class="btn small">OK</button></div>
      <div class="note">В Telegram Mini App включена защита от свайпа вниз: <b>disableVerticalSwipes()</b>.</div>`);
  }

  function showShop() {
    openModal('Магазин', `${resourceLine()}
      <div class="shop-item"><div class="item-left"><span class="ico">⚡</span><div><div class="name">+25 энергии</div><div class="sub">Цена: 50 монет</div></div></div><button class="btn small" data-action="buyEnergy">Купить</button></div>
      <div class="shop-item"><div class="item-left"><span class="ico">🐔</span><div><div class="name">Курица</div><div class="sub">Цена: 100 монет</div></div></div><button class="btn small" data-action="buyChicken">Купить</button></div>
      <div class="shop-item"><div class="item-left"><span class="ico">🐷</span><div><div class="name">Свинья</div><div class="sub">Цена: 300 монет</div></div></div><button class="btn small" onclick="window.__farmBuyAnimal && window.__farmBuyAnimal('pigsty')">Купить</button></div>
      <div class="shop-item"><div class="item-left"><span class="ico">🐑</span><div><div class="name">Овца</div><div class="sub">Цена: 250 монет</div></div></div><button class="btn small" onclick="window.__farmBuyAnimal && window.__farmBuyAnimal('sheepfold')">Купить</button></div>
      <div class="shop-item"><div class="item-left"><span class="ico">🐄</span><div><div class="name">Корова</div><div class="sub">Цена: 500 монет</div></div></div><button class="btn small" onclick="window.__farmBuyAnimal && window.__farmBuyAnimal('cowbarn')">Купить</button></div>
      <div class="shop-item"><div class="item-left"><span class="ico">🧪</span><div><div class="name">Исследование</div><div class="sub">Открывает улучшения фермы</div></div></div><button class="btn small" data-action="screen" data-screen="research">Открыть</button></div>`);
  }

  function showStorage() {
    const keys = ['eggs', 'milk', 'wool', 'meat', 'sourCream', 'cottageCheese', 'cheese', 'wheat', 'corn', 'carrot', 'pumpkin'];
    openModal('Мои склады', `${resourceLine()}${keys.map(k => `
      <div class="row"><div class="item-left"><span class="ico">${icon[k]}</span><div><div class="name">${productNames[k]}</div><div class="sub">На складе: ${fmt(state[k] || 0)}</div></div></div><button class="btn small" data-action="sell" data-item="${k}">Продать</button></div>`).join('')}`);
  }

  function showResearchList() {
    openModal('Все улучшения', `${resourceLine()}
      ${researchRow('harvest', '⏱️', 'Ускорение сбора', 'Сбор урожая происходит быстрее')}
      ${researchRow('crops', '🌽', 'Новые культуры', 'Открывает новые культуры')}
      ${researchRow('energy', '🔋', 'Больше энергии', 'Увеличивает запас энергии')}
      ${researchRow('storage', '🏚️', 'Склад', 'Увеличивает вместимость склада')}`);
  }

  function researchRow(key, ic, name, sub) {
    const level = state.research[key] || 0;
    return `<div class="row"><div class="item-left"><span class="ico">${ic}</span><div><div class="name">${name} · ${level}/3</div><div class="sub">${sub}</div></div></div><button class="btn small" data-action="study" data-item="${key}">Изучить</button></div>`;
  }

  function buyEnergy() {
    if (state.coins < 50) return toast('Не хватает монет');
    state.coins -= 50;
    state.energy = Math.min(100, state.energy + 25);
    save();
    toast('+25 энергии');
  }

  function claimDaily() {
    if (state.dailyLast === today()) return toast('Бонус уже забран');
    state.dailyLast = today();
    state.streak += 1;
    state.coins += 250;
    state.gems += 5;
    save();
    closeModal();
    toast('Получено: 250 монет и 5 алмазов');
  }

  function collectFields() {
    if (state.energy <= 0) return toast('Не хватает энергии');
    state.energy -= 1;
    state.wheat += 25;
    state.corn += 18;
    state.carrot += 20;
    state.pumpkin += 10;
    state.tasks.harvest = true;
    save();
    toast('Урожай собран: +25 пшеницы, +18 кукурузы');
  }

  function collectEggs() {
    state.eggs += 18;
    state.tasks.eggs = true;
    save();
    toast('Яйца собраны: +18');
  }

  function sell(item) {
    const amount = state[item] || 0;
    if (amount <= 0) return toast('На складе пусто');
    const sellCount = Math.min(amount, item === 'eggs' ? 12 : 5);
    const coinGain = Math.max(1, Math.round(sellCount * (prices[item] || 1) * (['wheat','corn','carrot','pumpkin'].includes(item) ? 1 : 1000)));
    state[item] -= sellCount;
    state.coins += coinGain;
    state.soldToday += sellCount;
    state.incomeToday = +(state.incomeToday + coinGain / 100).toFixed(2);
    state.tasks.sell = true;
    save();
    toast(`Продано: ${productNames[item]} ×${sellCount}. +${coinGain} монет`);
  }

  function sendOrder(idx) {
    const requirements = [
      { eggs: 6, milk: 4, reward: 780, name: 'Дед Захар' },
      { corn: 10, wool: 5, reward: 920, name: 'Мария' },
      { pumpkin: 4, milk: 3, reward: 650, name: 'Семён' },
      { eggs: 8, corn: 6, reward: 840, name: 'Петя' },
    ][idx];
    for (const [k, v] of Object.entries(requirements)) {
      if (k === 'reward' || k === 'name') continue;
      if ((state[k] || 0) < v) return toast(`Не хватает: ${productNames[k]}`);
    }
    for (const [k, v] of Object.entries(requirements)) {
      if (k === 'reward' || k === 'name') continue;
      state[k] -= v;
    }
    state.coins += requirements.reward;
    state.ordersDone += 1;
    state.tasks.order = true;
    if (state.ordersDone >= 3) {
      state.coins += 300;
      state.ordersDone = 0;
      toast(`Заказ отправлен. Бонус за доставку: +300 монет`);
    } else {
      toast(`Заказ для ${requirements.name} отправлен: +${requirements.reward} монет`);
    }
    save();
  }

  function study(item) {
    const cost = 350 + (state.research[item] || 0) * 250;
    if (state.coins < cost) return toast(`Нужно ${cost} монет`);
    if ((state.research[item] || 0) >= 3) return toast('Улучшение уже на максимуме');
    state.coins -= cost;
    state.research[item] = (state.research[item] || 0) + 1;
    if (item === 'energy') state.energy = Math.min(100, state.energy + 10);
    save();
    toast('Исследование улучшено');
  }



  const animalConfig = {
    pigsty: { count:'pigs', level:'pigstyLevel', capacity:'pigstyCapacity', product:'meat', productName:'мясо', buyCost:300, upgradeCost:3800, addCapacity:1, collectAmount:6, label:'свинья' },
    sheepfold: { count:'sheep', level:'sheepfoldLevel', capacity:'sheepfoldCapacity', product:'wool', productName:'шерсть', buyCost:250, upgradeCost:3200, addCapacity:2, collectAmount:6, label:'овца' },
    cowbarn: { count:'cows', level:'cowbarnLevel', capacity:'cowbarnCapacity', product:'milk', productName:'молоко', buyCost:500, upgradeCost:4500, addCapacity:1, collectAmount:12, label:'корова' },
  };

  function buyAnimal(type) {
    const c = animalConfig[type];
    if (!c) return;
    if (state[c.count] >= state[c.capacity]) return toast('Все места заняты. Сначала улучши загон');
    if (state.coins < c.buyCost) return toast(`Нужно ${fmt(c.buyCost)} монет`);
    state.coins -= c.buyCost;
    state[c.count] += 1;
    save();
    toast(`${c.label[0].toUpperCase() + c.label.slice(1)} куплена`);
  }

  function upgradeAnimal(type) {
    const c = animalConfig[type];
    if (!c) return;
    const cost = c.upgradeCost + Math.max(0, state[c.level] - 1) * 1200;
    if (state.coins < cost) return toast(`Нужно ${fmt(cost)} монет`);
    state.coins -= cost;
    state[c.level] += 1;
    state[c.capacity] += c.addCapacity;
    save();
    toast(`Загон улучшен: +${c.addCapacity} места`);
  }

  function collectAnimal(type) {
    const c = animalConfig[type];
    if (!c) return;
    const gain = Math.max(1, state[c.count]) * c.collectAmount;
    state[c.product] += gain;
    if (c.product === 'milk') state.tasks.eggs = state.tasks.eggs || false;
    save();
    toast(`Собрано: ${c.productName} +${gain}`);
  }

  window.__farmBuyAnimal = buyAnimal;

  function buyChicken() {
    if (state.chickens >= state.coopCapacity) return toast('Все места в курятнике заняты');
    if (state.coins < 100) return toast('Нужно 100 монет');
    state.coins -= 100;
    state.chickens += 1;
    save();
    toast('Курица куплена');
  }

  function upgradeCoop() {
    if (state.coins < 3800) return toast('Нужно 3 800 монет');
    state.coins -= 3800;
    state.coopLevel += 1;
    state.coopCapacity += 4;
    save();
    toast('Курятник улучшен: +4 места');
  }

  function plantPlot(n) {
    if (state.coins < 60) return toast('Нужно 60 монет для посадки');
    state.coins -= 60;
    save();
    toast(`Участок ${n}: посадка началась`);
  }

  function resetGame() {
    localStorage.removeItem(STORE_KEY);
    state = structuredClone(defaults);
    closeModal();
    setScreen('home', false);
    toast('Прогресс сброшен');
  }
})();
