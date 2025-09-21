# Usamos una imagen oficial de Python
FROM python:3.13-slim

# Establecemos el directorio de la app
WORKDIR /app

# Copiamos requirements.txt
COPY requirements.txt .

# Instalamos pip y dependencias
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el código de la app
COPY . .

# Exponemos el puerto que Heroku asignará
ENV PORT=5000
EXPOSE $PORT

# Comando para iniciar la app
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]