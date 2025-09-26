from fastapi import FastAPI, HTTPException, Form
from pydantic import BaseModel
import requests
from io import BytesIO
from PIL import Image
import os
from langchain_utils_simulado import analyze_cow_image_with_json_output
import uvicorn

app = FastAPI(title="AgroTech Vision API")

class CowURL(BaseModel):
    url: str

@app.post("/predict")
async def predict(cow: CowURL):
    image_url = cow.url
    try:
        # Descargar imagen con timeout y manejo de errores
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content))
        image.verify()  # Verifica que sea una imagen válida
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Error descargando la imagen: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Imagen inválida: {e}")

    try:
        # Analizar imagen con la función de tu IA
        resultado = analyze_cow_image_with_json_output(image_url)
        if not resultado:
            raise ValueError("No se pudo procesar la imagen con la IA")
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando la imagen: {e}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
