import { useState, useCallback, useRef } from 'react';
import { APP_CONFIG, ApiError } from '../config/app';

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

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validationError = validateFile(file);
    if (validationError) {
      setError({ message: validationError });
      return;
    }

    // Limpiar URL anterior si existe
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
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
