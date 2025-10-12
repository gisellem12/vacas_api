#!/usr/bin/env python3
"""
Script de migración para el dataset integrado
Actualiza el sistema para usar medidas corporales
"""

import os
import json

def update_system_for_integrated_dataset():
    """Actualizar sistema para usar dataset integrado"""
    print("🔄 Actualizando sistema para dataset integrado...")
    
    # El dataset ya está integrado en annotations_expanded.json
    dataset_path = "dataset-ninja/expanded_cows/annotations_expanded.json"
    
    if os.path.exists(dataset_path):
        with open(dataset_path, 'r', encoding='utf-8') as f:
            dataset = json.load(f)
        
        print(f"✅ Dataset cargado: {len(dataset.get('images', []))} imágenes")
        print("✅ Sistema listo para usar medidas corporales")
        
        # Verificar que las nuevas imágenes tienen medidas
        new_images = [img for img in dataset.get('images', []) if img.get('has_real_measurements')]
        print(f"📊 Imágenes con medidas reales: {len(new_images)}")
        
        return True
    else:
        print("❌ Dataset no encontrado")
        return False

if __name__ == "__main__":
    update_system_for_integrated_dataset()
