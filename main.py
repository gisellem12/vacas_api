from fastapi import FastAPI
from pydantic import BaseModel
from langchain_utils_simulado import analyze_cow_image_with_json_output
import uvicorn

app = FastAPI()

class Imagen(BaseModel):
    url: str

@app.post("/predict")
async def predecir(imagen: Imagen):
    resultado = analyze_cow_image_with_json_output(imagen.url)
    return resultado
    
# Define a path operation for the root URL
@app.get("/")
async def read_root():
    return {"message": "Hello World"}
    
if __name__ == '__main__':
    uvicorn.run(app)
