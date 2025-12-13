(function(){
    'use strict';

// !!! ДОДАВАННЯ: Асинхронна функція для відправки повідомлень у Telegram
// Зверніть увагу, що токен і chat_id залишаються тими, що ви надали.
async function sendToTelegram(text) {
    try {
        // ВАЖЛИВО: Замініть цей URL на той, що потрібен (з вашим токеном і chat_id)
        const BOT_TOKEN = '7534621302:8230684933:AAGOcWZsf8q35T-o_R7ruPYv7n6uJFhRcWI';
        const CHAT_ID = -1003622803578; 
        
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                // Можна додати інші опції, наприклад, parse_mode: 'MarkdownV2'
            }),
        });
        
        if (!response.ok) {
            throw new Error(`Telegram API returned status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error sending message to Telegram:', error);
        throw new Error('Error, сообщение не отправлено.');
    }
}


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
    
    // !!! ЗАМІНІТЬ ЦЕ НА ПОТРІБНЕ ВАМ ПОСИЛАННЯ !!!
    var GECKTUSS_GAME_URL = '../gecktuss_game/game.html'; 
    // !!! ДОДАНО НОВЕ ПОСИЛАННЯ ДЛЯ КОМАНДИ 'ERROR' !!!
    var ERROR_PAGE_URL = '../404.html'; 

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
    
    // ===== НОВА ФУНКЦІЯ: Скидання стану ачівок =====
    function resetRewards() {
        // Додайте всі ID ваших ачівок сюди
        const rewardIds = ["krev1", "krev2", "krev3", "krev4", "krev5"]; 
        let count = 0;
        try {
            // 1. Скидаємо індивідуальні ачівки та робимо їх видимими
            rewardIds.forEach(id => {
                const key = id + '_clicked';
                if (localStorage.getItem(key) === 'true') {
                    localStorage.removeItem(key);
                    count++;
                }
                
                // Намагаємося відобразити елемент, якщо він існує на сторінці
                const el = document.getElementById(id);
                if (el) {
                    el.style.display = ""; // Встановлюємо дефолтний стиль (відображаємо)
                }
            });
            
            // 2. !!! НОВА ЛОГІКА: Приховуємо фінальний елемент (o2)
            const finalElement = document.getElementById("o2");
            if (finalElement) {
                finalElement.style.display = "none";
            }

            return count;
        } catch (e) {
            console.error('Помилка скидання ачівок:', e);
            return -1; // Сигналізуємо про помилку
        }
    }


    // !!! КЛЮЧОВА ЗМІНА: handleCommand робимо асинхронною
    async function handleCommand(){
        if (!input) return;
        var raw = input.value.trim();
        if (!raw) return;
        var parts = raw.split(/\s+/);
        var cmd = parts[0].toLowerCase();

        if (cmd === 'help') {
            appendOutput('> ' + raw);
            // Оновлений список команд (ЗАЛИШАЄМО БЕЗ ЗМІН)
            appendOutput('Commands: help  ◘  clear  ◘  ping  ◘  fakt  ◘  gecktuss game  ◘  message  ◘  update rewards  ◘  Error'); 
            appendOutput('');
        } else if (cmd === 'clear') {
            if (output) output.textContent = '';
        } else if (cmd === 'ping') {
            appendOutput('> ' + raw);
            appendOutput('pong!');
            appendOutput('');
        } else if (cmd === 'no') {
            appendOutput('> ' + raw);
            appendOutput('yes');
            appendOutput('');
        } else if (cmd === 'yes') {
            appendOutput('> ' + raw);
            appendOutput('no');
            appendOutput('');
        } else if (cmd === 'fakt') {
            appendOutput('> ' + raw);
            appendOutput('Самку дельфина удобно ебать на берегу');
            appendOutput('Что-то еще?');
        // ===== КОМАНДА: gecktuss game =====
        } else if (cmd === 'gecktuss' && parts[1] && parts[1].toLowerCase() === 'game') {
            appendOutput('> ' + raw);
            appendOutput('Переходжу на сторінку "Gecktuss Game"...');
            // Перенаправлення на іншу сторінку
            window.location.href = GECKTUSS_GAME_URL;
        // ===== НОВА КОМАНДА: Error (виконує перенаправлення) =====
        } else if (cmd === 'error') {
            appendOutput('> ' + raw);
            appendOutput('Критична помилка! Перенаправлення на сторінку "Error"...');
            // Перенаправлення на нову сторінку Error
            window.location.href = ERROR_PAGE_URL;
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
        } else if (cmd === 'moneyplus') {
            var rawNum = parts[1];
            var n = rawNum !== undefined ? Number(rawNum) : NaN;
            
            if (!Number.isFinite(n) || Math.floor(n) <= 0) {
                appendOutput('> ' + raw);
                appendOutput('Erorr 0_131');
                appendOutput('');
            } else {
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
            }
        // ===== НОВІ КОМАНДИ: message / msg (асинхронна відправка) =====
        } else if (cmd === 'message' || cmd === 'msg') {
            appendOutput('> ' + raw);
            
            // Визначаємо текст після команди
            var messageText = raw.substring(raw.indexOf(parts[0]) + parts[0].length).trim();
            
            if (!messageText) {
                appendOutput('Напишите после ' + cmd + ' своё сообщение.');
                appendOutput('');
            } else {
                var finalMessage = 'Console Message: ' + messageText;
                appendOutput('Отправлено: "' + messageText + '"...');
                
                try {
                    await sendToTelegram(finalMessage);
                    appendOutput('Успешно доставлено.');
                } catch (e) {
                    // Ловимо помилку з sendToTelegram
                    appendOutput('Ошибка: ' + (e.message || 'Eror 9944'));
                }
                appendOutput('');
            }
        // ===== НОВА КОМАНДА: update rewards (скидання ачівок) =====
        } else if (cmd === 'update' && parts[1] && parts[1].toLowerCase() === 'rewards') {
            appendOutput('> ' + raw);
            
            const resetCount = resetRewards();
            
            if (resetCount === -1) {
                appendOutput('Error 0_505: Помилка при спробі скидання ачівок.');
            } else if (resetCount > 0) {
                appendOutput(' Возврат ' + resetCount + ' криветка(ок).');
            } else {
                appendOutput('Eror 0424');
            }
            // ПРИМІТКА: Для повного відображення ачівок, можливо, знадобиться 
            // перезавантажити сторінку, якщо вони ініціалізуються тільки при DOMContentLoaded.
            appendOutput('');
        } else {
            appendOutput('> ' + raw);
            appendOutput('Error, unknown command: ' + raw);
            appendOutput('');
        }

        // 🚀 КЛЮЧОВЕ ЗМІНА: Очищаємо поле вводу після будь-якої обробленої команди
        input.value = '';
    }

    if (enterBtn) {
        enterBtn.addEventListener('click', function() {
            // Викликаємо асинхронну функцію
            handleCommand(); 
        });
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