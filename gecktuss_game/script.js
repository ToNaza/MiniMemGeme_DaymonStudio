
    const MONEY_KEY = 'vov_money_v1';
    let _money = null;

    function safeParseInt(v){ const n = Number(v); return Number.isFinite(n) ? Math.floor(n) : 0; }

    function readFromStorage(){
        try {
            const raw = localStorage.getItem(MONEY_KEY);
            return raw === null ? 0 : safeParseInt(raw);
        } catch(e){ return 0; }
    }

    function writeToStorage(val){
        try {
            const v = Math.max(0, Math.floor(Number(val) || 0));
            localStorage.setItem(MONEY_KEY, String(v));
            _money = v;
            return v;
        } catch(e){ return _money === null ? 0 : _money; }
    }

    function getMoney(){
        if (_money === null) _money = readFromStorage();
        return _money;
    }

    const moneyEl = document.getElementById('money');
    function updateMoneyDisplay(val) {
        if(moneyEl) moneyEl.textContent = String(val);
    }

    function addMoney(amount){
        const current = getMoney();
        const a = safeParseInt(amount);
        const newVal = writeToStorage(current + a);
        updateMoneyDisplay(newVal);
        return newVal;
    }

    updateMoneyDisplay(getMoney());

    /** * ----------------------------------------------------
     * ЧАСТЬ 2: ЛОГИКА ИГРЫ И НАКАЗАНИЯ
     * ----------------------------------------------------
     */
    
    // --- 2.1 Настройки и DOM Элементы ---
    
    const IMAGES = {
        player: '../media/gecktuzz.png', 
        good: '../media/insulin.png',
        bad: '../media/choklet.png'
    };

    const playerEl = document.getElementById('player');
    playerEl.style.backgroundImage = `url('${IMAGES.player}')`;

    const gameArea = document.getElementById('gameArea');
    const spawnLine = document.getElementById('spawnLine');
    
    let gameInterval = null;
    let spawnInterval = null;
    let activeDifficulty = null;
    let isGameRunning = false;
    
    // Настройки движения A/D
    let isMovingLeft = false;
    let isMovingRight = false;
    
    const PLAYER_SPEED = 9; 

    const CONFIG = {
        easy: { name: 'easy', goodChance: 0.6, speed: 11, spawnRate: 800, reward: 10, penalty: -15 },
        average: { name: 'average', goodChance: 0.4, speed: 15, spawnRate: 500, reward: 20, penalty: -25 },
        complex: { name: 'complex', goodChance: 0.2, speed: 18, spawnRate: 300, reward: 50, penalty: -50}
    };

    // --- 2.2 Настройки Наказания ---
    const PUNISHMENT_STAGES = [
        { type: 'image', path: '../media/rip1.png', sound: 'sound1Src', opacity: 0.5 }, 
        { type: 'image', path: '../media/rip2.png', sound: 'sound2Src', opacity: 0.8 }, 
        { type: 'video', path: '../media/rip.mp4', redirect: true }                   
    ];

    let punishmentCounter = 0; 
    let currentSoundEl = null; 

    // --- 2.3 Функции Движения ---
    
    function movePlayer(deltaX) {
        let currentLeft = parseFloat(playerEl.style.left) || (gameArea.clientWidth / 2);
        let newLeft = currentLeft + deltaX;

        const gameWidth = gameArea.clientWidth;
        const halfPlayerWidth = 40; 
        
        if (newLeft < halfPlayerWidth) newLeft = halfPlayerWidth;
        if (newLeft > gameWidth - halfPlayerWidth) newLeft = gameWidth - halfPlayerWidth;

        playerEl.style.left = newLeft + 'px';
    }

    document.addEventListener('keydown', (e) => {
        if (!isGameRunning) return;
        if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
            isMovingLeft = true;
        }
        if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
            isMovingRight = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (!isGameRunning) return;
        if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
            isMovingLeft = false;
        }
        if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
            isMovingRight = false;
        }
    });

    // --- 2.4 Функции Игры и Наказания ---

    function stopCurrentSound() {
        if (currentSoundEl) {
            currentSoundEl.pause();
            currentSoundEl.currentTime = 0;
            currentSoundEl = null;
        }
    }

    function startGame(difficultyKey) {
        stopGame();
        stopCurrentSound(); 
        activeDifficulty = CONFIG[difficultyKey];
        isGameRunning = true;

        punishmentCounter = 0; 
        isMovingLeft = false;
        isMovingRight = false;
        
        // Очищаем полноэкранные элементы
        document.querySelectorAll('.full-screen-overlay').forEach(el => el.remove());

        document.querySelectorAll('button').forEach(b => b.className = '');
        document.getElementById(difficultyKey).classList.add(`active-${difficultyKey}`);
        
        if (!playerEl.style.left) {
             playerEl.style.left = (gameArea.clientWidth / 2) + 'px';
        }

        spawnInterval = setInterval(spawnItem, activeDifficulty.spawnRate);
        gameLoop();
    }

    function stopGame() {
        isGameRunning = false;
        clearInterval(spawnInterval);
        cancelAnimationFrame(gameInterval);
        document.querySelectorAll('.falling-item').forEach(el => el.remove());
    }
    
    
    // Функция для показа полноэкранного фото-фильтра
    function startPunishmentSequence() {
        
        const stage = PUNISHMENT_STAGES[punishmentCounter];
        
        if (!stage || stage.type !== 'image') {
            return; 
        }
        
        // --- 1. Обработка Звука (Сброс и Запуск) ---
        stopCurrentSound(); 
        if (stage.sound) {
            const soundEl = document.getElementById(stage.sound);
            if (soundEl) {
                currentSoundEl = soundEl;
                currentSoundEl.loop = true; 
                currentSoundEl.currentTime = 0;
                currentSoundEl.play().catch(e => console.warn("Звук не воспроизвелся:", e)); 
            }
        }
        
        // --- 2. Создание и отображение полноэкранного фильтра ---
        
        document.querySelectorAll('.full-screen-overlay').forEach(el => el.remove());

        const filterDiv = document.createElement('div');
        filterDiv.classList.add('full-screen-overlay');
        
        // Стилизация для ПОЛНОЭКРАННОГО ФИЛЬТРА
        filterDiv.style.position = 'fixed';
        filterDiv.style.top = '0';
        filterDiv.style.left = '0';
        filterDiv.style.width = '100%';
        filterDiv.style.height = '100%';
        filterDiv.style.zIndex = '999'; 
        filterDiv.style.backgroundImage = `url('${stage.path}')`;
        filterDiv.style.backgroundSize = 'cover';
        filterDiv.style.backgroundPosition = 'center';
        filterDiv.style.opacity = stage.opacity; 
        filterDiv.style.transition = 'opacity 0.5s';
        
        document.body.appendChild(filterDiv);

        // УВЕЛИЧИВАЕМ СЧЕТЧИК УРОНА
        punishmentCounter++;
    }


    // Создание падающего предмета (Spawn Item)
    function spawnItem() {
        if (!isGameRunning) return;
        const item = document.createElement('div');
        item.classList.add('falling-item');

        const isGood = Math.random() < activeDifficulty.goodChance;
        if (isGood) {
            item.style.backgroundImage = `url('${IMAGES.good}')`;
            item.dataset.type = 'good';
        } else {
            item.style.backgroundImage = `url('${IMAGES.bad}')`;
            item.dataset.type = 'bad';
        }

        const startY = spawnLine.offsetTop;
        const maxW = gameArea.clientWidth - 60;
        const randomX = Math.floor(Math.random() * maxW) + 10;

        item.style.top = startY + 'px';
        item.style.left = randomX + 'px';
        gameArea.appendChild(item);
    }

    // Цикл игры
    function gameLoop() {
        if (!isGameRunning) return;

        // ДВИЖЕНИЕ ИГРОКА A/D
        if (isMovingLeft && !isMovingRight) {
            movePlayer(-PLAYER_SPEED);
        } else if (isMovingRight && !isMovingLeft) {
            movePlayer(PLAYER_SPEED);
        }

        const items = document.querySelectorAll('.falling-item');
        const playerRect = playerEl.getBoundingClientRect();
        const gameHeight = gameArea.clientHeight;

        items.forEach(item => {
            let currentTop = parseFloat(item.style.top);
            let newTop = currentTop + activeDifficulty.speed;
            item.style.top = newTop + 'px';

            const itemRect = item.getBoundingClientRect();

            // Столкновение
            if (
                itemRect.left < playerRect.right &&
                itemRect.right > playerRect.left &&
                itemRect.top < playerRect.bottom &&
                itemRect.bottom > playerRect.top
            ) {
                const type = item.dataset.type;
                if (type === 'good') {
                    addMoney(activeDifficulty.reward);
                    playerEl.style.filter = "drop-shadow(0 0 10px #00ff00)";
                    
                    // 💡 СБРОС СЧЕТЧИКА НАКАЗАНИЯ
                    if (punishmentCounter > 0) {
                        punishmentCounter = 0;
                        document.querySelectorAll('.full-screen-overlay').forEach(el => el.remove()); 
                        stopCurrentSound(); 
                    }

                } else {
                    addMoney(activeDifficulty.penalty);
                    playerEl.style.filter = "drop-shadow(0 0 10px #ff0000)";

                    // 🚨 ПРОВЕРКА НАКАЗАНИЯ
                    if (getMoney() <= 0) { 
                        
                        // 1. Финальное поражение (Этап видео)
                        if (punishmentCounter === PUNISHMENT_STAGES.length - 1) {
                             const videoStage = PUNISHMENT_STAGES[punishmentCounter];
                             stopGame();
                             stopCurrentSound(); 
                             document.querySelectorAll('.full-screen-overlay').forEach(el => el.remove()); 
                             
                             // Створення видео на весь екран (с fit: contain)
                             const finalVideo = document.createElement('video');
                             finalVideo.src = videoStage.path;
                             finalVideo.autoplay = true;
                             finalVideo.controls = false;
                             finalVideo.style.backgroundColor = 'black'; // Фон для областей, не занятых видео
                             finalVideo.style.position = 'fixed';
                             finalVideo.style.top = '0';
                             finalVideo.style.left = '0';
                             finalVideo.style.width = '100%';
                             finalVideo.style.height = '100%';
                             finalVideo.style.objectFit = 'contain'; // Видео ВПИСЫВАЕТСЯ
                             finalVideo.style.zIndex = '10000'; 
                             document.body.appendChild(finalVideo);
                             
                             // После окончания видео перенаправляем
                             finalVideo.onended = () => {
                                 setTimeout(() => {
                                     window.location.href = '../index.html'; 
                                 }, 1000); 
                             };

                        // 2. Обычное предупреждение (Фото-фильтр)
                        } else if (punishmentCounter < PUNISHMENT_STAGES.length - 1) {
                            startPunishmentSequence();
                        }
                    }
                }
                setTimeout(() => playerEl.style.filter = "none", 200);
                item.remove();
                return; 
            }

            // Удаление снизу
            if (newTop > gameHeight) item.remove();
        });

        gameInterval = requestAnimationFrame(gameLoop);
    }

    // КНОПКИ
    document.getElementById('easy').addEventListener('click', () => startGame('easy'));
    document.getElementById('average').addEventListener('click', () => startGame('average'));
    document.getElementById('complex').addEventListener('click', () => startGame('complex'));
