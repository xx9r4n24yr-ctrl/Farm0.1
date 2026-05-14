
(function(){
  "use strict";
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const game=$('#game'), scene=$('#scene'), homePanel=$('#homePanel'), animalPanel=$('#animalPanel'), simplePanel=$('#simplePanel');
  const toastEl=$('#toast'), overlay=$('#modalOverlay'), modalTitle=$('#modalTitle'), modalBody=$('#modalBody');
  const STORE='farm_v8_no_green';
  const fmt=n=>String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const defaults={screen:'home',coins:12450,gems:320,energy:78,level:12,dayClaimed:false,
    chickens:4,coopLevel:1,coopCapacity:4,eggs:6,
    pigs:1,pigstyLevel:1,pigstyCapacity:1,meat:2,
    sheep:1,sheepfoldLevel:1,sheepfoldCapacity:1,wool:2,
    cows:1,cowbarnLevel:1,cowbarnCapacity:1,milk:2,
    crops:{wheat:120,corn:90,carrot:110,pumpkin:80},tasks:{eggs:false,market:false,order:false,wheat:false}};
  function copy(o){return JSON.parse(JSON.stringify(o))}
  function merge(a,b){for(const k in b){a[k]=b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])?merge(a[k]||{},b[k]):b[k]}return a}
  let state; try{state=merge(copy(defaults),JSON.parse(localStorage.getItem(STORE)||'{}'))}catch(e){state=copy(defaults)}
  function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){}}
  function tgInit(){try{const tg=window.Telegram&&window.Telegram.WebApp;if(!tg)return;tg.ready();tg.expand();tg.disableVerticalSwipes&&tg.disableVerticalSwipes();tg.setHeaderColor&&tg.setHeaderColor('#1497d7');tg.setBackgroundColor&&tg.setBackgroundColor('#0c663a')}catch(e){}}
  function toast(t){toastEl.textContent=t;toastEl.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>toastEl.classList.remove('show'),1600)}
  function updateTop(){$('#coins').textContent=fmt(state.coins);$('#gems').textContent=fmt(state.gems);$('#energy').textContent=state.energy+'/100'}
  const animalCfg={
    coop:{title:'КУРЯТНИК',emoji:'🐔',count:'chickens',level:'coopLevel',cap:'coopCapacity',product:'eggs',productName:'яиц',unit:'курицу',cost:100,add:4,max:4,asset:()=>`assets/coop${Math.max(1,Math.min(4,state.coopLevel))}.svg`},
    pigsty:{title:'СВИНАРНИК',emoji:'🐷',count:'pigs',level:'pigstyLevel',cap:'pigstyCapacity',product:'meat',productName:'мяса',unit:'свинью',cost:300,add:1,max:4,asset:()=>`assets/pigsty1.svg`},
    sheepfold:{title:'ОВЧАРНЯ',emoji:'🐑',count:'sheep',level:'sheepfoldLevel',cap:'sheepfoldCapacity',product:'wool',productName:'шерсти',unit:'овцу',cost:250,add:2,max:4,asset:()=>`assets/sheepfold1.svg`},
    cowbarn:{title:'КОРОВНИК',emoji:'🐄',count:'cows',level:'cowbarnLevel',cap:'cowbarnCapacity',product:'milk',productName:'молока',unit:'корову',cost:500,add:1,max:4,asset:()=>`assets/cowbarn1.svg`}
  };
  function bgFor(screen){
    if(screen==='home')return 'assets/home.svg';
    if(animalCfg[screen])return animalCfg[screen].asset();
    return `assets/${screen}.svg`;
  }
  function setScreen(screen){
    state.screen=screen; save(); updateTop();
    scene.style.backgroundImage=`url("${bgFor(screen)}")`;
    game.className='game screen-'+screen;
    const animal=animalCfg[screen];
    homePanel.hidden=screen!=='home';
    animalPanel.hidden=!animal;
    simplePanel.hidden=screen==='home'||!!animal;
    if(animal) renderAnimal(screen);
    else if(screen!=='home') renderSimple(screen);
  }
  function renderAnimal(screen){
    const c=animalCfg[screen];
    $('#animalTitle').textContent=c.title;
    $('#animalStage').textContent=Array(Math.min(state[c.count],10)).fill(c.emoji).join(' ');
    $('#levelTitle').textContent='УРОВЕНЬ '+state[c.level];
    $('#levelText').textContent='Мест: '+state[c.cap]+' • след. +'+c.add;
    $('#animalCardTitle').textContent=c.title==='КУРЯТНИК'?'КУРИЦЫ':c.title;
    $('#animalText').textContent='Куплено '+state[c.count]+'/'+state[c.cap];
    const icon={eggs:'🥚',milk:'🥛',wool:'🧶',meat:'🥩'}[c.product];
    $('#productText').textContent=icon+' '+state[c.product];
    $('#upgradeBtn').textContent=state[c.level]>=c.max?'Макс. уровень':'Улучшить '+fmt(upgradeCost(screen));
    $('#buyBtn').textContent='Купить '+fmt(c.cost);
  }
  function upgradeCost(s){const base={coop:1500,pigsty:2500,sheepfold:2800,cowbarn:3200}[s]||1500;return base+(state[animalCfg[s].level]-1)*1100}
  function activeAnimal(){return state.screen&&animalCfg[state.screen]?state.screen:'coop'}
  function buyAnimal(s=activeAnimal()){const c=animalCfg[s]; if(state[c.count]>=state[c.cap])return toast('Нет свободных мест'); if(state.coins<c.cost)return toast('Нужно '+fmt(c.cost)+' монет'); state.coins-=c.cost; state[c.count]++; save(); setScreen(s); toast('Куплена '+c.unit)}
  function upgradeAnimal(s=activeAnimal()){const c=animalCfg[s],cost=upgradeCost(s); if(state[c.level]>=c.max)return toast('Максимальный уровень'); if(state.coins<cost)return toast('Нужно '+fmt(cost)+' монет'); state.coins-=cost; state[c.level]++; state[c.cap]+=c.add; save(); setScreen(s); toast('Загон улучшен')}
  function collectAnimal(s=activeAnimal()){const c=animalCfg[s]; const gain=Math.max(1,state[c.count])*(s==='coop'?3:2); state[c.product]+=gain; if(s==='coop')state.tasks.eggs=true; save(); setScreen(s); toast('Собрано: +'+gain+' '+c.productName)}
  function renderSimple(screen){
    const titles={fields:'ПОЛЯ',market:'РЫНОК',orders:'ЗАКАЗЫ',research:'ИССЛЕДОВАНИЯ'};
    $('#simpleTitle').textContent=titles[screen]||'ЭКРАН';
    if(screen==='fields') $('#simpleContent').innerHTML=`<div class="row"><span>🌾 Пшеница</span><b>${state.crops.wheat}</b></div><div class="row"><span>🌽 Кукуруза</span><b>${state.crops.corn}</b></div><div class="row"><span>🥕 Морковь</span><b>${state.crops.carrot}</b></div><button class="btn" id="collectCrops">Собрать урожай</button>`;
    if(screen==='market') $('#simpleContent').innerHTML=rowSell('🥚 Яйца','eggs',5,50)+rowSell('🥛 Молоко','milk',2,60)+rowSell('🧶 Шерсть','wool',2,70)+rowSell('🥩 Мясо','meat',1,90);
    if(screen==='orders') $('#simpleContent').innerHTML=`<div class="row"><span>Кафе: 5 яиц + 2 молока</span><button class="btn" id="order1">280 🪙</button></div><div class="row"><span>Фабрика: 2 шерсти + 1 мясо</span><button class="btn" id="order2">340 🪙</button></div>`;
    if(screen==='research') $('#simpleContent').innerHTML=`<div class="row"><span>💧 Быстрый сбор</span><button class="btn" id="research1">50 💎</button></div><div class="row"><span>🏭 Молочный завод</span><b>Ур. 1</b></div>`;
    bindSimple(screen);
  }
  function rowSell(label,k,a,p){return `<div class="row"><span>${label}: ${state[k]}</span><button class="btn sell" data-k="${k}" data-a="${a}" data-p="${p}">+${p}</button></div>`}
  function bindSimple(screen){
    const cc=$('#collectCrops'); if(cc) cc.onclick=()=>{state.crops.wheat+=30;state.crops.corn+=20;state.crops.carrot+=20;state.tasks.wheat=true;save();setScreen('fields');toast('Урожай собран')};
    $$('.sell').forEach(b=>b.onclick=()=>{const k=b.dataset.k,a=+b.dataset.a,p=+b.dataset.p;if(state[k]<a)return toast('Недостаточно товара');state[k]-=a;state.coins+=p;state.tasks.market=true;save();setScreen('market');toast('Продано +'+p)});
    const o1=$('#order1'); if(o1)o1.onclick=()=>{if(state.eggs<5||state.milk<2)return toast('Недостаточно ресурсов');state.eggs-=5;state.milk-=2;state.coins+=280;state.tasks.order=true;save();setScreen('orders');toast('Заказ выполнен')};
    const o2=$('#order2'); if(o2)o2.onclick=()=>{if(state.wool<2||state.meat<1)return toast('Недостаточно ресурсов');state.wool-=2;state.meat-=1;state.coins+=340;state.tasks.order=true;save();setScreen('orders');toast('Заказ выполнен')};
    const r=$('#research1'); if(r)r.onclick=()=>{if(state.gems<50)return toast('Нужно 50 кристаллов');state.gems-=50;save();setScreen('research');toast('Исследование готово')};
  }
  function resources(){return `<div class="resource-line"><div class="resource">🪙 ${fmt(state.coins)}</div><div class="resource">💎 ${fmt(state.gems)}</div><div class="resource">⚡ ${state.energy}/100</div></div>`}
  function modal(title,html){modalTitle.textContent=title;modalBody.innerHTML=html;overlay.hidden=false}
  function close(){overlay.hidden=true}
  function bonus(){if(state.dayClaimed)return toast('Бонус уже забран');state.dayClaimed=true;state.coins+=150;state.gems+=3;save();updateTop();toast('+150 монет, +3 кристалла')}
  $('#modalClose').onclick=close; overlay.onclick=e=>{if(e.target===overlay)close()};
  $('#backBtn').onclick=()=>setScreen('home'); $('#simpleBackBtn').onclick=()=>setScreen('home');
  $('#upgradeBtn').onclick=()=>upgradeAnimal(); $('#buyBtn').onclick=()=>buyAnimal(); $('#collectBtn').onclick=()=>collectAnimal();
  $$('.card[data-screen]').forEach(b=>b.onclick=()=>setScreen(b.dataset.screen));
  $('#questBtn').onclick=()=>modal('Квесты',resources()+`<div class="row"><span>Собери яйца</span><b>${state.tasks.eggs?'✅':'⬜'}</b></div><div class="row"><span>Продай товар</span><b>${state.tasks.market?'✅':'⬜'}</b></div><div class="row"><span>Выполни заказ</span><b>${state.tasks.order?'✅':'⬜'}</b></div>`);
  $('#bonusBtn').onclick=bonus; $('#menuBtn').onclick=()=>modal('Меню',resources()+`<div class="row"><span>Версия</span><b>v8 fixed</b></div><button class="btn" id="resetBtn">Сбросить прогресс</button>`);
  $('#achievementsBtn').onclick=()=>modal('Достижения',resources()+`<div class="row"><span>🏆 Фермер 12 уровня</span><b>✅</b></div><div class="row"><span>🐔 Курятник открыт</span><b>✅</b></div>`);
  $$('.bottom-nav button').forEach(b=>b.onclick=()=>{const m=b.dataset.modal;if(m==='shop')modal('Магазин',resources()+`<div class="row"><span>🐔 Курица</span><button class="btn" onclick="window._buy('coop')">100</button></div><div class="row"><span>🐷 Свинья</span><button class="btn" onclick="window._buy('pigsty')">300</button></div><div class="row"><span>🐑 Овца</span><button class="btn" onclick="window._buy('sheepfold')">250</button></div><div class="row"><span>🐄 Корова</span><button class="btn" onclick="window._buy('cowbarn')">500</button></div>`);
    else if(m==='tasks')$('#questBtn').click(); else modal(m==='friends'?'Друзья':m==='mail'?'Почта':'Настройки',resources()+`<div class="row"><span>${m==='friends'?'Список друзей будет позже':m==='mail'?'Писем пока нет':'Настройки игры'}</span><b>🌱</b></div>`)});
  window._buy=s=>{buyAnimal(s); close()};
  document.addEventListener('click',e=>{if(e.target&&e.target.id==='resetBtn'){localStorage.removeItem(STORE);state=copy(defaults);close();setScreen('home');toast('Прогресс сброшен')}});
  let y0=0; document.addEventListener('touchstart',e=>{y0=e.touches[0].clientY},{passive:false}); document.addEventListener('touchmove',e=>{if(e.touches[0].clientY>y0)e.preventDefault()},{passive:false});
  tgInit(); setScreen(state.screen||'home'); updateTop();
})();
