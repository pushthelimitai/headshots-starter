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