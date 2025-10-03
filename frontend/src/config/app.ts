// Configuración de la aplicación
export const APP_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://agrotechvision.up.railway.app',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  UPLOAD_PROGRESS_INTERVAL: 200, // ms
} as const;

// Tipos de errores de la API
export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

// Recomendaciones veterinarias
export interface VeterinaryRecommendations {
  nutricion: string[];
  manejo: string[];
  salud: string[];
}

// Resultado de la predicción
export interface PredictionResult {
  peso: number;
  precio?: string;
  recomendaciones: VeterinaryRecommendations;
  metodologia?: string;
  peso_openai?: number;
  peso_dataset?: number;
  peso_original?: number;
  factor_correccion_global?: number;
  confianza?: string;
  observaciones?: string;
  dispositivo?: string;
  ajustes_aplicados?: string;
}
