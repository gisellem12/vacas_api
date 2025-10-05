# Configuración de MySQL para AgroTech Vision

## 📋 Resumen de Cambios

Se ha migrado el sistema de autenticación de una base de datos en memoria a MySQL usando los parámetros proporcionados:

- **Host**: maglev.proxy.rlwy.net
- **Puerto**: 45136
- **Usuario**: root
- **Contraseña**: lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL
- **Base de datos**: agrotech_db

## 🚀 Instalación

### 1. Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 2. Verificar configuración

El archivo `config.env` ya está configurado con los parámetros de MySQL. Verifica que contenga:

```env
DATABASE_HOST=maglev.proxy.rlwy.net
DATABASE_PORT=45136
DATABASE_USER=root
DATABASE_PASSWORD=lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL
DATABASE_NAME=agrotech_db
DATABASE_URL=mysql+mysqlconnector://root:lhybnXPgOYNZWXrrpfFlvtxTZFWXgSEL@maglev.proxy.rlwy.net:45136/agrotech_db
```

### 3. Probar conexión

```bash
python test_db_connection.py
```

Este script verificará:
- ✅ Conexión a MySQL
- ✅ Creación de tablas
- ✅ Operaciones básicas de base de datos

### 4. Crear usuarios de ejemplo (opcional)

```bash
python migrate_to_mysql.py
```

Este script creará usuarios de prueba para testing:
- admin@agrotech.com / admin123
- veterinario@agrotech.com / vet123
- ganadero@agrotech.com / ganadero123

## 🏗️ Arquitectura

### Modelos de Base de Datos

**Tabla: usuarios**
- `id`: Primary key (auto-increment)
- `email`: Email único del usuario
- `name`: Nombre completo
- `password_hash`: Hash de contraseña (NULL para usuarios de Google)
- `picture`: URL de foto de perfil
- `google_id`: ID de Google OAuth (NULL para usuarios tradicionales)
- `login_method`: "email" o "google"
- `is_active`: Estado del usuario
- `created_at`: Fecha de creación
- `last_login`: Último acceso

### Archivos Modificados

1. **requirements.txt**: Agregadas dependencias MySQL
2. **config.env**: Configuración de base de datos MySQL
3. **database.py**: Nuevo archivo con modelos SQLAlchemy
4. **auth.py**: Migrado de memoria a MySQL
5. **main.py**: Inicialización de base de datos y endpoint `/me` actualizado

### Archivos Nuevos

1. **test_db_connection.py**: Script de prueba de conexión
2. **migrate_to_mysql.py**: Script de migración con usuarios de ejemplo

## 🔧 Uso

### Iniciar el servidor

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Endpoints de Autenticación

- `POST /register` - Registro de usuario
- `POST /login` - Login tradicional
- `POST /google-login` - Login con Google OAuth
- `GET /me` - Información del usuario actual

## 🧪 Testing

### Probar conexión a base de datos

```bash
python test_db_connection.py
```

### Probar endpoints con curl

```bash
# Registro
curl -X POST "http://localhost:8000/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123", "name": "Test User"}'

# Login
curl -X POST "http://localhost:8000/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Obtener usuario actual (necesita token)
curl -X GET "http://localhost:8000/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔍 Troubleshooting

### Error de conexión

1. Verifica que las credenciales en `config.env` sean correctas
2. Asegúrate de que la base de datos esté disponible
3. Verifica que el usuario tenga permisos para crear tablas

### Error de dependencias

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Error de importación

Asegúrate de estar en el directorio `backend` y que todos los archivos estén presentes.

## 📊 Monitoreo

El sistema ahora registra:
- ✅ Conexiones a la base de datos
- ✅ Creación de tablas
- ✅ Operaciones de autenticación
- ✅ Errores de base de datos

Revisa los logs del servidor para monitorear el estado de la base de datos.
