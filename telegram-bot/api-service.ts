import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Сервис для работы с API приложения
 */
export class ApiService {
  /**
   * Загружает изображение на сервер
   * @param filePath Путь к файлу на диске
   * @param filename Имя файла
   * @returns URL загруженного изображения
   */
  static async uploadImage(buffer: Buffer, filename: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', buffer, filename);

      const response = await axios.post(
        `${API_BASE_URL}/astria_mode/train-model/image-upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      if (response.data?.url) {
        return response.data.url;
      }
      
      throw new Error('Не удалось получить URL загруженного изображения');
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
      throw error;
    }
  }

  /**
   * Получает список доступных паков
   * @returns Массив паков
   */
  static async getPacks(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/astria_mode/packs`);
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при получении паков:', error);
      return [];
    }
  }

  /**
   * Создает и тренирует модель
   * @param images Массив URL изображений
   * @param type Тип модели
   * @param pack ID пака
   * @param name Название модели
   * @returns ID созданной модели
   */
  static async createModel(
    images: string[],
    type: string,
    pack: string,
    name: string
  ): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/astria_mode/train-model`, {
        urls: images,
        type,
        pack,
        name,
      });

      if (response.data?.modelId) {
        return response.data.modelId;
      }
      
      throw new Error('Не удалось получить ID созданной модели');
    } catch (error) {
      console.error('Ошибка при создании модели:', error);
      throw error;
    }
  }

  /**
   * Получает список сгенерированных изображений для модели
   * @param modelId ID модели
   * @returns Массив URL изображений
   */
  static async getGeneratedImages(modelId: string): Promise<string[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/models/${modelId}/images`);
      
      if (response.data) {
        return response.data.map((image: any) => image.uri);
      }
      
      return [];
    } catch (error) {
      console.error('Ошибка при получении изображений:', error);
      return [];
    }
  }

  /**
   * Получает статус модели
   * @param modelId ID модели
   * @returns Статус модели
   */
  static async getModelStatus(modelId: string): Promise<string> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/models/${modelId}`);
      
      if (response.data?.status) {
        return response.data.status;
      }
      
      return 'unknown';
    } catch (error) {
      console.error('Ошибка при получении статуса модели:', error);
      return 'error';
    }
  }
} 