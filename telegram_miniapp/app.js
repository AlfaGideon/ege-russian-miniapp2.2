// Telegram WebApp API
let tg = null;
let currentRole = null;
let musicEnabled = false;
let backgroundMusic = null;
let currentTheme = 'light';

// Инициализация Telegram WebApp
if (window.Telegram?.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Применяем тему из Telegram
    if (tg.themeParams.bg_color) {
        document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color);
    }

    // Настройка кнопки "Назад"
    tg.BackButton.onClick(() => {
        if (currentRole) {
            selectRole(null);
            tg.BackButton.hide();
        } else {
            tg.close();
        }
    });
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Инициализация приложения
function initializeApp() {
    // Инициализируем музыкальный плеер
    backgroundMusic = document.getElementById('backgroundMusic');
    if (backgroundMusic) {
        backgroundMusic.volume = 0.3; // Устанавливаем громкость по умолчанию

        // Обработчик ошибок загрузки музыки
        backgroundMusic.addEventListener('error', function() {
            console.log('Не удалось загрузить фоновую музыку');
            showNotification('Фоновая музыка недоступна', 'warning');
        });

        // Автоматическое воспроизведение при взаимодействии пользователя
        document.addEventListener('click', function enableAudio() {
            if (musicEnabled && backgroundMusic.paused) {
                backgroundMusic.play().catch(e => console.log('Автовоспроизведение заблокировано'));
            }
            document.removeEventListener('click', enableAudio);
        });
    }

    // Загружаем сохраненные настройки
    loadSettings();

    // Инициализируем интерфейс
    initializeInterface();

    // Показываем приветственное сообщение
    setTimeout(() => {
        showNotification('🎉 Добро пожаловать в ЕГЭ Pro!');
    }, 1000);
}

// Загрузка настроек из localStorage
function loadSettings() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedMusicState = localStorage.getItem('musicEnabled') === 'true';
    const savedRole = localStorage.getItem('currentRole');

    // Применяем тему
    setTheme(savedTheme);

    // Применяем настройки музыки
    if (savedMusicState) {
        enableMusic();
    }

    // Восстанавливаем роль если была выбрана
    if (savedRole) {
        selectRole(savedRole);
    }
}

// Сохранение настроек в localStorage
function saveSettings() {
    localStorage.setItem('theme', currentTheme);
    localStorage.setItem('musicEnabled', musicEnabled.toString());
    localStorage.setItem('currentRole', currentRole || '');
}

