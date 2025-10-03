'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface WeightEntry {
  id: string;
  timestamp: Date;
  weight: number;
  condition: string;
  confidence: string;
  imageUrl?: string;
  deviceType?: string;
  originalWeight?: number;
}

interface WeightHistoryProps {
  entries: WeightEntry[];
  onClearHistory: () => void;
}

const WeightHistory: React.FC<WeightHistoryProps> = ({ entries, onClearHistory }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'delgada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'media':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'gorda':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'muy_alta':
        return 'bg-emerald-100 text-emerald-800';
      case 'alta':
        return 'bg-green-100 text-green-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return '📱';
      case 'desktop':
        return '💻';
      case 'tablet':
        return '📱';
      default:
        return '🤖';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-6xl mb-4">🐄</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Historial de Pesos
        </h3>
        <p className="text-gray-500 mb-4">
          Sube una imagen de una vaca para comenzar el historial
        </p>
        <div className="text-sm text-gray-400">
          Los resultados se mostrarán aquí automáticamente
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📊</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Historial de Pesos
            </h3>
            <p className="text-sm text-gray-500">
              {entries.length} {entries.length === 1 ? 'estimación' : 'estimaciones'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isExpanded ? 'Contraer' : 'Expandir'}
          >
            {isExpanded ? '📉' : '📈'}
          </button>
          <button
            onClick={onClearHistory}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Limpiar historial"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${
                isExpanded ? 'p-6' : 'p-4'
              }`}
            >
              {/* Main Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">⚖️</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {entry.weight} kg
                    </div>
                    {entry.originalWeight && entry.originalWeight !== entry.weight && (
                      <div className="text-sm text-gray-500">
                        Original: {entry.originalWeight} kg
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {formatTime(entry.timestamp)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(entry.timestamp)}
                  </div>
                </div>
              </div>

              {/* Expanded Info */}
              {isExpanded && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  {/* Condition and Confidence */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getConditionColor(entry.condition)}`}
                    >
                      {entry.condition.charAt(0).toUpperCase() + entry.condition.slice(1)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(entry.confidence)}`}
                    >
                      Confianza: {entry.confidence.replace('_', ' ')}
                    </span>
                    {entry.deviceType && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {getDeviceIcon(entry.deviceType)} {entry.deviceType}
                      </span>
                    )}
                  </div>

                  {/* Image Preview */}
                  {entry.imageUrl && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-600 mb-2">Imagen analizada:</div>
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={entry.imageUrl}
                          alt="Vaca analizada"
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="text-xs text-gray-500">
                    ID: {entry.id.slice(0, 8)}...
                  </div>
                </div>
              )}

              {/* Compact View Indicators */}
              {!isExpanded && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getConditionColor(entry.condition)}`}
                    >
                      {entry.condition.charAt(0).toUpperCase() + entry.condition.slice(1)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(entry.confidence)}`}
                    >
                      {entry.confidence.replace('_', ' ')}
                    </span>
                  </div>
                  {entry.deviceType && (
                    <span className="text-lg">
                      {getDeviceIcon(entry.deviceType)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Promedio: {Math.round(entries.reduce((sum, entry) => sum + entry.weight, 0) / entries.length)} kg
          </div>
          <div>
            Rango: {Math.min(...entries.map(e => e.weight))} - {Math.max(...entries.map(e => e.weight))} kg
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightHistory;
