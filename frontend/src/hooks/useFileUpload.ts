import { useState, useCallback, useRef } from 'react';
import { APP_CONFIG, ApiError } from '../config/app';

// Función para comprimir imágenes
const compressImage = (file: File, maxSizeKB: number = 2048): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo la proporción
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convertir a blob con compresión
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.8 // Calidad de compresión (0.8 = 80%)
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para validar archivos
  const validateFile = useCallback((file: File): string | null => {
    if (!APP_CONFIG.ALLOWED_FILE_TYPES.includes(file.type as 'image/jpeg' | 'image/jpg' | 'image/png' | 'image/webp')) {
      return 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP).';
    }
    if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
      return `El archivo es demasiado grande. Máximo permitido: ${APP_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validationError = validateFile(file);
    if (validationError) {
      setError({ message: validationError });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Comprimir imagen si es mayor al umbral configurado
      let processedFile = file;
      if (file.size > APP_CONFIG.COMPRESSION_THRESHOLD) {
        console.log(`🔄 Comprimiendo imagen de ${(file.size / 1024 / 1024).toFixed(1)}MB...`);
        processedFile = await compressImage(file);
        console.log(`✅ Imagen comprimida a ${(processedFile.size / 1024 / 1024).toFixed(1)}MB`);
      }

      // Limpiar URL anterior si existe
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedFile(processedFile);
      setPreviewUrl(URL.createObjectURL(processedFile));
    } catch (error) {
      console.error('Error procesando imagen:', error);
      setError({ message: 'Error al procesar la imagen. Intenta con otra.' });
    } finally {
      setIsLoading(false);
    }
  }, [previewUrl, validateFile]);

  const reset = useCallback(() => {
    // Limpiar URL de objeto
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  return {
    selectedFile,
    previewUrl,
    isLoading,
    error,
    uploadProgress,
    fileInputRef,
    setError,
    setIsLoading,
    setUploadProgress,
    handleFileSelect,
    reset,
  };
};