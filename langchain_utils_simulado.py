from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from PIL import Image
import base64
import requests
from io import BytesIO
import os

# Función para convertir imagen a base64
def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Función para descargar imagen de URL
def download_image_from_url(image_url):
    response = requests.get(image_url)
    image = Image.open(BytesIO(response.content))
    return image

# Datos de contexto con ejemplos
EXAMPLES = """
- Vaca 1: imagen_url=https://drive.google.com/uc?id=12ygJabwRTon0DoVliundkso-35w_ILxO, peso=378 kg
- Vaca 2: imagen_url=https://drive.google.com/uc?id=1p9zqcP2DeUEx993fjqnR6HrzJF5r_rix, peso=446 kg
- Vaca 3: imagen_url=https://drive.google.com/uc?id=1DwLycAIur8Hc1Beda3DQiYqMSOGucHQW, peso=487 kg
- Vaca 4: imagen_url=https://drive.google.com/uc?id=1BduYhTPpvPnQdf9hb9Mudaj9hCY9BW0d, peso=457 kg
- Vaca 5: imagen_url=https://drive.google.com/uc?id=1QEcgPxSGrtQubaiOPdkFKpSFJaeMCZ_q, peso=389 kg
- Vaca 6: imagen_url=https://drive.google.com/uc?id=1ftGFRdg5G3nCLyd_Xuyn80wfwzYmhFLY, peso=410 kg
- Vaca 7: imagen_url=https://drive.google.com/uc?id=1p4izPVn180TetlxOxwm6GW4_PEf-8qtN, peso=429 kg
- Vaca 8: imagen_url=https://drive.google.com/uc?id=1UwbKMJ0RcgNVj2XqKIP4BcQtS9fhe4o5, peso=514 kg
- Vaca 9: imagen_url=https://drive.google.com/uc?id=1vRl6QdmhJrF4TKGcbxHhmQSQKDu3dWiF, peso=459 kg
"""

# Configura el modelo multimodal
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1, api_key="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")

def analyze_cow_image_with_context(image_path_or_url):
    """Analiza una imagen de vaca con contexto de referencia"""
    
    try:
        # Determinar si es URL o ruta local
        if image_path_or_url.startswith(('http://', 'https://')):
            # Es URL, descargar imagen
            image = download_image_from_url(image_path_or_url)
            # Convertir a base64
            buffer = BytesIO()
            image.save(buffer, format="JPEG")
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        else:
            # Es ruta local
            image_base64 = encode_image_to_base64(image_path_or_url)
        
        # Crear mensaje multimodal DIRECTO (sin prompt template)
        message = HumanMessage(
            content=[
                {"type": "text", "text": f"""Eres un experto en ganadería con experiencia en estimación de peso de ganado. 

CONTEXTO DE REFERENCIA:
{EXAMPLES}

Basándote en estos ejemplos de referencia, analiza la imagen de la vaca y extrae:
- Raza (ej: Brangus Roja, Brangus Negro, Brangus, Braford, Nelore, etc.)
- Tamaño aproximado (pequeño/medio/grande, o en metros de altura)
- Peso estimado (en kg, basado en apariencia visual y comparación con los ejemplos)
- Condición corporal (gorda/delgada/media)
- Otras características notables (color, cuernos, etc.)

IMPORTANTE: 
- Usa los ejemplos de referencia para calibrar tu estimación de peso
- Considera el tamaño relativo, condición corporal y raza
- El peso debe estar en el rango de 350-550 kg basado en los ejemplos
- Responde solo en formato JSON con las claves: raza, tamaño, peso, condicion, otras"""},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                },
            ]
        )
        
        # Llamar directamente al modelo
        result = llm.invoke([message])
        
        return result.content
        
    except Exception as e:
        print(f"❌ Error procesando imagen: {e}")
        return None

def analyze_cow_image_local(image_path):
    """Analiza una imagen local de vaca con contexto"""
    
    if not os.path.exists(image_path):
        print(f"❌ Error: El archivo {image_path} no existe")
        return None
    
    return analyze_cow_image_with_context(image_path)

def analyze_cow_image_url(image_url):
    """Analiza una imagen de URL de vaca con contexto"""
    return analyze_cow_image_with_context(image_url)

# Función para probar con ejemplos de referencia
def test_with_reference_examples():
    """Prueba con algunos ejemplos de referencia"""
    
    # URLs de ejemplo (puedes usar cualquiera de las del contexto)
    test_urls = [
        "https://drive.google.com/uc?id=1X8gum_ste-UQ-vvrH5-Wfaeuhdq3LonF",  # Vaca 1: 378 kg
        "https://drive.google.com/uc?id=1p9zqcP2DeUEx993fjqnR6HrzJF5r_rix",  # Vaca 2: 446 kg
        "https://drive.google.com/uc?id=1DwLycAIur8Hc1Beda3DQiYqMSOGucHQW",  # Vaca 3: 487 kg
    ]
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n🔍 Analizando Vaca {i} (Peso real: {[378, 446, 487][i-1]} kg)")
        print("-" * 50)
        
        result = analyze_cow_image_url(url)
        if result:
            print(f"Resultado: {result}")
        else:
            print("❌ Error en el análisis")

# Uso principal
if __name__ == "__main__":
    # Opción 1: Imagen local
    # image_path = "angus-2.jpg"  # Tu imagen local
    # output = analyze_cow_image_local(image_path)
    # print("Resultado con imagen local:")
    # print(output)
    
    # Opción 2: Imagen de URL
    # image_url = "https://drive.google.com/uc?id=12ygJabwRTon0DoVliundkso-35w_ILxO"
    # output = analyze_cow_image_url(image_url)
    # print("Resultado con imagen de URL:")
    # print(output)
    
    # Opción 3: Probar con ejemplos de referencia
    test_with_reference_examples()