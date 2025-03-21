"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUpdate = processUpdate;
// telegram-bot/update-processor.ts
const grammy_1 = require("grammy");
const handlers_1 = require("./handlers");
// Убедитесь, что бот инициализирован правильно
const bot = new grammy_1.Bot(process.env.TELEGRAM_BOT_TOKEN || '');
async function processUpdate(update) {
    // Обработка обновления без использования middleware стека grammy
    if (update.message) {
        await (0, handlers_1.processMessage)(bot, update.message);
    }
    else if (update.callback_query) {
        await (0, handlers_1.processCallback)(bot, update.callback_query);
    }
    // Добавьте обработку других типов обновлений по необходимости
}
