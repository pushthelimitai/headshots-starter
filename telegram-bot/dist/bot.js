"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
exports.notifyUserAboutReadyAvatars = notifyUserAboutReadyAvatars;
const grammy_1 = require("grammy");
const menu_1 = require("@grammyjs/menu");
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
const api_service_1 = require("./api-service");
// Загрузка переменных окружения
dotenv_1.default.config();
// Настройка клиента Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
// API URL для нашего сервиса
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
// Инициализация бота
const bot = new grammy_1.Bot(process.env.TELEGRAM_BOT_TOKEN || '');
exports.bot = bot;
// Настройка сессии
bot.use((0, grammy_1.session)({
    initial: () => ({
        step: 'idle',
        images: [],
    }),
}));
// Создаем меню для выбора пака
const packsMenu = new menu_1.Menu('packs-menu');
// Функция для обновления меню паков на основе полученных данных
async function updatePacksMenu() {
    packsMenu.clearChoices();
    try {
        const packs = await api_service_1.ApiService.getPacks();
        // Группировка по 2 кнопки в ряд
        let rowCount = 0;
        packs.forEach((pack, index) => {
            // Новый ряд каждые 2 элемента
            if (index % 2 === 0 && index > 0) {
                packsMenu.row();
            }
            packsMenu.text(pack.name, async (ctx) => {
                ctx.session.pack = pack.id;
                ctx.session.step = 'select_type';
                await ctx.reply(`Пак "${pack.name}" выбран. Теперь выберите тип изображения:`, {
                    reply_markup: typesMenu,
                });
            });
        });
        // Добавляем кнопку отмены в отдельном ряду
        packsMenu.row();
        packsMenu.text('Отмена', (ctx) => {
            ctx.session.step = 'idle';
            return ctx.reply('Операция отменена. Чтобы начать заново, введите /start');
        });
    }
    catch (error) {
        console.error('Ошибка при обновлении меню паков:', error);
    }
}
// Создаем меню для выбора типа изображения
const typesMenu = new menu_1.Menu('types-menu')
    .text('Профессиональный', async (ctx) => {
    ctx.session.type = 'professional';
    ctx.session.step = 'enter_name';
    await ctx.reply('Выбран профессиональный тип. Теперь введите название для вашей модели:');
})
    .text('Креативный', async (ctx) => {
    ctx.session.type = 'creative';
    ctx.session.step = 'enter_name';
    await ctx.reply('Выбран креативный тип. Теперь введите название для вашей модели:');
})
    .row()
    .text('Студийный', async (ctx) => {
    ctx.session.type = 'studio';
    ctx.session.step = 'enter_name';
    await ctx.reply('Выбран студийный тип. Теперь введите название для вашей модели:');
})
    .text('Деловой', async (ctx) => {
    ctx.session.type = 'business';
    ctx.session.step = 'enter_name';
    await ctx.reply('Выбран деловой тип. Теперь введите название для вашей модели:');
})
    .row()
    .text('Отмена', (ctx) => {
    ctx.session.step = 'select_pack';
    updatePacksMenu().then(() => {
        return ctx.reply('Вернемся к выбору пака:', {
            reply_markup: packsMenu,
        });
    });
});
// Регистрируем меню
bot.use(packsMenu);
bot.use(typesMenu);
// Обработчик команды /start
bot.command('start', async (ctx) => {
    ctx.session.step = 'idle';
    ctx.session.images = [];
    await ctx.reply('Добро пожаловать в бота для создания аватаров! Чтобы начать, отправьте не менее 4 фотографий вашего лица в хорошем качестве.');
});
// Обработчик команды /connect - связь с аккаунтом Supabase
bot.command('connect', async (ctx) => {
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;
    const lastName = ctx.from?.last_name;
    if (!telegramId) {
        await ctx.reply('Не удалось получить ваш Telegram ID. Пожалуйста, попробуйте еще раз.');
        return;
    }
    await ctx.reply('Чтобы связать ваш Telegram с аккаунтом в приложении, выполните следующие шаги:\n\n' +
        '1. Войдите в свой аккаунт в приложении\n' +
        '2. Перейдите по ссылке ниже\n' +
        '3. Нажмите кнопку "Связать аккаунт"\n\n' +
        `${API_BASE_URL}/connect-telegram?telegram_id=${telegramId}` +
        (username ? `&username=${username}` : '') +
        (firstName ? `&first_name=${firstName}` : '') +
        (lastName ? `&last_name=${lastName}` : ''));
});
// Обработчик команды /status - проверка статуса модели
bot.command('status', async (ctx) => {
    if (!ctx.session.modelId) {
        await ctx.reply('У вас нет активных моделей. Начните процесс создания с команды /start');
        return;
    }
    try {
        const status = await api_service_1.ApiService.getModelStatus(ctx.session.modelId);
        let statusText = 'Неизвестный статус';
        switch (status) {
            case 'pending':
                statusText = 'Ваша модель в очереди на обработку';
                break;
            case 'training':
                statusText = 'Идет обучение модели';
                break;
            case 'finished':
                statusText = 'Обучение завершено! Вы можете получить ваши аватары командой /results';
                break;
            case 'failed':
                statusText = 'К сожалению, произошла ошибка при обучении модели';
                break;
        }
        await ctx.reply(statusText);
    }
    catch (error) {
        console.error('Ошибка при получении статуса:', error);
        await ctx.reply('Произошла ошибка при получении статуса модели');
    }
});
// Обработчик команды /results - получение результатов
bot.command('results', async (ctx) => {
    if (!ctx.session.modelId) {
        await ctx.reply('У вас нет активных моделей. Начните процесс создания с команды /start');
        return;
    }
    try {
        const images = await api_service_1.ApiService.getGeneratedImages(ctx.session.modelId);
        if (images.length === 0) {
            await ctx.reply('Пока нет готовых изображений для вашей модели. Проверьте статус командой /status');
            return;
        }
        await ctx.reply(`Найдено ${images.length} аватаров для вашей модели. Отправляю первые 5:`);
        // Отправляем первые 5 изображений
        for (let i = 0; i < Math.min(5, images.length); i++) {
            await ctx.replyWithPhoto(images[i]);
        }
        // Если изображений больше 5, предложим ссылку на полную галерею
        if (images.length > 5) {
            await ctx.reply(`Вы можете просмотреть все ${images.length} аватаров, перейдя по ссылке: ${API_BASE_URL}/models/${ctx.session.modelId}`);
        }
    }
    catch (error) {
        console.error('Ошибка при получении результатов:', error);
        await ctx.reply('Произошла ошибка при получении результатов');
    }
});
// Обработчик команды /cancel - отмена текущей операции
bot.command('cancel', async (ctx) => {
    ctx.session.step = 'idle';
    await ctx.reply('Операция отменена. Чтобы начать заново, введите /start');
});
// Обработчик команды /help - справка
bot.command('help', async (ctx) => {
    await ctx.reply('Доступные команды:\n' +
        '/start - Начать процесс создания аватаров\n' +
        '/connect - Связать ваш Telegram с аккаунтом в приложении\n' +
        '/status - Проверить статус обучения модели\n' +
        '/results - Получить результаты (аватары)\n' +
        '/cancel - Отменить текущую операцию\n' +
        '/help - Показать эту справку');
});
// Обработчик загрузки фотографий
bot.on('message:photo', async (ctx) => {
    if (ctx.session.step === 'idle' || ctx.session.step === 'upload') {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const file = await ctx.api.getFile(photo.file_id);
        // Получаем URL файла
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
        // Загружаем файл из Telegram API
        const response = await axios_1.default.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        try {
            // Создаем временную директорию, если её нет
            const tempDir = path_1.default.join(__dirname, 'temp');
            fs_1.default.mkdirSync(tempDir, { recursive: true });
            // Создаем временный файл
            const tempFilePath = path_1.default.join(tempDir, `${photo.file_id}.jpg`);
            fs_1.default.writeFileSync(tempFilePath, buffer);
            try {
                // Загружаем изображение через сервис API
                const imageUrl = await api_service_1.ApiService.uploadImage(buffer, `${photo.file_id}.jpg`);
                // Добавляем URL в сессию
                ctx.session.images.push(imageUrl);
                await ctx.reply(`Фото загружено! (${ctx.session.images.length}/4)`);
                if (ctx.session.images.length >= 4) {
                    ctx.session.step = 'select_pack';
                    // Обновляем меню паков перед показом
                    await updatePacksMenu();
                    await ctx.reply('У вас достаточно фотографий! Теперь выберите пак для создания аватаров:', {
                        reply_markup: packsMenu,
                    });
                }
                else {
                    ctx.session.step = 'upload';
                    await ctx.reply(`Отправьте еще ${4 - ctx.session.images.length} фотографий`);
                }
            }
            catch (error) {
                console.error('Ошибка при загрузке изображения:', error);
                await ctx.reply('Произошла ошибка при загрузке изображения. Пожалуйста, попробуйте еще раз.');
            }
            finally {
                // Удаляем временный файл
                fs_1.default.unlinkSync(tempFilePath);
            }
        }
        catch (error) {
            console.error('Ошибка при работе с файлом:', error);
            await ctx.reply('Произошла ошибка при обработке изображения. Пожалуйста, попробуйте еще раз.');
        }
    }
    else {
        await ctx.reply(`Вы находитесь на шаге "${ctx.session.step}". Завершите текущий шаг или используйте /cancel для отмены.`);
    }
});
// Обработчик текстовых сообщений
bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    // Обработка названия модели
    if (ctx.session.step === 'enter_name') {
        ctx.session.name = text;
        // Теперь у нас есть все необходимые данные для создания модели
        await ctx.reply('Запускаем процесс создания модели...');
        try {
            // Вызов API для создания модели
            const modelId = await api_service_1.ApiService.createModel(ctx.session.images, ctx.session.type || 'professional', ctx.session.pack || '', ctx.session.name);
            ctx.session.modelId = modelId;
            await ctx.reply('Модель успешно отправлена на обучение! Этот процесс может занять некоторое время (от 15 минут до нескольких часов). ' +
                'Вы получите уведомление, когда аватары будут готовы.\n\n' +
                'Вы можете проверить статус командой /status и получить результаты командой /results, когда модель будет готова.');
            ctx.session.step = 'idle';
        }
        catch (error) {
            console.error('Ошибка при создании модели:', error);
            await ctx.reply('Произошла ошибка при создании модели. Пожалуйста, попробуйте еще раз позже.');
            ctx.session.step = 'idle';
        }
    }
    else if (ctx.session.step !== 'idle') {
        // Если пользователь находится в процессе создания, но отправляет текст не в том месте
        await ctx.reply(`Вы находитесь на шаге "${ctx.session.step}". Пожалуйста, следуйте инструкциям или используйте /cancel для отмены.`);
    }
});
// Функция для получения готовых изображений по ID модели
async function getGeneratedImages(modelId) {
    return await api_service_1.ApiService.getGeneratedImages(modelId);
}
// Webhook для обработки уведомлений о готовности аватаров
// Примечание: эту функцию нужно вызывать из вашего сервера, когда аватары готовы
async function notifyUserAboutReadyAvatars(userId, modelId) {
    try {
        // Получаем Telegram ID пользователя из базы данных
        // (предполагаем, что у вас есть таблица, связывающая supabase user_id с telegram_id)
        const { data, error } = await supabase
            .from("users")
            .select("telegram_id")
            .eq("id", userId)
            .single();
        if (error || !data) {
            console.error('Не удалось найти пользователя:', error);
            return;
        }
        const telegramId = data.telegram_id;
        // Получаем готовые изображения
        const images = await getGeneratedImages(modelId);
        if (images.length > 0) {
            // Отправляем уведомление пользователю
            await bot.api.sendMessage(telegramId, 'Ваши аватары готовы! 🎉');
            // Отправляем первые 5 изображений (или все, если их меньше 5)
            for (let i = 0; i < Math.min(5, images.length); i++) {
                await bot.api.sendPhoto(telegramId, images[i]);
            }
            // Если изображений больше 5, предложим ссылку на полную галерею
            if (images.length > 5) {
                await bot.api.sendMessage(telegramId, `Вы можете просмотреть все ${images.length} аватаров, перейдя по ссылке: ${API_BASE_URL}/models/${modelId}`);
            }
        }
    }
    catch (error) {
        console.error('Ошибка при отправке уведомления:', error);
    }
}
// Запускаем бота
bot.start();
console.log('Telegram бот запущен!');
