// rewards.js (приклад з інтеграцією збереження стану)

const audio = new Audio("../media/pop.mp3");
// Винесено список ID на глобальний рівень
const rewardIds = ["krev1", "krev2", "krev3", "krev4", "krev5"]; 
const finalRewardId = "o2"; // ID елемента, який потрібно показати

// ===== НОВА ФУНКЦІЯ: Перевіряє, чи зібрано всі креветки =====
function checkAllRewardsCollected() {
    let allCollected = true;
    
    // 1. Перевіряємо localStorage для кожного ID
    for (const id of rewardIds) {
        if (localStorage.getItem(id + '_clicked') !== 'true') {
            allCollected = false;
            break; // Якщо хоча б одна не зібрана, припиняємо перевірку
        }
    }

    // 2. Знаходимо фінальний елемент та встановлюємо його стиль
    const finalElement = document.getElementById(finalRewardId);
    if (finalElement) {
        // Якщо всі зібрано -> block, інакше -> none
        finalElement.style.display = allCollected ? "block" : "none";
    }
}
// ==========================================================

// Функція для приховування та збереження стану ачівки
function hideAndSave(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        // 1. Приховуємо елемент
        element.style.display = "none";
        
        // 2. Зберігаємо стан у localStorage
        try {
            localStorage.setItem(elementId + '_clicked', 'true');
        } catch (e) {
            console.error('Помилка збереження в localStorage:', e);
        }

        // 3. Відтворюємо звук (якщо він є)
        if (audio) {
            audio.currentTime = 0;
            audio.play();
        }
        
        // 4. Перевіряємо, чи зібрано всі ачівки
        checkAllRewardsCollected(); 
    }
}

// Функція для завантаження стану при завантаженні сторінки
function loadRewardState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        try {
            if (localStorage.getItem(elementId + '_clicked') === 'true') {
                element.style.display = "none"; // Якщо збережено, приховуємо
            } else {
                element.style.display = ""; // Інакше показуємо (або ваш дефолтний стиль)
            }
        } catch (e) {
            console.error('Помилка читання з localStorage:', e);
        }
    }
}

// Застосування логіки до всіх ачівок
document.addEventListener('DOMContentLoaded', () => {
    rewardIds.forEach(id => {
        loadRewardState(id); // Завантажуємо стан при старті
        const krev = document.getElementById(id);
        if (krev) {
            // Використовуємо єдину функцію-обробник
            krev.addEventListener("click", () => {
                hideAndSave(id);
            });
        }
    });
    
    // Перевіряємо фінальну умову при завантаженні сторінки
    checkAllRewardsCollected(); 
});