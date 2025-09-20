# -*- coding: utf-8 -*-
"""app.py: API Flask para predicción de peso y raza de vacas"""

import os
import io
import torch
from PIL import Image
from flask import Flask, request, jsonify
from torchvision import transforms
import timm
import torch.nn as nn
from sklearn.preprocessing import MinMaxScaler
import numpy as np

# --------------------
# 🔹 Bloques SE y ASPP
# --------------------
class SEBlock(nn.Module):
    def __init__(self, in_channels, reduction=16):
        super(SEBlock, self).__init__()
        self.fc1 = nn.Linear(in_channels, in_channels // reduction, bias=False)
        self.fc2 = nn.Linear(in_channels // reduction, in_channels, bias=False)
        self.relu = nn.ReLU(inplace=True)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        b,c,_,_ = x.size()
        w = x.mean(dim=(2,3), keepdim=True)
        w = self.fc1(w.squeeze(-1).squeeze(-1))
        w = self.relu(w)
        w = self.fc2(w)
        w = self.sigmoid(w).view(b,c,1,1)
        return x * w.expand_as(x)

class ASPP(nn.Module):
    def __init__(self, in_channels, out_channel):
        super(ASPP, self).__init__()
        self.atrous_block1 = nn.Conv2d(in_channels, out_channel, kernel_size=1, stride=1, padding=0, dilation=1)
        self.atrous_block6 = nn.Conv2d(in_channels, out_channel, kernel_size=3, stride=1, padding=6, dilation=6)
        self.atrous_block12 = nn.Conv2d(in_channels, out_channel, kernel_size=3, stride=1, padding=12, dilation=12)
        self.atrous_block18 = nn.Conv2d(in_channels, out_channel, kernel_size=3, stride=1, padding=18, dilation=18)
        self.conv1x1 = nn.Conv2d(4*out_channel, out_channel, kernel_size=1, stride=1)
        self.relu = nn.ReLU()

    def forward(self, x):
        atrous_block1 = self.atrous_block1(x)
        atrous_block6 = self.atrous_block6(x)
        atrous_block12 = self.atrous_block12(x)
        atrous_block18 = self.atrous_block18(x)
        atrous_blocks = torch.cat([atrous_block1, atrous_block6, atrous_block12, atrous_block18], dim=1)
        return self.relu(self.conv1x1(atrous_blocks))

# --------------------
# 🔹 Modelo ResNet101d + ASPP + SE
# --------------------
class ResNet101d_aspp_se(nn.Module):
    def __init__(self, num_classes=1):
        super(ResNet101d_aspp_se, self).__init__()
        self.backbone = timm.create_model("resnet101d", pretrained=True, features_only=True)
        in_channels = self.backbone.feature_info[-1]["num_chs"]
        self.aspp = ASPP(in_channels, 256)
        self.se = SEBlock(256)
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Linear(256, num_classes)

    def forward(self, x):
        x = self.backbone(x)[-1]
        x = self.aspp(x)
        x = self.se(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        return x

# --------------------
# 🔹 Cargar modelo
# --------------------
device = "cuda" if torch.cuda.is_available() else "cpu"
model = ResNet101d_aspp_se()
model.to(device)
model.eval()

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
# Reemplazar estos valores si entrenaste con MinMaxScaler real:
# pesos_n.min_ = np.array([peso_min_dataset])
# pesos_n.scale_ = np.array([escala_dataset])
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
        # Evitamos negativos y aplicamos inversa de scaler
        peso_estimado = max(0, pesos_n.inverse_transform([[peso_normalizado]])[0][0])
    
    raza_predicha = "Holstein"  # Cambiar si tu modelo predice raza
    return round(peso_estimado,     2), raza_predicha

@app.route("/predict", methods=["POST"])
def predict():
    if 'file' not in request.files:
        return jsonify({"error":"No se subió archivo"}), 400
    
    file = request.files['file']
    peso, raza = predecir_vaca(file.read())
    return jsonify({"peso": peso, "raza": raza})

# --------------------
# 🔹 Ejecutar servidor
# --------------------
if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT",5000)), debug=True)
