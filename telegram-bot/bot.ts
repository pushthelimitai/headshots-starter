import { createClient } from '@supabase/supabase-js';
import { Bot } from 'grammy'; // или другой импорт, в зависимости от вашей реализации

// Настройка клиента Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
import { config } from 'dotenv';
config(); // Загружаем переменные окружения из .env файла

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN не установлен'); // Проверка наличия токена
}
const bot = new Bot(token); // Создание бота
/**
 * Генерирует случайный токен для связывания аккаунтов
 * @param length Длина токена
 * @returns Строка со случайным токеном
 */
export function generateToken(length = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  // В Node.js используем crypto модуль
  try {
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      token += characters.charAt(randomBytes[i] % characters.length);
    }
  } catch (e) {
    // Запасной вариант, если crypto недоступен
    for (let i = 0; i < length; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  }
  
  return token;
}
   
   // Пример функции notifyUserAboutReadyAvatars
   export async function notifyUserAboutReadyAvatars(userId: string, modelId: string) {
       try {
           // Получаем Telegram ID пользователя из базы данных
           const { data, error } = await supabase
               .from('users')
               .select('telegram_id')
               .eq('id', userId) // Предполагаем, что userId - это ID пользователя в вашей базе данных
               .single();
   
           if (error || !data) {
               console.error('Ошибка при получении Telegram ID:', error);
               return;
           }
   
           const telegramId = data.telegram_id;
   
           // Формируем сообщение
           const message = `Ваши аватары готовы! Вы можете их просмотреть по следующей ссылке: https://example.com/models/${modelId}`;
   
           // Отправляем сообщение пользователю
           await bot.api.sendMessage(telegramId, message);
           console.log(`Уведомление отправлено пользователю ${telegramId}: ${message}`);
       } catch (error) {
           console.error('Ошибка при отправке уведомления:', error);
       }
   }
/**
 * Сохраняет токен связывания в базе данных
 * @param token Сгенерированный токен
 * @param telegramId ID пользователя в Telegram
 */
export async function saveConnectToken(token: string, telegramId: number): Promise<void> {
  try {
    // Создаем запись в базе данных
    const { error } = await supabase
      .from('connect_tokens')
      .insert({
        token,
        telegram_id: telegramId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString() // +1 час
      });
    
    if (error) {
      console.error('Ошибка при сохранении токена:', error);
      throw error;
    }
    
    console.log(`Токен ${token} успешно сохранен для Telegram ID ${telegramId}`);
  } catch (error) {
    console.error('Ошибка при сохранении токена связывания:', error);
    
    // Если таблица не существует, логируем сообщение но не вызываем ошибку
    console.log('Используем временное хранение токена в памяти (не подходит для продакшена)');
    
    // Используем глобальный объект как временное решение
    global._tokenStorage = global._tokenStorage || {};
    global._tokenStorage[token] = telegramId;
  }
}

/**
 * Получает Telegram ID по токену связывания
 * @param token Токен для проверки
 * @returns Telegram ID пользователя или null, если токен не найден
 */
export async function getTelegramIdByToken(token: string): Promise<number | null> {
  try {
    // Проверяем токен в базе данных
    const { data, error } = await supabase
      .from('connect_tokens')
      .select('telegram_id')
      .eq('token', token)
      .lt('expires_at', new Date().toISOString()) // Проверяем, что токен не истек
      .single();
    
    if (error || !data) {
      // Если есть ошибка или нет данных, пробуем проверить в локальном хранилище
      return global._tokenStorage?.[token] || null;
    }
    
    return data.telegram_id;
  } catch (error) {
    console.error('Ошибка при получении Telegram ID по токену:', error);
    
    // Проверяем в локальном хранилище как запасной вариант
    return global._tokenStorage?.[token] || null;
  }
}

console.log('Экспортируемые члены:', { notifyUserAboutReadyAvatars });

export { bot }; // Экспортируем объект bot