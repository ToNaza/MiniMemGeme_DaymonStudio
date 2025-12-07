
/*
  Стабільний модульний скрипт для модалки + підключення money.js.
  Поставити у кінець body. Працює якщо money.js експортує:
    export function getMoney()...
    export function addMoney()...
    export function onMoneyChange(cb)...
  А також підтримує варіант, коли money API доступний як window.vov або window.vovMoney.
*/
(async function(){
  // чекаємо готовності DOM
  if (document.readyState === 'loading') {
    await new Promise(res => document.addEventListener('DOMContentLoaded', res, {once:true}));
  }

  // Спроба імпортувати money.js як module; якщо не вдасться — fallback на глобальний об'єкт
  let moneyAPI = null;
  try {
    // зміни шлях тут якщо твій файл лежить інакше
    const mod = await import('../money.js');
    // якщо модуль експортує потрібні функції — використовуємо їх
    if (mod && (typeof mod.getMoney === 'function')) {
      moneyAPI = {
        getMoney: mod.getMoney,
        addMoney: mod.addMoney || (amt => { mod.setMoney((mod.getMoney()||0) + Number(amt||0)); }),
        spendMoney: mod.spendMoney || (amt => { return false; }),
        onMoneyChange: mod.onMoneyChange || null
      };
      console.log('money.js імпортовано як ES module');
    } else {
      console.warn('money.js імпортовано, але очікувані експорти відсутні. Шукаємо глобальні об\'єкти...');
    }
  } catch (e) {
    console.warn('Не вдалось імпортувати /js/money.js як модуль:', e);
  }

  // fallback на глобальні об'єкти (якщо вони є)
  if (!moneyAPI) {
    const fallback = window.vov || window.vovMoney || window.vovMoneyAPI;
    if (fallback && typeof fallback.getMoney === 'function') {
      moneyAPI = {
        getMoney: fallback.getMoney,
        addMoney: fallback.addMoney || (amt => { if (fallback.setMoney) fallback.setMoney((fallback.getMoney()||0)+Number(amt||0)); }),
        spendMoney: fallback.spendMoney || (amt => false),
        onMoneyChange: fallback.onChange || fallback.onMoneyChange || null
      };
      console.log('Використовується глобальний money API:', !!fallback);
    }
  }

  // якщо moneyAPI все ще немає — робимо простий локальний shim (не зберігатиме між перезавантаженнями)
  if (!moneyAPI) {
    console.warn('Money API не знайдено — створюється тимчасовий shim (дані не збережуться між перезавантаженнями).');
    let _m = 0;
    const listeners = new Set();
    moneyAPI = {
      getMoney: () => _m,
      addMoney: (amt) => { _m += Number(amt||0); listeners.forEach(cb=>{ try{cb(_m)}catch{} }); return _m; },
      spendMoney: (amt) => { amt = Math.floor(Number(amt||0)); if (_m < amt) return false; _m -= amt; listeners.forEach(cb=>{ try{cb(_m)}catch{} }); return true; },
      onMoneyChange: (cb) => { if (typeof cb!=='function') return ()=>{}; listeners.add(cb); cb(_m); return ()=>listeners.delete(cb); }
    };
  }

  // Тепер основна логіка модалки (взято з попереднього коду, але з гарантованим DOM-ready)
  const NUMBER_OF_ROWS = 6;
  const REWARD_POINTS = 20;
  const RECORD_BONUS = -10;
  const RECORD_KEY = 'vov_math_record_ms_v1';

  const openModalBtn = document.getElementById('openModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const closeModalBtn = document.getElementById('closeModal');
  const tasksContainer = document.getElementById('tasksContainer');
  const moneyEl = document.getElementById('money');
  const resultText = document.getElementById('resultText');
  const timeDisplay = document.getElementById('timeDisplay');
  const recordDisplay = document.getElementById('recordDisplay');

  // базова перевірка наявності елементів
  if (!openModalBtn || !modalBackdrop || !closeModalBtn || !tasksContainer || !moneyEl || !timeDisplay || !recordDisplay) {
    console.error('Не знайдено необхідних DOM-елементів для модалки. Перевір HTML id: openModal, modalBackdrop, closeModal, tasksContainer, money, timeDisplay, recordDisplay.');
    return;
  }

  // format time
  function formatTime(ms){
    const total = Math.max(0, Math.floor(ms));
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const millis = total % 1000;
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}:${String(millis).padStart(3,'0')}`;
  }
  function loadRecord(){ const r = localStorage.getItem(RECORD_KEY); return r ? Number(r) : null; }
  function saveRecord(ms){ localStorage.setItem(RECORD_KEY, String(Math.max(0, Math.floor(ms)))); }

  // tasks helpers
  function getRandomInt(min,max){ min=Math.ceil(min); max=Math.floor(max); return Math.floor(Math.random()*(max-min+1))+min; }
  function makeTaskFromExpression(a, op, b){ const result = op === '+' ? (a+b) : (a-b); return {a,op,b, correctDigit: Math.abs(result)%10, answered:false, isCorrect:false}; }
  let tasks = [];

  function generateTasks(){
    tasks = [];
    for(let i=0;i<NUMBER_OF_ROWS;i++){
      const op = Math.random()<0.5?'+':'-';
      tasks.push(makeTaskFromExpression(getRandomInt(0,9), op, getRandomInt(0,9)));
    }
  }

  function renderTasks(){
    tasksContainer.innerHTML = '';
    tasks.forEach((task, idx)=>{
      const row = document.createElement('div'); row.className = 'task-row'; row.dataset.index = idx;
      const digitsWrap = document.createElement('div'); digitsWrap.className = 'digits';
      for(let d=0; d<=9; d++){
        const btn = document.createElement('button'); btn.className = 'digit-btn'; btn.textContent = String(d); btn.type='button';
        btn.addEventListener('click', ()=> handleDigitClick(idx, d));
        digitsWrap.appendChild(btn);
      }
      const expr = document.createElement('div'); expr.className = 'expression'; expr.textContent = `${task.a}${task.op}${task.b}`;
      const status = document.createElement('div'); status.className = 'status pending'; status.id = `status-${idx}`; status.textContent = 'None';
      row.appendChild(digitsWrap); row.appendChild(expr); row.appendChild(status);
      tasksContainer.appendChild(row);
    });
  }

  // timer
  let startTime = null;
  let timerInterval = null;
  function startTimer(){ startTime = performance.now(); timeDisplay.textContent='00:00:000'; if (timerInterval) clearInterval(timerInterval); timerInterval = setInterval(()=>{ timeDisplay.textContent = formatTime(performance.now()-startTime); }, 16); }
  function stopTimer(){ if (!startTime) return 0; const elapsed = performance.now()-startTime; if (timerInterval){ clearInterval(timerInterval); timerInterval = null; } startTime = null; timeDisplay.textContent = formatTime(elapsed); return Math.floor(elapsed); }

  function handleDigitClick(rowIndex, clickedDigit){
    const task = tasks[rowIndex];
    if (!task || task.answered) return;
    task.answered = true;
    task.isCorrect = (clickedDigit === task.correctDigit);

    const rowElem = tasksContainer.querySelector(`.task-row[data-index="${rowIndex}"]`);
    if (rowElem) {
      rowElem.querySelectorAll('.digit-btn').forEach(b=>b.disabled = true);
      const status = rowElem.querySelector(`#status-${rowIndex}`);
      if (status) { status.className = task.isCorrect ? 'status correct' : 'status wrong'; status.textContent = task.isCorrect ? 'Success' : 'Error'; }
    }

    const allAnswered = tasks.every(t => t.answered);
    if (allAnswered) onAllAnswered();
  }

  async function onAllAnswered(){
    const elapsedMs = stopTimer();
    const recordMs = loadRecord();
    const allCorrect = tasks.every(t => t.isCorrect);
    let reward = 0;
    if (allCorrect) reward += REWARD_POINTS;

    let newRecord = false;
    if (recordMs === null || elapsedMs < recordMs){
      saveRecord(elapsedMs);
      newRecord = true;
      reward += RECORD_BONUS;
    }

    // нарахування через moneyAPI
    try {
      if (reward > 0 && typeof moneyAPI.addMoney === 'function') {
        moneyAPI.addMoney(reward);
      }
    } catch(e){
      console.error('Помилка при нарахуванні грошей через moneyAPI:', e);
    }

    // оновлюємо відображення рекорду
    const updatedRecord = loadRecord();
    recordDisplay.textContent = updatedRecord ? formatTime(updatedRecord) : '--:--:---';

    // інформування користувача (коротко)
    if (allCorrect && reward > 0) resultText.textContent = `Pass receipt verification, successful ${reward} поінтів.`;
    else if (allCorrect) resultText.textContent = `Pass receipt verification, successful ${REWARD_POINTS} поінтів.`;
    else if (newRecord) resultText.textContent = `Speed ​​bonus - received +${RECORD_BONUS} поінтів.`;
    else resultText.textContent = `Pass receipt verification, error`;

    // трохи почекати, щоб користувач встиг побачити статус, потім закрити модал
    setTimeout(()=>{
      modalBackdrop.style.display='none';
      modalBackdrop.setAttribute('aria-hidden','true');
      tasks = [];
      timeDisplay.textContent='00:00:000';
      resultText.textContent='Почніть відповіді.';
    }, 300);
  }

  // open/close handlers
  openModalBtn.addEventListener('click', ()=>{
    generateTasks();
    renderTasks();
    const r = loadRecord();
    recordDisplay.textContent = r ? formatTime(r) : '--:--:---';
    modalBackdrop.style.display='flex';
    modalBackdrop.setAttribute('aria-hidden','false');
    startTimer();
    // оновлюємо баланс на UI одразу
    try {
      const val = typeof moneyAPI.getMoney === 'function' ? moneyAPI.getMoney() : 0;
      moneyEl.textContent = String(val);
    } catch(e){ console.warn(e); }
  });

  closeModalBtn.addEventListener('click', ()=>{
    if (timerInterval) clearInterval(timerInterval);
    startTime = null;
    timeDisplay.textContent='00:00:000';
    modalBackdrop.style.display='none';
    modalBackdrop.setAttribute('aria-hidden','true');
    tasks = [];
    resultText.textContent='ICS - Start of restart ';
  });

  modalBackdrop.addEventListener('click', (e)=>{
    if (e.target === modalBackdrop){
      if (timerInterval) clearInterval(timerInterval);
      startTime = null;
      timeDisplay.textContent='00:00:000';
      modalBackdrop.style.display='none';
      modalBackdrop.setAttribute('aria-hidden','true');
      tasks = [];
      resultText.textContent='ICS - Start of restart';
    }
  });

  // підписка на оновлення балансу (якщо money.js надає onMoneyChange)
  if (typeof moneyAPI.onMoneyChange === 'function'){
    try {
      moneyAPI.onMoneyChange((val)=> { moneyEl.textContent = String(val); });
    } catch(e){
      console.warn('onMoneyChange викликав помилку:', e);
    }
  } else {
    // fallback: підтягуємо раз в секунду
    setInterval(()=>{
      try { moneyEl.textContent = String(moneyAPI.getMoney()); } catch(e) {}
    }, 1000);
  }

  // початкове відображення балансу
  try { moneyEl.textContent = String(moneyAPI.getMoney()); } catch(e){ moneyEl.textContent = '0'; }

  console.log('Modal script initialized OK');
})();

// === Скидання рекорду при даблкліку ===
const bestTimeEl = document.getElementById('recordDisplay');
if (bestTimeEl) {
  bestTimeEl.addEventListener('dblclick', () => {
    if (confirm('Скинути рекорд часу виконання?')) {
      localStorage.removeItem('vov_math_record_ms_v1'); // ключ, який зберігає рекорд
      bestTimeEl.textContent = 'Рекорд: --:--:---';
    }
  });
}
