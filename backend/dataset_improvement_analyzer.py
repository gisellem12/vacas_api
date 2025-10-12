#!/usr/bin/env python3
"""
Analizador de Mejora de Precisión para Datasets de Ganado
Compara datasets actuales vs nuevos y predice mejoras de precisión
"""

import json
import os
from typing import Dict, List, Tuple
import numpy as np
from pathlib import Path

class DatasetImprovementAnalyzer:
    """Analiza el potencial de mejora de precisión con nuevos datasets"""
    
    def __init__(self):
        self.current_dataset = None
        self.load_current_dataset()
    
    def load_current_dataset(self):
        """Cargar dataset actual del sistema"""
        try:
            dataset_path = os.path.join('dataset-ninja', 'expanded_cows', 'annotations_expanded.json')
            if os.path.exists(dataset_path):
                with open(dataset_path, 'r', encoding='utf-8') as f:
                    self.current_dataset = json.load(f)
                print(f"✅ Dataset actual cargado: {len(self.current_dataset.get('images', []))} imágenes")
            else:
                print("⚠️ Dataset actual no encontrado")
        except Exception as e:
            print(f"❌ Error cargando dataset actual: {e}")
    
    def analyze_current_limitations(self) -> Dict:
        """Analizar limitaciones del dataset actual"""
        if not self.current_dataset:
            return {"error": "Dataset actual no disponible"}
        
        images = self.current_dataset.get('images', [])
        
        analysis = {
            "total_images": len(images),
            "weight_distribution": self._analyze_weight_distribution(images),
            "error_analysis": self._analyze_errors(images),
            "condition_distribution": self._analyze_condition_distribution(images),
            "image_quality_issues": self._analyze_image_quality_issues(images),
            "limitations": [],
            "improvement_potential": {}
        }
        
        # Identificar limitaciones
        if len(images) < 100:
            analysis["limitations"].append("Dataset pequeño - solo 30 imágenes")
        
        weight_range = analysis["weight_distribution"]
        if weight_range["range"] < 300:
            analysis["limitations"].append(f"Rango de peso limitado: {weight_range['min']}-{weight_range['max']}kg")
        
        error_stats = analysis["error_analysis"]
        if error_stats["avg_error"] > 5:
            analysis["limitations"].append(f"Error promedio alto: {error_stats['avg_error']:.1f}kg")
        
        conditions = analysis["condition_distribution"]
        if len(conditions) < 3:
            analysis["limitations"].append("Poca variedad en condiciones corporales")
        
        # Calcular potencial de mejora
        analysis["improvement_potential"] = self._calculate_improvement_potential(analysis)
        
        return analysis
    
    def _analyze_weight_distribution(self, images: List[Dict]) -> Dict:
        """Analizar distribución de pesos"""
        weights = [img.get('real_weight', 0) for img in images if img.get('real_weight')]
        
        if not weights:
            return {"min": 0, "max": 0, "avg": 0, "range": 0}
        
        return {
            "min": min(weights),
            "max": max(weights),
            "avg": sum(weights) / len(weights),
            "range": max(weights) - min(weights),
            "std": np.std(weights) if len(weights) > 1 else 0
        }
    
    def _analyze_errors(self, images: List[Dict]) -> Dict:
        """Analizar errores de estimación"""
        errors = []
        for img in images:
            real_weight = img.get('real_weight')
            ai_estimate = img.get('ai_estimate')
            if real_weight and ai_estimate:
                error = abs(real_weight - ai_estimate)
                errors.append(error)
        
        if not errors:
            return {"avg_error": 0, "max_error": 0, "error_std": 0}
        
        return {
            "avg_error": sum(errors) / len(errors),
            "max_error": max(errors),
            "min_error": min(errors),
            "error_std": np.std(errors) if len(errors) > 1 else 0,
            "error_count": len(errors)
        }
    
    def _analyze_condition_distribution(self, images: List[Dict]) -> Dict:
        """Analizar distribución de condiciones corporales"""
        conditions = {}
        for img in images:
            condition = img.get('condition', 'unknown')
            conditions[condition] = conditions.get(condition, 0) + 1
        
        return conditions
    
    def _analyze_image_quality_issues(self, images: List[Dict]) -> Dict:
        """Analizar problemas de calidad de imagen"""
        issues = {
            "low_resolution": 0,
            "missing_images": 0,
            "inconsistent_angles": 0
        }
        
        for img in images:
            width = img.get('width', 0)
            height = img.get('height', 0)
            
            if width < 800 or height < 600:
                issues["low_resolution"] += 1
            
            # Verificar si la imagen existe
            file_name = img.get('file_name')
            if file_name:
                image_path = os.path.join('dataset-ninja', 'expanded_cows', file_name)
                if not os.path.exists(image_path):
                    issues["missing_images"] += 1
        
        return issues
    
    def _calculate_improvement_potential(self, analysis: Dict) -> Dict:
        """Calcular potencial de mejora"""
        current_score = 0.6  # Basado en evaluación anterior
        
        improvements = {
            "size_improvement": 0,
            "quality_improvement": 0,
            "diversity_improvement": 0,
            "total_improvement": 0
        }
        
        # Mejora por tamaño
        if analysis["total_images"] < 100:
            improvements["size_improvement"] = min(0.2, (100 - analysis["total_images"]) / 100 * 0.3)
        
        # Mejora por calidad
        error_stats = analysis["error_analysis"]
        if error_stats["avg_error"] > 4:
            improvements["quality_improvement"] = min(0.15, (error_stats["avg_error"] - 4) / 10 * 0.2)
        
        # Mejora por diversidad
        conditions = analysis["condition_distribution"]
        if len(conditions) < 4:
            improvements["diversity_improvement"] = min(0.1, (4 - len(conditions)) / 4 * 0.15)
        
        # Mejora total
        improvements["total_improvement"] = sum(improvements.values())
        improvements["predicted_new_score"] = min(1.0, current_score + improvements["total_improvement"])
        
        return improvements
    
    def evaluate_new_dataset_potential(self, new_dataset_info: Dict) -> Dict:
        """Evaluar potencial de un nuevo dataset"""
        print("🔍 Evaluando potencial del nuevo dataset...")
        
        evaluation = {
            "dataset_compatibility": self._check_compatibility(new_dataset_info),
            "precision_improvement": self._predict_precision_improvement(new_dataset_info),
            "integration_effort": self._estimate_integration_effort(new_dataset_info),
            "recommendation": "",
            "expected_benefits": [],
            "risks": []
        }
        
        # Generar recomendación
        if evaluation["dataset_compatibility"]["score"] >= 0.8:
            if evaluation["precision_improvement"]["expected_error_reduction"] > 1:
                evaluation["recommendation"] = "HIGHLY_RECOMMENDED"
                evaluation["expected_benefits"].extend([
                    "Reducción significativa del error promedio",
                    "Mejor generalización a diferentes razas",
                    "Mayor robustez del modelo"
                ])
            else:
                evaluation["recommendation"] = "RECOMMENDED"
                evaluation["expected_benefits"].append("Mejora moderada en precisión")
        else:
            evaluation["recommendation"] = "NOT_RECOMMENDED"
            evaluation["risks"].append("Incompatibilidad con sistema actual")
        
        return evaluation
    
    def _check_compatibility(self, dataset_info: Dict) -> Dict:
        """Verificar compatibilidad con sistema actual"""
        compatibility = {
            "has_weight_data": dataset_info.get("annotations", {}).get("has_weight_data", False),
            "format_compatible": dataset_info.get("annotations", {}).get("format_compatibility", False),
            "image_quality_ok": dataset_info.get("images", {}).get("image_quality", "unknown") in ["good", "excellent"],
            "sufficient_size": dataset_info.get("total_images", 0) > 50,
            "score": 0
        }
        
        # Calcular puntuación de compatibilidad
        score = 0
        if compatibility["has_weight_data"]: score += 0.4
        if compatibility["format_compatible"]: score += 0.3
        if compatibility["image_quality_ok"]: score += 0.2
        if compatibility["sufficient_size"]: score += 0.1
        
        compatibility["score"] = score
        return compatibility
    
    def _predict_precision_improvement(self, dataset_info: Dict) -> Dict:
        """Predecir mejora en precisión"""
        current_error = 3.8  # Error actual del sistema
        
        # Factores de mejora
        size_factor = min(0.3, (dataset_info.get("total_images", 0) - 30) / 200)
        quality_factor = 0.1 if dataset_info.get("images", {}).get("image_quality") == "excellent" else 0.05
        diversity_factor = 0.1 if dataset_info.get("annotations", {}).get("breed_variety", 0) > 3 else 0.05
        
        total_improvement_factor = size_factor + quality_factor + diversity_factor
        
        predicted_error = current_error * (1 - total_improvement_factor)
        
        return {
            "current_error": current_error,
            "predicted_error": predicted_error,
            "expected_error_reduction": current_error - predicted_error,
            "improvement_percentage": (current_error - predicted_error) / current_error * 100,
            "factors": {
                "size_improvement": size_factor,
                "quality_improvement": quality_factor,
                "diversity_improvement": diversity_factor
            }
        }
    
    def _estimate_integration_effort(self, dataset_info: Dict) -> Dict:
        """Estimar esfuerzo de integración"""
        effort = {
            "data_conversion": "low",
            "format_adjustment": "low",
            "quality_control": "medium",
            "testing": "medium",
            "total_effort": "medium"
        }
        
        # Ajustar según características del dataset
        if not dataset_info.get("annotations", {}).get("format_compatibility", False):
            effort["data_conversion"] = "high"
            effort["format_adjustment"] = "high"
            effort["total_effort"] = "high"
        
        if dataset_info.get("images", {}).get("image_quality") == "poor":
            effort["quality_control"] = "high"
            effort["total_effort"] = "high"
        
        return effort

