route.ts// app/api/telegram/set-webhook/route.ts
import { Bot } from 'grammy';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = process.env.WEBHOOK_SECRET;
    
    // Проверка секретного ключа для защиты эндпоинта
    const url = new URL(request.url);
    if (url.searchParams.get('secret') !== secret) {
      return NextResponse.json({ error: 'Неверный секретный ключ' }, { status: 401 });
    }
    
    const bot = new Bot(token || '');
    const webAppUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || 'https://headshotai-bay.vercel.app';
    
    const webhookUrl = `${webAppUrl}/api/telegram/webhook/${token}`;
    await bot.api.setWebhook(webhookUrl);
    
    return NextResponse.json({ 
      success: true, 
      webhook_url: webhookUrl 
    });
  } catch (error) {
    console.error('Ошибка установки вебхука:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}