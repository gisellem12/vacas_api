#!/usr/bin/env python3
"""
Script de prueba para verificar la conexión a la base de datos MySQL
"""

import sys
import os
from dotenv import load_dotenv

# Agregar el directorio backend al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import test_connection, create_tables, get_db, User
from sqlalchemy.orm import Session

def test_mysql_connection():
    """Probar conexión a MySQL"""
    print("🔍 Probando conexión a MySQL...")
    print(f"Host: {os.getenv('DATABASE_HOST')}")
    print(f"Puerto: {os.getenv('DATABASE_PORT')}")
    print(f"Base de datos: {os.getenv('DATABASE_NAME')}")
    print(f"Usuario: {os.getenv('DATABASE_USER')}")
    
    # Probar conexión básica
    if test_connection():
        print("✅ Conexión exitosa!")
        return True
    else:
        print("❌ Error en la conexión")
        return False

def test_database_operations():
    """Probar operaciones básicas de base de datos"""
    print("\n🔧 Probando operaciones de base de datos...")
    
    try:
        # Crear tablas
        print("📋 Creando tablas...")
        create_tables()
        print("✅ Tablas creadas exitosamente")
        
        # Probar inserción de usuario de prueba
        db = next(get_db())
        try:
            print("👤 Creando usuario de prueba...")
            
            # Verificar si ya existe
            existing_user = db.query(User).filter(User.email == "test@example.com").first()
            if existing_user:
                print("ℹ️ Usuario de prueba ya existe")
                return True
            
            # Crear usuario de prueba
            test_user = User(
                email="test@example.com",
                name="Usuario de Prueba",
                login_method="email",
                password_hash="test_hash"
            )
            
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            
            print(f"✅ Usuario creado con ID: {test_user.id}")
            
            # Probar consulta
            user_found = db.query(User).filter(User.email == "test@example.com").first()
            if user_found:
                print(f"✅ Usuario encontrado: {user_found.name} ({user_found.email})")
                return True
            else:
                print("❌ No se pudo encontrar el usuario creado")
                return False
                
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error en operaciones de base de datos: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando pruebas de base de datos MySQL")
    print("=" * 50)
    
    # Cargar variables de entorno
    load_dotenv()
    
    # Probar conexión
    connection_ok = test_mysql_connection()
    
    if connection_ok:
        # Probar operaciones
        operations_ok = test_database_operations()
        
        if operations_ok:
            print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")
            print("✅ La base de datos MySQL está configurada correctamente")
        else:
            print("\n❌ Error en las operaciones de base de datos")
            sys.exit(1)
    else:
        print("\n❌ Error en la conexión a la base de datos")
        print("Verifica que:")
        print("1. Las credenciales en config.env sean correctas")
        print("2. La base de datos esté disponible")
        print("3. El usuario tenga permisos para crear tablas")
        sys.exit(1)

if __name__ == "__main__":
    main()
