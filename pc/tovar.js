(async function(){
  // ==========================================
  // ⚙️ НАЛАШТУВАННЯ ТОВАРІВ (КОНФІГУРАЦІЯ)
  // ==========================================
  // Додано 8 товарів. Переконайтеся, що всі ці ID існують у вашому HTML!
  const PRODUCTS_CONFIG = [
    // 1. Пельмені (Ціна 50)
    {
      dbKey:    'koll_1',
      buyBtnId: 'buyBtn1',
      sellBtnId:'sellBtn1',
      priceId:  'cena',     // Читає ціну з id="cena"
      countId:  'koll_1',
      invIdsToHide: ['i1', 'inf1'] 
    },
    // 2. Торт (Ціна 80)
    {
      dbKey:    'koll_2',
      buyBtnId: 'buyBtn2',
      sellBtnId:'sellBtn2',
      priceId:  'cena2',    // Читає ціну з id="cena2"
      countId:  'koll_2',
      invIdsToHide: ['i2', 'inf2']
    },
    // 3. НОВИЙ ТОВАР (Ціна 100)
    {
      dbKey:    'koll_3',
      buyBtnId: 'buyBtn3',
      sellBtnId:'sellBtn3',
      priceId:  'cena3',
      countId:  'koll_3',
      invIdsToHide: ['i3', 'inf3'] 
    },
    // 4. НОВИЙ ТОВАР (Ціна 120)
    {
      dbKey:    'koll_4',
      buyBtnId: 'buyBtn4',
      sellBtnId:'sellBtn4',
      priceId:  'cena4',
      countId:  'koll_4',
      invIdsToHide: ['i4', 'inf4'] 
    },
    // 5. НОВИЙ ТОВАР (Ціна 200)
    {
      dbKey:    'koll_5',
      buyBtnId: 'buyBtn5',
      sellBtnId:'sellBtn5',
      priceId:  'cena5',
      countId:  'koll_5',
      invIdsToHide: ['i5', 'inf5'] 
    },
    // 6. НОВИЙ ТОВАР (Ціна 10)
    {
      dbKey:    'koll_6',
      buyBtnId: 'buyBtn6',
      sellBtnId:'sellBtn6',
      priceId:  'cena6',
      countId:  'koll_6',
      invIdsToHide: ['i6', 'inf6'] 
    },
    // 7. НОВИЙ ТОВАР (Ціна 20)
    {
      dbKey:    'koll_7',
      buyBtnId: 'buyBtn7',
      sellBtnId:'sellBtn7',
      priceId:  'cena7',
      countId:  'koll_7',
      invIdsToHide: ['i7', 'inf7'] 
    },
    // 8. НОВИЙ ТОВАР (Ціна 50)
    {
      dbKey:    'koll_8',
      buyBtnId: 'buyBtn8',
      sellBtnId:'sellBtn8',
      priceId:  'cena8',
      countId:  'koll_8',
      invIdsToHide: ['i8', 'inf8'] 
    },
  ];

  // ---- Глобальні налаштування ----
  const MONEY_MODULE_PATH = '../money.js';
  const DB_KEY = 'vov_shop_db_v1'; 

  // ==========================================
  // 🛠 ДОПОМІЖНІ ФУНКЦІЇ (БАЗА, ГРОШІ)
  // ==========================================
  
  // Функція для витягування числа з тексту
  function safeParseInt(s){
    const t = String(s||'').replace(/\u00A0/g,' ');
    const m = t.match(/-?\d+/);
    return m ? parseInt(m[0],10) : 0;
  }

  // --- Робота з Базою Даних (LocalStorage) ---
  function loadDB(){
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? JSON.parse(raw) : { items: {}, history: [] };
    } catch(e){ return { items: {}, history: [] }; }
  }
  function saveDB(db){
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
  
  // Отримати кількість товару
  function getQty(key){
    return loadDB().items[key] || 0;
  }

  // Змінити кількість товару та записати в історію
  function updateQty(key, delta, price){
    const db = loadDB();
    const oldVal = db.items[key] || 0;
    const newVal = Math.max(0, oldVal + delta);
    
    db.items[key] = newVal;
    
    // Запис в історію
    if(delta !== 0){
        db.history = db.history || [];
        db.history.push({ 
            when: new Date().toISOString(), 
            action: delta > 0 ? 'buy' : 'sell', 
            product: key, 
            qty: delta, 
            price: price 
        });
    }
    saveDB(db);
    return newVal;
  }

  // --- Імпорт Money.js ---
  let moneyApi = null;
  try {
    const mod = await import(MONEY_MODULE_PATH);
    moneyApi = mod && mod.getMoney ? mod : (window.vovMoney || null);
  } catch(err){ moneyApi = window.vovMoney || null; }

  // Mock (заглушка), якщо money.js немає
  if (!moneyApi){
    console.warn('Використовується тестовий гаманець (mock).');
    let _m = 500;
    moneyApi = {
      getMoney: ()=> _m,
      addMoney: (a)=> { _m += Number(a); },
      spendMoney: (a)=> { if(_m < a) return false; _m -= a; return true; },
      onMoneyChange: (cb)=> {}
    };
  }

  // ==========================================
  // 🚀 ОСНОВНА ЛОГІКА (Ініціалізація товарів)
  // ==========================================

  // Оновлення балансу на екрані
  const moneyEl = document.getElementById('money');
  const updateBalanceDisplay = () => {
      if(moneyEl) moneyEl.textContent = String(moneyApi.getMoney());
  };
  
  // Підписуємось на зміни балансу
  if(typeof moneyApi.onMoneyChange === 'function'){
      moneyApi.onMoneyChange(updateBalanceDisplay);
  }
  updateBalanceDisplay(); // Показати одразу при старті

  // --- Проходимось по кожному товару зі списку CONFIG ---
  PRODUCTS_CONFIG.forEach(product => {
      
      // Знаходимо елементи в HTML
      const buyBtn = document.getElementById(product.buyBtnId);
      const sellBtn = document.getElementById(product.sellBtnId);
      const priceEl = document.getElementById(product.priceId);
      const countEl = document.getElementById(product.countId); // "В мешочке..."

      // Отримуємо поточну ціну з тексту
      const getPrice = () => safeParseInt(priceEl?.textContent);

      // Функція малювання (оновлює текст і ховає/показує блок)
      const render = () => {
          const qty = getQty(product.dbKey);
          
          // Оновлюємо текст "В мешочке: X шт."
          if (countEl) countEl.textContent = `В мешочке: ${qty} шт.`;

          // Логіка приховування блоків інвентарю
          const displayStyle = (qty === 0) ? 'none' : ''; 
          
          // Проходимо по всіх ID, які треба приховати (напр. 'i1', 'inf1')
          (product.invIdsToHide || []).forEach(invId => {
              const invBlock = document.getElementById(invId);
              if (invBlock) {
                  invBlock.style.display = displayStyle;
              }
          });
      };

      // 1. Початковий рендер при завантаженні сторінки
      render();

      // 2. Логіка КУПІВЛІ
      if (buyBtn) {
          buyBtn.addEventListener('click', () => {
              const price = getPrice();
              
              if (moneyApi.spendMoney(price)) {
                  updateQty(product.dbKey, 1, price); // +1 в базу
                  render(); 
                  updateBalanceDisplay();
              } else {
                  alert(`Не вистачає баребухів! Треба: ${price}`);
              }
          });
      } else {
          console.warn(`Кнопку купити id="${product.buyBtnId}" не знайдено.`);
      }

      // 3. Логіка ПРОДАЖУ
      if (sellBtn) {
          sellBtn.addEventListener('click', () => {
              const currentQty = getQty(product.dbKey);
              if (currentQty <= 0) {
                  alert('Нічого продавати.');
                  return;
              }

              const price = getPrice();
              moneyApi.addMoney(price); // Повертаємо гроші
              updateQty(product.dbKey, -1, price); // -1 з бази
              render(); 
              updateBalanceDisplay();
          });
      }
  });

  // Дебаг для тебе в консолі
  window.vovShopDebug = { 
    getDB: loadDB, 
    clear: ()=> { saveDB({items:{}, history:[]}); location.reload(); }
  };
})();