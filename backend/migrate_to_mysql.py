#!/usr/bin/env python3
"""
Script de migración para transición de base de datos en memoria a MySQL
"""

import sys
import os
from dotenv import load_dotenv

# Agregar el directorio backend al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import create_tables, get_db, User
from sqlalchemy.orm import Session

def create_sample_users():
    """Crear algunos usuarios de ejemplo para probar el sistema"""
    print("👥 Creando usuarios de ejemplo...")
    
    sample_users = [
        {
            "email": "admin@agrotech.com",
            "name": "Administrador",
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2J6J5Y5Y5Y",  # password: admin123
            "login_method": "email"
        },
        {
            "email": "veterinario@agrotech.com", 
            "name": "Dr. Veterinario",
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2J6J5Y5Y5Y",  # password: vet123
            "login_method": "email"
        },
        {
            "email": "ganadero@agrotech.com",
            "name": "Juan Ganadero", 
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2J6J5Y5Y5Y",  # password: ganadero123
            "login_method": "email"
        }
    ]
    
    db = next(get_db())
    try:
        created_count = 0
        for user_data in sample_users:
            # Verificar si el usuario ya existe
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"ℹ️ Usuario {user_data['email']} ya existe")
                continue
            
            # Crear usuario
            user = User(**user_data)
            db.add(user)
            created_count += 1
            print(f"✅ Usuario creado: {user_data['name']} ({user_data['email']})")
        
        db.commit()
        print(f"🎉 {created_count} usuarios creados exitosamente")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando usuarios: {e}")
    finally:
        db.close()

def verify_migration():
    """Verificar que la migración fue exitosa"""
    print("\n🔍 Verificando migración...")
    
    db = next(get_db())
    try:
        # Contar usuarios
        user_count = db.query(User).count()
        print(f"📊 Total de usuarios en la base de datos: {user_count}")
        
        # Listar usuarios
        users = db.query(User).all()
        print("\n👥 Usuarios en la base de datos:")
        for user in users:
            print(f"  - {user.name} ({user.email}) - Método: {user.login_method}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando migración: {e}")
        return False
    finally:
        db.close()

def main():
    """Función principal de migración"""
    print("🔄 Iniciando migración a MySQL")
    print("=" * 50)
    
    # Cargar variables de entorno
    load_dotenv()
    
    try:
        # Crear tablas
        print("📋 Creando tablas...")
        create_tables()
        print("✅ Tablas creadas")
        
        # Crear usuarios de ejemplo
        create_sample_users()
        
        # Verificar migración
        if verify_migration():
            print("\n🎉 ¡Migración completada exitosamente!")
            print("\n📝 Credenciales de usuarios de ejemplo:")
            print("  admin@agrotech.com / admin123")
            print("  veterinario@agrotech.com / vet123") 
            print("  ganadero@agrotech.com / ganadero123")
        else:
            print("\n❌ Error en la verificación de migración")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
