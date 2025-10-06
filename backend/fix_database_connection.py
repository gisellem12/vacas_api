#!/usr/bin/env python3
"""
Script para migrar usuarios de agrotech_db a railway
"""

import mysql.connector
from mysql.connector import Error

def migrate_users():
    """Migrar usuarios de agrotech_db a railway"""
    try:
        print("🔄 Migrando usuarios de agrotech_db a railway...")
        
        # Conectar a agrotech_db para leer usuarios
        source_connection = mysql.connector.connect(
            host='maglev.proxy.rlwy.net',
            port=45136,
            user='root',
            password='lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL',
            database='agrotech_db'
        )
        
        # Conectar a railway para escribir usuarios
        target_connection = mysql.connector.connect(
            host='maglev.proxy.rlwy.net',
            port=45136,
            user='root',
            password='lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL',
            database='railway'
        )
        
        source_cursor = source_connection.cursor()
        target_cursor = target_connection.cursor()
        
        # Leer usuarios de agrotech_db
        source_cursor.execute("SELECT * FROM usuarios")
        users = source_cursor.fetchall()
        
        print(f"📋 Encontrados {len(users)} usuarios en agrotech_db")
        
        # Migrar cada usuario a railway
        for user in users:
            try:
                # Verificar si el usuario ya existe en railway
                target_cursor.execute("SELECT id FROM usuarios WHERE email = %s", (user[1],))
                if target_cursor.fetchone():
                    print(f"  ⚠️ Usuario {user[1]} ya existe en railway")
                    continue
                
                # Insertar usuario en railway
                insert_query = """
                INSERT INTO usuarios (email, name, password_hash, picture, google_id, login_method, is_active, created_at, last_login)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                # Extraer los valores correctos (saltar ID que es el primer elemento)
                user_data = user[1:]  # email, name, password_hash, picture, google_id, login_method, is_active, created_at, last_login
                
                target_cursor.execute(insert_query, user_data)
                target_connection.commit()
                print(f"  ✅ Migrado: {user[1]} ({user[2]})")
                
            except Error as e:
                print(f"  ❌ Error migrando usuario {user[1]}: {e}")
        
        # Verificar resultado
        target_cursor.execute("SELECT COUNT(*) FROM usuarios")
        count = target_cursor.fetchone()[0]
        print(f"\n🎉 Migración completada. Total usuarios en railway: {count}")
        
        # Mostrar usuarios migrados
        target_cursor.execute("SELECT id, email, name, created_at FROM usuarios")
        migrated_users = target_cursor.fetchall()
        print("\n👥 Usuarios en railway:")
        for user in migrated_users:
            print(f"  - ID: {user[0]}, Email: {user[1]}, Nombre: {user[2]}, Creado: {user[3]}")
        
        return True
        
    except Error as e:
        print(f"❌ Error durante la migración: {e}")
        return False
    finally:
        if 'source_connection' in locals() and source_connection.is_connected():
            source_cursor.close()
            source_connection.close()
        if 'target_connection' in locals() and target_connection.is_connected():
            target_cursor.close()
            target_connection.close()
        print("🔌 Conexiones cerradas")

def main():
    """Función principal"""
    print("🚀 Migrando usuarios de agrotech_db a railway")
    print("=" * 50)
    
    success = migrate_users()
    
    if success:
        print("\n✅ ¡Migración exitosa!")
        print("Ahora los usuarios están en la base de datos correcta (railway)")
    else:
        print("\n❌ Error en la migración")

if __name__ == "__main__":
    main()
