# 🔧 Sistema de Modo de Mantenimiento

Este sistema permite desactivar temporalmente la IA durante actualizaciones del sistema, manteniendo la API funcionando pero bloqueando los análisis de IA.

## 📋 Características

- ✅ **Modo de mantenimiento**: Desactiva la IA temporalmente
- ✅ **Endpoints protegidos**: Todos los endpoints de IA verifican el modo de mantenimiento
- ✅ **API operativa**: Los endpoints de estado y autenticación siguen funcionando
- ✅ **Scripts de gestión**: Herramientas para activar/desactivar el modo
- ✅ **Monitoreo**: Endpoints para verificar el estado del sistema

## 🚀 Uso Rápido

### Verificar estado del sistema
```bash
# Ver estado actual
curl http://localhost:8000/status

# Healthcheck básico
curl http://localhost:8000/health
```

### Activar modo de mantenimiento
```bash
# Activar con mensaje por defecto
curl -X POST http://localhost:8000/admin/maintenance/enable

# Activar con mensaje personalizado
curl -X POST "http://localhost:8000/admin/maintenance/enable?message=Actualización%20de%20modelos%20en%20progreso"
```

### Desactivar modo de mantenimiento
```bash
curl -X POST http://localhost:8000/admin/maintenance/disable
```

## 🛠️ Scripts de Gestión

### 1. Gestor Manual (`maintenance_manager.py`)

```bash
# Ver estado actual
python maintenance_manager.py status

# Activar modo de mantenimiento
python maintenance_manager.py enable

# Activar con mensaje personalizado
python maintenance_manager.py enable -m "Actualizando modelos de IA..."

# Desactivar modo de mantenimiento
python maintenance_manager.py disable

# Cambiar estado (toggle)
python maintenance_manager.py toggle

# Usar con servidor diferente
python maintenance_manager.py status -u http://tu-servidor:8000
```

### 2. Script de Actualización Automática (`update_system.py`)

```bash
# Ejecutar actualización completa
python update_system.py
```

Este script:
1. ✅ Verifica el estado inicial del sistema
2. 🔧 Activa el modo de mantenimiento
3. 🚀 Ejecuta las actualizaciones
4. ✅ Desactiva el modo de mantenimiento
5. 🔍 Verifica que todo esté funcionando

## 📊 Endpoints Disponibles

### Endpoints Públicos
- `GET /` - Healthcheck (indica si está en mantenimiento)
- `GET /health` - Healthcheck alternativo
- `GET /status` - Estado detallado del sistema

### Endpoints de Administración
- `POST /admin/maintenance` - Configurar modo de mantenimiento
- `POST /admin/maintenance/enable` - Activar modo de mantenimiento
- `POST /admin/maintenance/disable` - Desactivar modo de mantenimiento

### Endpoints Protegidos (verifican modo de mantenimiento)
- `POST /predict` - Análisis de imagen por URL
- `POST /predict-file` - Análisis de imagen por archivo
- `POST /predict-multipart` - Análisis de imagen multipart
- `GET /test-ai-analysis/{image_id}` - Análisis de prueba

## 🔒 Comportamiento en Modo de Mantenimiento

### ✅ Endpoints que Siguen Funcionando
- Autenticación (`/login`, `/register`, `/google-login`, `/me`)
- Estado del sistema (`/status`, `/health`, `/`)
- Endpoints de administración

### ❌ Endpoints Bloqueados
- Todos los endpoints que usan IA (`/predict*`, `/test-ai-analysis/*`)
- Retornan error 503 con mensaje de mantenimiento

### 📝 Respuesta de Error en Mantenimiento
```json
{
  "error": "maintenance_mode",
  "message": "Sistema en mantenimiento. Actualización en progreso...",
  "status": "maintenance"
}
```

## 🎯 Casos de Uso

### 1. Actualización de Modelos de IA
```bash
# 1. Activar modo de mantenimiento
python maintenance_manager.py enable -m "Actualizando modelos de IA..."

# 2. Realizar actualizaciones
# (copiar nuevos modelos, actualizar configuraciones, etc.)

# 3. Desactivar modo de mantenimiento
python maintenance_manager.py disable
```

### 2. Actualización Automática
```bash
# Ejecutar script completo de actualización
python update_system.py
```

### 3. Diagnóstico del Sistema
```bash
# Verificar estado actual
python maintenance_manager.py status

# Si hay problemas, mantener en modo de mantenimiento
# hasta resolver el problema
```

## 🔧 Configuración

### Variables de Entorno
```bash
# En config.env o variables de entorno
BASE_URL=http://localhost:8000  # URL de tu servidor
```

### Personalización
- **Mensaje de mantenimiento**: Personalizable en cada activación
- **URL del servidor**: Configurable en los scripts
- **Timeout**: Ajustable en las peticiones HTTP

## 📈 Monitoreo

### Estado del Sistema
```bash
# Ver estado completo
curl http://localhost:8000/status | jq

# Respuesta ejemplo:
{
  "status": "maintenance",
  "maintenance_mode": true,
  "message": "Actualización en progreso...",
  "ai_enabled": false,
  "timestamp": "2024-01-15T10:30:00"
}
```

### Healthcheck para Load Balancers
```bash
# Healthcheck básico
curl http://localhost:8000/health

# Respuesta en modo normal:
{"status": "healthy", "maintenance_mode": false}

# Respuesta en modo mantenimiento:
{"status": "maintenance", "message": "...", "maintenance_mode": true}
```

## 🚨 Troubleshooting

### Error: No se puede conectar al sistema
```bash
# Verificar que el servidor esté ejecutándose
curl http://localhost:8000/status

# Si no responde, iniciar el servidor
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Error: Endpoint de administración no funciona
- Verificar que los endpoints estén definidos en `main.py`
- Comprobar que el servidor esté ejecutándose
- Revisar logs del servidor

### El modo de mantenimiento no se desactiva
```bash
# Verificar estado actual
python maintenance_manager.py status

# Forzar desactivación
python maintenance_manager.py disable

# Si persiste el problema, revisar logs del servidor
```

## 🔐 Seguridad

⚠️ **Nota de Seguridad**: Los endpoints de administración no tienen autenticación en esta implementación básica. En producción, deberías:

1. Agregar autenticación JWT o API key
2. Restringir acceso por IP
3. Usar HTTPS
4. Implementar rate limiting

### Ejemplo de Autenticación (Futuro)
```python
@app.post("/admin/maintenance/enable")
async def enable_maintenance_mode(
    message: str = "Sistema en mantenimiento...",
    admin_token: str = Header(None)
):
    # Verificar token de administrador
    if not verify_admin_token(admin_token):
        raise HTTPException(status_code=403, detail="Token de administrador requerido")
    
    # Resto del código...
```

## 📝 Logs

El sistema genera logs detallados:
- 🔧 Activación/desactivación de modo de mantenimiento
- 📊 Estado del sistema
- ❌ Errores de conexión
- 🎯 Progreso de actualizaciones

Revisar logs del servidor para diagnóstico:
```bash
# Ver logs en tiempo real
tail -f logs/app.log

# O si usas uvicorn directamente
uvicorn main:app --host 0.0.0.0 --port 8000 --log-level debug
```
