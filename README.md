# Sistema de Análisis de Peso de Ganado 🐄

## Descripción
Sistema de análisis inteligente de peso y estado del ganado vacuno usando imágenes y tecnologías de AI.

## Arquitectura
- **Backend**: FastAPI + Python (Puerto 8000)
- **Frontend**: Next.js + React + TypeScript (Puerto 3000)
- **AI**: OpenAI GPT + LangChain

## Deployment en Render

### Backend (vacas-backend)
- **Runtime**: Python 3.11
- **Build**: `pip install -r requirements.txt`
- **Start**, `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Directorio**: `./backend`
- **Variables**: `OPENAI_API_KEY`

### Frontend (vacas-frontend)
- **Runtime**: Node.js
- **Build**: `npm install`
- **Start**: `npm run start`  
- **Directorio**: `./frontend`
- **Variables**: `NEXT_PUBLIC_API_URL=https://vacas-backend.onrender.com`

## Variables de Entorno
- `OPENAI_API_KEY`: Clave de OpenAI (obligatoria)
- `PORT`: Puerto del servicio (automático en Render)

## URLs
- Frontend: `https://vacas-frontend.onrender.com`
- Backend API: `https://vacas-backend.onrender.com`
- Docs API: `https://vacas-backend.onrender.com/docs`
