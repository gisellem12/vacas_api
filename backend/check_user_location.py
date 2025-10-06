#!/usr/bin/env python3
"""
Script para verificar en qué base de datos se están creando los usuarios
"""

import mysql.connector
from mysql.connector import Error

def check_databases():
    """Verificar qué bases de datos existen y cuál tiene usuarios"""
    try:
        print("🔍 Verificando bases de datos...")
        
        # Conectar sin especificar base de datos
        connection = mysql.connector.connect(
            host='maglev.proxy.rlwy.net',
            port=45136,
            user='root',
            password='lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Listar todas las bases de datos
            cursor.execute("SHOW DATABASES")
            databases = cursor.fetchall()
            
            print("📋 Bases de datos disponibles:")
            for db in databases:
                print(f"  - {db[0]}")
            
            # Verificar cada base de datos que pueda contener usuarios
            for db in databases:
                db_name = db[0]
                if db_name in ['railway', 'agrotech_db', 'mysql', 'information_schema', 'performance_schema', 'sys']:
                    continue
                    
                try:
                    cursor.execute(f"USE {db_name}")
                    cursor.execute("SHOW TABLES LIKE 'usuarios'")
                    tables = cursor.fetchall()
                    
                    if tables:
                        print(f"\n🔍 Verificando base de datos: {db_name}")
                        cursor.execute("SELECT COUNT(*) FROM usuarios")
                        count = cursor.fetchone()[0]
                        print(f"  👥 Usuarios en {db_name}: {count}")
                        
                        if count > 0:
                            cursor.execute("SELECT id, email, name, created_at FROM usuarios LIMIT 5")
                            users = cursor.fetchall()
                            print(f"  📋 Primeros usuarios:")
                            for user in users:
                                print(f"    - ID: {user[0]}, Email: {user[1]}, Nombre: {user[2]}, Creado: {user[3]}")
                            
                except Error as e:
                    print(f"  ❌ Error verificando {db_name}: {e}")
            
            # Verificar específicamente railway
            print(f"\n🎯 Verificando base de datos 'railway':")
            try:
                cursor.execute("USE railway")
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                print(f"  📋 Tablas en railway: {[table[0] for table in tables]}")
                
                if any('usuarios' in table for table in tables):
                    cursor.execute("SELECT COUNT(*) FROM usuarios")
                    count = cursor.fetchone()[0]
                    print(f"  👥 Usuarios en railway: {count}")
                else:
                    print("  ❌ No hay tabla usuarios en railway")
                    
            except Error as e:
                print(f"  ❌ Error verificando railway: {e}")
            
            # Verificar específicamente agrotech_db
            print(f"\n🎯 Verificando base de datos 'agrotech_db':")
            try:
                cursor.execute("USE agrotech_db")
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                print(f"  📋 Tablas en agrotech_db: {[table[0] for table in tables]}")
                
                if any('usuarios' in table for table in tables):
                    cursor.execute("SELECT COUNT(*) FROM usuarios")
                    count = cursor.fetchone()[0]
                    print(f"  👥 Usuarios en agrotech_db: {count}")
                else:
                    print("  ❌ No hay tabla usuarios en agrotech_db")
                    
            except Error as e:
                print(f"  ❌ Error verificando agrotech_db: {e}")
            
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
    print("🚀 Verificando dónde se están guardando los usuarios")
    print("=" * 60)
    
    success = check_databases()
    
    if success:
        print("\n✅ Verificación completada")
    else:
        print("\n❌ Error en la verificación")

if __name__ == "__main__":
    main()

