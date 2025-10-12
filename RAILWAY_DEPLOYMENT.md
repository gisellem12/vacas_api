# 🚀 Railway Deployment Guide

Esta guía te ayudará a desplegar la aplicación Vacas API en Railway.

## 📋 Prerequisitos

1. Cuenta en [Railway](https://railway.app)
2. Repositorio en GitHub
3. Variables de entorno configuradas

## 🔧 Configuración del Backend

### 1. Variables de Entorno en Railway

Configura las siguientes variables de entorno en tu proyecto de Railway:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=490126152605-00mok4vj7o1m1m2n5v7i6udhmrn6f180.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui

# JWT Configuration
JWT_SECRET_KEY=tu_super_secret_jwt_key_aqui
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Database Configuration
DATABASE_HOST=maglev.proxy.rlwy.net
DATABASE_PORT=45136
DATABASE_USER=root
DATABASE_PASSWORD=tu_password_de_base_de_datos
DATABASE_NAME=railway
DATABASE_URL=mysql+mysqlconnector://root:tu_password@maglev.proxy.rlwy.net:45136/railway

# API Configuration
API_BASE_URL=https://tu-proyecto.railway.app
```

### 2. Deployment Automático

1. Conecta tu repositorio de GitHub a Railway
2. Railway detectará automáticamente que es una aplicación Python
3. Usará el archivo `runtime.txt` para la versión de Python
4. Ejecutará `python main.py` como comando de inicio

## 🌐 Configuración del Frontend

### 1. Variables de Entorno en Vercel

En tu proyecto de Vercel, configura:

```bash
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

### 2. Deployment en Vercel

1. Conecta tu repositorio a Vercel
2. Vercel detectará automáticamente que es una aplicación Next.js
3. Usará la configuración de `vercel.json`

## 🔒 Configuración de Google OAuth

Para que Google OAuth funcione en producción:

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Actualiza las URIs de redirección autorizadas:
   - `https://tu-frontend.vercel.app`
   - `https://tu-backend.railway.app`
3. Asegúrate de que `GOOGLE_CLIENT_SECRET` esté configurado en Railway

## 🗄️ Base de Datos

Railway manejará automáticamente la conexión a MySQL. Asegúrate de que:

1. La base de datos esté configurada en Railway
2. Las variables de entorno de la base de datos estén correctas
3. Las tablas se crean automáticamente al iniciar la aplicación

## 🔄 Funcionalidades de Sesión

La persistencia de sesión funciona correctamente en Railway porque:

- ✅ Los tokens JWT se almacenan en localStorage
- ✅ Se verifican automáticamente al cargar la página
- ✅ El endpoint `/verify-token` funciona en producción
- ✅ Los tokens duran 24 horas (1440 minutos)
- ✅ CORS está configurado para permitir el frontend

## 🚨 Troubleshooting

### Error de CORS
Si tienes problemas de CORS, verifica que:
- El frontend esté desplegado en Vercel
- La URL del backend en `next.config.ts` sea correcta
- CORS esté habilitado para todos los orígenes

### Error de Base de Datos
Si hay problemas de conexión:
- Verifica las variables de entorno de la base de datos
- Asegúrate de que la base de datos esté activa en Railway
- Revisa los logs de Railway para errores específicos

### Error de Autenticación
Si la autenticación no funciona:
- Verifica que `JWT_SECRET_KEY` esté configurado
- Asegúrate de que `GOOGLE_CLIENT_SECRET` sea correcto
- Revisa que las URIs de Google OAuth incluyan tu dominio

## 📊 Monitoreo

Railway proporciona:
- Logs en tiempo real
- Métricas de rendimiento
- Monitoreo de salud de la aplicación
- Alertas automáticas

## 🔗 URLs Importantes

- **Backend**: `https://tu-proyecto.railway.app`
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Base de Datos**: Configurada automáticamente por Railway
- **Logs**: Disponibles en el dashboard de Railway

## 🎯 Comandos Útiles

```bash
# Ver logs en tiempo real
railway logs

# Conectar a la base de datos
railway connect

# Ver variables de entorno
railway variables

# Reiniciar el servicio
railway redeploy
```
