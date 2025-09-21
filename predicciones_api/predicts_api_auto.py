import os
import requests
import csv
import time
from PIL import Image, ImageDraw, ImageFont

# --- CONFIGURACIÓN ---
carpeta_imagenes = r"C:\Users\Souva\Downloads\mi_api_vacas\mi_api_vacas\prueba"
url_api = "http://127.0.0.1:5000/predict"
archivo_csv = os.path.join(carpeta_imagenes, "predicciones.csv")
carpeta_resultados = os.path.join(carpeta_imagenes, "predicciones_resultados")

os.makedirs(carpeta_resultados, exist_ok=True)

def procesar_imagenes():
    imagenes = [f for f in os.listdir(carpeta_imagenes) if f.endswith((".jpg", ".png", ".jpeg"))]
    if not imagenes:
        print("[DEBUG] No hay imágenes para procesar.")
        return
    
    with open(archivo_csv, mode='w', newline='') as csvfile:
        escritor = csv.writer(csvfile)
        escritor.writerow(["Imagen", "Peso (kg)", "Raza"])
        
        for img_nombre in imagenes:
            ruta_img = os.path.join(carpeta_imagenes, img_nombre)
            with open(ruta_img, "rb") as f:
                files = {"file": f}
                try:
                    respuesta = requests.post(url_api, files=files)
                    data = respuesta.json()
                    peso = data.get("peso")
                    raza = data.get("raza")
                    escritor.writerow([img_nombre, peso, raza])

                    # Dibujar predicción en la imagen
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
                    print(f"[INFO] Imagen guardada con predicción: {ruta_resultado}")
                except Exception as e:
                    print(f"[ERROR] Error con {img_nombre}: {e}")

print("[INFO] Script de predicciones en modo automático iniciado.")

# Loop infinito para revisar nuevas imágenes cada X segundos
while True:
    procesar_imagenes()
    print("[INFO] Esperando 30 segundos para revisar nuevas imágenes...")
    time.sleep(30)  # Cambiar el tiempo si querés que sea más frecuente
