// Configuración de la aplicación
export const APP_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://vacasapi-production.up.railway.app',
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  UPLOAD_PROGRESS_INTERVAL: 200, // ms
  UPLOAD_TIMEOUT: 300000, // 5 minutos para archivos grandes
  COMPRESSION_THRESHOLD: 2 * 1024 * 1024, // 2MB - comprimir archivos mayores a esto
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
  // Campos del Ensemble Model
  precision_estimada?: number;
  desviacion_estandar?: number;
  coeficiente_variacion?: number;
  peso_promedio?: number;
  peso_mediana?: number;
  pesos_individuales?: number[];
  outliers_removidos?: number;
}