// telegram-service/api-client.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Создаем экземпляр Axios с базовым URL
const apiClient = axios.create({
  baseURL: process.env.MAIN_API_URL || 'https://headshotai-bay.vercel.app/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Добавляем API-ключ к каждому запросу
apiClient.interceptors.request.use((config) => {
  config.headers['API-Key'] = process.env.API_SECRET_KEY;
  return config;
});

export async function getPacks() {
  try {
    const response = await apiClient.get('/packs');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении паков:', error);
    throw error;
  }
}

export async function uploadImage(imageBuffer: Buffer, filename: string) {
  try {
    // Создаем FormData для загрузки файла
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, filename);
    
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.imageUrl;
  } catch (error) {
    console.error('Ошибка при загрузке изображения:', error);
    throw error;
  }
}

export async function createModel(images: string[], type: string, packId: string, name: string) {
  try {
    const response = await apiClient.post('/models', {
      images,
      type,
      packId,
      name
    });
    
    return response.data.modelId;
  } catch (error) {
    console.error('Ошибка при создании модели:', error);
    throw error;
  }
}

// Другие функции для работы с API...