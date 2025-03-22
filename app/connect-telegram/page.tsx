'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ConnectTelegramPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  // Получаем параметры из URL
  const telegramId = searchParams.get('telegram_id');
  const username = searchParams.get('username');
  const firstName = searchParams.get('first_name');
  const lastName = searchParams.get('last_name');

  // Функция для подключения Telegram
  const connectTelegram = async () => {
    if (!telegramId) {
      setStatus('error');
      setMessage('Не удалось получить Telegram ID. Пожалуйста, попробуйте еще раз.');
      return;
    }

    try {
      setStatus('loading');
      setMessage('Связываем ваш аккаунт с Telegram...');

      // Отправляем запрос к API
      const response = await fetch('/api/telegram/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegram_id: telegramId,
          username,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не удалось связать аккаунт');
      }

      const data = await response.json();
      setStatus('success');
      setMessage('Ваш аккаунт успешно связан с Telegram! Теперь вы будете получать уведомления о готовности ваших аватаров.');
    } catch (error) {
      console.error('Ошибка при связывании аккаунта:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Произошла неизвестная ошибка');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Связать аккаунт с Telegram</CardTitle>
          <CardDescription>
            Подключите ваш Telegram аккаунт, чтобы получать уведомления о готовности аватаров.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'idle' && (
            <div className="space-y-4">
              <p>Вы хотите связать свой аккаунт со следующим Telegram пользователем:</p>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4">
                <p><strong>Telegram ID:</strong> {telegramId}</p>
                {username && <p><strong>Имя пользователя:</strong> @{username}</p>}
                <p><strong>Имя:</strong> {firstName} {lastName}</p>
              </div>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
              <p>{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-green-800 dark:text-green-200">
              <p>{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
              <p>{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={() => router.push('/')}>
                Отмена
              </Button>
              <Button onClick={connectTelegram}>
                Связать аккаунт
              </Button>
            </>
          )}
          
          {(status === 'success' || status === 'error') && (
            <Button onClick={() => router.push('/')}>
              Вернуться на главную
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}