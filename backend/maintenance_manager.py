#!/usr/bin/env python3
"""
Gestor de modo de mantenimiento
Script para gestionar el modo de mantenimiento del sistema de forma manual
"""

import requests
import sys
import argparse
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"  # Cambiar por la URL de tu servidor en producción

def log(message):
    """Función de logging con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def check_status():
    """Verifica el estado actual del sistema"""
    try:
        response = requests.get(f"{BASE_URL}/status", timeout=10)
        if response.status_code == 200:
            status = response.json()
            log(f"Estado del sistema: {status['status']}")
            log(f"Modo mantenimiento: {status['maintenance_mode']}")
            log(f"IA habilitada: {status['ai_enabled']}")
            log(f"Mensaje: {status['message']}")
            return status
        else:
            log(f"Error verificando estado: {response.status_code}")
            return None
    except Exception as e:
        log(f"Error conectando al sistema: {e}")
        return None

def enable_maintenance(message="Sistema en mantenimiento. Actualización en progreso..."):
    """Activa el modo de mantenimiento"""
    try:
        log("🔧 Activando modo de mantenimiento...")
        response = requests.post(
            f"{BASE_URL}/admin/maintenance/enable",
            params={"message": message},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            log(f"✅ Modo de mantenimiento activado")
            log(f"📝 Mensaje: {result['maintenance_message']}")
            return True
        else:
            log(f"❌ Error activando modo de mantenimiento: {response.status_code}")
            if response.text:
                log(f"Detalle: {response.text}")
            return False
    except Exception as e:
        log(f"❌ Error activando modo de mantenimiento: {e}")
        return False

def disable_maintenance():
    """Desactiva el modo de mantenimiento"""
    try:
        log("🔧 Desactivando modo de mantenimiento...")
        response = requests.post(f"{BASE_URL}/admin/maintenance/disable", timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            log(f"✅ Modo de mantenimiento desactivado")
            log(f"📝 Estado: {result['status']}")
            return True
        else:
            log(f"❌ Error desactivando modo de mantenimiento: {response.status_code}")
            if response.text:
                log(f"Detalle: {response.text}")
            return False
    except Exception as e:
        log(f"❌ Error desactivando modo de mantenimiento: {e}")
        return False

def toggle_maintenance(enabled, message=None):
    """Activa o desactiva el modo de mantenimiento"""
    try:
        log(f"🔧 {'Activando' if enabled else 'Desactivando'} modo de mantenimiento...")
        
        data = {"enabled": enabled}
        if message:
            data["message"] = message
        
        response = requests.post(
            f"{BASE_URL}/admin/maintenance",
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            log(f"✅ Modo de mantenimiento {'activado' if enabled else 'desactivado'}")
            log(f"📝 Mensaje: {result['message']}")
            log(f"🤖 IA habilitada: {result['ai_enabled']}")
            return True
        else:
            log(f"❌ Error configurando modo de mantenimiento: {response.status_code}")
            if response.text:
                log(f"Detalle: {response.text}")
            return False
    except Exception as e:
        log(f"❌ Error configurando modo de mantenimiento: {e}")
        return False

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description="Gestor de modo de mantenimiento")
    parser.add_argument("action", choices=["status", "enable", "disable", "toggle"], 
                       help="Acción a realizar")
    parser.add_argument("-m", "--message", type=str,
                       help="Mensaje personalizado para el modo de mantenimiento")
    parser.add_argument("-u", "--url", type=str, default=BASE_URL,
                       help=f"URL base del servidor (por defecto: {BASE_URL})")
    
    args = parser.parse_args()
    
    # Actualizar URL si se proporciona
    global BASE_URL
    BASE_URL = args.url
    
    log(f"🎯 Conectando a: {BASE_URL}")
    
    if args.action == "status":
        check_status()
    
    elif args.action == "enable":
        message = args.message or "Sistema en mantenimiento. Actualización en progreso..."
        enable_maintenance(message)
    
    elif args.action == "disable":
        disable_maintenance()
    
    elif args.action == "toggle":
        # Primero verificar estado actual
        current_status = check_status()
        if current_status:
            new_state = not current_status['maintenance_mode']
            message = args.message
            toggle_maintenance(new_state, message)
        else:
            log("❌ No se pudo determinar el estado actual del sistema")
            sys.exit(1)

if __name__ == "__main__":
    main()
