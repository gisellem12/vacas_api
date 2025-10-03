from fastapi import FastAPI, HTTPException, Form, File, UploadFile
from pydantic import BaseModel
import requests
from io import BytesIO
from PIL import Image
import os
import tempfile
from langchain_utils_simulado import analyze_cow_image_with_json_output
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AgroTech Vision API")

#enable cors
origins = ["*"]

app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,  # Allow cookies to be included in cross-origin requests
        allow_methods=["*"],     # Allow all standard HTTP methods (GET, POST, PUT, DELETE, etc.)
        allow_headers=["*"],     # Allow all headers in cross-origin requests
    )

class CowURL(BaseModel):
    url: str

@app.post("/predict")
async def predict(cow: CowURL):
    image_url = cow.url
    print(f"🔍 Procesando URL en endpoint: {image_url}")
    
    try:
        # Descargar imagen con timeout y manejo de errores
        print("📥 Descargando imagen...")
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        print(f"✅ Imagen descargada: {len(response.content)} bytes")
        
        # Verificar que el contenido no esté vacío
        if not response.content:
            raise ValueError("La imagen descargada está vacía")
        
        # Verificar que es una imagen válida
        print("🖼️ Verificando imagen...")
        image = Image.open(BytesIO(response.content))
        image.verify()  # Verifica que sea una imagen válida
        print("✅ Imagen válida confirmada")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error descargando imagen: {e}")
        raise HTTPException(status_code=400, detail=f"Error descargando la imagen: {e}")
    except Exception as e:
        print(f"❌ Error validando imagen: {e}")
        print(f"Tipo de error: {type(e).__name__}")
        raise HTTPException(status_code=400, detail=f"Imagen inválida: {e}")

    try:
        # Analizar imagen con la función de tu IA
        print("🤖 Iniciando análisis con IA...")
        resultado = analyze_cow_image_with_json_output(image_url)
        if not resultado:
            print("❌ La IA no pudo procesar la imagen")
            raise ValueError("No se pudo procesar la imagen con la IA")
        
        # Asegurar que la respuesta tenga todos los campos esperados por el frontend
        respuesta_completa = {
            "peso": resultado.get("peso", 400),
            "precio": resultado.get("precio"),
            "tamaño": resultado.get("tamaño", "medio"),
            "condicion": resultado.get("condicion", "buena"),
            "recomendaciones": resultado.get("recomendaciones", {
                "nutricion": [
                    "Mantener dieta balanceada con forraje de calidad",
                    "Suplementar con sales minerales",
                    "Proporcionar agua limpia y fresca"
                ],
                "manejo": [
                    "Realizar controles regulares de peso",
                    "Mantener instalaciones limpias",
                    "Programar rotación de pasturas"
                ],
                "salud": [
                    "Calendario de vacunación al día",
                    "Revisión veterinaria periódica",
                    "Control de parásitos interno y externo"
                ]
            }),
            "metodologia": resultado.get("metodologia"),
            "peso_openai": resultado.get("peso_openai"),
            "peso_dataset": resultado.get("peso_dataset"),
            "peso_original": resultado.get("peso_original"),
            "factor_correccion_global": resultado.get("factor_correccion_global"),
            "confianza": resultado.get("confianza"),
            "observaciones": resultado.get("observaciones"),
            "dispositivo": resultado.get("dispositivo"),
            "ajustes_aplicados": resultado.get("ajustes_aplicados")
        }
        
        print("✅ Análisis completado exitosamente")
        print("🎯 Respuesta final:", respuesta_completa)
        return respuesta_completa
    except Exception as e:
        print(f"❌ Error procesando imagen con IA: {e}")
        print(f"Tipo de error: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error procesando la imagen: {e}")

