#!/usr/bin/env python3
"""
Analizador del Excel de Medidas del Dataset de Ganado
Evalúa la calidad y potencial del dataset con medidas reales
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
import zipfile
import os

def analyze_cattle_measurements_excel():
    """Analizar el Excel de medidas del dataset"""
    
    print("🐄 ANÁLISIS DEL EXCEL DE MEDIDAS - DATASET DE GANADO")
    print("="*60)
    
    try:
        # Extraer y leer el Excel
        zip_path = r"C:\Users\Souva\Downloads\Cattle side view and back view dataset.zip"
        excel_path = "Cattle side view and back view dataset/Cattle side and back view images/measurements.xlsx"
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extract(excel_path, "temp_excel_analysis")
        
        df = pd.read_excel("temp_excel_analysis/" + excel_path)
        
        print(f"✅ Excel cargado exitosamente: {len(df)} registros")
        print(f"📊 Columnas disponibles: {list(df.columns)}")
        
        # Análisis detallado
        analysis = {
            "total_records": len(df),
            "columns": list(df.columns),
            "weight_analysis": analyze_weight_data(df),
            "measurements_analysis": analyze_measurements(df),
            "correlations": analyze_correlations(df),
            "quality_assessment": assess_data_quality(df),
            "improvement_potential": calculate_improvement_potential(df)
        }
        
        # Mostrar resultados
        print_analysis_results(analysis)
        
        # Limpiar archivos temporales
        import shutil
        if os.path.exists("temp_excel_analysis"):
            shutil.rmtree("temp_excel_analysis")
        
        return analysis
        
    except Exception as e:
        print(f"❌ Error analizando Excel: {e}")
        return None

def analyze_weight_data(df):
    """Analizar datos de peso corporal"""
    weights = df['Body weight (kg)'].dropna()
    
    return {
        "count": len(weights),
        "mean": weights.mean(),
        "std": weights.std(),
        "min": weights.min(),
        "max": weights.max(),
        "range": weights.max() - weights.min(),
        "percentiles": {
            "25th": weights.quantile(0.25),
            "50th": weights.quantile(0.50),
            "75th": weights.quantile(0.75)
        }
    }

def analyze_measurements(df):
    """Analizar las medidas corporales"""
    measurements = {
        "oblique_length": df['Oblique body length (cm)'].dropna(),
        "withers_height": df['Withers height(cm)'].dropna(),
        "heart_girth": df['Heart girth(cm)'].dropna(),
        "hip_length": df['Hip length (cm)'].dropna()
    }
    
    analysis = {}
    for name, data in measurements.items():
        if len(data) > 0:
            analysis[name] = {
                "count": len(data),
                "mean": data.mean(),
                "std": data.std(),
                "min": data.min(),
                "max": data.max()
            }
    
    return analysis

def analyze_correlations(df):
    """Analizar correlaciones entre medidas y peso"""
    numeric_cols = ['Oblique body length (cm)', 'Withers height(cm)', 
                   'Heart girth(cm)', 'Hip length (cm)', 'Body weight (kg)']
    
    correlation_matrix = df[numeric_cols].corr()
    weight_correlations = correlation_matrix['Body weight (kg)'].drop('Body weight (kg)')
    
    return {
        "correlation_with_weight": weight_correlations.to_dict(),
        "strongest_predictor": weight_correlations.abs().idxmax(),
        "strongest_correlation": weight_correlations.abs().max()
    }

def assess_data_quality(df):
    """Evaluar calidad de los datos"""
    quality = {
        "completeness": {},
        "outliers": {},
        "consistency": {},
        "overall_score": 0
    }
    
    # Completitud de datos
    for col in df.columns:
        completeness = (df[col].notna().sum() / len(df)) * 100
        quality["completeness"][col] = completeness
    
    # Detectar outliers en peso
    weights = df['Body weight (kg)'].dropna()
    Q1 = weights.quantile(0.25)
    Q3 = weights.quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    outliers = weights[(weights < lower_bound) | (weights > upper_bound)]
    quality["outliers"]["weight_outliers"] = {
        "count": len(outliers),
        "percentage": (len(outliers) / len(weights)) * 100
    }
    
    # Consistencia de datos
    quality["consistency"]["weight_range_reasonable"] = (
        weights.min() >= 200 and weights.max() <= 1000
    )
    
    # Calcular puntuación general
    score = 0
    if quality["completeness"]["Body weight (kg)"] >= 95: score += 3
    if quality["outliers"]["weight_outliers"]["percentage"] < 5: score += 2
    if quality["consistency"]["weight_range_reasonable"]: score += 2
    if len(df) >= 50: score += 2
    if len(df) >= 100: score += 1
    
    quality["overall_score"] = score / 10
    
    return quality

def calculate_improvement_potential(df):
    """Calcular potencial de mejora vs dataset actual"""
    current_dataset = {
        "total_images": 30,
        "weight_range": (375, 645),
        "error_avg": 4.8
    }
    
    new_dataset = {
        "total_images": len(df),
        "weight_range": (df['Body weight (kg)'].min(), df['Body weight (kg)'].max()),
        "weight_mean": df['Body weight (kg)'].mean(),
        "weight_std": df['Body weight (kg)'].std()
    }
    
    improvement = {
        "size_increase": (new_dataset["total_images"] / current_dataset["total_images"] - 1) * 100,
        "weight_range_expansion": {
            "current_range": current_dataset["weight_range"][1] - current_dataset["weight_range"][0],
            "new_range": new_dataset["weight_range"][1] - new_dataset["weight_range"][0],
            "expansion_percentage": ((new_dataset["weight_range"][1] - new_dataset["weight_range"][0]) / 
                                   (current_dataset["weight_range"][1] - current_dataset["weight_range"][0]) - 1) * 100
        },
        "predicted_error_reduction": calculate_predicted_error_reduction(current_dataset, new_dataset),
        "additional_measurements": len([col for col in df.columns if col not in ['Num', 'Body weight (kg)']])
    }
    
    return improvement

def calculate_predicted_error_reduction(current, new):
    """Calcular reducción de error esperada"""
    # Fórmula basada en la relación entre tamaño de dataset y precisión
    size_improvement_factor = np.log(new["total_images"] / current["total_images"])
    
    # Mejora por diversidad de medidas (más variables predictoras)
    measurement_diversity_factor = 0.1  # 10% de mejora por medidas adicionales
    
    # Mejora por rango de pesos más amplio
    range_factor = 0.05  # 5% de mejora por mejor cobertura
    
    total_improvement = (size_improvement_factor + measurement_diversity_factor + range_factor) * 0.3
    
    predicted_error = current["error_avg"] * (1 - total_improvement)
    error_reduction = current["error_avg"] - predicted_error
    
    return {
        "current_error": current["error_avg"],
        "predicted_error": predicted_error,
        "error_reduction": error_reduction,
        "improvement_percentage": (error_reduction / current["error_avg"]) * 100
    }

def print_analysis_results(analysis):
    """Imprimir resultados del análisis"""
    
    print(f"\n📊 DATOS DE PESO CORPORAL:")
    weight_data = analysis["weight_analysis"]
    print(f"  - Total de registros: {weight_data['count']}")
    print(f"  - Peso promedio: {weight_data['mean']:.1f} kg")
    print(f"  - Rango: {weight_data['min']:.0f} - {weight_data['max']:.0f} kg")
    print(f"  - Desviación estándar: {weight_data['std']:.1f} kg")
    
    print(f"\n📏 MEDIDAS CORPORALES DISPONIBLES:")
    for measure, data in analysis["measurements_analysis"].items():
        print(f"  - {measure.replace('_', ' ').title()}: {data['mean']:.1f} cm (rango: {data['min']:.0f}-{data['max']:.0f})")
    
    print(f"\n🔗 CORRELACIONES CON PESO:")
    correlations = analysis["correlations"]["correlation_with_weight"]
    for measure, corr in correlations.items():
        print(f"  - {measure}: {corr:.3f}")
    
    print(f"\n🏆 PREDICTOR MÁS FUERTE:")
    print(f"  - {analysis['correlations']['strongest_predictor']}: {analysis['correlations']['strongest_correlation']:.3f}")
    
    print(f"\n⭐ CALIDAD DE DATOS:")
    quality = analysis["quality_assessment"]
    print(f"  - Puntuación general: {quality['overall_score']:.2f}/1.0")
    print(f"  - Completitud de datos: {quality['completeness']['Body weight (kg)']:.1f}%")
    print(f"  - Outliers en peso: {quality['outliers']['weight_outliers']['count']} ({quality['outliers']['weight_outliers']['percentage']:.1f}%)")
    
    print(f"\n🚀 POTENCIAL DE MEJORA:")
    improvement = analysis["improvement_potential"]
    print(f"  - Aumento de tamaño: +{improvement['size_increase']:.1f}%")
    print(f"  - Expansión de rango de peso: +{improvement['weight_range_expansion']['expansion_percentage']:.1f}%")
    print(f"  - Medidas adicionales: {improvement['additional_measurements']} variables predictoras")
    
    error_pred = improvement["predicted_error_reduction"]
    print(f"  - Error actual: {error_pred['current_error']:.1f} kg")
    print(f"  - Error predicho: {error_pred['predicted_error']:.1f} kg")
    print(f"  - Reducción esperada: {error_pred['improvement_percentage']:.1f}%")
    
    print(f"\n🎯 RECOMENDACIÓN FINAL:")
    if quality["overall_score"] >= 0.8 and error_pred["improvement_percentage"] > 20:
        print("  ✅ ALTAMENTE RECOMENDADO - Excelente calidad y gran potencial de mejora")
    elif quality["overall_score"] >= 0.6 and error_pred["improvement_percentage"] > 10:
        print("  ✅ RECOMENDADO - Buena calidad y mejora significativa")
    else:
        print("  ⚠️ EVALUAR CASO POR CASO - Calidad o mejora limitada")

if __name__ == "__main__":
    analyze_cattle_measurements_excel()
