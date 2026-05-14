
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const game = $('#game');
  const screenArt = $('#screenArt');
  const bootFallback = $('#bootFallback');
  const hitLayer = $('#hitLayer');
  const hudLayer = $('#hudLayer');
  const toastEl = $('#toast');
  const overlay = $('#modalOverlay');
  const modalTitle = $('#modalTitle');
  const modalBody = $('#modalBody');
  const modalClose = $('#modalClose');

  const STORE_KEY = 'my-farm-miniapp-v11-hitboxes-bugfix';
  const fmt = (n) => String(Math.floor(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const defaultState = {
    screen: 'home',
    coins: 12450,
    gems: 320,
    energy: 78,
    level: 12,
    dayClaimed: false,
    tasks: { eggs:false, wheat:false, market:false, order:false },
    chickens: 4, coopLevel: 1, coopCapacity: 4, eggs: 6,
    pigs: 1, pigstyLevel: 1, pigstyCapacity: 1, meat: 2,
    sheep: 1, sheepfoldLevel: 1, sheepfoldCapacity: 1, wool: 2,
    cows: 1, cowbarnLevel: 1, cowbarnCapacity: 1, milk: 2,
    crops: { wheat: 120, corn: 90, carrot: 110, pumpkin: 80 },
    soldToday: 0,
    factories: { dairy: 1 }
  };

  const screens = ['home','coop','pigsty','sheepfold','cowbarn','fields','market','orders','research'];
  const animals = ['coop','pigsty','sheepfold','cowbarn'];

  function deepCopy(o){ return JSON.parse(JSON.stringify(o)); }
  function deepMerge(a,b){
    if (!b || typeof b !== 'object') return a;
    for (const k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) a[k] = deepMerge(a[k] || {}, b[k]);
      else a[k] = b[k];
    }
    return a;
  }
  function load(){
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? deepMerge(deepCopy(defaultState), JSON.parse(raw)) : deepCopy(defaultState);
    } catch(e){ return deepCopy(defaultState); }
  }

  let state = load();

  function save(){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch(e){}
  }

  function initTelegram(){
    try {
      const tg = window.Telegram && window.Telegram.WebApp;
      if (!tg) return;
      tg.ready && tg.ready();
      tg.expand && tg.expand();
      tg.disableVerticalSwipes && tg.disableVerticalSwipes();
      tg.setHeaderColor && tg.setHeaderColor('#0b8fd9');
      tg.setBackgroundColor && tg.setBackgroundColor('#0b693c');
    } catch(e){}
  }

  function assetFor(screen){
    const coop = Math.max(1, Math.min(4, state.coopLevel || 1));
    const map = {
      home: './assets/home.jpg',
      coop: './assets/coop' + coop + '.jpg',
      pigsty: './assets/pigsty1.jpg',
      sheepfold: './assets/sheepfold1.jpg',
      cowbarn: './assets/cowbarn1.jpg',
      fields: './assets/fields.jpg',
      market: './assets/market.jpg',
      orders: './assets/orders.jpg',
      research: './assets/research.jpg'
    };
    return map[screen] || map.home;
  }

  function label(screen){
    return {
      home:'Моя ферма',
      coop:'Курятник',
      pigsty:'Свинарник',
      sheepfold:'Овчарня',
      cowbarn:'Коровник',
      fields:'Поля',
      market:'Рынок',
      orders:'Заказы',
      research:'Исследования'
    }[screen] || 'Моя ферма';
  }

  function setScreen(screen, notice=true){
    if (!screens.includes(screen)) screen = 'home';
    if (bootFallback) bootFallback.classList.add('hide');
    state.screen = screen;
    const src = assetFor(screen);
    if (screenArt.getAttribute('src') !== src) screenArt.src = src;
    renderHitboxes();
    save();
    if (notice) toast(label(screen));
  }

  function toast(text){
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 1500);
  }

  // Coordinates are % of the whole art, now matched because CSS uses object-fit: fill.
  function hit(x,y,w,h,action,label=''){
    const b = document.createElement('button');
    b.className = 'hit';
    b.type = 'button';
    b.setAttribute('aria-label', label || 'button');
    b.style.left = x + '%';
    b.style.top = y + '%';
    b.style.width = w + '%';
    b.style.height = h + '%';
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      action();
    });
    hitLayer.appendChild(b);
  }

  function renderHitboxes(){
    hitLayer.innerHTML = '';
    hudLayer.innerHTML = '';
    if (state.screen === 'home') return homeHitboxes();
    if (animals.includes(state.screen)) return animalHitboxes(state.screen);
    return contentHitboxes(state.screen);
  }

  function homeHitboxes(){
    // Top bar
    hit(1.5, 1.0, 12.5, 7.3, () => openWallet(), 'Профиль');
    hit(17.2, 1.0, 18.7, 5.8, () => openWallet(), 'Монеты');
    hit(39.0, 1.0, 17.2, 5.8, () => openWallet(), 'Кристаллы');
    hit(63.0, 1.0, 20.5, 5.8, () => openWallet(), 'Энергия');
    hit(89.2, 1.0, 8.9, 5.9, () => openMenu(), 'Меню');

    // Side buttons from reference
    hit(3.0, 10.0, 15.2, 9.1, () => openTasks(), 'Квесты');
    hit(82.0, 10.0, 15.5, 9.1, () => claimBonus(), 'Бонусы');

    // Scene interactive areas
    hit(27.0, 21.0, 44.0, 19.0, () => toast('Дом фермы. Уровень ' + state.level), 'Дом');
    hit(4.2, 31.4, 25.0, 14.6, () => setScreen('coop'), 'Курятник на карте');
    hit(61.0, 33.4, 33.0, 16.5, () => setScreen('fields'), 'Поля на карте');

    // Big cards: corrected to actual visual grid
    hit(6.0, 50.7, 28.0, 11.0, () => setScreen('coop'), 'Животные');
    hit(36.1, 50.7, 28.0, 11.0, () => setScreen('fields'), 'Поля');
    hit(66.1, 50.7, 28.0, 11.0, () => setScreen('market'), 'Рынок');

    hit(6.0, 65.0, 28.0, 11.0, () => setScreen('orders'), 'Заказы');
    hit(36.1, 65.0, 28.0, 11.0, () => setScreen('research'), 'Исследования');
    hit(66.1, 65.0, 28.0, 11.0, () => openAchievements(), 'Достижения');

    // Bottom nav: corrected
    hit(0.0, 85.8, 20.0, 14.2, () => openShop(), 'Магазин');
    hit(20.0, 85.8, 20.0, 14.2, () => openFriends(), 'Друзья');
    hit(40.0, 85.8, 20.0, 14.2, () => openTasks(), 'Задания');
    hit(60.0, 85.8, 20.0, 14.2, () => openMail(), 'Почта');
    hit(80.0, 85.8, 20.0, 14.2, () => openSettings(), 'Настройки');
  }

  const animalCfg = {
    coop: { count:'chickens', level:'coopLevel', capacity:'coopCapacity', product:'eggs', productName:'яйца', buyCost:100, addCapacity:4, maxLevel:4, label:'курица' },
    pigsty: { count:'pigs', level:'pigstyLevel', capacity:'pigstyCapacity', product:'meat', productName:'мясо', buyCost:300, addCapacity:1, maxLevel:4, label:'свинья' },
    sheepfold: { count:'sheep', level:'sheepfoldLevel', capacity:'sheepfoldCapacity', product:'wool', productName:'шерсть', buyCost:250, addCapacity:2, maxLevel:4, label:'овца' },
    cowbarn: { count:'cows', level:'cowbarnLevel', capacity:'cowbarnCapacity', product:'milk', productName:'молоко', buyCost:500, addCapacity:1, maxLevel:4, label:'корова' }
  };

  function animalHitboxes(screen){
    hit(1.5, 1.2, 10.5, 6.5, () => setScreen('home'), 'Назад');
    hit(73.0, 1.0, 24.5, 8.0, () => openWallet(), 'Баланс');

    // Main scene tap collects product.
    hit(6.0, 13.0, 88.0, 38.0, () => collectAnimal(screen), 'Сцена животного');

    // Bottom info cards / buttons — corrected lower row
    hit(4.0, 68.0, 28.0, 12.5, () => upgradeAnimal(screen), 'Улучшить');
    hit(35.8, 68.0, 28.2, 12.5, () => buyAnimal(screen), 'Купить животное');
    hit(67.5, 68.0, 28.7, 12.5, () => collectAnimal(screen), 'Собрать');

    // Animal tab bar
    hit(0.0, 87.0, 20.0, 13.0, () => setScreen('home'), 'Ферма');
    hit(20.0, 87.0, 20.0, 13.0, () => setScreen('coop'), 'Курятник');
    hit(40.0, 87.0, 20.0, 13.0, () => setScreen('pigsty'), 'Свинарник');
    hit(60.0, 87.0, 20.0, 13.0, () => setScreen('sheepfold'), 'Овчарня');
    hit(80.0, 87.0, 20.0, 13.0, () => setScreen('cowbarn'), 'Коровник');
  }

  function contentHitboxes(screen){
    hit(1.5, 1.2, 10.5, 6.5, () => setScreen('home'), 'Назад');
    hit(73.0, 1.0, 24.5, 8.0, () => openWallet(), 'Баланс');

    if (screen === 'fields') {
      // crop cards and collect all button
      hit(6.0, 19.0, 42.0, 17.0, () => collectCrop('wheat'), 'Пшеница');
      hit(52.0, 19.0, 42.0, 17.0, () => collectCrop('corn'), 'Кукуруза');
      hit(6.0, 38.0, 42.0, 17.0, () => collectCrop('carrot'), 'Морковь');
      hit(52.0, 38.0, 42.0, 17.0, () => collectCrop('pumpkin'), 'Тыква');
      hit(24.0, 59.0, 52.0, 8.0, () => collectAllCrops(), 'Собрать всё');
    } else if (screen === 'market') {
      // sell buttons: right side list
      hit(70.0, 19.0, 24.0, 6.5, () => sell('eggs',5,50), 'Продать яйца');
      hit(70.0, 27.0, 24.0, 6.5, () => sell('milk',2,60), 'Продать молоко');
      hit(70.0, 35.0, 24.0, 6.5, () => sell('wool',2,70), 'Продать шерсть');
      hit(70.0, 43.0, 24.0, 6.5, () => sell('meat',1,90), 'Продать мясо');
      hit(6.0, 56.0, 88.0, 11.0, () => renderMarketModal(), 'Мой склад');
    } else if (screen === 'orders') {
      hit(61.0, 19.0, 33.0, 8.0, () => completeOrder(1), 'Заказ кафе');
      hit(61.0, 30.0, 33.0, 8.0, () => completeOrder(2), 'Заказ фабрики');
      hit(61.0, 41.0, 33.0, 8.0, () => completeOrder(3), 'Заказ рынка');
    } else if (screen === 'research') {
      hit(6.0, 20.0, 88.0, 14.0, () => buyResearch(), 'Исследование');
      hit(6.0, 39.0, 88.0, 14.0, () => toast('Молочный завод: уровень ' + state.factories.dairy), 'Завод');
    }

    // Bottom nav for content screens
    hit(0.0, 87.0, 20.0, 13.0, () => setScreen('home'), 'Ферма');
    hit(20.0, 87.0, 20.0, 13.0, () => setScreen('coop'), 'Животные');
    hit(40.0, 87.0, 20.0, 13.0, () => setScreen('fields'), 'Поля');
    hit(60.0, 87.0, 20.0, 13.0, () => setScreen('market'), 'Рынок');
    hit(80.0, 87.0, 20.0, 13.0, () => setScreen('orders'), 'Заказы');
  }

  function upgradeCost(screen){
    const base = { coop:1500, pigsty:2500, sheepfold:2800, cowbarn:3200 }[screen] || 1500;
    return base + ((state[animalCfg[screen].level] || 1)-1)*1100;
  }

  function productIcon(p){ return {eggs:'🥚', meat:'🥩', wool:'🧶', milk:'🥛'}[p] || '📦'; }

  function collectAnimal(screen){
    const c = animalCfg[screen];
    const gain = Math.max(1, state[c.count] || 1) * (screen === 'coop' ? 3 : 2);
    state[c.product] += gain;
    if (screen === 'coop') state.tasks.eggs = true;
    save(); renderHitboxes();
    toast(`Собрано: ${c.productName} +${gain}`);
  }

  function buyAnimal(screen){
    const c = animalCfg[screen];
    if (state[c.count] >= state[c.capacity]) return toast('Нет свободных мест. Улучши загон.');
    if (state.coins < c.buyCost) return toast('Нужно ' + fmt(c.buyCost) + ' монет');
    state.coins -= c.buyCost;
    state[c.count] += 1;
    save(); renderHitboxes();
    toast(c.label[0].toUpperCase() + c.label.slice(1) + ' куплена');
  }

  function upgradeAnimal(screen){
    const c = animalCfg[screen];
    if (state[c.level] >= c.maxLevel) return toast('Максимальный уровень');
    const cost = upgradeCost(screen);
    if (state.coins < cost) return toast('Нужно ' + fmt(cost) + ' монет');
    state.coins -= cost;
    state[c.level] += 1;
    state[c.capacity] += c.addCapacity;
    save();
    if (screen === 'coop') screenArt.src = assetFor('coop');
    renderHitboxes();
    toast('Улучшено: +' + c.addCapacity + ' места');
  }

  function collectCrop(crop){
    const gain = {wheat:30, corn:20, carrot:20, pumpkin:10}[crop] || 10;
    state.crops[crop] += gain;
    state.tasks.wheat = true;
    save();
    toast('Урожай собран: +' + gain);
  }

  function collectAllCrops(){
    collectCrop('wheat');
    state.crops.corn += 20;
    state.crops.carrot += 20;
    state.crops.pumpkin += 10;
    save();
    toast('Весь урожай собран');
  }

  function sell(product, amount, price){
    if ((state[product] || 0) < amount) return toast('Недостаточно товара');
    state[product] -= amount;
    state.coins += price;
    state.soldToday += price;
    state.tasks.market = true;
    save();
    toast('Продано: +' + fmt(price) + ' монет');
  }

  function completeOrder(id){
    let ok = false;
    if(id===1 && state.eggs>=5 && state.milk>=2){ state.eggs-=5; state.milk-=2; state.coins+=280; ok=true; }
    if(id===2 && state.wool>=2 && state.meat>=1){ state.wool-=2; state.meat-=1; state.coins+=340; ok=true; }
    if(id===3 && state.crops.wheat>=20 && state.crops.corn>=10){ state.crops.wheat-=20; state.crops.corn-=10; state.coins+=220; ok=true; }
    if(!ok) return toast('Недостаточно ресурсов');
    state.tasks.order = true;
    save();
    toast('Заказ выполнен');
  }

  function buyResearch(){
    if(state.gems < 50) return toast('Нужно 50 кристаллов');
    state.gems -= 50;
    state.factories.dairy += 1;
    save();
    toast('Исследование готово');
  }

  function claimBonus(){
    if (state.dayClaimed) return toast('Сегодня бонус уже забран');
    state.dayClaimed = true;
    state.coins += 150;
    state.gems += 3;
    save();
    toast('Ежедневный бонус: +150 монет, +3 кристалла');
  }

  function modal(title, html){
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    overlay.hidden = false;
    modalBody.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', () => actions[el.dataset.action]?.());
    });
  }

  function closeModal(){ overlay.hidden = true; }
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  const actions = {
    bonus: () => { claimBonus(); closeModal(); },
    reset: () => {
      localStorage.removeItem(STORE_KEY);
      state = deepCopy(defaultState);
      closeModal();
      setScreen('home');
      toast('Прогресс сброшен');
    },
    debug: () => {
      game.classList.toggle('debug-hitboxes');
      toast(game.classList.contains('debug-hitboxes') ? 'Debug hitboxes ON' : 'Debug hitboxes OFF');
    }
  };

  function resourcesHtml(){
    return `<div class="resource-line">
      <div class="resource">🪙 ${fmt(state.coins)}</div>
      <div class="resource">💎 ${fmt(state.gems)}</div>
      <div class="resource">⚡ ${state.energy}/100</div>
    </div>`;
  }

  function openWallet(){
    modal('Баланс', resourcesHtml() + `
      <div class="row"><div class="item-left"><span class="ico">🥚</span><div><div class="name">Яйца</div><div class="sub">${state.eggs}</div></div></div></div>
      <div class="row"><div class="item-left"><span class="ico">🥛</span><div><div class="name">Молоко</div><div class="sub">${state.milk}</div></div></div></div>
      <div class="note">v11: исправлены поля кнопок и масштабирование на iPhone.</div>`);
  }

  function openMenu(){
    modal('Меню', resourcesHtml() + `
      <div class="grid">
        <button class="btn" data-action="bonus">Забрать бонус</button>
        <button class="btn blue" onclick="location.reload()">Перезагрузить</button>
        <button class="btn gold" data-action="debug">Показать зоны</button>
        <button class="btn gold" data-action="reset">Сбросить</button>
      </div>
      <div class="note">Кнопка “Показать зоны” нужна для проверки совпадения кликов с дизайном.</div>`);
  }

  function openTasks(){
    const t = state.tasks;
    modal('Задания', resourcesHtml() + `
      <div class="task"><div><div class="name">Собери яйца</div><div class="sub">Награда: 120 монет</div></div><span>${t.eggs?'✅':'⬜'}</span></div>
      <div class="task"><div><div class="name">Продай товар на рынке</div><div class="sub">Награда: 150 монет</div></div><span>${t.market?'✅':'⬜'}</span></div>
      <div class="task"><div><div class="name">Собери урожай</div><div class="sub">Награда: 100 монет</div></div><span>${t.wheat?'✅':'⬜'}</span></div>
      <div class="task"><div><div class="name">Выполни заказ</div><div class="sub">Награда: 250 монет</div></div><span>${t.order?'✅':'⬜'}</span></div>`);
  }

  function openAchievements(){
    modal('Достижения', resourcesHtml() + `
      <div class="row"><div class="item-left"><span class="ico">🏆</span><div><div class="name">Фермер 12 уровня</div><div class="sub">Развивай ферму дальше</div></div></div><span>✅</span></div>
      <div class="row"><div class="item-left"><span class="ico">🐔</span><div><div class="name">Куриный старт</div><div class="sub">${state.chickens}/${state.coopCapacity} мест занято</div></div></div><span>⭐</span></div>`);
  }

  function openShop(){
    modal('Магазин', resourcesHtml() + `
      ${shopRow('🐔','Курица','coop',100)}
      ${shopRow('🐷','Свинья','pigsty',300)}
      ${shopRow('🐑','Овца','sheepfold',250)}
      ${shopRow('🐄','Корова','cowbarn',500)}`);
  }
  function shopRow(icon,name,screen,cost){
    return `<div class="shop-item"><div class="item-left"><span class="ico">${icon}</span><div><div class="name">${name}</div><div class="sub">${cost} монет</div></div></div><button class="btn small" onclick="window.gameBuy('${screen}')">Купить</button></div>`;
  }

  function openFriends(){ modal('Друзья', resourcesHtml() + `<div class="card">Здесь позже будет список друзей из Telegram и подарки.</div>`); }
  function openMail(){ modal('Почта', resourcesHtml() + `<div class="card">Письмо: “Ферма открыта для публичного запуска!”</div>`); }
  function openSettings(){ modal('Настройки', resourcesHtml() + `<button class="btn gold" data-action="reset">Сбросить прогресс</button><button class="btn blue" data-action="debug">Показать зоны кликов</button><div class="note">v11 bugfix build.</div>`); }

  window.gameBuy = function(screen){
    buyAnimal(screen);
    openShop();
  };

  function renderFieldsModal(){
    modal('Поля', resourcesHtml() + `
      <div class="grid">
        <div class="card"><div class="name">🌾 Пшеница</div><div class="sub">${state.crops.wheat} шт.</div></div>
        <div class="card"><div class="name">🌽 Кукуруза</div><div class="sub">${state.crops.corn} шт.</div></div>
        <div class="card"><div class="name">🥕 Морковь</div><div class="sub">${state.crops.carrot} шт.</div></div>
        <div class="card"><div class="name">🎃 Тыква</div><div class="sub">${state.crops.pumpkin} шт.</div></div>
      </div>
      <button class="btn" onclick="window.collectAllCrops()">Собрать всё</button>`);
  }

  window.collectAllCrops = function(){
    collectAllCrops();
    renderFieldsModal();
  };

  function renderMarketModal(){
    modal('Рынок', resourcesHtml() + `
      ${marketRow('🥚','Яйца','eggs',5,50)}
      ${marketRow('🥛','Молоко','milk',2,60)}
      ${marketRow('🧶','Шерсть','wool',2,70)}
      ${marketRow('🥩','Мясо','meat',1,90)}
      <div class="note">Продано сегодня: ${fmt(state.soldToday)} монет</div>`);
  }
  function marketRow(icon,name,key,amount,price){
    return `<div class="row"><div class="item-left"><span class="ico">${icon}</span><div><div class="name">${name}</div><div class="sub">На складе: ${state[key] || 0}</div></div></div><button class="btn small" onclick="window.sellProduct('${key}',${amount},${price})">+${price}</button></div>`;
  }
  window.sellProduct = function(k,a,p){ sell(k,a,p); renderMarketModal(); };

  function renderOrdersModal(){
    modal('Заказы', resourcesHtml() + `
      <div class="order"><div><div class="name">Заказ кафе</div><div class="sub">5 яиц + 2 молока</div></div><button class="btn small" onclick="window.completeOrder(1)">280 🪙</button></div>
      <div class="order"><div><div class="name">Заказ фабрики</div><div class="sub">2 шерсти + 1 мясо</div></div><button class="btn small" onclick="window.completeOrder(2)">340 🪙</button></div>
      <div class="order"><div><div class="name">Заказ рынка</div><div class="sub">20 пшеницы + 10 кукурузы</div></div><button class="btn small" onclick="window.completeOrder(3)">220 🪙</button></div>`);
  }
  window.completeOrder = function(id){
    completeOrder(id);
    renderOrdersModal();
  };

  function renderResearchModal(){
    modal('Исследования', resourcesHtml() + `
      <div class="card"><div class="name">💧 Быстрый сбор</div><div class="sub">Сокращает время производства. Стоимость: 50 💎</div><button class="btn blue" onclick="window.buyResearch()">Изучить</button></div>
      <div class="card"><div class="name">🏭 Молочный завод</div><div class="sub">Уровень ${state.factories.dairy}</div><div class="progress"><i style="width:${Math.min(100,state.factories.dairy*25)}%"></i></div></div>`);
  }
  window.buyResearch = function(){
    buyResearch();
    renderResearchModal();
  };

  function openScreenModal(){
    if(state.screen==='fields') renderFieldsModal();
    if(state.screen==='market') renderMarketModal();
    if(state.screen==='orders') renderOrdersModal();
    if(state.screen==='research') renderResearchModal();
  }

  let startY = 0;
  document.addEventListener('touchstart', e => { if (e.touches[0]) startY = e.touches[0].clientY; }, {passive:false});
  document.addEventListener('touchmove', e => {
    if (!e.touches[0]) return;
    const y = e.touches[0].clientY;
    if (window.scrollY <= 0 && y > startY) e.preventDefault();
  }, {passive:false});

  screenArt.addEventListener('load', () => { if (bootFallback) bootFallback.classList.add('hide'); });
  screenArt.addEventListener('error', () => {
    screenArt.src = './assets/fallback.svg';
    toast('Картинка не загрузилась, включён fallback');
  });

  initTelegram();
  setScreen(state.screen || 'home', false);
})();
