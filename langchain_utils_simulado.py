from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
import base64
import requests
from io import BytesIO
import os
import json
import re
from PIL import Image 


# Función para convertir imagen a base64
def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')
    
# Función para descargar imagen de URL
def download_image_from_url(image_url):
    """Descarga una imagen desde una URL y la convierte a objeto PIL Image"""
    try:
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()  # Lanza excepción si hay error HTTP
       
        # Convertir bytes a imagen PIL
        image = Image.open(BytesIO(response.content))
        return image
       
    except requests.exceptions.RequestException as e:
        print(f"❌ Error descargando imagen: {e}")
        return None
    except Exception as e:
        print(f"❌ Error procesando imagen: {e}")
        return None

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

open_api_key = os.environ.get('OPEN_API_KEY')

# Configura el modelo multimodal
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1, api_key=open_api_key)

def analyze_cow_image_with_context(image_path_or_url):
    """Analiza una imagen de vaca con contexto de referencia"""
    
    try:
        # Determinar si es URL o ruta local
        if image_path_or_url.startswith(('http://', 'https://')):
            # Es URL, descargar imagen
            image = download_image_from_url(image_path_or_url)
            # # Convertir a base64
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
- Raza (ej: Holstein, Angus, Jersey, etc.)
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

def extract_json_from_response(response_text):
    """Extrae JSON del texto de respuesta del modelo"""
    
    try:
        # Método 1: Buscar JSON completo (incluyendo anidados)
        # Patrón mejorado para capturar JSON con objetos anidados
        json_pattern = r'```json\s*(\{.*?\})\s*```'
        json_match = re.search(json_pattern, response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
            return json.loads(json_str)
        
        # Método 2: Buscar JSON sin markdown
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        json_match = re.search(json_pattern, response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            return json.loads(json_str)
        
        # Método 3: Buscar JSON en formato de texto
        if 'json' in response_text.lower():
            # Extraer contenido entre ```json y ```
            start_marker = '```json'
            end_marker = '```'
            
            start_idx = response_text.lower().find(start_marker)
            if start_idx != -1:
                start_idx += len(start_marker)
                end_idx = response_text.find(end_marker, start_idx)
                if end_idx != -1:
                    json_str = response_text[start_idx:end_idx].strip()
                    return json.loads(json_str)
        
        # Método 4: Buscar cualquier JSON válido con "raza"
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*"raza"[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        json_match = re.search(json_pattern, response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            return json.loads(json_str)
        
        return None
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON: {e}")
        print(f"Texto que causó el error: {response_text[:200]}...")
        return None
    except Exception as e:
        print(f"❌ Error extrayendo JSON: {e}")
        return None

def analyze_cow_image_with_json_output(image_path_or_url):
    """Analiza imagen y devuelve JSON estructurado"""
    
    # Obtener respuesta del modelo
    response_text = analyze_cow_image_with_context(image_path_or_url)
    
    if not response_text:
        return None
    
    print(f"📝 Respuesta del modelo: {response_text}")
    
    # Extraer JSON
    json_data = extract_json_from_response(response_text)
    
    if json_data:
        print("✅ JSON extraído correctamente:")
        print(json.dumps(json_data, indent=2, ensure_ascii=False))
        
        return json_data
    else:
        print("❌ No se pudo extraer JSON válido")
        print("🔍 Intentando métodos alternativos...")
        
        # Método alternativo: buscar manualmente
        try:
            # Buscar entre ```json y ```
            if '```json' in response_text:
                start = response_text.find('```json') + 7
                end = response_text.find('```', start)
                if end > start:
                    json_str = response_text[start:end].strip()
                    json_data = json.loads(json_str)
                    print("✅ JSON extraído con método alternativo:")
                    print(json.dumps(json_data, indent=2, ensure_ascii=False))
                    return json_data
        except:
            pass
        
        return None