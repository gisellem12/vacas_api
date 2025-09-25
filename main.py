from fastapi import FastAPI
from pydantic import BaseModel
from langchain_utils_simulado import analyze_cow_image_url, analyze_cow_image_local, analyze_cow_image_with_context
app = FastAPI( )

class Imagen(BaseModel):
    url: str

@app.post("/items")
async def predecir(imagen: Imagen):
    try:
        resultado = analyze_cow_image_url(imagen.url)
        return resultado
    except Exception as e:
        return {"error": str(e)}
    