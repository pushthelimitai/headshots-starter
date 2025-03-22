//route.ts// app/api/telegram/set-webhook/route.ts
import { Bot } from 'grammy';
import { NextResponse } from 'next/server';
import { Suspense } from 'react';

export async function POST(request: Request) {
  // Логика для обработки POST-запроса
  const body = await request.json();
  // Здесь вы можете добавить логику для обработки данных из запроса

  return NextResponse.json({ message: "Webhook set successfully" });
}

export async function GET(request: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
      // Проверка секретного ключа для защиты эндпоинта
    const secret = process.env.WEBHOOK_SECRET;
    
  
    const url = new URL(request.url);
      // Логика для обработки GET-запроса
   
      console.log('Получен GET-запрос на:', url);
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
   // Возвращаем ответ
    return NextResponse.json({ message: "Webhook GET request received" });
}

 