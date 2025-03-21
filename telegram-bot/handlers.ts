import { Bot } from 'grammy';
import { ApiService } from './api-service';

// Обработка текстовых сообщений
export async function processMessage(bot: Bot, message: any) {
  try {
    const chatId = message.chat.id;
    
    // Обработка команд
    if (message.text && message.text.startsWith('/')) {
      const command = message.text.split(' ')[0].substring(1);
      
      switch (command) {
        case 'start':
          await bot.api.sendMessage(chatId, 'Добро пожаловать в бота для создания аватаров! Чтобы начать, отправьте не менее 4 фотографий вашего лица в хорошем качестве.');
          break;
          
        case 'connect':
          const telegramId = message.from.id;
          const username = message.from.username;
          const firstName = message.from.first_name;
          const lastName = message.from.last_name;
          
          const connectUrl = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/connect-telegram?telegram_id=${telegramId}` +
            (username ? `&username=${username}` : '') +
            (firstName ? `&first_name=${firstName}` : '') +
            (lastName ? `&last_name=${lastName}` : '');
            
          await bot.api.sendMessage(chatId, 
            'Чтобы связать ваш Telegram с аккаунтом в приложении, выполните следующие шаги:\n\n' +
            '1. Войдите в свой аккаунт в приложении\n' +
            '2. Перейдите по ссылке ниже\n' +
            '3. Нажмите кнопку "Связать аккаунт"\n\n' +
            connectUrl
          );
          break;
          
        case 'help':
          await bot.api.sendMessage(chatId,
            'Доступные команды:\n' +
            '/start - Начать процесс создания аватаров\n' +
            '/connect - Связать ваш Telegram с аккаунтом в приложении\n' +
            '/status - Проверить статус обучения модели\n' +
            '/results - Получить результаты (аватары)\n' +
            '/cancel - Отменить текущую операцию\n' +
            '/help - Показать эту справку'
          );
          break;
          
        default:
          await bot.api.sendMessage(chatId, 'Неизвестная команда. Используйте /help для просмотра доступных команд.');
      }
    }
    
    // Обработка фотографий
    else if (message.photo) {
      // Получаем фото максимального размера
      const photo = message.photo[message.photo.length - 1];
      await bot.api.sendMessage(chatId, `Фото получено! ID файла: ${photo.file_id}. В бессерверной среде Vercel нам нужно реализовать обработку фото через API.`);
    }
    
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
  }
}

/**
 * Обрабатывает callback-запросы от инлайн-кнопок
 */
export async function processCallback(bot: Bot, callbackQuery: any) {
  try {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    await bot.api.sendMessage(chatId, `Получен callback с данными: ${data}`);
    
    // Отправляем пустой ответ на callback, чтобы убрать индикатор загрузки
    await bot.api.answerCallbackQuery(callbackQuery.id);
    
  } catch (error) {
    console.error('Ошибка при обработке callback-запроса:', error);
  }
}