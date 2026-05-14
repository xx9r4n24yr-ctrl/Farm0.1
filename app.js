(() => {
  'use strict';

  const STORAGE_KEY = 'tgFarmMiniApp.v1.state';
  const DAY_MS = 86_400_000;

  const products = {
    egg: { name: 'Яйца', one: 'яйцо', emoji: '🥚', price: 2 },
    milk: { name: 'Молоко', one: 'молоко', emoji: '🥛', price: 4 },
    wool: { name: 'Шерсть', one: 'шерсть', emoji: '🧶', price: 5 },
    meat: { name: 'Мясо', one: 'мясо', emoji: '🥩', price: 7 },
    wheat: { name: 'Пшеница', one: 'пшеница', emoji: '🌾', price: 3 },
    corn: { name: 'Кукуруза', one: 'кукуруза', emoji: '🌽', price: 4 },
    pea: { name: 'Горох', one: 'горох', emoji: '🫛', price: 5 },
    flour: { name: 'Мука', one: 'мука', emoji: '🌾', price: 9 },
    cream: { name: 'Сметана', one: 'сметана', emoji: '🥣', price: 10 },
    feed: { name: 'Корм', one: 'корм', emoji: '🧺', price: 8 }
  };

  const animals = {
    chicken: {
      room: 'Курятник', animalName: 'Курицы', single: 'курицу', emoji: '🐔', small: '🐔', product: 'egg',
      baseCapacity: 4, capacityStep: 4, cycleSec: 25, outputPerAnimal: 1, buyCost: 100, baseUpgrade: 1500, xp: 4
    },
    pig: {
      room: 'Свинарник', animalName: 'Свиньи', single: 'свинью', emoji: '🐷', small: '🐖', product: 'meat',
      baseCapacity: 3, capacityStep: 3, cycleSec: 45, outputPerAnimal: 1, buyCost: 180, baseUpgrade: 2400, xp: 6
    },
    sheep: {
      room: 'Овчарня', animalName: 'Овцы', single: 'овцу', emoji: '🐑', small: '🐑', product: 'wool',
      baseCapacity: 3, capacityStep: 3, cycleSec: 55, outputPerAnimal: 1, buyCost: 220, baseUpgrade: 2800, xp: 7
    },
    cow: {
      room: 'Коровник', animalName: 'Коровы', single: 'корову', emoji: '🐮', small: '🐄', product: 'milk',
      baseCapacity: 2, capacityStep: 2, cycleSec: 65, outputPerAnimal: 1, buyCost: 300, baseUpgrade: 3600, xp: 8
    }
  };

  const crops = {
    wheat: { name: 'Пшеница', emoji: '🌾', growSec: 35, seedCost: 10, harvest: 4, xp: 4 },
    corn: { name: 'Кукуруза', emoji: '🌽', growSec: 50, seedCost: 16, harvest: 4, xp: 5 },
    pea: { name: 'Горох', emoji: '🫛', growSec: 65, seedCost: 22, harvest: 5, xp: 7 }
  };

  const factories = {
    flour: {
      title: 'Мельница', emoji: '🏭', output: 'flour', outputQty: 2, duration: 45,
      inputs: { wheat: 5 }, xp: 7
    },
    cream: {
      title: 'Молочный завод', emoji: '🥛', output: 'cream', outputQty: 2, duration: 55,
      inputs: { milk: 4 }, xp: 8
    },
    feed: {
      title: 'Комбикормовый цех', emoji: '🌽', output: 'feed', outputQty: 3, duration: 60,
      inputs: { corn: 3, pea: 2 }, xp: 8
    }
  };

  const dailyRewards = [
    { type: 'coins', qty: 150, icon: '🪙', label: '150' },
    { type: 'gems', qty: 1, icon: '💎', label: '1' },
    { type: 'coins', qty: 250, icon: '🪙', label: '250' },
    { type: 'energy', qty: 50, icon: '⚡', label: '50' },
    { type: 'gems', qty: 2, icon: '💎', label: '2' },
    { type: 'coins', qty: 500, icon: '🪙', label: '500' },
    { type: 'chest', qty: 1, icon: '🎁', label: 'Сундук' }
  ];

  const taskDefs = [
    { key: 'collectAnimal', title: 'Собери продукцию животных', target: 10, icon: '🐔', reward: { coins: 90 }, stat: 'animalCollected' },
    { key: 'harvestCrops', title: 'Собери урожай с полей', target: 3, icon: '🌾', reward: { coins: 110 }, stat: 'cropsHarvested' },
    { key: 'sellMarket', title: 'Продай товары на рынке', target: 5, icon: '🏪', reward: { coins: 120 }, stat: 'itemsSold' },
    { key: 'orders', title: 'Выполни заказ', target: 1, icon: '🚚', reward: { coins: 160, gems: 1 }, stat: 'ordersDone' }
  ];

  const achievementDefs = [
    { key: 'firstHarvest', title: 'Первый урожай', desc: 'Собери любое растение', icon: '🌾', check: s => s.stats.life.cropsHarvested >= 1, reward: { coins: 100 } },
    { key: 'animalFriend', title: 'Друг животных', desc: 'Купи 10 животных', icon: '🐮', check: s => totalAnimals(s) >= 10, reward: { gems: 1 } },
    { key: 'merchant', title: 'Фермер-коммерсант', desc: 'Продай 50 товаров', icon: '🏪', check: s => s.stats.life.itemsSold >= 50, reward: { coins: 450 } },
    { key: 'richPocket', title: 'Золотой карман', desc: 'Накопи 5 000 монет', icon: '🪙', check: s => s.coins >= 5000, reward: { gems: 2 } },
    { key: 'fifthLevel', title: 'Пятый уровень', desc: 'Достигни 5 уровня фермы', icon: '⭐', check: s => s.level >= 5, reward: { coins: 700 } }
  ];

  const navItems = [
    { page: 'farm', label: 'Ферма', icon: '🏡' },
    { page: 'animals', label: 'Животные', icon: '🐮' },
    { page: 'fields', label: 'Поля', icon: '🌾' },
    { page: 'market', label: 'Рынок', icon: '🏪' },
    { page: 'tasks', label: 'Задания', icon: '📋' }
  ];

  const app = document.getElementById('app');
  const ui = {
    page: 'farm',
    animal: 'chicken',
    modal: null,
    drawer: false,
    selectedField: null,
    telegramUser: null,
    ready: false
  };

  let state = loadState();
  let renderTimer = null;

  initTelegram();
  boot();

  function boot() {
    resetDailyIfNeeded();
    regenEnergy();
    ensureOrders();
    ui.ready = true;
    render();
    maybeShowDailyReward();

    app.addEventListener('click', handleClick);
    app.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        regenEnergy();
        render();
      }
    });

    renderTimer = setInterval(() => {
      regenEnergy();
      render();
    }, 1000);
  }

  function initTelegram() {
    const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#68b842');
      tg.setBackgroundColor('#4da236');
      if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes();
      if (typeof tg.requestFullscreen === 'function') tg.requestFullscreen();
      ui.telegramUser = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;
    } catch (err) {
      console.warn('Telegram init skipped:', err);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return sanitizeState(JSON.parse(raw));
    } catch (err) {
      console.warn('Cannot load state:', err);
    }
    return createDefaultState();
  }

  function createDefaultState() {
    const now = nowSec();
    return {
      version: 1,
      coins: 12450,
      gems: 320,
      energy: 78,
      maxEnergy: 100,
      lastEnergyAt: now,
      xp: 0,
      level: 1,
      resources: Object.fromEntries(Object.keys(products).map(key => [key, 0])),
      animals: {
        chicken: { level: 1, owned: 4, lastCollectAt: now - 55 },
        pig: { level: 1, owned: 1, lastCollectAt: now - 70 },
        sheep: { level: 1, owned: 1, lastCollectAt: now - 85 },
        cow: { level: 1, owned: 1, lastCollectAt: now - 95 }
      },
      fields: [
        { crop: 'wheat', plantedAt: now - 34 },
        { crop: 'corn', plantedAt: now - 20 },
        { crop: null, plantedAt: null }
      ],
      factoryJobs: {},
      orders: [],
      stats: {
        dayKey: todayKey(),
        daily: { animalCollected: 0, cropsHarvested: 0, itemsSold: 0, ordersDone: 0 },
        life: { animalCollected: 0, cropsHarvested: 0, itemsSold: 0, ordersDone: 0 }
      },
      tasksClaimed: {},
      achievements: {},
      daily: { lastClaimDate: '', streak: 0 }
    };
  }

  function sanitizeState(s) {
    const d = createDefaultState();
    const merged = deepMerge(d, s || {});
    for (const key of Object.keys(products)) merged.resources[key] = Number(merged.resources[key] || 0);
    for (const key of Object.keys(animals)) {
      merged.animals[key] = Object.assign({}, d.animals[key], merged.animals[key] || {});
      merged.animals[key].level = clamp(Number(merged.animals[key].level || 1), 1, 99);
      merged.animals[key].owned = clamp(Number(merged.animals[key].owned || 0), 0, 999);
      merged.animals[key].lastCollectAt = Number(merged.animals[key].lastCollectAt || nowSec());
    }
    merged.fields = Array.isArray(merged.fields) && merged.fields.length ? merged.fields : d.fields;
    merged.coins = Math.max(0, Number(merged.coins || 0));
    merged.gems = Math.max(0, Number(merged.gems || 0));
    merged.energy = clamp(Number(merged.energy || 0), 0, Number(merged.maxEnergy || 100));
    merged.maxEnergy = Math.max(100, Number(merged.maxEnergy || 100));
    return merged;
  }

  function deepMerge(base, patch) {
    const out = Array.isArray(base) ? [...base] : { ...base };
    for (const [key, value] of Object.entries(patch || {})) {
      if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
        out[key] = deepMerge(base[key], value);
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function render() {
    if (!ui.ready) return;
    const content = getPageHtml();
    app.innerHTML = `
      <div class="game">
        ${renderTopbar()}
        <main class="screen ${ui.page === 'farm' ? 'no-pad' : ''}">${content}</main>
        ${renderBottomNav()}
      </div>
      ${ui.drawer ? renderDrawer() : ''}
      ${ui.modal ? renderModal() : ''}
      <div class="toast-stack" id="toastStack"></div>
    `;
  }

  function renderTopbar() {
    const avatar = getAvatarHtml();
    return `
      <header class="topbar">
        <div class="avatar-wrap">${avatar}<div class="level-badge">${state.level}</div></div>
        <div class="resources">
          ${resourcePill('coin', formatNum(state.coins), '🪙')}
          ${resourcePill('gem', formatNum(state.gems), '💎')}
          ${resourcePill('energy', `${Math.floor(state.energy)}/${state.maxEnergy}`, '⚡')}
        </div>
        <button class="menu-btn" data-action="toggle-drawer" aria-label="Меню">☰</button>
      </header>
    `;
  }

  function resourcePill(type, value, icon) {
    const extra = type === 'gem' ? ' gem' : type === 'energy' ? ' energy' : '';
    return `<div class="resource-pill"><div class="resource-icon${extra}">${icon}</div><div class="resource-value">${value}</div><button class="plus-btn" data-action="bonus-shop" aria-label="Добавить">+</button></div>`;
  }

  function getAvatarHtml() {
    const user = ui.telegramUser;
    if (user && user.photo_url) {
      return `<img class="avatar" src="${escapeAttr(user.photo_url)}" alt="avatar" />`;
    }
    return `<div class="avatar">👨‍🌾</div>`;
  }

  function getPinHtml() {
    const user = ui.telegramUser;
    if (user && user.photo_url) return `<img class="player-pin" src="${escapeAttr(user.photo_url)}" alt="player" />`;
    return `<div class="player-pin">👨‍🌾</div>`;
  }

  function getPlayerName() {
    const user = ui.telegramUser;
    if (!user) return 'Моя ферма';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return name ? `Ферма ${name}` : 'Моя ферма';
  }

  function getPageHtml() {
    switch (ui.page) {
      case 'animals': return renderAnimalsPage();
      case 'fields': return renderFieldsPage();
      case 'market': return renderMarketPage();
      case 'tasks': return renderTasksPage();
      case 'orders': return renderOrdersPage();
      case 'factories': return renderFactoriesPage();
      case 'achievements': return renderAchievementsPage();
      case 'settings': return renderSettingsPage();
      default: return renderFarmPage();
    }
  }

  function renderFarmPage() {
    return `
      <div class="farm-map">
        <div class="cloud c1"></div><div class="cloud c2"></div>
        <div class="hills"></div><div class="river"></div>
        <div class="path p1"></div><div class="path p2"></div><div class="path p3"></div>
        <div class="windmill scene-item"><div class="blades"></div></div>
        <div class="house scene-item"><div class="chimney"></div><div class="roof"></div><div class="base"></div><div class="door"></div><div class="win"></div><div class="win w2"></div></div>
        <div class="silo scene-item"></div>
        <div class="barn scene-item"><div class="door"></div></div>
        <div class="coop scene-item"><div class="mini-door"></div></div>
        <div class="fence f1"></div><div class="fence f2"></div><div class="fence f3"></div>
        <div class="field">${Array.from({ length: 32 }, (_, i) => `<span class="crop-dot ${i % 3 === 0 ? 'alt' : i % 5 === 0 ? 'pea' : ''}"></span>`).join('')}</div>
        <div class="farm-animal cow">🐄</div><div class="farm-animal pig">🐖</div><div class="farm-animal sheep">🐑</div><div class="farm-animal chicken">🐔</div>
        ${getPinHtml()}
        <div class="floating-buttons">
          <div class="side-stack">
            <button class="float-card" data-action="go" data-page="tasks"><span class="big-icon">📋</span><span>Задания</span>${openTasksCount() ? `<span class="badge">${openTasksCount()}</span>` : ''}</button>
            <button class="float-card" data-action="go" data-page="achievements"><span class="big-icon">🏆</span><span>Достижения</span></button>
            <button class="float-card" data-action="daily"><span class="big-icon">🎁</span><span>Бонусы</span>${canClaimDaily() ? '<span class="badge">!</span>' : ''}</button>
          </div>
          <div class="side-stack right">
            <button class="float-card" data-action="go" data-page="orders"><span class="big-icon">🚚</span><span>Заказы</span>${state.orders.length ? `<span class="badge">${state.orders.length}</span>` : ''}</button>
          </div>
        </div>
        <div class="name-plate"><div class="title">${escapeHtml(getPlayerName())}</div><div class="sub">Уровень ${state.level} • ${Math.floor(state.xp % 100)}/100 XP</div></div>
      </div>
      <section class="panel" style="margin-top: -2px; border-radius: 0 0 22px 22px;">
        <div class="grid-2">
          ${homeCard('animals', '🐮', 'Животные', animalSummary())}
          ${homeCard('fields', '🌾', 'Поля', fieldSummary())}
          ${homeCard('market', '🏪', 'Рынок', 'Продать продукцию')}
          ${homeCard('orders', '🚚', 'Заказы', `${state.orders.length} активных`)}
          ${homeCard('factories', '🏭', 'Заводы', readyFactoriesCount() ? `${readyFactoriesCount()} готово` : 'Переработка')}
          ${homeCard('achievements', '🏆', 'Достижения', `${claimedAchievementCount()}/${achievementDefs.length}`)}
        </div>
      </section>
    `;
  }

  function homeCard(page, emoji, label, hint) {
    return `<button class="big-card" data-action="go" data-page="${page}"><span class="emoji">${emoji}</span><span class="label">${label}</span><span class="hint">${escapeHtml(hint)}</span></button>`;
  }

  function renderAnimalsPage() {
    const key = ui.animal;
    const cfg = animals[key];
    const a = state.animals[key];
    const capacity = animalCapacity(key);
    const ready = animalReadyQty(key);
    const product = products[cfg.product];
    const cost = animalUpgradeCost(key);
    const buyDisabled = a.owned >= capacity || state.coins < cfg.buyCost;
    const nests = Array.from({ length: Math.min(capacity, 16) }, (_, i) => {
      const occupied = i < a.owned;
      return `<div class="nest ${occupied ? '' : 'empty'}">${occupied ? cfg.emoji : '＋'}</div>`;
    }).join('');

    return `
      <div class="detail-layout">
        <div class="animal-room">
          <div class="room-title-board">${cfg.room.toUpperCase()}</div>
          <div class="room-level">Уровень ${a.level}</div>
          <div class="capacity-board"><div><div class="big">${a.owned}/${capacity}</div><div>места занято</div></div></div>
          <div class="nests">${nests}</div>
        </div>
        <div class="detail-cards">
          <div class="info-card">
            <h3>УРОВЕНЬ ${cfg.room.toUpperCase()}</h3>
            <div class="info-line"><span>Мест</span><span>${capacity}</span></div>
            <div class="info-line"><span>Следующий уровень</span><span>+${cfg.capacityStep} места</span></div>
            <button class="action-btn" style="width:100%;margin-top:10px" data-action="upgrade-animal" data-animal="${key}" ${state.coins < cost ? 'disabled' : ''}>🪙 ${formatNum(cost)} Улучшить</button>
          </div>
          <div class="info-card">
            <h3>${cfg.animalName.toUpperCase()}</h3>
            <div class="info-line"><span>Куплено</span><span>${a.owned}/${capacity}</span></div>
            <div class="info-line"><span>Производство</span><span>${a.owned * cfg.outputPerAnimal} ${product.one} / ${formatTime(cfg.cycleSec)}</span></div>
            <button class="action-btn blue" style="width:100%;margin-top:10px" data-action="buy-animal" data-animal="${key}" ${buyDisabled ? 'disabled' : ''}>Купить ${cfg.single} 🪙 ${cfg.buyCost}</button>
          </div>
          <div class="info-card">
            <h3>СОБРАНО</h3>
            <div style="text-align:center;font-size:52px;margin:4px 0">${product.emoji}</div>
            <div style="text-align:center;font-size:30px;font-weight:950;color:#573415">${ready}</div>
            <button class="action-btn" style="width:100%;margin-top:10px" data-action="collect-animal" data-animal="${key}" ${ready <= 0 ? 'disabled' : ''}>Собрать всё</button>
          </div>
        </div>
        ${renderAnimalTabs()}
      </div>
    `;
  }

  function renderAnimalTabs() {
    const tabs = [
      { key: 'farm', label: 'Ферма', emoji: '🏡', action: 'go', page: 'farm' },
      { key: 'chicken', label: 'Курятник', emoji: '🐔' },
      { key: 'pig', label: 'Свинарник', emoji: '🐷' },
      { key: 'sheep', label: 'Овчарня', emoji: '🐑' },
      { key: 'cow', label: 'Коровник', emoji: '🐮' }
    ];
    return `<div class="tabs">${tabs.map(t => {
      if (t.action === 'go') return `<button class="tab-btn" data-action="go" data-page="${t.page}"><span class="tab-icon">${t.emoji}</span>${t.label}</button>`;
      return `<button class="tab-btn ${ui.animal === t.key ? 'active' : ''}" data-action="animal-tab" data-animal="${t.key}"><span class="tab-icon">${t.emoji}</span>${t.label}</button>`;
    }).join('')}</div>`;
  }

  function renderFieldsPage() {
    return `
      <div class="detail-layout">
        <h1 class="panel-title">ПОЛЯ</h1>
        <section class="panel">
          <div class="sub-title">Сажай пшеницу, кукурузу и горох. Урожай можно продавать или перерабатывать.</div>
          <div class="grid-2">
            ${state.fields.map((slot, index) => renderFieldSlot(slot, index)).join('')}
          </div>
          <button class="action-btn gold" style="width:100%;margin-top:12px" data-action="buy-field" ${state.coins < fieldCost() ? 'disabled' : ''}>Купить поле 🪙 ${formatNum(fieldCost())}</button>
        </section>
      </div>
    `;
  }

  function renderFieldSlot(slot, index) {
    if (!slot.crop) {
      return `
        <div class="big-card">
          <div class="field-plot"><div class="plot-crop">🟫</div><div class="plot-meta">Свободное поле</div></div>
          <div class="crop-picker">
            ${Object.entries(crops).map(([key, crop]) => `<button class="crop-btn" data-action="plant" data-field="${index}" data-crop="${key}" ${state.coins < crop.seedCost ? 'disabled' : ''}><span class="emoji">${crop.emoji}</span>${crop.name}<br><small>🪙 ${crop.seedCost}</small></button>`).join('')}
          </div>
        </div>
      `;
    }
    const crop = crops[slot.crop];
    const left = cropTimeLeft(slot);
    const ready = left <= 0;
    const pct = ready ? 100 : clamp(((crop.growSec - left) / crop.growSec) * 100, 0, 100);
    return `
      <div class="big-card">
        <div class="field-plot ${ready ? 'ready' : ''}"><div class="plot-crop">${crop.emoji}</div><div class="plot-meta">${crop.name}</div></div>
        <div class="label">${ready ? 'Урожай готов' : `Готово через ${formatTime(left)}`}</div>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <button class="action-btn" data-action="harvest" data-field="${index}" ${ready ? '' : 'disabled'}>Собрать +${crop.harvest}</button>
      </div>
    `;
  }

  function renderMarketPage() {
    const keys = Object.keys(products);
    return `
      <div class="detail-layout">
        <h1 class="panel-title">РЫНОК</h1>
        <section class="panel">
          <div class="sub-title">Продавай продукцию за монеты. Цены пока фиксированные для первой версии.</div>
          ${keys.map(key => renderProductRow(key)).join('')}
          <button class="action-btn gold" style="width:100%;margin-top:8px" data-action="sell-all">Продать всё</button>
        </section>
      </div>
    `;
  }

  function renderProductRow(key) {
    const p = products[key];
    const qty = state.resources[key] || 0;
    return `
      <div class="product-row">
        <div class="product-icon">${p.emoji}</div>
        <div>
          <div class="product-name">${p.name}</div>
          <div class="product-meta">На складе: ${qty} • Цена: 🪙 ${p.price}</div>
        </div>
        <button class="action-btn small" data-action="sell-one" data-product="${key}" ${qty <= 0 ? 'disabled' : ''}>Продать</button>
      </div>
    `;
  }

  function renderTasksPage() {
    return `
      <div class="detail-layout">
        <h1 class="panel-title">ЗАДАНИЯ</h1>
        <section class="panel">
          <div class="sub-title">Ежедневные задания обновляются каждый день. Забирай награды и разгоняй ферму.</div>
          <div class="task-list">${taskDefs.map(renderTaskRow).join('')}</div>
        </section>
      </div>
    `;
  }

  function renderTaskRow(task) {
    const progress = taskProgress(task);
    const done = progress >= task.target;
    const claimed = !!state.tasksClaimed[task.key];
    const pct = clamp((progress / task.target) * 100, 0, 100);
    const reward = rewardLabel(task.reward);
    return `
      <div class="task-row">
        <div class="product-icon">${task.icon}</div>
        <div>
          <div class="product-name">${task.title}</div>
          <div class="product-meta">${Math.min(progress, task.target)}/${task.target} • Награда: ${reward}</div>
          <div class="progress" style="margin-top:5px"><span style="width:${pct}%"></span></div>
        </div>
        <button class="action-btn small" data-action="claim-task" data-task="${task.key}" ${done && !claimed ? '' : 'disabled'}>${claimed ? 'Взято' : 'Забрать'}</button>
      </div>
    `;
  }

  function renderOrdersPage() {
    ensureOrders();
    return `
      <div class="detail-layout">
        <h1 class="panel-title">ЗАКАЗЫ</h1>
        <section class="panel">
          <div class="sub-title">Собирай товары и отправляй грузовик. Заказы дают больше монет, чем обычная продажа.</div>
          <div class="order-list">${state.orders.map(renderOrderCard).join('')}</div>
        </section>
      </div>
    `;
  }

  function renderOrderCard(order, index) {
    const can = canFulfill(order);
    const req = Object.entries(order.requires).map(([key, qty]) => `<span class="req-chip">${products[key].emoji} ${products[key].name}: ${state.resources[key] || 0}/${qty}</span>`).join('');
    return `
      <div class="order-card">
        <div class="order-head">
          <div class="order-title">🚚 Заказ #${order.id}</div>
          <span class="reward-chip">${rewardLabel(order.reward)}</span>
        </div>
        <div class="requirements">${req}</div>
        <button class="action-btn" data-action="fulfill-order" data-order="${index}" ${can ? '' : 'disabled'}>Отправить заказ</button>
      </div>
    `;
  }

  function renderFactoriesPage() {
    return `
      <div class="detail-layout">
        <h1 class="panel-title">ЗАВОДЫ</h1>
        <section class="panel">
          <div class="sub-title">Перерабатывай простые продукты в более дорогие товары.</div>
          <div class="factory-list">${Object.entries(factories).map(([key, recipe]) => renderFactoryCard(key, recipe)).join('')}</div>
        </section>
      </div>
    `;
  }

  function renderFactoryCard(key, recipe) {
    const job = state.factoryJobs[key];
    const left = factoryTimeLeft(key);
    const ready = job && left <= 0;
    const inProgress = !!job && left > 0;
    const canStart = !job && hasResources(recipe.inputs);
    const req = Object.entries(recipe.inputs).map(([p, q]) => `<span class="req-chip">${products[p].emoji} ${q}</span>`).join('');
    return `
      <div class="factory-card">
        <div class="factory-head">
          <div class="factory-title">${recipe.emoji} ${recipe.title}</div>
          <span class="reward-chip">→ ${products[recipe.output].emoji} ${recipe.outputQty}</span>
        </div>
        <div class="requirements">${req}<span class="req-chip">⏱ ${formatTime(recipe.duration)}</span></div>
        ${inProgress ? `<div class="progress"><span style="width:${clamp(((recipe.duration - left) / recipe.duration) * 100, 0, 100)}%"></span></div><div class="product-meta" style="margin:7px 0">Готово через ${formatTime(left)}</div>` : ''}
        <button class="action-btn" data-action="factory" data-factory="${key}" ${ready || canStart ? '' : 'disabled'}>${ready ? 'Забрать' : inProgress ? 'В процессе' : 'Произвести'}</button>
      </div>
    `;
  }

  function renderAchievementsPage() {
    return `
      <div class="detail-layout">
        <h1 class="panel-title">ДОСТИЖЕНИЯ</h1>
        <section class="panel">
          <div class="achievement-list">${achievementDefs.map(renderAchievementCard).join('')}</div>
        </section>
      </div>
    `;
  }

  function renderAchievementCard(ach) {
    const done = ach.check(state);
    const claimed = !!state.achievements[ach.key];
    return `
      <div class="achievement-card ${done ? '' : 'locked'}">
        <div class="achievement-head">
          <div class="achievement-title">${ach.icon} ${ach.title}</div>
          <span class="reward-chip">${rewardLabel(ach.reward)}</span>
        </div>
        <div class="product-meta">${ach.desc}</div>
        <button class="action-btn small" style="margin-top:10px" data-action="claim-achievement" data-achievement="${ach.key}" ${done && !claimed ? '' : 'disabled'}>${claimed ? 'Получено' : 'Забрать'}</button>
      </div>
    `;
  }

  function renderSettingsPage() {
    return `
      <div class="detail-layout">
        <h1 class="panel-title">НАСТРОЙКИ</h1>
        <section class="panel">
          <div class="settings-row">
            <div class="product-icon">👤</div>
            <div><div class="product-name">Аватар игрока</div><div class="product-meta">В Telegram Mini App берётся из профиля Telegram, если Telegram отдаёт photo_url.</div></div>
            <button class="action-btn small" data-action="go" data-page="farm">Ок</button>
          </div>
          <div class="settings-row">
            <div class="product-icon">📱</div>
            <div><div class="product-name">Свайп вниз</div><div class="product-meta">В коде включён Telegram.WebApp.disableVerticalSwipes() + CSS overscroll protection.</div></div>
            <button class="action-btn small" data-action="go" data-page="farm">Ок</button>
          </div>
          <div class="settings-row">
            <div class="product-icon">🧹</div>
            <div><div class="product-name">Сброс прогресса</div><div class="product-meta">Очистить localStorage и начать заново.</div></div>
            <button class="action-btn red small" data-action="reset-game">Сброс</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderBottomNav() {
    return `<nav class="bottom-nav">${navItems.map(item => `<button class="nav-btn ${ui.page === item.page ? 'active' : ''}" data-action="go" data-page="${item.page}"><span class="nav-icon">${item.icon}</span><span>${item.label}</span>${item.page === 'tasks' && openTasksCount() ? `<span class="badge">${openTasksCount()}</span>` : ''}</button>`).join('')}</nav>`;
  }

  function renderDrawer() {
    return `
      <div class="drawer">
        <button class="drawer-row" data-action="go" data-page="orders"><span>🚚 Заказы</span><span>${state.orders.length}</span></button>
        <button class="drawer-row" data-action="go" data-page="factories"><span>🏭 Заводы</span><span>${readyFactoriesCount() ? `${readyFactoriesCount()} готово` : '›'}</span></button>
        <button class="drawer-row" data-action="daily"><span>🎁 Ежедневный бонус</span><span>${canClaimDaily() ? '!' : '›'}</span></button>
        <button class="drawer-row" data-action="go" data-page="achievements"><span>🏆 Достижения</span><span>${claimedAchievementCount()}/${achievementDefs.length}</span></button>
        <button class="drawer-row" data-action="go" data-page="settings"><span>⚙️ Настройки</span><span>›</span></button>
      </div>
    `;
  }

  function renderModal() {
    if (ui.modal === 'daily') return renderDailyModal();
    if (ui.modal === 'bonus') return renderBonusModal();
    return '';
  }

  function renderDailyModal() {
    const currentDay = Math.min((state.daily.streak % 7) + 1, 7);
    const claimedToday = !canClaimDaily();
    return `
      <div class="modal-layer" data-action="close-modal-bg">
        <div class="modal" data-stop="1">
          <button class="close-btn" data-action="close-modal">×</button>
          <div class="modal-title">Ежедневные награды</div>
          <div class="daily-grid">
            ${dailyRewards.map((r, i) => {
              const day = i + 1;
              const isPast = day <= state.daily.streak && claimedToday;
              const isToday = day === currentDay && !claimedToday;
              const mystery = day > currentDay;
              return `<div class="daily-card ${isToday ? 'today' : ''} ${isPast ? 'claimed' : ''} ${mystery ? 'mystery' : ''}"><div class="daily-day">День ${day}</div><div class="daily-icon">${mystery ? '❔' : r.icon}</div><div class="daily-reward">${mystery ? 'скрыто' : r.label}</div></div>`;
            }).join('')}
          </div>
          <button class="action-btn gold" style="width:100%;margin-top:14px" data-action="claim-daily" ${canClaimDaily() ? '' : 'disabled'}>${canClaimDaily() ? 'Забрать награду' : 'Сегодня уже забрано'}</button>
        </div>
      </div>
    `;
  }

  function renderBonusModal() {
    return `
      <div class="modal-layer" data-action="close-modal-bg">
        <div class="modal" data-stop="1">
          <button class="close-btn" data-action="close-modal">×</button>
          <div class="modal-title">Бонусы тестовой версии</div>
          <div class="grid-2">
            <button class="big-card" data-action="debug-bonus" data-type="coins"><span class="emoji">🪙</span><span class="label">+500 монет</span><span class="hint">для теста экономики</span></button>
            <button class="big-card" data-action="debug-bonus" data-type="energy"><span class="emoji">⚡</span><span class="label">+50 энергии</span><span class="hint">для быстрого теста</span></button>
          </div>
        </div>
      </div>
    `;
  }

  function handleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.stop) return;
    const action = button.dataset.action;
    if (action === 'close-modal-bg' && event.target !== button) return;

    haptic('light');

    switch (action) {
      case 'go': setPage(button.dataset.page); break;
      case 'toggle-drawer': ui.drawer = !ui.drawer; render(); break;
      case 'animal-tab': ui.animal = button.dataset.animal; render(); break;
      case 'buy-animal': buyAnimal(button.dataset.animal); break;
      case 'upgrade-animal': upgradeAnimal(button.dataset.animal); break;
      case 'collect-animal': collectAnimal(button.dataset.animal); break;
      case 'plant': plantCrop(Number(button.dataset.field), button.dataset.crop); break;
      case 'harvest': harvestCrop(Number(button.dataset.field)); break;
      case 'buy-field': buyField(); break;
      case 'sell-one': sellProduct(button.dataset.product, 1); break;
      case 'sell-all': sellAllProducts(); break;
      case 'claim-task': claimTask(button.dataset.task); break;
      case 'fulfill-order': fulfillOrder(Number(button.dataset.order)); break;
      case 'factory': handleFactory(button.dataset.factory); break;
      case 'claim-achievement': claimAchievement(button.dataset.achievement); break;
      case 'daily': ui.drawer = false; ui.modal = 'daily'; render(); break;
      case 'claim-daily': claimDaily(); break;
      case 'close-modal': ui.modal = null; render(); break;
      case 'close-modal-bg': ui.modal = null; render(); break;
      case 'bonus-shop': ui.modal = 'bonus'; render(); break;
      case 'debug-bonus': debugBonus(button.dataset.type); break;
      case 'reset-game': resetGame(); break;
      default: break;
    }
  }

  function setPage(page) {
    ui.drawer = false;
    ui.modal = null;
    ui.page = page || 'farm';
    render();
  }

  function buyAnimal(key) {
    const cfg = animals[key];
    const a = state.animals[key];
    const capacity = animalCapacity(key);
    if (a.owned >= capacity) return toast('Нет свободных мест. Улучши здание.');
    if (!spendCoins(cfg.buyCost)) return;
    a.owned += 1;
    addXp(5);
    saveState();
    toast(`Куплено: ${cfg.emoji} ${cfg.single}`);
    render();
  }

  function upgradeAnimal(key) {
    const cost = animalUpgradeCost(key);
    if (!spendCoins(cost)) return;
    state.animals[key].level += 1;
    addXp(20);
    saveState();
    toast(`${animals[key].room} улучшен до уровня ${state.animals[key].level}`);
    render();
  }

  function collectAnimal(key) {
    const qty = animalReadyQty(key);
    if (qty <= 0) return;
    if (!useEnergy(1)) return;
    const cfg = animals[key];
    const cycles = Math.floor((nowSec() - state.animals[key].lastCollectAt) / cfg.cycleSec);
    state.animals[key].lastCollectAt += cycles * cfg.cycleSec;
    state.resources[cfg.product] += qty;
    bumpStat('animalCollected', qty);
    addXp(Math.max(cfg.xp, Math.floor(qty / 2)));
    saveState();
    toast(`Собрано: ${products[cfg.product].emoji} +${qty}`);
    render();
  }

  function plantCrop(fieldIndex, cropKey) {
    const slot = state.fields[fieldIndex];
    const crop = crops[cropKey];
    if (!slot || slot.crop || !crop) return;
    if (!spendCoins(crop.seedCost)) return;
    slot.crop = cropKey;
    slot.plantedAt = nowSec();
    saveState();
    toast(`Посажено: ${crop.emoji} ${crop.name}`);
    render();
  }

  function harvestCrop(fieldIndex) {
    const slot = state.fields[fieldIndex];
    if (!slot || !slot.crop) return;
    const crop = crops[slot.crop];
    if (cropTimeLeft(slot) > 0) return;
    if (!useEnergy(1)) return;
    state.resources[slot.crop] += crop.harvest;
    slot.crop = null;
    slot.plantedAt = null;
    bumpStat('cropsHarvested', 1);
    addXp(crop.xp);
    saveState();
    toast(`Урожай собран: ${crop.emoji} +${crop.harvest}`);
    render();
  }

  function buyField() {
    const cost = fieldCost();
    if (!spendCoins(cost)) return;
    state.fields.push({ crop: null, plantedAt: null });
    addXp(10);
    saveState();
    toast('Новое поле куплено');
    render();
  }

  function sellProduct(key, qty) {
    const available = state.resources[key] || 0;
    const amount = Math.min(qty, available);
    if (amount <= 0) return;
    state.resources[key] -= amount;
    state.coins += amount * products[key].price;
    bumpStat('itemsSold', amount);
    addXp(1);
    saveState();
    toast(`Продано: ${products[key].emoji} ${amount} шт.`);
    render();
  }

  function sellAllProducts() {
    let totalCoins = 0;
    let totalItems = 0;
    for (const [key, p] of Object.entries(products)) {
      const qty = state.resources[key] || 0;
      if (qty > 0) {
        totalCoins += qty * p.price;
        totalItems += qty;
        state.resources[key] = 0;
      }
    }
    if (totalItems <= 0) return toast('На складе пока пусто.');
    state.coins += totalCoins;
    bumpStat('itemsSold', totalItems);
    addXp(Math.max(1, Math.floor(totalItems / 4)));
    saveState();
    toast(`Продано товаров: ${totalItems}. Получено 🪙 ${totalCoins}`);
    render();
  }

  function claimTask(key) {
    const task = taskDefs.find(t => t.key === key);
    if (!task) return;
    if (state.tasksClaimed[key]) return;
    if (taskProgress(task) < task.target) return;
    applyReward(task.reward);
    state.tasksClaimed[key] = true;
    addXp(12);
    saveState();
    toast(`Задание выполнено: ${rewardLabel(task.reward)}`);
    render();
  }

  function fulfillOrder(index) {
    const order = state.orders[index];
    if (!order || !canFulfill(order)) return;
    for (const [key, qty] of Object.entries(order.requires)) state.resources[key] -= qty;
    applyReward(order.reward);
    state.orders.splice(index, 1);
    bumpStat('ordersDone', 1);
    addXp(18);
    ensureOrders();
    saveState();
    toast(`Заказ отправлен: ${rewardLabel(order.reward)}`);
    render();
  }

  function handleFactory(key) {
    const recipe = factories[key];
    const job = state.factoryJobs[key];
    if (!recipe) return;
    if (job && factoryTimeLeft(key) <= 0) {
      state.resources[recipe.output] += recipe.outputQty;
      delete state.factoryJobs[key];
      addXp(recipe.xp);
      saveState();
      toast(`Готово: ${products[recipe.output].emoji} +${recipe.outputQty}`);
      render();
      return;
    }
    if (job) return;
    if (!hasResources(recipe.inputs)) return toast('Не хватает ингредиентов.');
    for (const [p, q] of Object.entries(recipe.inputs)) state.resources[p] -= q;
    state.factoryJobs[key] = { startedAt: nowSec(), doneAt: nowSec() + recipe.duration };
    saveState();
    toast(`${recipe.title}: производство запущено`);
    render();
  }

  function claimAchievement(key) {
    const ach = achievementDefs.find(a => a.key === key);
    if (!ach || state.achievements[key] || !ach.check(state)) return;
    applyReward(ach.reward);
    state.achievements[key] = true;
    addXp(25);
    saveState();
    toast(`Достижение: ${ach.title}`);
    render();
  }

  function claimDaily() {
    if (!canClaimDaily()) return;
    const dayIndex = state.daily.streak % 7;
    const reward = dailyRewards[dayIndex];
    if (reward.type === 'chest') applyReward({ coins: 800, gems: 3, energy: 100 });
    else applyReward({ [reward.type]: reward.qty });
    state.daily.streak += 1;
    state.daily.lastClaimDate = todayKey();
    addXp(10);
    saveState();
    toast(`Ежедневная награда получена: ${reward.icon} ${reward.label}`);
    ui.modal = null;
    render();
  }

  function debugBonus(type) {
    if (type === 'coins') applyReward({ coins: 500 });
    if (type === 'energy') applyReward({ energy: 50 });
    saveState();
    toast(type === 'coins' ? '+500 монет' : '+50 энергии');
    render();
  }

  function resetGame() {
    localStorage.removeItem(STORAGE_KEY);
    state = createDefaultState();
    ui.page = 'farm';
    ui.drawer = false;
    ui.modal = null;
    saveState();
    toast('Прогресс сброшен');
    render();
  }

  function animalCapacity(key) {
    const cfg = animals[key];
    const level = state.animals[key].level;
    return cfg.baseCapacity + (level - 1) * cfg.capacityStep;
  }

  function animalUpgradeCost(key) {
    const cfg = animals[key];
    const level = state.animals[key].level;
    return Math.round(cfg.baseUpgrade * Math.pow(1.7, level - 1));
  }

  function animalReadyQty(key) {
    const cfg = animals[key];
    const a = state.animals[key];
    if (!a.owned) return 0;
    const elapsed = Math.max(0, nowSec() - a.lastCollectAt);
    const cycles = Math.floor(elapsed / cfg.cycleSec);
    return cycles * a.owned * cfg.outputPerAnimal;
  }

  function cropTimeLeft(slot) {
    if (!slot || !slot.crop) return 0;
    const crop = crops[slot.crop];
    return Math.max(0, crop.growSec - (nowSec() - Number(slot.plantedAt || 0)));
  }

  function factoryTimeLeft(key) {
    const job = state.factoryJobs[key];
    if (!job) return 0;
    return Math.max(0, Number(job.doneAt || 0) - nowSec());
  }

  function readyFactoriesCount() {
    return Object.keys(state.factoryJobs).filter(key => factoryTimeLeft(key) <= 0).length;
  }

  function fieldCost() {
    return 450 + state.fields.length * 250;
  }

  function totalAnimals(s = state) {
    return Object.values(s.animals).reduce((sum, a) => sum + Number(a.owned || 0), 0);
  }

  function animalSummary() {
    const ready = Object.keys(animals).reduce((sum, key) => sum + animalReadyQty(key), 0);
    return ready ? `${ready} готово к сбору` : `${totalAnimals()} животных`;
  }

  function fieldSummary() {
    const ready = state.fields.filter(slot => slot.crop && cropTimeLeft(slot) <= 0).length;
    return ready ? `${ready} готово` : `${state.fields.length} поля`;
  }

  function canFulfill(order) {
    return Object.entries(order.requires).every(([key, qty]) => (state.resources[key] || 0) >= qty);
  }

  function hasResources(req) {
    return Object.entries(req).every(([key, qty]) => (state.resources[key] || 0) >= qty);
  }

  function ensureOrders() {
    while (state.orders.length < 3) state.orders.push(generateOrder());
  }

  function generateOrder() {
    const possible = ['egg', 'milk', 'wheat', 'corn', 'pea', 'wool', 'meat'];
    const count = randInt(2, 3);
    const shuffled = possible.sort(() => Math.random() - 0.5).slice(0, count);
    const requires = {};
    let value = 0;
    for (const key of shuffled) {
      const qty = randInt(2, 6 + Math.min(state.level, 6));
      requires[key] = qty;
      value += qty * products[key].price;
    }
    return {
      id: Math.floor(Date.now() / 1000).toString().slice(-5) + randInt(10, 99),
      requires,
      reward: { coins: Math.round(value * 2.2 + 50 + state.level * 10) }
    };
  }

  function canClaimDaily() {
    return state.daily.lastClaimDate !== todayKey();
  }

  function maybeShowDailyReward() {
    if (canClaimDaily()) {
      ui.modal = 'daily';
      render();
    }
  }

  function resetDailyIfNeeded() {
    const key = todayKey();
    if (state.stats.dayKey !== key) {
      state.stats.dayKey = key;
      state.stats.daily = { animalCollected: 0, cropsHarvested: 0, itemsSold: 0, ordersDone: 0 };
      state.tasksClaimed = {};
      saveState();
    }
  }

  function taskProgress(task) {
    return Number(state.stats.daily[task.stat] || 0);
  }

  function openTasksCount() {
    return taskDefs.filter(t => taskProgress(t) >= t.target && !state.tasksClaimed[t.key]).length;
  }

  function claimedAchievementCount() {
    return Object.keys(state.achievements || {}).filter(k => state.achievements[k]).length;
  }

  function bumpStat(key, amount) {
    state.stats.daily[key] = Number(state.stats.daily[key] || 0) + amount;
    state.stats.life[key] = Number(state.stats.life[key] || 0) + amount;
  }

  function applyReward(reward) {
    if (reward.coins) state.coins += reward.coins;
    if (reward.gems) state.gems += reward.gems;
    if (reward.energy) state.energy = clamp(state.energy + reward.energy, 0, state.maxEnergy);
  }

  function rewardLabel(reward) {
    const parts = [];
    if (reward.coins) parts.push(`🪙 ${formatNum(reward.coins)}`);
    if (reward.gems) parts.push(`💎 ${formatNum(reward.gems)}`);
    if (reward.energy) parts.push(`⚡ ${formatNum(reward.energy)}`);
    return parts.join('  ');
  }

  function spendCoins(amount) {
    if (state.coins < amount) {
      toast('Не хватает монет.');
      return false;
    }
    state.coins -= amount;
    return true;
  }

  function useEnergy(amount) {
    if (state.energy < amount) {
      toast('Не хватает энергии. Подожди восстановления или возьми бонус.');
      return false;
    }
    state.energy -= amount;
    state.lastEnergyAt = nowSec();
    return true;
  }

  function regenEnergy() {
    const now = nowSec();
    if (state.energy >= state.maxEnergy) {
      state.lastEnergyAt = now;
      return;
    }
    const elapsed = Math.max(0, now - Number(state.lastEnergyAt || now));
    const gained = Math.floor(elapsed / 60);
    if (gained > 0) {
      state.energy = clamp(state.energy + gained, 0, state.maxEnergy);
      state.lastEnergyAt += gained * 60;
      saveState();
    }
  }

  function addXp(amount) {
    const oldLevel = state.level;
    state.xp += amount;
    state.level = Math.max(1, Math.floor(state.xp / 100) + 1);
    if (state.level > oldLevel) {
      state.gems += state.level - oldLevel;
      toast(`Новый уровень: ${state.level}! +${state.level - oldLevel} 💎`);
    }
  }

  function toast(message) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    stack.appendChild(node);
    setTimeout(() => node.remove(), 2400);
  }

  function haptic(type = 'light') {
    const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    try {
      if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type);
    } catch (_) {}
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function nowSec() { return Math.floor(Date.now() / 1000); }

  function formatTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m <= 0) return `${s}с`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function formatNum(num) {
    return new Intl.NumberFormat('ru-RU').format(Math.floor(Number(num) || 0));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll('`', '&#096;');
  }
})();
