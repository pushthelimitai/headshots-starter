# Telegram Бот для Генерации Аватаров

Этот бот позволяет пользователям создавать профессиональные аватары с помощью технологии Astria AI через удобный интерфейс Telegram.

## Функциональные возможности

- Загрузка фотографий пользователя (минимум 4 фото)
- Выбор стиля из доступных паков
- Выбор типа аватаров (профессиональный, креативный, студийный и т.д.)
- Получение уведомлений о готовности аватаров
- Просмотр и скачивание готовых аватаров прямо в Telegram

## Установка и настройка

### Предварительные требования

- Node.js 16+ и npm/yarn
- Учетная запись Telegram
- Токен бота от @BotFather в Telegram
- Аккаунт и API-ключ Astria
- Учетная запись Supabase и настроенная база данных

### Шаги установки

1. Клонируйте репозиторий:
   ```bash
   git clone <url-репозитория>
   cd telegram-bot
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Скопируйте файл `.env.example` в `.env` и настройте переменные окружения:
   ```bash
   cp .env.example .env
   ```

4. Отредактируйте файл `.env`, установив все необходимые переменные:
   - `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота
   - `API_BASE_URL` - URL вашего сервера с API
   - `NEXT_PUBLIC_SUPABASE_URL` - URL вашей базы данных Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - анонимный ключ Supabase

5. Скомпилируйте TypeScript:
   ```bash
   npm run build
   ```

6. Запустите бота:
   ```bash
   npm start
   ```

### Настройка базы данных Supabase

1. Выполните SQL миграцию для создания таблицы пользователей:

```sql
-- Создание таблицы пользователей Telegram
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индекса для ускорения поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Установка RLS (Row Level Security) для таблицы
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Создание политики доступа для аутентифицированных пользователей
CREATE POLICY "Пользователи могут видеть только свою запись" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Пользователи могут обновлять только свою запись" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

2. Обновите определение типов в `types/supabase.ts`, добавив новую таблицу `users`.

### Интеграция с веб-приложением

1. Добавьте страницу для подключения Telegram аккаунта (`app/connect-telegram/page.tsx`).

2. Создайте API эндпоинт для регистрации Telegram пользователей (`app/api/telegram/register/route.ts`).

3. Модифицируйте webhook для уведомлений о готовых аватарах (`app/astria/prompt-webhook/route.ts`), добавив вызов функции для отправки уведомлений в Telegram.

```typescript
// Импортируйте функцию notifyUserAboutReadyAvatars из бота
import { notifyUserAboutReadyAvatars } from "@/telegram-bot/bot";

// Внутри обработчика webhook после сохранения изображений
if (allHeadshots.length > 0) {
  try {
    // Проверяем, есть ли у пользователя связанный Telegram ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("id", user_id)
      .single();

    if (!userError && userData && userData.telegram_id) {
      console.log(`Отправка уведомления в Telegram для пользователя ${user_id}`);
      
      // Асинхронно отправляем уведомление, не ждем завершения
      notifyUserAboutReadyAvatars(user_id, model_id)
        .then(() => console.log('Уведомление в Telegram успешно отправлено'))
        .catch(err => console.error('Ошибка при отправке уведомления в Telegram:', err));
    }
  } catch (telegramError) {
    // Ошибка в Telegram не должна прерывать основной поток выполнения
    console.error('Ошибка при попытке отправить уведомление в Telegram:', telegramError);
  }
}
```

## Использование бота

### Команды бота

- `/start` - Начать процесс создания аватаров
- `/connect` - Связать ваш Telegram с аккаунтом в приложении
- `/status` - Проверить статус обучения модели
- `/results` - Получить сгенерированные аватары
- `/cancel` - Отменить текущий процесс
- `/help` - Показать справку

### Процесс создания аватаров

1. Начните взаимодействие с ботом, отправив команду `/start`
2. Загрузите не менее 4 фотографий вашего лица
3. Выберите пак из предложенного меню
4. Выберите тип/стиль аватаров
5. Введите название для вашей модели
6. Дождитесь уведомления о готовности аватаров
7. Используйте команду `/results`, чтобы получить готовые аватары

### Связывание аккаунтов

Чтобы получать уведомления о готовности аватаров, пользователи должны связать свой Telegram аккаунт с аккаунтом в вашем приложении:

1. Отправьте команду `/connect` в Telegram-боте
2. Перейдите по полученной ссылке (вы должны быть уже авторизованы в приложении)
3. Нажмите кнопку "Связать аккаунт"
4. После успешного связывания вы будете получать уведомления в Telegram

## Устранение неполадок

При возникновении ошибок проверьте:

1. Правильность настройки переменных окружения
2. Доступность API (ваш сервер должен быть доступен для бота)
3. Корректность работы Supabase
4. Логи бота для идентификации ошибок
5. Правильность структуры таблицы `users` в Supabase
6. Наличие соответствующих разрешений для доступа к таблицам в Supabase

## Лицензия

MIT 