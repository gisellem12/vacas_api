# -*- coding: utf-8 -*-
"""app.py: API Flask para predicción de peso y raza de vacas"""

import os
import io
import torch
from PIL import Image
from flask import Flask, request, jsonify
from torchvision import transforms
import requests
from sklearn.preprocessing import MinMaxScaler

# Importar modelo desde modelo.py
from modelo import cargar_modelo

# --------------------
# 🔹 Configuración de dispositivo y modelo
# --------------------
device = "cuda" if torch.cuda.is_available() else "cpu"
model = cargar_modelo()
model.to(device)

# Cargar pesos entrenados si existen:
# model.load_state_dict(torch.load("model.pth", map_location=device))

# --------------------
# 🔹 Transformación de imagen
# --------------------
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
])

# --------------------
# 🔹 Normalizador de pesos
# --------------------
pesos_n = MinMaxScaler()
pesos_n.min_, pesos_n.scale_ = 0, 1

# --------------------
# 🔹 Flask API
# --------------------
app = Flask(__name__)

def predecir_vaca(imagen_bytes):
    imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
    img_tensor = transform(imagen).unsqueeze(0).to(device)
    
    with torch.no_grad():
        salida = model(img_tensor).squeeze()
        peso_normalizado = salida.item()
        peso_estimado = max(0, pesos_n.inverse_transform([[peso_normalizado]])[0][0])
    
    raza_predicha = "Holstein"  # Cambiar si tu modelo predice raza
    return round(peso_estimado, 2), raza_predicha

@app.route("/predict", methods=["POST"])
def predict():
    # 1️⃣ Caso: JSON con URL (AppSheet)
    if request.is_json:
        data = request.get_json()
        if not data or 'imagen_url' not in data:
            return jsonify({"error": "No se recibió la URL de la imagen"}), 400
        
        imagen_url = data['imagen_url']
        try:
            response = requests.get(imagen_url)
            response.raise_for_status()
        except Exception as e:
            return jsonify({"error": f"No se pudo descargar la imagen: {e}"}), 400

        peso, raza = predecir_vaca(response.content)
        return jsonify({"peso": peso, "raza": raza})
    
    # 2️⃣ Caso: archivo subido directamente
    elif 'file' in request.files:
        file = request.files['file']
        peso, raza = predecir_vaca(file.read())
        return jsonify({"peso": peso, "raza": raza})

    else:
        return jsonify({"error": "No se subió archivo ni se envió JSON con URL"}), 400

# --------------------
# 🔹 Ejecutar servidor
# --------------------
if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT",5000)), debug=True)
