#!/usr/bin/env python3
"""
Script para migrar usuarios de la estructura antigua a la nueva
"""

import mysql.connector
from mysql.connector import Error

def migrate_users_correctly():
    """Migrar usuarios de agrotech_db (estructura antigua) a railway (estructura nueva)"""
    try:
        print("🔄 Migrando usuarios de estructura antigua a nueva...")
        
        # Conectar a agrotech_db
        source_connection = mysql.connector.connect(
            host='maglev.proxy.rlwy.net',
            port=45136,
            user='root',
            password='lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL',
            database='agrotech_db'
        )
        
        # Conectar a railway
        target_connection = mysql.connector.connect(
            host='maglev.proxy.rlwy.net',
            port=45136,
            user='root',
            password='lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL',
            database='railway'
        )
        
        source_cursor = source_connection.cursor()
        target_cursor = target_connection.cursor()
        
        # Leer usuarios de agrotech_db (estructura antigua)
        source_cursor.execute("SELECT * FROM usuarios")
        users = source_cursor.fetchall()
        
        print(f"📋 Encontrados {len(users)} usuarios en agrotech_db")
        
        # Migrar cada usuario
        for user in users:
            try:
                # Estructura antigua: (id, email, password, created_at)
                old_id, old_email, old_password, old_created_at = user
                
                # Verificar si el usuario ya existe en railway
                target_cursor.execute("SELECT id FROM usuarios WHERE email = %s", (old_email,))
                if target_cursor.fetchone():
                    print(f"  ⚠️ Usuario {old_email} ya existe en railway")
                    continue
                
                # Crear usuario en railway con estructura nueva
                insert_query = """
                INSERT INTO usuarios (email, name, password_hash, login_method, is_active, created_at, last_login)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                
                # Extraer nombre del email (parte antes del @)
                name = old_email.split('@')[0]
                
                # Datos para la nueva estructura
                user_data = (
                    old_email,           # email
                    name,                # name (extraído del email)
                    old_password,        # password_hash
                    'email',             # login_method
                    True,                # is_active
                    old_created_at,      # created_at
                    old_created_at       # last_login (usar created_at como inicial)
                )
                
                target_cursor.execute(insert_query, user_data)
                target_connection.commit()
                print(f"  ✅ Migrado: {old_email} ({name})")
                
            except Error as e:
                print(f"  ❌ Error migrando usuario {old_email}: {e}")
        
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
    print("🚀 Migrando usuarios de estructura antigua a nueva")
    print("=" * 50)
    
    success = migrate_users_correctly()
    
    if success:
        print("\n✅ ¡Migración exitosa!")
        print("Ahora los usuarios están en railway con la estructura correcta")
    else:
        print("\n❌ Error en la migración")

if __name__ == "__main__":
    main()

