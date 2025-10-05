#!/usr/bin/env python3
"""
Script para probar la conexión directa a MySQL y crear tablas manualmente
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def test_mysql_connection():
    """Probar conexión directa a MySQL"""
    try:
        print("🔍 Probando conexión directa a MySQL...")
        
        connection = mysql.connector.connect(
            host='maglev.proxy.rlwy.net',
            port=45136,
            user='root',
            password='lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL',
            database='railway'
        )
        
        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"✅ Conectado a MySQL Server versión: {db_info}")
            
            cursor = connection.cursor()
            
            # Verificar tablas existentes
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            print(f"📋 Tablas existentes: {len(tables)}")
            for table in tables:
                print(f"  - {table[0]}")
            
            # Si no existe la tabla usuarios, crearla
            if not any('usuarios' in table for table in tables):
                print("🔧 Creando tabla usuarios...")
                
                create_table_query = """
                CREATE TABLE usuarios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    password_hash VARCHAR(255),
                    picture TEXT,
                    google_id VARCHAR(255) UNIQUE,
                    login_method VARCHAR(50) NOT NULL DEFAULT 'email',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
                """
                
                cursor.execute(create_table_query)
                connection.commit()
                print("✅ Tabla usuarios creada exitosamente")
            else:
                print("ℹ️ Tabla usuarios ya existe")
            
            # Mostrar estructura de la tabla
            cursor.execute("DESCRIBE usuarios")
            columns = cursor.fetchall()
            print("\n📊 Estructura de la tabla usuarios:")
            for column in columns:
                print(f"  - {column[0]} ({column[1]}) - {column[2]}")
            
            # Contar registros
            cursor.execute("SELECT COUNT(*) FROM usuarios")
            count = cursor.fetchone()[0]
            print(f"\n👥 Total de usuarios: {count}")
            
            return True
            
    except Error as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("🔌 Conexión cerrada")

def main():
    """Función principal"""
    print("🚀 Iniciando prueba directa de MySQL")
    print("=" * 50)
    
    success = test_mysql_connection()
    
    if success:
        print("\n🎉 ¡Prueba exitosa!")
        print("La tabla usuarios debería aparecer ahora en Railway")
    else:
        print("\n❌ Error en la prueba")
        print("Verifica las credenciales en config.env")

if __name__ == "__main__":
    main()
