import os
import requests
import csv
from PIL import Image, ImageDraw, ImageFont

# ---------------- CONFIGURACIÓN ----------------
carpeta_imagenes = r"C:\Users\Souva\Downloads\mi_api_vacas\mi_api_vacas\prueba"
url_api = "http://127.0.0.1:5000/predict"
archivo_csv = os.path.join(carpeta_imagenes, "predicciones.csv")
carpeta_resultados = os.path.join(carpeta_imagenes, "predicciones_resultados")
dibujar_imagenes = True  # True = dibuja predicciones sobre imágenes, False = no dibuja

# Crear carpeta de resultados si no existe
os.makedirs(carpeta_resultados, exist_ok=True)

# ---------------- VERIFICAR API ----------------
try:
    test = requests.get("http://127.0.0.1:5000")
    print("[INFO] API detectada y corriendo correctamente.")
except requests.exceptions.RequestException:
    print("[ERROR] No se pudo conectar a la API. Asegurate de que Flask esté corriendo en http://127.0.0.1:5000")
    exit(1)

# ---------------- LISTAR IMÁGENES ----------------
imagenes = [f for f in os.listdir(carpeta_imagenes) if f.lower().endswith((".jpg", ".png", ".jpeg"))]
if not imagenes:
    print("[DEBUG] No se encontraron imágenes en la carpeta.")
    exit(0)

# ---------------- CREAR CSV ----------------
with open(archivo_csv, mode='w', newline='', encoding='utf-8') as csvfile:
    escritor = csv.writer(csvfile)
    escritor.writerow(["Imagen", "Peso (kg)", "Raza"])  # Encabezados

    for img_nombre in imagenes:
        ruta_img = os.path.join(carpeta_imagenes, img_nombre)
        try:
            with open(ruta_img, "rb") as f:
                files = {"file": f}
                respuesta = requests.post(url_api, files=files)
                data = respuesta.json()

            peso = data.get("peso", "N/A")
            raza = data.get("raza", "N/A")
            escritor.writerow([img_nombre, peso, raza])
            print(f"[INFO] {img_nombre} -> Peso: {peso}, Raza: {raza}")

            # ---------------- OPCIONAL: DIBUJAR SOBRE IMAGEN ----------------
            if dibujar_imagenes:
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
        except Exception as e:
            print(f"[ERROR] No se pudo procesar {img_nombre}: {e}")

print("[INFO] Script finalizado. CSV listo para AppSheet y predicciones guardadas en:", carpeta_resultados)
