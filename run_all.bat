@echo off
cls
echo ============================
echo Iniciando entorno virtual...
echo ============================

:: Activar el entorno virtual
call venv\Scripts\activate.bat

echo ============================
echo Iniciando API de Vacas...
echo ============================
start cmd /k "python app.py"

:: Esperar 5 segundos para que la API arranque
timeout /t 5 > nul

echo ============================
echo Iniciando script de predicciones automáticas...
echo ============================
start cmd /k "python predicciones_api\predicts_api_auto.py"

echo ============================
echo Todo listo. API corriendo y script automático activo.
echo ============================
pause