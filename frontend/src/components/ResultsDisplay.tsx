import React from 'react';
import { PredictionResult, VeterinaryRecommendations } from '../config/app';

interface ResultsDisplayProps {
  result: PredictionResult | null;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  console.log('📊 ResultsDisplay recibió:', result);
  
  if (!result) {
    return (
      <div className="text-center py-16 text-gray-500" role="status" aria-label="Esperando análisis">
        <div className="text-6xl mb-6">
          <i className="fas fa-chart-bar" aria-hidden="true"></i>
        </div>
        <p className="text-xl font-semibold mb-2">Análisis en Tiempo Real</p>
        <p className="text-gray-400">
          Los resultados del análisis aparecerán aquí después de procesar la imagen
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" role="region" aria-label="Resultados del análisis">
      {/* Main Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl text-center border border-amber-200">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Peso</div>
          <div className="text-xl font-bold text-amber-800" aria-label={`Peso: ${result.peso} kilogramos`}>{result.peso} kg</div>
        </div>
        {result.precio && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center border border-blue-200">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Precio Estimado</div>
            <div className="text-xl font-bold text-blue-800 capitalize" aria-label={`Precio: ${result.precio}`}>{result.precio}</div>
          </div>
        )}
        {result.confianza && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center border border-green-200">
            <div className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Confianza</div>
            <div className="text-xl font-bold text-green-800 capitalize" aria-label={`Confianza: ${result.confianza}`}>{result.confianza}</div>
          </div>
        )}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center border border-purple-200">
          <div className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2">Estado</div>
          <div className="text-xl font-bold text-purple-800 capitalize" aria-label="Estado: Analizado">Analizado</div>
        </div>
      </div>

    </div>
  );
};

// Componente separado para mostrar las recomendaciones veterinarias
interface VeterinaryRecommendationsProps {
  recommendations: VeterinaryRecommendations;
}

export const VeterinaryRecommendationsDisplay: React.FC<VeterinaryRecommendationsProps> = ({ recommendations }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6" role="region" aria-label="Recomendaciones veterinarias">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <i className="fas fa-user-md mr-3 text-emerald-600" aria-hidden="true"></i>
          Recomendaciones
        </h3>
        <div className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
          <i className="fas fa-robot mr-1.5" aria-hidden="true"></i>
          Confianza: 94%
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nutrición */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
          <h4 className="font-bold text-green-800 mb-4 flex items-center text-lg">
            <i className="fas fa-seedling mr-2 text-green-600" aria-hidden="true"></i>
            Nutrición
          </h4>
          <ul className="space-y-3">
            {recommendations.nutricion.map((rec, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <i className="fas fa-check-circle mr-3 mt-0.5 text-green-500 flex-shrink-0" aria-hidden="true"></i>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Manejo */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-4 flex items-center text-lg">
            <i className="fas fa-cogs mr-2 text-blue-600" aria-hidden="true"></i>
            Manejo
          </h4>
          <ul className="space-y-3">
            {recommendations.manejo.map((rec, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <i className="fas fa-check-circle mr-3 mt-0.5 text-blue-500 flex-shrink-0" aria-hidden="true"></i>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Salud */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-5 rounded-xl border border-red-200">
          <h4 className="font-bold text-red-800 mb-4 flex items-center text-lg">
            <i className="fas fa-heart mr-2 text-red-600" aria-hidden="true"></i>
            Salud
          </h4>
          <ul className="space-y-3">
            {recommendations.salud.map((rec, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <i className="fas fa-check-circle mr-3 mt-0.5 text-red-500 flex-shrink-0" aria-hidden="true"></i>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <p className="text-sm text-yellow-800 flex items-start">
          <i className="fas fa-exclamation-triangle mr-2 mt-0.5 text-yellow-600" aria-hidden="true"></i>
          <span className="leading-relaxed">
            <strong>Importante:</strong> Estas recomendaciones son generadas por inteligencia artificial y deben ser validadas por un veterinario profesional. 
            Siempre consulte con un especialista antes de implementar cambios significativos en el manejo de sus animales.
          </span>
        </p>
      </div>
    </div>
  );
};
