// app/api/models/route.ts в основном приложении
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Проверка API-ключа
  const apiKey = request.headers.get('x-api-key'); // Извлечение API-ключа из заголовков
  if (!apiKey || apiKey !== process.env.API_KEY) { // Сравнение с ожидаемым значением
    return new Response('Unauthorized', { status: 401 }); // Возврат ошибки 401
  }
  
  try {
    const { images, type, packId, name } = await request.json();
    
    // TODO: Обработка данных и создание модели
    
  // Обработка тела запроса
  const body = await request.json(); // Извлечение JSON из тела запроса

    return NextResponse.json({ 
      modelId: 'new-model-id',
      status: 'pending' 
    });
    
  } catch (error) {
    console.error('Ошибка при создании модели:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }

 return new Response('Success', { status: 200 }); // Возврат успешного ответа
}