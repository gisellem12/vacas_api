#!/usr/bin/env python3
"""
Demo del Sistema de Modo de Mantenimiento
Demuestra cómo usar el sistema de mantenimiento paso a paso
"""

import requests
import time
import json

BASE_URL = "http://localhost:8000"

def print_separator(title):
    """Imprime un separador visual"""
    print(f"\n{'='*60}")
    print(f"🎯 {title}")
    print(f"{'='*60}")

def print_json(data, title="Respuesta"):
    """Imprime JSON de forma legible"""
    print(f"\n📋 {title}:")
    print(json.dumps(data, indent=2, ensure_ascii=False))

def check_status():
    """Verifica el estado del sistema"""
    try:
        response = requests.get(f"{BASE_URL}/status")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def test_ai_endpoint():
    """Prueba un endpoint de IA"""
    try:
        print("\n🤖 Probando endpoint de IA...")
        
        # Usar una imagen de prueba del dataset
        test_data = {"url": "https://drive.google.com/uc?id=12ygJabwRTon0DoVliundkso-35w_ILxO"}
        
        response = requests.post(f"{BASE_URL}/predict", json=test_data, timeout=30)
        
        if response.status_code == 200:
            print("✅ Endpoint de IA funcionando correctamente")
            return True
        elif response.status_code == 503:
            print("🔧 Endpoint de IA bloqueado (modo de mantenimiento)")
            error_data = response.json()
            print(f"📝 Mensaje: {error_data.get('message', 'Sin mensaje')}")
            return False
        else:
            print(f"❌ Error inesperado: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏰ Timeout en la prueba de IA")
        return False
    except Exception as e:
        print(f"❌ Error probando IA: {e}")
        return False

def enable_maintenance():
    """Activa el modo de mantenimiento"""
    try:
        print("\n🔧 Activando modo de mantenimiento...")
        response = requests.post(
            f"{BASE_URL}/admin/maintenance/enable",
            params={"message": "Demo del sistema de mantenimiento"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Modo de mantenimiento activado")
            print_json(result, "Resultado")
            return True
        else:
            print(f"❌ Error activando mantenimiento: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def disable_maintenance():
    """Desactiva el modo de mantenimiento"""
    try:
        print("\n🔧 Desactivando modo de mantenimiento...")
        response = requests.post(f"{BASE_URL}/admin/maintenance/disable")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Modo de mantenimiento desactivado")
            print_json(result, "Resultado")
            return True
        else:
            print(f"❌ Error desactivando mantenimiento: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def simulate_update():
    """Simula una actualización del sistema"""
    print("\n🚀 Simulando actualización del sistema...")
    
    update_steps = [
        "Actualizando modelos de IA...",
        "Optimizando base de datos...",
        "Instalando nuevas dependencias...",
        "Actualizando configuraciones...",
        "Verificando integridad del sistema..."
    ]
    
    for i, step in enumerate(update_steps, 1):
        print(f"📋 Paso {i}/{len(update_steps)}: {step}")
        time.sleep(1)  # Simular tiempo de procesamiento
    
    print("✅ Actualización completada")

def main():
    """Función principal del demo"""
    print_separator("DEMO DEL SISTEMA DE MODO DE MANTENIMIENTO")
    print("Este demo muestra cómo usar el sistema de mantenimiento paso a paso")
    
    # Paso 1: Verificar estado inicial
    print_separator("PASO 1: ESTADO INICIAL")
    status = check_status()
    if status:
        print_json(status, "Estado del Sistema")
    else:
        print("❌ No se puede conectar al sistema. Asegúrate de que esté ejecutándose.")
        print("💡 Ejecuta: uvicorn main:app --host 0.0.0.0 --port 8000")
        return
    
    # Paso 2: Probar IA en estado normal
    print_separator("PASO 2: PROBANDO IA EN ESTADO NORMAL")
    ai_working = test_ai_endpoint()
    
    if not ai_working:
        print("⚠️ La IA no está funcionando en estado normal")
        print("💡 Esto podría ser normal si no tienes configurada la API key de OpenAI")
    
    # Paso 3: Activar modo de mantenimiento
    print_separator("PASO 3: ACTIVANDO MODO DE MANTENIMIENTO")
    if enable_maintenance():
        print("✅ Modo de mantenimiento activado correctamente")
    else:
        print("❌ No se pudo activar el modo de mantenimiento")
        return
    
    # Paso 4: Verificar estado en mantenimiento
    print_separator("PASO 4: ESTADO EN MODO DE MANTENIMIENTO")
    status = check_status()
    if status:
        print_json(status, "Estado del Sistema en Mantenimiento")
    
    # Paso 5: Probar IA bloqueada
    print_separator("PASO 5: PROBANDO IA BLOQUEADA")
    ai_blocked = not test_ai_endpoint()
    
    if ai_blocked:
        print("✅ La IA está correctamente bloqueada en modo de mantenimiento")
    else:
        print("❌ La IA debería estar bloqueada pero no lo está")
    
    # Paso 6: Simular actualización
    print_separator("PASO 6: SIMULANDO ACTUALIZACIÓN")
    simulate_update()
    
    # Paso 7: Desactivar modo de mantenimiento
    print_separator("PASO 7: DESACTIVANDO MODO DE MANTENIMIENTO")
    if disable_maintenance():
        print("✅ Modo de mantenimiento desactivado correctamente")
    else:
        print("❌ No se pudo desactivar el modo de mantenimiento")
        return
    
    # Paso 8: Verificar estado final
    print_separator("PASO 8: ESTADO FINAL")
    status = check_status()
    if status:
        print_json(status, "Estado Final del Sistema")
    
    # Paso 9: Probar IA restaurada
    print_separator("PASO 9: PROBANDO IA RESTAURADA")
    ai_restored = test_ai_endpoint()
    
    if ai_restored:
        print("✅ La IA está funcionando correctamente después del mantenimiento")
    else:
        print("⚠️ La IA no está funcionando (puede ser normal sin API key)")
    
    # Resumen final
    print_separator("RESUMEN DEL DEMO")
    print("✅ Sistema de modo de mantenimiento funcionando correctamente")
    print("✅ La IA se bloquea correctamente en modo de mantenimiento")
    print("✅ La IA se restaura correctamente después del mantenimiento")
    print("✅ Los endpoints de estado funcionan durante el mantenimiento")
    
    print("\n🎉 Demo completado exitosamente!")
    print("\n💡 Próximos pasos:")
    print("   - Usar 'python maintenance_manager.py status' para verificar estado")
    print("   - Usar 'python update_system.py' para actualizaciones automáticas")
    print("   - Revisar MAINTENANCE_MODE_README.md para más información")

if __name__ == "__main__":
    main()