// Инициализация интерфейса
function initializeInterface() {
    // Анимация карточек при загрузке
    setTimeout(() => {
        const cards = document.querySelectorAll('.role-preview');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.2}s`;
            card.classList.add('fade-in-up');
        });
    }, 500);

    // Обработчики событий для боковой панели
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        userAvatar.addEventListener('click', toggleSidebar);
    }

    // Закрытие боковой панели при клике вне её
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const userAvatar = document.querySelector('.user-avatar');

        if (sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !userAvatar.contains(e.target)) {
                toggleSidebar();
            }
        }
    });
}

// Переключение темы
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveSettings();
    showNotification(`Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}!`);
}

// Установка темы
function setTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);

    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Сообщаем Telegram о смене темы
    if (tg) {
        tg.setHeaderColor(theme === 'dark' ? '#1a1a1a' : '#4ecdc4');
    }
}

// Переключение музыки
function toggleMusic() {
    if (musicEnabled) {
        disableMusic();
        showNotification('🔇 Музыка отключена');
    } else {
        enableMusic();
        showNotification('🎵 Музыка включена');
    }
    saveSettings();
}

// Включение музыки
function enableMusic() {
    musicEnabled = true;
    const musicIcon = document.getElementById('musicIcon');
    if (musicIcon) {
        musicIcon.textContent = '🎵';
    }

    if (backgroundMusic && backgroundMusic.paused) {
        backgroundMusic.play().catch(e => {
            console.log('Не удалось воспроизвести музыку:', e);
            showNotification('Включите звук для воспроизведения музыки', 'warning');
        });
    }
}

// Отключение музыки
function disableMusic() {
    musicEnabled = false;
    const musicIcon = document.getElementById('musicIcon');
    if (musicIcon) {
        musicIcon.textContent = '🔇';
    }

    if (backgroundMusic && !backgroundMusic.paused) {
        backgroundMusic.pause();
    }
}

// Установка громкости
function setVolume(value) {
    if (backgroundMusic) {
        backgroundMusic.volume = parseFloat(value);
        localStorage.setItem('musicVolume', value);
    }
}

// Переключение боковой панели
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    if (sidebar) {
        sidebar.classList.toggle('active');
        if (mainContent) {
            mainContent.classList.toggle('sidebar-active');
        }
    }
}

// Показ меню пользователя
function showUserMenu() {
    toggleSidebar();
}

// Выбор роли
function selectRole(role) {
    // Скрываем все интерфейсы
    const interfaces = document.querySelectorAll('.role-interface');
    interfaces.forEach(iface => {
        iface.style.display = 'none';
    });

    // Обновляем активный элемент в sidebar
    const roleItems = document.querySelectorAll('.role-item');
    roleItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.role === role) {
            item.classList.add('active');
        }
    });

    currentRole = role;

    if (role) {
        // Показываем соответствующий интерфейс
        const targetInterface = document.getElementById(`${role}-interface`);
        if (targetInterface) {
            targetInterface.style.display = 'block';
        }

        // Показываем кнопку "Назад" в Telegram
        if (tg) {
            tg.BackButton.show();
            tg.sendData(JSON.stringify({
                action: 'role_selected',
                role: role
            }));
        }

        // Закрываем боковую панель
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            if (mainContent) {
                mainContent.classList.remove('sidebar-active');
            }
        }

        showNotification(`🎯 Выбрана роль: ${getRoleName(role)}`);

        // Инициализируем специфичную для роли логику
        initializeRoleSpecificFeatures(role);
    } else {
        // Показываем экран выбора роли по умолчанию
        const defaultInterface = document.getElementById('default-interface');
        if (defaultInterface) {
            defaultInterface.style.display = 'block';
        }

        // Скрываем кнопку "Назад" в Telegram
        if (tg) {
            tg.BackButton.hide();
        }
    }

    saveSettings();
}

// Получение имени роли
function getRoleName(role) {
    const roleNames = {
        'student': 'Ученик',
        'teacher': 'Репетитор',
        'admin': 'Администратор',
        'psychologist': 'Психолог'
    };
    return roleNames[role] || role;
}

// Инициализация функций для конкретной роли
function initializeRoleSpecificFeatures(role) {
    switch (role) {
        case 'student':
            initializeStudentFeatures();
            break;
        case 'teacher':
            initializeTeacherFeatures();
            break;
        case 'admin':
            initializeAdminFeatures();
            break;
        case 'psychologist':
            initializePsychologistFeatures();
            break;
    }
}

// Функции для ученика
function initializeStudentFeatures() {
    // Анимация статистики прогресса
    animateProgressStats();
}

function openStudentFeature(feature) {
    const featureNames = {
        'tasks': 'Задания ЕГЭ',
        'theory': 'Теория',
        'tests': 'Тесты',
        'games': 'Игры'
    };

    showNotification(`📂 Открываем: ${featureNames[feature]}`);

    if (tg) {
        tg.sendData(JSON.stringify({
            action: 'open_student_feature',
            feature: feature
        }));
    }

    // Имитация загрузки
    setTimeout(() => {
        showNotification(`✅ ${featureNames[feature]} загружен!`);
    }, 1500);
}

// Игра "Эрудит"
function playEruditGame() {
    const modal = document.getElementById('gameModal');
    if (modal) {
        modal.style.display = 'flex';
        initializeGameBoard();
        showNotification('🎮 Загружается игра "Эрудит"...');
    }
}

function initializeGameBoard() {
    const gameBoard = document.getElementById('gameBoard');
    if (gameBoard) {
        gameBoard.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
                <h3>Игра "Эрудит"</h3>
                <p>Составляйте слова из доступных букв!</p>
                <div style="margin-top: 1rem; font-size: 1.5rem; letter-spacing: 0.5rem;">
                    А Л Г О Р И Т М
                </div>
                <p style="margin-top: 1rem; font-size: 0.9rem;">
                    Найдите все возможные слова из этих букв
                </p>
            </div>
        `;
    }
}

