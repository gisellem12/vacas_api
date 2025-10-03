import React from 'react';
import Image from 'next/image';
import { useFileUpload } from '../hooks/useFileUpload';
import { PredictionResult, ApiError } from '../config/app';

interface UploadFormProps {
  onSubmit: (file: File) => Promise<void>;
  isLoading: boolean;
  uploadProgress: number;
  error: ApiError | null;
}

export const UploadForm: React.FC<UploadFormProps> = ({
  onSubmit,
  isLoading,
  uploadProgress,
  error,
}) => {
  const {
    selectedFile,
    previewUrl,
    fileInputRef,
    handleFileSelect,
    reset,
  } = useFileUpload();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;
    await onSubmit(selectedFile);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
      {/* Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500"></div>
      
      {/* Feature Icon */}
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border-2 border-emerald-100 group-hover:scale-110 transition-transform duration-300">
        <i className="fas fa-camera text-2xl text-emerald-600" aria-hidden="true"></i>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Captura Simple</h3>
      <p className="text-gray-600 mb-8 text-center leading-relaxed">
        Toma una foto lateral del animal con tu smartphone. 
        Nuestra IA hace el resto automáticamente.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Input */}
        <div>
          <label htmlFor="file-input" className="block text-sm font-semibold text-gray-900 mb-3">
            <i className="fas fa-cloud-upload-alt mr-2" aria-hidden="true"></i>
            Selecciona una imagen de ganado
          </label>
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="w-full p-4 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50 text-emerald-700 cursor-pointer hover:border-emerald-400 hover:bg-emerald-100 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
            required
            aria-describedby="file-help"
          />
          <p id="file-help" className="text-xs text-gray-500 mt-2">
            Formatos soportados: JPEG, PNG, WebP. Tamaño máximo: 10MB
          </p>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
              <i className="fas fa-eye mr-2" aria-hidden="true"></i> Vista previa:
            </p>
            <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-emerald-200 shadow-lg">
              <Image
                src={previewUrl}
                alt="Preview de imagen de ganado"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isLoading && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={!selectedFile || isLoading}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
            aria-label={isLoading ? "Analizando imagen..." : "Analizar imagen con IA"}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                <span>Analizando... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <i className="fas fa-brain" aria-hidden="true"></i>
                <span>Analizar con IA</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={reset}
            disabled={isLoading}
            className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            aria-label="Limpiar formulario y empezar de nuevo"
          >
            <i className="fas fa-redo" aria-hidden="true"></i>
            <span>Limpiar</span>
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl" role="alert">
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-triangle text-red-600 mt-1" aria-hidden="true"></i>
            <div>
              <strong className="block">Error:</strong>
              <p className="mt-1">{error.message}</p>
              {error.details && (
                <p className="mt-2 text-sm text-red-600">{error.details}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
