// console.js (не модульний файл)
// Безпечно зберігаємо перемикання вкладок та додаємо команди moneyminus/moneyplus

(function(){
  'use strict';

  // Очікуємо, бо файл підключено з defer — DOM вже має бути готовий, але перестрахуємось
  function ready(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function(){
    // ===== Вкладки / ПК (зберігаємо оригінальну логіку) =====
    var panel = document.querySelector('.contend .panel');
    var buttons = panel ? panel.querySelectorAll('.tab-btn') : null;
    var modules = document.querySelectorAll('.contend .module');

    function activate(targetId) {
      if (buttons && buttons.length) {
        buttons.forEach(function(btn){
          var active = btn.dataset && btn.dataset.target === targetId;
          btn.classList.toggle('selected', !!active);
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      }
      if (modules && modules.length) {
        modules.forEach(function(mod){
          var active = mod.id === targetId;
          mod.classList.toggle('active', active);
          // використовуємо hidden саме так, як було у тебе
          mod.hidden = !active;
        });
      }
    }

    if (buttons && buttons.length) {
      buttons.forEach(function(btn){
        btn.addEventListener('click', function(){ activate(btn.dataset.target); });
        btn.addEventListener('keydown', function(e){
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
          }
        });
      });

      var first = panel.querySelector('.tab-btn.selected') || panel.querySelector('.tab-btn');
      if (first) activate(first.dataset.target);
    } else {
      // Якщо структура трохи відмінна — просто лог, вкладки не впадуть
      console.warn('console.js: .contend .panel або .tab-btn не знайдено — пропускаю ініціалізацію табів.');
    }

    // ===== Консоль =====
    var input = document.getElementById('consoleInput');
    var enterBtn = document.getElementById('consoleEnter');
    var output = document.getElementById('consoleOutput');

    // Функції для роботи з грошима (через window.vovMoney або fallback)
    function safeGetMoney(){
      try {
        if (window.vovMoney && typeof window.vovMoney.getMoney === 'function') return window.vovMoney.getMoney();
      } catch(e){}
      try {
        return Number(localStorage.getItem('vov_money_v1')) || 0;
      } catch(e){ return 0; }
    }
    function safeSetMoney(v){
      try {
        if (window.vovMoney && typeof window.vovMoney.setMoney === 'function') return window.vovMoney.setMoney(v);
      } catch(e){}
      try {
        var val = Math.max(0, Math.floor(Number(v) || 0));
        localStorage.setItem('vov_money_v1', String(val));
        return val;
      } catch(e){ return 0; }
    }
    function safeAddMoney(v){
      try {
        if (window.vovMoney && typeof window.vovMoney.addMoney === 'function') return window.vovMoney.addMoney(v);
      } catch(e){}
      var cur = safeGetMoney();
      return safeSetMoney(cur + v);
    }

    function appendOutput(text){
      if (!output) return;
      output.textContent += text + '\n';
      output.scrollTop = output.scrollHeight;
    }

    function handleCommand(){
      if (!input) return;
      var raw = input.value.trim();
      if (!raw) return;
      var parts = raw.split(/\s+/);
      var cmd = parts[0].toLowerCase();

      if (cmd === 'help') {
        appendOutput('> ' + raw);
        appendOutput('Commands: help, clear, ping, fakt');
        appendOutput('');
      } else if (cmd === 'clear') {
        if (output) output.textContent = '';
        input.value = '';
      } else if (cmd === 'ping') {
        appendOutput('> ' + raw);
        appendOutput('pong!');
        appendOutput('');
        input.value = '';
      } else if (cmd === 'no') {
        appendOutput('> ' + raw);
        appendOutput('yes');
        appendOutput('');
        input.value = '';
      } else if (cmd === 'yes') {
        appendOutput('> ' + raw);
        appendOutput('no');
        appendOutput('');
        input.value = '';
    } else if (cmd === 'fakt') {
        appendOutput('> ' + raw);
        appendOutput('Самку дельфина удобно ебать на берегу');
        appendOutput('Что-то еще?');
        input.value = '';
      } else if (cmd === 'moneyminus') {
        try {
          safeSetMoney(0);
          appendOutput('> ' + raw);
          appendOutput('Баланс анульовано — 0.');
        } catch (e) {
          appendOutput('> ' + raw);
          appendOutput('Erorr 0_173');
          console.error(e);
        }
        appendOutput('');
        input.value = '';
      } else if (cmd === 'moneyplus') {
        var rawNum = parts[1];
        var n = rawNum !== undefined ? Number(rawNum) : NaN;
        if (!Number.isFinite(n) || Math.floor(n) <= 0) {
          appendOutput('> ' + raw);
          appendOutput('Erorr 0_131');
          appendOutput('');
          input.value = '';
          return;
        }
        var toAdd = Math.floor(n);
        try {
          safeAddMoney(toAdd);
          var cur = safeGetMoney();
          appendOutput('> ' + raw);
          appendOutput('Получено ' + toAdd + '. Баребхов: ' + cur + '.');
        } catch (e) {
          appendOutput('> ' + raw);
          appendOutput('Erorr 0_130');
          console.error(e);
        }
        appendOutput('');
        input.value = '';
      } else {
        appendOutput('> ' + raw);
        appendOutput('Error, unknown command: ' + raw);
        appendOutput('');
        input.value = '';
      }
    }

    if (enterBtn) {
      enterBtn.addEventListener('click', handleCommand);
    } else {
      console.warn('console.js: #consoleEnter не знайдено.');
    }

    if (input) {
      input.addEventListener('keydown', function(e){
        if (e.key === 'Enter') handleCommand();
      });
    } else {
      console.warn('console.js: #consoleInput не знайдено.');
    }

  }); // ready

})(); // IIFE
