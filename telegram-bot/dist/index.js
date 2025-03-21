"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Основной файл для запуска Telegram бота
 */
const bot_1 = require("./bot");
const dotenv_1 = __importDefault(require("dotenv"));
// Загружаем переменные окружения
dotenv_1.default.config();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Проверяем наличие токена
if (!TELEGRAM_BOT_TOKEN) {
    console.error('Ошибка: TELEGRAM_BOT_TOKEN не найден в переменных окружения.');
    process.exit(1);
}
// Запускаем бота
try {
    console.log('Telegram бот запускается...');
    // Обработка ошибок в процессе работы бота
    bot_1.bot.catch((err) => {
        console.error('Произошла ошибка в работе бота:', err);
    });
    // Запускаем бота
    bot_1.bot.start();
    console.log('Telegram бот успешно запущен!');
}
catch (error) {
    console.error('Ошибка при запуске бота:', error);
    process.exit(1);
}
