import os
import requests
import csv
from PIL import Image, ImageDraw, ImageFont

# --- CONFIGURACIÓN ---
carpeta_imagenes = r"C:\Users\Souva\Downloads\mi_api_vacas\mi_api_vacas\prueba"
url_api = "http://127.0.0.1:5000/predict"
archivo_csv = os.path.join(carpeta_imagenes, "predicciones.csv")
carpeta_resultados = os.path.join(carpeta_imagenes, "predicciones_resultados")

# Crear carpeta de resultados si no existe
os.makedirs(carpeta_resultados, exist_ok=True)

print("[DEBUG] Script iniciado")
print(f"[DEBUG] Carpeta de imágenes: {carpeta_imagenes}")
print(f"[DEBUG] Contenido de la carpeta: {os.listdir(carpeta_imagenes)}")

# Verificar si la API está disponible
try:
    test = requests.get("http://127.0.0.1:5000")
    print("[INFO] API detectada y corriendo correctamente.")
except requests.exceptions.RequestException:
    print("[ERROR] No se pudo conectar a la API. Asegurate de que Flask esté corriendo en http://127.0.0.1:5000")
    exit(1)

# Listar imágenes
imagenes = [f for f in os.listdir(carpeta_imagenes) if f.endswith((".jpg", ".png", ".jpeg"))]
print(f"[DEBUG] Imágenes encontradas: {imagenes}")

if not imagenes:
    print("[DEBUG] No se encontraron imágenes en la carpeta.")
else:
    # Crear CSV y escribir encabezados
    with open(archivo_csv, mode='w', newline='') as csvfile:
        escritor = csv.writer(csvfile)
        escritor.writerow(["Imagen", "Peso (kg)", "Raza"])

        for img_nombre in imagenes:
            ruta_img = os.path.join(carpeta_imagenes, img_nombre)
            print(f"[DEBUG] Procesando imagen: {ruta_img}")
            with open(ruta_img, "rb") as f:
                files = {"file": f}
                try:
                    respuesta = requests.post(url_api, files=files)
                    print(f"[DEBUG] Status code de la API: {respuesta.status_code}")
                    data = respuesta.json()
                    print(f"[DEBUG] Respuesta de la API: {data}")

                    peso = data.get("peso")
                    raza = data.get("raza")

                    escritor.writerow([img_nombre, peso, raza])

                    # --- DIBUJAR SOBRE LA IMAGEN ---
                    imagen = Image.open(ruta_img).convert("RGB")
                    draw = ImageDraw.Draw(imagen)
                    try:
                        font = ImageFont.truetype("arial.ttf", 30)
                    except:
                        font = ImageFont.load_default()
                    texto = f"{raza}, {peso} kg"
                    draw.text((10, 10), texto, fill="red", font=font)
                    ruta_resultado = os.path.join(carpeta_resultados, img_nombre)
                    imagen.save(ruta_resultado)
                    print(f"[INFO] Imagen guardada con predicción en: {ruta_resultado}")

                except Exception as e:
                    print(f"[ERROR] Error con {img_nombre}: {e}")

print("[INFO] Script finalizado")
