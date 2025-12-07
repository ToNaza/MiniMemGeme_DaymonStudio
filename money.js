// ../money.js
// ES module — центральний сервіс валюти (localStorage + BroadcastChannel + onChange)
// Використання: import { getMoney, addMoney, spendMoney, setMoney, onMoneyChange } from '/path/to/money.js';

const MONEY_KEY = 'vov_money_v1';
const CHANNEL = 'vov_money_channel_v1';

function safeParseInt(v){ const n = Number(v); return Number.isFinite(n) ? Math.floor(n) : 0; }

let _money = null; // internal cache
function readFromStorage(){
  try {
    const raw = localStorage.getItem(MONEY_KEY);
    if (raw === null) return 0;
    return safeParseInt(raw);
  } catch(e){
    console.warn('money.js: readFromStorage failed', e);
    return 0;
  }
}
function writeToStorage(val){
  try {
    const v = Math.max(0, Math.floor(Number(val) || 0));
    localStorage.setItem(MONEY_KEY, String(v));
    _money = v;
    return v;
  } catch(e){
    console.warn('money.js: writeToStorage failed', e);
    return _money === null ? 0 : _money;
  }
}

// init
if (_money === null){
  _money = readFromStorage();
  if (!Number.isFinite(_money)) _money = 0;
}

// BroadcastChannel setup (may fail in some envs)
let bc = null;
try { bc = new BroadcastChannel(CHANNEL); } catch(e){ bc = null; }

// listeners set
const listeners = new Set();
function notifyAll(newVal){
  for (const cb of listeners){
    try { cb(newVal); } catch(e){ console.error('money.js listener error', e); }
  }
}

// Listen for messages from other tabs
if (bc){
  bc.onmessage = (ev) => {
    if (!ev || !ev.data) return;
    if (typeof ev.data.money !== 'undefined'){
      _money = safeParseInt(ev.data.money);
      writeToStorage(_money); // keep storage consistent
      notifyAll(_money);
    }
  };
}

// Fallback: listen storage event (from other tabs)
window.addEventListener('storage', (e) => {
  if (!e) return;
  if (e.key === MONEY_KEY){
    const val = safeParseInt(e.newValue);
    _money = val;
    notifyAll(_money);
  }
});

// API
export function getMoney(){
  if (_money === null) _money = readFromStorage();
  return _money;
}
export function setMoney(amount){
  const v = safeParseInt(amount);
  const newVal = writeToStorage(v);
  // broadcast change
  if (bc){
    try { bc.postMessage({ money: newVal }); } catch(e){ /* ignore */ }
  }
  notifyAll(newVal);
  return newVal;
}
export function addMoney(amount){
  const a = safeParseInt(amount);
  const newVal = setMoney(getMoney() + a);
  return newVal;
}
export function spendMoney(amount){
  const a = Math.abs(safeParseInt(amount));
  const cur = getMoney();
  if (a <= 0) return false;
  if (cur < a) return false;
  const newVal = setMoney(cur - a);
  return newVal >= 0;
}
// Подписка: onMoneyChange(cb) -> возвращает unsubscribe
export function onMoneyChange(cb){
  if (typeof cb !== 'function') return ()=>{};
  listeners.add(cb);
  try { cb(getMoney()); } catch(e){ /* swallow */ }
  return ()=> listeners.delete(cb);
}

// Экспорт для совместимости с non-module подключением (если нужно)
window.vovMoney = window.vovMoney || {};
Object.assign(window.vovMoney, {
  getMoney, setMoney, addMoney, spendMoney, onMoneyChange
});
