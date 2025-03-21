"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPacks = getPacks;
exports.uploadImage = uploadImage;
exports.createModel = createModel;
// telegram-service/api-client.ts
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Создаем экземпляр Axios с базовым URL
const apiClient = axios_1.default.create({
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
async function getPacks() {
    try {
        const response = await apiClient.get('/packs');
        return response.data;
    }
    catch (error) {
        console.error('Ошибка при получении паков:', error);
        throw error;
    }
}
async function uploadImage(imageBuffer, filename) {
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
    }
    catch (error) {
        console.error('Ошибка при загрузке изображения:', error);
        throw error;
    }
}
async function createModel(images, type, packId, name) {
    try {
        const response = await apiClient.post('/models', {
            images,
            type,
            packId,
            name
        });
        return response.data.modelId;
    }
    catch (error) {
        console.error('Ошибка при создании модели:', error);
        throw error;
    }
}
// Другие функции для работы с API...