@app.post("/predict-file")
async def predict_file(file: UploadFile = File(...)):
    """Endpoint para analizar imagen enviada como archivo"""
    print(f"🔍 Procesando archivo: {file.filename}")
    print(f"📊 Tipo de contenido: {file.content_type}")
    
    # Verificar que es una imagen
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
    
    try:
        # Leer el contenido del archivo
        print("📖 Leyendo contenido del archivo...")
        file_content = await file.read()
        print(f"✅ Archivo leído: {len(file_content)} bytes")
        
        # Verificar que el archivo no esté vacío
        if not file_content:
            raise ValueError("El archivo está vacío")
        
        # Verificar que es una imagen válida
        print("🖼️ Verificando que es una imagen válida...")
        image = Image.open(BytesIO(file_content))
        image.verify()  # Verifica que sea una imagen válida
        print("✅ Imagen válida confirmada")
        
        # Guardar temporalmente en un archivo para procesar
        print("💾 Guardando archivo temporal...")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
            print(f"✅ Archivo temporal guardado: {temp_file_path}")
        
        try:
            # Analizar imagen con la función de tu IA
            print("🤖 Iniciando análisis con IA...")
            resultado = analyze_cow_image_with_json_output(temp_file_path)
            if not resultado:
                print("❌ La IA no pudo procesar la imagen")
                raise ValueError("No se pudo procesar la imagen con la IA")
            
            # Asegurar que la respuesta tenga todos los campos esperados por el frontend
            respuesta_completa = {
                "peso": resultado.get("peso", 400),
                "precio": resultado.get("precio"),
                "tamaño": resultado.get("tamaño", "medio"),
                "condicion": resultado.get("condicion", "buena"),
                "recomendaciones": resultado.get("recomendaciones", {
                    "nutricion": [
                        "Mantener dieta balanceada con forraje de calidad",
                        "Suplementar con sales minerales",
                        "Proporcionar agua limpia y fresca"
                    ],
                    "manejo": [
                        "Realizar controles regulares de peso",
                        "Mantener instalaciones limpias",
                        "Programar rotación de pasturas"
                    ],
                    "salud": [
                        "Calendario de vacunación al día",
                        "Revisión veterinaria periódica",
                        "Control de parásitos interno y externo"
                    ]
                }),
                "metodologia": resultado.get("metodologia"),
                "peso_openai": resultado.get("peso_openai"),
                "peso_dataset": resultado.get("peso_dataset"),
                "peso_original": resultado.get("peso_original"),
                "factor_correccion_global": resultado.get("factor_correccion_global"),
                "confianza": resultado.get("confianza"),
                "observaciones": resultado.get("observaciones"),
                "dispositivo": resultado.get("dispositivo"),
                "ajustes_aplicados": resultado.get("ajustes_aplicados")
            }
            
            print("✅ Análisis completado exitosamente")
            print("🎯 Respuesta final:", respuesta_completa)
            return respuesta_completa
            
        finally:
            # Limpiar archivo temporal
            try:
                os.unlink(temp_file_path)
                print("🗑️ Archivo temporal eliminado")
            except:
                pass
                
    except Exception as e:
        print(f"❌ Error procesando archivo: {e}")
        print(f"Tipo de error: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error procesando la imagen: {e}")

@app.post("/predict-multipart")
async def predict_multipart(file: UploadFile = File(...)):
    """Endpoint alternativo para analizar imagen enviada como multipart/form-data"""
    return await predict_file(file)

@app.get("/test")
async def test_endpoint():
    """Endpoint de prueba simple"""
    return {"status": "ok", "message": "Backend funcionando correctamente"}

@app.post("/test-analysis")
async def test_analysis():
    """Endpoint de prueba para análisis simulado"""
    try:
        # Generar respuesta directamente sin emojis
        respuesta_completa = {
            "peso": 425,
            "precio": "6.500.575 Gs",
            "tamaño": "medio",
            "condicion": "buena",
            "recomendaciones": {
                "nutricion": [
                    "Mantener dieta balanceada con forraje de calidad",
                    "Suplementar con sales minerales",
                    "Proporcionar agua limpia y fresca"
                ],
                "manejo": [
                    "Realizar controles regulares de peso",
                    "Mantener instalaciones limpias",
                    "Programar rotacion de pasturas"
                ],
                "salud": [
                    "Calendario de vacunacion al dia",
                    "Revision veterinaria periodica",
                    "Control de parasitos interno y externo"
                ]
            }
        }
        return respuesta_completa
            
    except Exception as e:
        return {"error": f"Error en analisis de prueba: {str(e)}"}

@app.post("/calibrate-weight")
async def calibrate_weight(file: UploadFile = File(...), peso_real: int = None):
    """Endpoint para calibrar el modelo con peso real conocido"""
    print(f"🔧 Calibrando modelo con peso real: {peso_real} kg")
    
    if peso_real is None or peso_real <= 0:
        raise HTTPException(status_code=400, detail="Peso real debe ser un número positivo")
    
    # Verificar que es una imagen
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
    
    try:
        # Leer el contenido del archivo
        file_content = await file.read()
        
        if not file_content:
            raise ValueError("El archivo está vacío")
        
        # Verificar que es una imagen válida
        image = Image.open(BytesIO(file_content))
        image.verify()
        
        # Guardar temporalmente
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name
        
        # Realizar calibración
        from langchain_utils_simulado import calibrate_weight_estimation
        resultado_calibrado = calibrate_weight_estimation(temp_path, peso_real)
        
        # Limpiar archivo temporal
        os.unlink(temp_path)
        
        if resultado_calibrado:
            return {
                "mensaje": "Calibración exitosa",
                "peso_real": peso_real,
                "peso_estimado_original": resultado_calibrado.get('peso_original'),
                "factor_correccion": resultado_calibrado.get('factor_correccion'),
                "resultado_calibrado": resultado_calibrado
            }
        else:
            raise HTTPException(status_code=500, detail="Error en la calibración")
            
    except Exception as e:
        print(f"❌ Error en calibración: {e}")
        raise HTTPException(status_code=500, detail=f"Error en calibración: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