function startGame() {
    showNotification('🎯 Игра началась! Удачи!');
    // Здесь будет логика игры
    let gameTime = 60;
    const gameTimeElement = document.getElementById('gameTime');
    const gameScoreElement = document.getElementById('gameScore');

    if (gameScoreElement) gameScoreElement.textContent = '0';

    const timer = setInterval(() => {
        gameTime--;
        if (gameTimeElement) gameTimeElement.textContent = gameTime;

        if (gameTime <= 0) {
            clearInterval(timer);
            showNotification('⏰ Время вышло! Игра окончена.');
        }
    }, 1000);
}

// Функции для репетитора
function initializeTeacherFeatures() {
    // Загрузка данных учеников
    loadTeacherDashboard();
}

function loadTeacherDashboard() {
    // Анимация статистики
    animateStats('.teacher-interface .stat-number');
}

function openTeacherFeature(feature) {
    const featureNames = {
        'create-tasks': 'Создание заданий',
        'students': 'Управление учениками',
        'analytics': 'Аналитика',
        'materials': 'Материалы'
    };

    showNotification(`📂 Открываем: ${featureNames[feature]}`);

    if (tg) {
        tg.sendData(JSON.stringify({
            action: 'open_teacher_feature',
            feature: feature
        }));
    }
}

function createQuickTask() {
    showNotification('✏️ Создаём быстрое задание...');

    setTimeout(() => {
        showNotification('✅ Задание создано и отправлено ученикам!');
    }, 2000);
}

function checkSubmissions() {
    showNotification('📝 Проверяем работы учеников...');

    setTimeout(() => {
        showNotification('📊 Найдено 12 работ для проверки');
    }, 1500);
}

// Функции для администратора
function initializeAdminFeatures() {
    loadAdminDashboard();
    updateSystemHealth();
}

function loadAdminDashboard() {
    animateStats('.admin-interface .stat-number');
}

function updateSystemHealth() {
    // Имитация проверки состояния системы
    setTimeout(() => {
        const healthItems = document.querySelectorAll('.health-status');
        healthItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.animation = 'pulse 0.5s ease';
            }, index * 200);
        });
    }, 1000);
}

function openAdminFeature(feature) {
    const featureNames = {
        'users': 'Управление пользователями',
        'content': 'Модерация контента',
        'statistics': 'Системная статистика',
        'settings': 'Настройки системы'
    };

    showNotification(`🔧 Открываем: ${featureNames[feature]}`);

    if (tg) {
        tg.sendData(JSON.stringify({
            action: 'open_admin_feature',
            feature: feature
        }));
    }
}

// Функции для психолога
function initializePsychologistFeatures() {
    // Инициализация инструментов релаксации
}

function openConsultation(type) {
    const consultationTypes = {
        'individual': 'Индивидуальная консультация',
        'group': 'Групповая консультация',
        'resources': 'Материалы по релаксации',
        'tests': 'Психологические тесты'
    };

    showNotification(`🧠 Открываем: ${consultationTypes[type]}`);

    if (tg) {
        tg.sendData(JSON.stringify({
            action: 'open_consultation',
            type: type
        }));
    }
}

function startBreathing() {
    showNotification('🫁 Начинаем дыхательное упражнение...');

    // Создаем простое дыхательное упражнение
    let breathingPhase = 'inhale';
    let breathingTimer = 0;
    const breathingCycle = 4; // 4 секунды на каждую фазу

    const breathingInterval = setInterval(() => {
        breathingTimer++;

        if (breathingTimer === breathingCycle) {
            breathingPhase = breathingPhase === 'inhale' ? 'exhale' : 'inhale';
            breathingTimer = 0;

            const message = breathingPhase === 'inhale' ? '🫁 Вдох...' : '💨 Выдох...';
            showNotification(message);
        }

        if (breathingTimer === 0 && breathingPhase === 'inhale') {
            // Завершаем после нескольких циклов
            if (Math.random() > 0.7) {
                clearInterval(breathingInterval);
                showNotification('✨ Дыхательное упражнение завершено!');
            }
        }
    }, 1000);
}

