// telegram-bot/update-processor.ts
import { Bot, Context } from 'grammy';
import { processMessage, processCallback } from './handlers';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

export async function processUpdate(update: any) {
  // Обработка обновления без использования middleware стека grammy
  if (update.message) {
    await processMessage(bot, update.message);
  } else if (update.callback_query) {
    await processCallback(bot, update.callback_query);
  }
  // Добавьте обработку других типов обновлений по необходимости
}