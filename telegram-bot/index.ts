/**
 * Основной файл для запуска Telegram бота
 */
import { bot } from './bot';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

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
  bot.catch((err) => {
    console.error('Произошла ошибка в работе бота:', err);
  });
  
  // Запускаем бота
  bot.start();
  
  console.log('Telegram бот успешно запущен!');
} catch (error) {
  console.error('Ошибка при запуске бота:', error);
  process.exit(1);
} 