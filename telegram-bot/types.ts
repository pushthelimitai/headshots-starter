/**
 * Тип для сессии пользователя
 */
export interface SessionData {
  userId?: string; // ID пользователя в Supabase
  step: Step;
  images: string[]; // URL загруженных изображений
  pack?: string; // Выбранный пак
  type?: string; // Выбранный тип (напр., "профессиональный", "креативный" и т.д.)
  name?: string; // Имя для модели
  modelId?: string; // ID созданной модели
}

/**
 * Шаги процесса создания аватара
 */
export type Step = 
  | 'idle'        // Начальное состояние
  | 'upload'      // Загрузка изображений
  | 'select_pack' // Выбор пака
  | 'select_type' // Выбор типа
  | 'enter_name'; // Ввод названия модели

/**
 * Тип для пака
 */
export interface Pack {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
}

/**
 * Тип для модели
 */
export interface Model {
  id: string;
  name: string;
  type: string;
  status: ModelStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Статусы модели
 */
export type ModelStatus = 
  | 'pending'   // Ожидает обработки
  | 'training'  // Идет обучение
  | 'finished'  // Обучение завершено
  | 'failed';   // Ошибка при обучении

/**
 * Тип для изображения
 */
export interface Image {
  id: string;
  modelId: string;
  uri: string;
  created_at: string;
} 