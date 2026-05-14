
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

  const STORE_KEY = 'my-farm-miniapp-v10-design-fixed';
  const fmt = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

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

  function deepCopy(o){ return JSON.parse(JSON.stringify(o)); }
  function deepMerge(a,b){
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

  const screens = ['home','coop','pigsty','sheepfold','cowbarn','fields','market','orders','research'];

  function save(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch(e){} }

  function initTelegram(){
    try {
      const tg = window.Telegram && window.Telegram.WebApp;
      if (!tg) return;
      tg.ready();
      tg.expand();
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

  function setScreen(name, notice=true){
    if (!screens.includes(name)) name = 'home';
    if (bootFallback) bootFallback.classList.add('hide');
    state.screen = name;
    const src = assetFor(name);
    if (screenArt.getAttribute('src') !== src) screenArt.src = src;
    render();
    save();
    if (notice) toast(label(name));
  }

  function label(name){
    return {
      home:'Моя ферма', coop:'Курятник', pigsty:'Свинарник',
      sheepfold:'Овчарня', cowbarn:'Коровник', fields:'Поля',
      market:'Рынок', orders:'Заказы', research:'Исследования'
    }[name] || 'Моя ферма';
  }

  function toast(text){
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 1650);
  }

  function hit(x,y,w,h,action,label=''){
    const b = document.createElement('button');
    b.className = 'hit';
    b.setAttribute('aria-label', label || 'button');
    b.style.left = x + '%'; b.style.top = y + '%'; b.style.width = w + '%'; b.style.height = h + '%';
    b.addEventListener('click', action);
    hitLayer.appendChild(b);
  }

  function chip(x,y,text,cls=''){
    const c = document.createElement('div');
    c.className = 'float-chip ' + cls;
    c.style.left = x + '%'; c.style.top = y + '%';
    c.textContent = text;
    hudLayer.appendChild(c);
  }

  function render(){
    hitLayer.innerHTML = '';
    hudLayer.innerHTML = '';
    const s = state.screen;
    if (s === 'home') homeHits();
    else if (['coop','pigsty','sheepfold','cowbarn'].includes(s)) animalHits(s);
    else contentHits(s);
    if (s === 'home' || ['fields','market','orders','research'].includes(s)) homeHud();
    if (['coop','pigsty','sheepfold','cowbarn'].includes(s)) animalHud(s);
  }

  function homeHits(){
    hit(2,9,16,8, () => openTasks(), 'Квесты');
    hit(82,8,15,8, () => claimBonus(), 'Бонусы');
    hit(89,1.5,9,5, () => openMenu(), 'Меню');

    hit(6,42,28,12, () => setScreen('coop'), 'Животные');
    hit(36,42,28,12, () => setScreen('fields'), 'Поля');
    hit(66,42,28,12, () => setScreen('market'), 'Рынок');
    hit(6,56,28,12, () => setScreen('orders'), 'Заказы');
    hit(36,56,28,12, () => setScreen('research'), 'Исследования');
    hit(66,56,28,12, () => openAchievements(), 'Достижения');

    hit(0,84,20,12, () => openShop(), 'Магазин');
    hit(20,84,20,12, () => openFriends(), 'Друзья');
    hit(40,84,20,12, () => openTasks(), 'Задания');
    hit(60,84,20,12, () => openMail(), 'Почта');
    hit(80,84,20,12, () => openSettings(), 'Настройки');

    hit(30,25,40,19, () => toast('Дом фермы. Уровень ' + state.level), 'Дом');
    hit(5,28,25,18, () => setScreen('coop'), 'Курятник на карте');
    hit(63,33,30,18, () => setScreen('fields'), 'Поля на карте');
  }

  function contentHits(s){
    hit(2,1.5,11,6, () => setScreen('home'), 'Назад');
    hit(5,12,90,66, () => openScreenModal(), label(s));
    hit(0,86,20,12, () => setScreen('home'), 'Ферма');
    hit(20,86,20,12, () => setScreen('coop'), 'Животные');
    hit(40,86,20,12, () => setScreen('fields'), 'Поля');
    hit(60,86,20,12, () => setScreen('market'), 'Рынок');
    hit(80,86,20,12, () => setScreen('orders'), 'Заказы');
  }

  function homeHud(){
    chip(29,3.3, '🪙 ' + fmt(state.coins));
    chip(51,3.3, '💎 ' + fmt(state.gems));
    chip(74,3.3, '⚡ ' + state.energy + '/100');
  }

  const configs = {
    coop: { count:'chickens', level:'coopLevel', capacity:'coopCapacity', product:'eggs', productName:'яйца', buyCost:100, addCapacity:4, maxLevel:4, label:'курица' },
    pigsty: { count:'pigs', level:'pigstyLevel', capacity:'pigstyCapacity', product:'meat', productName:'мясо', buyCost:300, addCapacity:1, maxLevel:4, label:'свинья' },
    sheepfold: { count:'sheep', level:'sheepfoldLevel', capacity:'sheepfoldCapacity', product:'wool', productName:'шерсть', buyCost:250, addCapacity:2, maxLevel:4, label:'овца' },
    cowbarn: { count:'cows', level:'cowbarnLevel', capacity:'cowbarnCapacity', product:'milk', productName:'молоко', buyCost:500, addCapacity:1, maxLevel:4, label:'корова' }
  };

  function animalHits(s){
    hit(2,1.5,11,6, () => setScreen('home'), 'Назад');
    hit(74,1.5,22,6, () => openWallet(), 'Баланс');
    hit(5,47,28,18, () => upgradeAnimal(s), 'Улучшить');
    hit(36,47,28,18, () => buyAnimal(s), 'Купить');
    hit(68,47,28,18, () => collectAnimal(s), 'Собрать');
    hit(0,86,20,12, () => setScreen('home'), 'Ферма');
    hit(20,86,20,12, () => setScreen('coop'), 'Курятник');
    hit(40,86,20,12, () => setScreen('pigsty'), 'Свинарник');
    hit(60,86,20,12, () => setScreen('sheepfold'), 'Овчарня');
    hit(80,86,20,12, () => setScreen('cowbarn'), 'Коровник');
  }

  function animalHud(s){
    const c = configs[s];
    chip(51,7.7, 'Уровень ' + state[c.level], 'green');
    chip(83,18, `${state[c.count]}/${state[c.capacity]} мест`, 'green');
    chip(83,39, `${productIcon(c.product)} ${state[c.product]}`, 'green');
    chip(30,71.5, `Улучшить: ${fmt(upgradeCost(s))} 🪙`);
    chip(50,71.5, `Купить: ${fmt(c.buyCost)} 🪙`);
    chip(79,71.5, `Собрать ${c.productName}`, 'green');
  }

  function productIcon(p){ return {eggs:'🥚', meat:'🥩', wool:'🧶', milk:'🥛'}[p] || '📦'; }
  function upgradeCost(s){
    const base = { coop:1500, pigsty:2500, sheepfold:2800, cowbarn:3200 }[s] || 1500;
    return base + (state[configs[s].level]-1)*1100;
  }

  function collectAnimal(s){
    const c = configs[s];
    const gain = Math.max(1, state[c.count]) * (s === 'coop' ? 3 : 2);
    state[c.product] += gain;
    if (s === 'coop') state.tasks.eggs = true;
    save(); render();
    toast(`Собрано: ${c.productName} +${gain}`);
  }

  function buyAnimal(s){
    const c = configs[s];
    if (state[c.count] >= state[c.capacity]) return toast('Нет свободных мест. Улучши загон.');
    if (state.coins < c.buyCost) return toast('Нужно ' + fmt(c.buyCost) + ' монет');
    state.coins -= c.buyCost;
    state[c.count] += 1;
    save(); render();
    toast(c.label[0].toUpperCase() + c.label.slice(1) + ' куплена');
  }

  function upgradeAnimal(s){
    const c = configs[s];
    if (state[c.level] >= c.maxLevel) return toast('Максимальный уровень');
    const cost = upgradeCost(s);
    if (state.coins < cost) return toast('Нужно ' + fmt(cost) + ' монет');
    state.coins -= cost;
    state[c.level] += 1;
    state[c.capacity] += c.addCapacity;
    save();
    if (s === 'coop') screenArt.src = assetFor('coop');
    render();
    toast('Улучшено: +' + c.addCapacity + ' места');
  }

  function sell(product, amount, price){
    if ((state[product] || 0) < amount) return toast('Недостаточно товара');
    state[product] -= amount;
    state.coins += price;
    state.soldToday += price;
    state.tasks.market = true;
    save(); render();
    toast('Продано: +' + fmt(price) + ' монет');
  }

  function claimBonus(){
    if (state.dayClaimed) return toast('Сегодня бонус уже забран');
    state.dayClaimed = true;
    state.coins += 150;
    state.gems += 3;
    save(); render();
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
    collectEggs: () => { collectAnimal('coop'); closeModal(); },
    bonus: () => { claimBonus(); closeModal(); },
    reset: () => {
      localStorage.removeItem(STORE_KEY);
      state = deepCopy(defaultState);
      closeModal();
      setScreen('home');
      toast('Прогресс сброшен');
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
    modal('Баланс', resourcesHtml() + `<div class="note">Баланс сохраняется в localStorage. Telegram Mini App SDK подключён.</div>`);
  }

  function openMenu(){
    modal('Меню', resourcesHtml() + `
      <div class="grid">
        <button class="btn" data-action="bonus">Забрать бонус</button>
        <button class="btn blue" onclick="location.reload()">Перезагрузить</button>
      </div>
      <div class="note">Версия v10: дизайн + iOS height fix.</div>`);
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
      <div class="shop-item"><div class="item-left"><span class="ico">🐔</span><div><div class="name">Курица</div><div class="sub">100 монет</div></div></div><button class="btn small" onclick="window.gameBuy('coop')">Купить</button></div>
      <div class="shop-item"><div class="item-left"><span class="ico">🐷</span><div><div class="name">Свинья</div><div class="sub">300 монет</div></div></div><button class="btn small" onclick="window.gameBuy('pigsty')">Купить</button></div>
      <div class="shop-item"><div class="item-left"><span class="ico">🐑</span><div><div class="name">Овца</div><div class="sub">250 монет</div></div></div><button class="btn small" onclick="window.gameBuy('sheepfold')">Купить</button></div>
      <div class="shop-item"><div class="item-left"><span class="ico">🐄</span><div><div class="name">Корова</div><div class="sub">500 монет</div></div></div><button class="btn small" onclick="window.gameBuy('cowbarn')">Купить</button></div>`);
  }

  function openFriends(){ modal('Друзья', resourcesHtml() + `<div class="card">Здесь позже будет список друзей из Telegram и подарки.</div>`); }
  function openMail(){ modal('Почта', resourcesHtml() + `<div class="card">Письмо: “Ферма открыта для публичного запуска!”</div>`); }
  function openSettings(){ modal('Настройки', resourcesHtml() + `<button class="btn gold" data-action="reset">Сбросить прогресс</button><div class="note">Звук и музыка будут добавлены следующим билдом.</div>`); }

  window.gameBuy = function(s){ buyAnimal(s); openShop(); };

  function openScreenModal(){
    if(state.screen==='fields') renderFieldsModal();
    if(state.screen==='market') renderMarketModal();
    if(state.screen==='orders') renderOrdersModal();
    if(state.screen==='research') renderResearchModal();
  }

  function renderFieldsModal(){
    modal('Поля', resourcesHtml() + `
      <div class="grid">
        <div class="card"><div class="name">🌾 Пшеница</div><div class="sub">${state.crops.wheat} шт.</div></div>
        <div class="card"><div class="name">🌽 Кукуруза</div><div class="sub">${state.crops.corn} шт.</div></div>
        <div class="card"><div class="name">🥕 Морковь</div><div class="sub">${state.crops.carrot} шт.</div></div>
        <div class="card"><div class="name">🎃 Тыква</div><div class="sub">${state.crops.pumpkin} шт.</div></div>
      </div>
      <button class="btn" onclick="window.collectCrops()">Собрать всё</button>`);
  }

  window.collectCrops = function(){
    state.crops.wheat += 30; state.crops.corn += 20; state.crops.carrot += 20; state.crops.pumpkin += 10;
    state.tasks.wheat = true;
    save(); renderFieldsModal(); toast('Урожай собран');
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
    let ok = false;
    if(id===1 && state.eggs>=5 && state.milk>=2){ state.eggs-=5; state.milk-=2; state.coins+=280; ok=true; }
    if(id===2 && state.wool>=2 && state.meat>=1){ state.wool-=2; state.meat-=1; state.coins+=340; ok=true; }
    if(id===3 && state.crops.wheat>=20 && state.crops.corn>=10){ state.crops.wheat-=20; state.crops.corn-=10; state.coins+=220; ok=true; }
    if(!ok) return toast('Недостаточно ресурсов');
    state.tasks.order = true; save(); renderOrdersModal(); toast('Заказ выполнен');
  };

  function renderResearchModal(){
    modal('Исследования', resourcesHtml() + `
      <div class="card"><div class="name">💧 Быстрый сбор</div><div class="sub">Сокращает время производства. Стоимость: 50 💎</div><button class="btn blue" onclick="window.buyResearch()">Изучить</button></div>
      <div class="card"><div class="name">🏭 Молочный завод</div><div class="sub">Улучшает переработку молока.</div><div class="progress"><i style="width:${Math.min(100,state.factories.dairy*25)}%"></i></div></div>`);
  }
  window.buyResearch = function(){
    if(state.gems<50) return toast('Нужно 50 кристаллов');
    state.gems-=50; state.factories.dairy += 1; save(); renderResearchModal(); toast('Исследование готово');
  };

  let startY = 0;
  document.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, {passive:false});
  document.addEventListener('touchmove', e => {
    const y = e.touches[0].clientY;
    if (window.scrollY <= 0 && y > startY) e.preventDefault();
  }, {passive:false});

  screenArt.addEventListener('load', () => { if (bootFallback) bootFallback.classList.add('hide'); });
  screenArt.addEventListener('error', () => { toast('Картинка не загрузилась, включён fallback'); });

  initTelegram();
  setScreen(state.screen || 'home', false);
})();
