import os
import requests
import csv

# Carpeta de imágenes
carpeta_imagenes = r"C:\Users\Souva\Downloads\mi_api_vacas\mi_api_vacas\prueba"
url_api = "http://127.0.0.1:5000/predict"

# Archivo CSV donde se guardarán los resultados
archivo_csv = r"C:\Users\Souva\Downloads\mi_api_vacas\mi_api_vacas\prueba\predicciones.csv"

# Listar todas las imágenes en la carpeta
imagenes = [f for f in os.listdir(carpeta_imagenes) if f.endswith((".jpg", ".png", ".jpeg"))]

# Crear/abrir el CSV y escribir encabezados
with open(archivo_csv, mode='w', newline='') as csvfile:
    escritor = csv.writer(csvfile)
    escritor.writerow(["Imagen", "Peso (kg)", "Raza"])

    # Procesar cada imagen
    for img_nombre in imagenes:
        ruta_img = os.path.join(carpeta_imagenes, img_nombre)
        with open(ruta_img, "rb") as f:
            files = {"file": f}
            try:
                respuesta = requests.post(url_api, files=files)
                data = respuesta.json()
                escritor.writerow([img_nombre, data.get("peso"), data.get("raza")])
                print(f"{img_nombre}: Peso={data.get('peso')} Raza={data.get('raza')}")
            except Exception as e:
                print(f"Error con {img_nombre}: {e}")
