from fastapi import FastAPI, HTTPException, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from io import BytesIO
from PIL import Image
import os
from dotenv import load_dotenv
import base64
from langchain_utils_simulado import analyze_cow_image_with_json_output

app = FastAPI(title="AgroTech Vision API")

# Configurar CORS para permitir frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CowURL(BaseModel):
    url: str

def image_to_base64(image: Image.Image) -> str:
    """Convierte imagen PIL a base64"""
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

@app.get("/")
async def root():
    return {"message": "AgroTech Vision API funcionando"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "api_key": bool(os.environ.get('OPENAI_API_KEY'))}

@app.post("/predict")
async def predict(url: str = Form(None), file: UploadFile = File(None)):
    """Endpoint que acepta tanto URL como archivo"""
    try:
        
        image_url = None
        image_base64 = None
        
        if file:
            # Procesar archivo subido
            contents = await file.read()
            image = Image.open(BytesIO(contents))
            image_base64 = image_to_base64(image)
        elif url:
            # Procesar URL
            image_url = url
        else:
            raise HTTPException(status_code=400, detail="Debe proporcionar URL o archivo")
        
        # Usar base64 si está disponible, sino URL
        if image_base64:
            input_data = image_base64
        else:
            input_data = image_url
        
        resultado = analyze_cow_image_with_json_output(input_data, True)
        
        if not resultado:
            raise HTTPException(status_code=500, detail="No se pudo procesar la imagen")
            
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)