function playRelaxingMusic() {
    showNotification('🎵 Включаем расслабляющую музыку...');
    enableMusic();

    if (backgroundMusic) {
        backgroundMusic.volume = 0.2; // Тише для релаксации
    }
}

function showMotivation() {
    const motivationalMessages = [
        '💪 Ты справишься с любыми трудностями!',
        '🌟 Каждый шаг приближает к успеху!',
        '🎯 Верь в себя - ты уже на пути к победе!',
        '🔥 Твоя целеустремлённость - твоя сила!',
        '🏆 Великие достижения требуют времени!'
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    showNotification(randomMessage);
}

// Утилиты и анимации
function animateProgressStats() {
    setTimeout(() => {
        animateStats('.progress-stats .stat-number');
    }, 500);
}

function animateStats(selector) {
    const numbers = document.querySelectorAll(selector);
    numbers.forEach((numElement, index) => {
        const finalValue = numElement.textContent;
        const isPercentage = finalValue.includes('%');
        const numericValue = parseInt(finalValue.replace(/[^\d]/g, ''));

        if (!isNaN(numericValue)) {
            let currentValue = 0;
            const increment = numericValue / 50;

            numElement.textContent = '0' + (isPercentage ? '%' : '');

            setTimeout(() => {
                const counter = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= numericValue) {
                        numElement.textContent = finalValue;
                        clearInterval(counter);
                    } else {
                        numElement.textContent = Math.floor(currentValue) + (isPercentage ? '%' : '');
                    }
                }, 30);
            }, index * 200);
        }
    });
}

// Система уведомлений
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    // Очищаем предыдущие классы
    notification.className = 'notification';

    // Добавляем класс типа уведомления
    if (type !== 'success') {
        notification.classList.add(type);
    }

    // Устанавливаем текст
    notification.textContent = message;

    // Показываем уведомление
    notification.classList.add('show');

    // Автоматически скрываем
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);

    // Отправляем в Telegram если доступно
    if (tg && type === 'success') {
        tg.showAlert(message);
    }
}

// Закрытие модальных окон
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Обработчики клавиатуры
document.addEventListener('keydown', function(e) {
    // ESC - закрыть модальные окна или боковую панель
    if (e.key === 'Escape') {
        // Закрываем модальные окна
        const modals = document.querySelectorAll('.modal[style*="flex"]');
        if (modals.length > 0) {
            modals.forEach(modal => modal.style.display = 'none');
            return;
        }

        // Закрываем боковую панель
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
            return;
        }

        // Возвращаемся к выбору роли
        if (currentRole) {
            selectRole(null);
        }
    }

    // Горячие клавиши для ролей
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                selectRole('student');
                break;
            case '2':
                e.preventDefault();
                selectRole('teacher');
                break;
            case '3':
                e.preventDefault();
                selectRole('admin');
                break;
            case '4':
                e.preventDefault();
                selectRole('psychologist');
                break;
            case 'm':
                e.preventDefault();
                toggleMusic();
                break;
            case 't':
                e.preventDefault();
                toggleTheme();
                break;
        }
    }
});

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Ошибка:', e.error);
    showNotification('Произошла ошибка в приложении', 'error');
});

// Обработка потери соединения
window.addEventListener('offline', function() {
    showNotification('⚠️ Нет подключения к интернету', 'warning');
});

window.addEventListener('online', function() {
    showNotification('✅ Подключение восстановлено');
});

// PWA - регистрация Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('Service Worker зарегистрирован');
        })
        .catch(error => {
            console.log('Ошибка регистрации Service Worker');
        });
}

// Экспорт функций для глобального доступа
window.EGEApp = {
    selectRole,
    toggleTheme,
    toggleMusic,
    showNotification,
    openStudentFeature,
    openTeacherFeature,
    openAdminFeature,
    openConsultation,
    playEruditGame,
    startGame,
    closeModal,
    createQuickTask,
    checkSubmissions,
    startBreathing,
    playRelaxingMusic,
    showMotivation,
    setVolume
};