def analyze_dataset_improvement():
    """Función principal para analizar mejora de dataset"""
    analyzer = DatasetImprovementAnalyzer()
    
    print("📊 ANÁLISIS DE MEJORA DE PRECISIÓN")
    print("="*50)
    
    # Analizar limitaciones actuales
    current_analysis = analyzer.analyze_current_limitations()
    print("\n🔍 LIMITACIONES DEL DATASET ACTUAL:")
    for limitation in current_analysis["limitations"]:
        print(f"  {limitation}")
    
    print(f"\n📈 POTENCIAL DE MEJORA:")
    improvement = current_analysis["improvement_potential"]
    print(f"  - Mejora por tamaño: {improvement['size_improvement']:.2f}")
    print(f"  - Mejora por calidad: {improvement['quality_improvement']:.2f}")
    print(f"  - Mejora por diversidad: {improvement['diversity_improvement']:.2f}")
    print(f"  - Puntuación actual: 0.60")
    print(f"  - Puntuación potencial: {improvement['predicted_new_score']:.2f}")
    
    print(f"\n🎯 ESTADÍSTICAS ACTUALES:")
    weight_dist = current_analysis["weight_distribution"]
    error_stats = current_analysis["error_analysis"]
    print(f"  - Rango de peso: {weight_dist['min']}-{weight_dist['max']}kg")
    print(f"  - Error promedio: {error_stats['avg_error']:.1f}kg")
    print(f"  - Total de imágenes: {current_analysis['total_images']}")
    
    return current_analysis

if __name__ == "__main__":
    analyze_dataset_improvement()
