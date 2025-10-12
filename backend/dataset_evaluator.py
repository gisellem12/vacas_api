#!/usr/bin/env python3
"""
Evaluador de Datasets para AgroTech Vision
Analiza la calidad y potencial de datasets de ganado para estimación de peso
"""

import os
import json
import zipfile
import pandas as pd
from PIL import Image
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CattleDatasetEvaluator:
    """Evaluador completo de datasets de ganado"""
    
    def __init__(self, dataset_path: str):
        self.dataset_path = dataset_path
        self.dataset_info = {}
        self.quality_metrics = {}
        self.recommendations = []
        
    def evaluate_dataset(self) -> Dict:
        """Evaluación completa del dataset"""
        logger.info(f"🔍 Evaluando dataset: {self.dataset_path}")
        
        # 1. Verificar si es un archivo ZIP
        if self.dataset_path.endswith('.zip'):
            return self._evaluate_zip_dataset()
        else:
            return self._evaluate_directory_dataset()
    
    def _evaluate_zip_dataset(self) -> Dict:
        """Evaluar dataset en formato ZIP"""
        logger.info("📦 Dataset es un archivo ZIP, extrayendo...")
        
        try:
            with zipfile.ZipFile(self.dataset_path, 'r') as zip_ref:
                # Listar contenido
                file_list = zip_ref.namelist()
                logger.info(f"📋 Archivos en ZIP: {len(file_list)}")
                
                # Buscar archivos de anotaciones
                annotation_files = [f for f in file_list if f.endswith(('.json', '.csv', '.txt', '.xml'))]
                image_files = [f for f in file_list if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
                
                logger.info(f"📊 Archivos de anotación: {len(annotation_files)}")
                logger.info(f"🖼️ Imágenes: {len(image_files)}")
                
                # Extraer temporalmente para análisis
                import shutil
                temp_dir = "temp_dataset_analysis"
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)
                
                zip_ref.extractall(temp_dir)
                
                # Analizar estructura
                structure_analysis = self._analyze_structure(temp_dir)
                
                # Analizar anotaciones
                annotations_analysis = self._analyze_annotations(temp_dir, annotation_files)
                
                # Analizar imágenes
                images_analysis = self._analyze_images(temp_dir, image_files[:50])  # Limitar para velocidad
                
                # Limpiar archivos temporales
                shutil.rmtree(temp_dir)
                
                return {
                    "dataset_type": "ZIP",
                    "total_files": len(file_list),
                    "annotation_files": len(annotation_files),
                    "image_files": len(image_files),
                    "structure": structure_analysis,
                    "annotations": annotations_analysis,
                    "images": images_analysis,
                    "quality_score": self._calculate_quality_score(structure_analysis, annotations_analysis, images_analysis),
                    "recommendations": self._generate_recommendations(structure_analysis, annotations_analysis, images_analysis)
                }
                
        except Exception as e:
            logger.error(f"❌ Error evaluando ZIP: {e}")
            return {"error": str(e)}
    
    def _evaluate_directory_dataset(self) -> Dict:
        """Evaluar dataset en directorio"""
        logger.info("📁 Dataset es un directorio")
        
        if not os.path.exists(self.dataset_path):
            return {"error": f"Directorio no encontrado: {self.dataset_path}"}
        
        # Buscar archivos
        image_files = []
        annotation_files = []
        
        for root, dirs, files in os.walk(self.dataset_path):
            for file in files:
                file_path = os.path.join(root, file)
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                    image_files.append(file_path)
                elif file.endswith(('.json', '.csv', '.txt', '.xml')):
                    annotation_files.append(file_path)
        
        # Analizar
        structure_analysis = self._analyze_structure(self.dataset_path)
        annotations_analysis = self._analyze_annotations(self.dataset_path, [os.path.basename(f) for f in annotation_files])
        images_analysis = self._analyze_images(self.dataset_path, image_files[:50])
        
        return {
            "dataset_type": "DIRECTORY",
            "total_images": len(image_files),
            "total_annotations": len(annotation_files),
            "structure": structure_analysis,
            "annotations": annotations_analysis,
            "images": images_analysis,
            "quality_score": self._calculate_quality_score(structure_analysis, annotations_analysis, images_analysis),
            "recommendations": self._generate_recommendations(structure_analysis, annotations_analysis, images_analysis)
        }
    
    def _analyze_structure(self, dataset_path: str) -> Dict:
        """Analizar estructura del dataset"""
        logger.info("🏗️ Analizando estructura del dataset...")
        
        structure_info = {
            "has_annotations": False,
            "has_images": False,
            "annotation_format": None,
            "image_organization": "unknown",
            "file_count": 0,
            "directory_structure": []
        }
        
        # Contar archivos y directorios
        if os.path.isdir(dataset_path):
            for root, dirs, files in os.walk(dataset_path):
                structure_info["file_count"] += len(files)
                structure_info["directory_structure"].append({
                    "path": root,
                    "directories": dirs,
                    "files": len(files)
                })
        
        return structure_info
    
    def _analyze_annotations(self, dataset_path: str, annotation_files: List[str]) -> Dict:
        """Analizar archivos de anotaciones"""
        logger.info("📝 Analizando anotaciones...")
        
        analysis = {
            "total_annotations": 0,
            "has_weight_data": False,
            "has_breed_data": False,
            "has_condition_data": False,
            "weight_range": None,
            "breed_variety": 0,
            "condition_variety": 0,
            "annotation_quality": "unknown",
            "format_compatibility": False
        }
        
        weights = []
        breeds = set()
        conditions = set()
        
        for ann_file in annotation_files:
            try:
                file_path = os.path.join(dataset_path, ann_file)
                
                if ann_file.endswith('.json'):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Buscar datos de peso
                    if isinstance(data, dict):
                        if 'images' in data:
                            for img in data['images']:
                                if 'weight' in img or 'real_weight' in img or 'weight_estimate' in img:
                                    weight = img.get('weight') or img.get('real_weight') or img.get('weight_estimate')
                                    if weight and isinstance(weight, (int, float)):
                                        weights.append(weight)
                                        analysis["has_weight_data"] = True
                                
                                if 'breed' in img:
                                    breeds.add(img['breed'])
                                    analysis["has_breed_data"] = True
                                
                                if 'condition' in img:
                                    conditions.add(img['condition'])
                                    analysis["has_condition_data"] = True
                        
                        # Verificar compatibilidad con formato actual
                        if 'images' in data and len(data['images']) > 0:
                            sample_img = data['images'][0]
                            required_fields = ['file_name', 'weight_estimate', 'real_weight']
                            if all(field in sample_img for field in required_fields):
                                analysis["format_compatibility"] = True
                    
                    analysis["total_annotations"] += len(data.get('images', []))
                
                elif ann_file.endswith('.csv'):
                    df = pd.read_csv(file_path)
                    if 'weight' in df.columns:
                        weights.extend(df['weight'].dropna().tolist())
                        analysis["has_weight_data"] = True
                    
                    if 'breed' in df.columns:
                        breeds.update(df['breed'].dropna().tolist())
                        analysis["has_breed_data"] = True
                    
                    if 'condition' in df.columns:
                        conditions.update(df['condition'].dropna().tolist())
                        analysis["has_condition_data"] = True
                    
                    analysis["total_annotations"] += len(df)
                
            except Exception as e:
                logger.warning(f"⚠️ Error analizando {ann_file}: {e}")
        
        # Calcular métricas
        if weights:
            analysis["weight_range"] = {
                "min": min(weights),
                "max": max(weights),
                "avg": sum(weights) / len(weights),
                "count": len(weights)
            }
        
        analysis["breed_variety"] = len(breeds)
        analysis["condition_variety"] = len(conditions)
        
        # Evaluar calidad
        quality_score = 0
        if analysis["has_weight_data"]: quality_score += 3
        if analysis["has_breed_data"]: quality_score += 1
        if analysis["has_condition_data"]: quality_score += 1
        if analysis["format_compatibility"]: quality_score += 2
        if analysis["total_annotations"] > 100: quality_score += 2
        
        if quality_score >= 6:
            analysis["annotation_quality"] = "excellent"
        elif quality_score >= 4:
            analysis["annotation_quality"] = "good"
        elif quality_score >= 2:
            analysis["annotation_quality"] = "fair"
        else:
            analysis["annotation_quality"] = "poor"
        
        return analysis
    
    def _analyze_images(self, dataset_path: str, image_files: List[str]) -> Dict:
        """Analizar calidad de imágenes"""
        logger.info("🖼️ Analizando calidad de imágenes...")
        
        analysis = {
            "total_analyzed": 0,
            "resolution_stats": {},
            "aspect_ratios": [],
            "file_sizes": [],
            "quality_issues": [],
            "view_angles": {"side": 0, "front": 0, "back": 0, "unknown": 0},
            "image_quality": "unknown"
        }
        
        if not image_files:
            return analysis
        
        resolutions = []
        file_sizes = []
        
        for img_file in image_files[:20]:  # Analizar solo las primeras 20 para velocidad
            try:
                if isinstance(img_file, str) and os.path.exists(img_file):
                    file_path = img_file
                else:
                    file_path = os.path.join(dataset_path, img_file)
                
                if os.path.exists(file_path):
                    # Información del archivo
                    file_size = os.path.getsize(file_path)
                    file_sizes.append(file_size)
                    
                    # Información de la imagen
                    with Image.open(file_path) as img:
                        width, height = img.size
                        resolutions.append((width, height))
                        aspect_ratio = width / height
                        analysis["aspect_ratios"].append(aspect_ratio)
                        
                        # Detectar ángulo de vista básico (heurística simple)
                        if aspect_ratio > 1.3:  # Más ancho que alto
                            analysis["view_angles"]["side"] += 1
                        elif aspect_ratio < 0.8:  # Más alto que ancho
                            analysis["view_angles"]["front"] += 1
                        else:
                            analysis["view_angles"]["unknown"] += 1
                        
                        # Verificar calidad básica
                        if width < 800 or height < 600:
                            analysis["quality_issues"].append("low_resolution")
                        
                        if file_size < 50000:  # < 50KB
                            analysis["quality_issues"].append("low_file_size")
                    
                    analysis["total_analyzed"] += 1
                    
            except Exception as e:
                logger.warning(f"⚠️ Error analizando imagen {img_file}: {e}")
        
        # Calcular estadísticas
        if resolutions:
            widths = [r[0] for r in resolutions]
            heights = [r[1] for r in resolutions]
            
            analysis["resolution_stats"] = {
                "avg_width": sum(widths) / len(widths),
                "avg_height": sum(heights) / len(heights),
                "min_width": min(widths),
                "max_width": max(widths),
                "min_height": min(heights),
                "max_height": max(heights)
            }
        
        if file_sizes:
            analysis["file_sizes"] = {
                "avg_size_kb": sum(file_sizes) / len(file_sizes) / 1024,
                "min_size_kb": min(file_sizes) / 1024,
                "max_size_kb": max(file_sizes) / 1024
            }
        
        # Evaluar calidad general
        quality_score = 0
        if analysis["total_analyzed"] > 0:
            if analysis["resolution_stats"].get("avg_width", 0) > 1200: quality_score += 2
            if analysis["resolution_stats"].get("avg_height", 0) > 800: quality_score += 2
            if analysis["view_angles"]["side"] > analysis["view_angles"]["front"]: quality_score += 1
            if len(analysis["quality_issues"]) < analysis["total_analyzed"] * 0.2: quality_score += 1
        
        if quality_score >= 5:
            analysis["image_quality"] = "excellent"
        elif quality_score >= 3:
            analysis["image_quality"] = "good"
        elif quality_score >= 1:
            analysis["image_quality"] = "fair"
        else:
            analysis["image_quality"] = "poor"
        
        return analysis
    
    def _calculate_quality_score(self, structure: Dict, annotations: Dict, images: Dict) -> float:
        """Calcular puntuación general de calidad"""
        score = 0.0
        
        # Peso de las anotaciones (40%)
        if annotations["has_weight_data"]:
            score += 0.4
        if annotations["format_compatibility"]:
            score += 0.2
        if annotations["total_annotations"] > 100:
            score += 0.2
        
        # Peso de las imágenes (40%)
        if images["image_quality"] == "excellent":
            score += 0.4
        elif images["image_quality"] == "good":
            score += 0.3
        elif images["image_quality"] == "fair":
            score += 0.2
        
        # Peso de la estructura (20%)
        if structure["file_count"] > 100:
            score += 0.2
        elif structure["file_count"] > 50:
            score += 0.1
        
        return min(score, 1.0)
    
    def _generate_recommendations(self, structure: Dict, annotations: Dict, images: Dict) -> List[str]:
        """Generar recomendaciones basadas en el análisis"""
        recommendations = []
        
        # Recomendaciones sobre anotaciones
        if not annotations["has_weight_data"]:
            recommendations.append("❌ CRÍTICO: El dataset no incluye datos de peso real - esencial para entrenamiento")
        
        if not annotations["format_compatibility"]:
            recommendations.append("⚠️ El formato no es compatible con el sistema actual - requiere conversión")
        
        if annotations["total_annotations"] < 100:
            recommendations.append("⚠️ Dataset pequeño - considerar combinar con otros datasets")
        
        # Recomendaciones sobre imágenes
        if images["image_quality"] == "poor":
            recommendations.append("❌ Calidad de imágenes baja - puede afectar precisión del modelo")
        
        if images["view_angles"]["side"] < images["view_angles"]["front"]:
            recommendations.append("⚠️ Pocas imágenes laterales - críticas para estimación de peso")
        
        # Recomendaciones generales
        if annotations["has_weight_data"] and annotations["total_annotations"] > 100:
            recommendations.append("✅ Dataset prometedor para mejorar precisión del sistema")
        
        if annotations["breed_variety"] > 3:
            recommendations.append("✅ Buena diversidad de razas - mejora generalización")
        
        return recommendations

def evaluate_cattle_dataset(dataset_path: str) -> Dict:
    """Función principal para evaluar un dataset de ganado"""
    evaluator = CattleDatasetEvaluator(dataset_path)
    return evaluator.evaluate_dataset()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Uso: python dataset_evaluator.py <ruta_al_dataset>")
        sys.exit(1)
    
    dataset_path = sys.argv[1]
    result = evaluate_cattle_dataset(dataset_path)
    
    print("\n" + "="*60)
    print("📊 EVALUACIÓN DE DATASET DE GANADO")
    print("="*60)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    if "quality_score" in result:
        score = result["quality_score"]
        print(f"\n🎯 PUNTUACIÓN GENERAL: {score:.2f}/1.0")
        
        if score >= 0.8:
            print("✅ EXCELENTE - Altamente recomendado para entrenamiento")
        elif score >= 0.6:
            print("✅ BUENO - Recomendado con mejoras menores")
        elif score >= 0.4:
            print("⚠️ REGULAR - Requiere mejoras significativas")
        else:
            print("❌ POBRE - No recomendado para entrenamiento")
