#!/usr/bin/env python3
"""
Script para ver la estructura exacta de las tablas
"""

import mysql.connector
from mysql.connector import Error

def check_table_structure():
    """Verificar estructura de las tablas"""
    try:
        print("🔍 Verificando estructura de las tablas...")
        
        # Conectar a agrotech_db
        connection = mysql.connector.connect(
            host='maglev.proxy.rlwy.net',
            port=45136,
            user='root',
            password='lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL',
            database='agrotech_db'
        )
        
        cursor = connection.cursor()
        
        # Ver estructura de la tabla
        cursor.execute("DESCRIBE usuarios")
        columns = cursor.fetchall()
        
        print("\n📊 Estructura de tabla usuarios en agrotech_db:")
        for column in columns:
            print(f"  - {column[0]} ({column[1]}) - {column[2]}")
        
        # Ver datos de la tabla
        cursor.execute("SELECT * FROM usuarios")
        users = cursor.fetchall()
        
        print(f"\n👥 Datos en agrotech_db ({len(users)} usuarios):")
        for user in users:
            print(f"  Usuario: {user}")
            print(f"    ID: {user[0]}")
            print(f"    Email: {user[1]}")
            print(f"    Name: {user[2]}")
            print(f"    Password_hash: {user[3]}")
            print(f"    Picture: {user[4]}")
            print(f"    Google_id: {user[5]}")
            print(f"    Login_method: {user[6]}")
            print(f"    Is_active: {user[7]}")
            print(f"    Created_at: {user[8]}")
            print(f"    Last_login: {user[9]}")
            print()
        
        return True
        
    except Error as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

def main():
    """Función principal"""
    print("🚀 Debugging estructura de tabla")
    print("=" * 40)
    
    success = check_table_structure()
    
    if success:
        print("✅ Debug completado")
    else:
        print("❌ Error en debug")

if __name__ == "__main__":
    main()

