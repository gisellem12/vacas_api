@echo off
:: ------------------------------
:: Run API de Vacas + Script de Predicciones
:: ------------------------------

echo ============================
echo Iniciando API de Vacas...
echo ============================

:: Activar entorno virtual
call venv\Scripts\activate.bat

:: Correr Flask en segundo plano
start "" python app.py

:: Esperar 5 segundos para que la API arranque
timeout /t 5 /nobreak >nul

echo ============================
echo Ejecutando script de predicciones...
echo ============================

:: Correr script de predicciones
python predicciones_api\predicts_api.py

echo ============================
echo Todo listo. API corriendo y CSV actualizado para AppSheet.
echo ============================

pause