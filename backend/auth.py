import os
import json
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from google.auth.transport import requests
from google.oauth2 import id_token
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import User, get_db

# Cargar variables de entorno
load_dotenv()

# Configuración de JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your_super_secret_jwt_key_here")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))

# Configuración de Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "490126152605-00mok4vj7o1m1m2n5v7i6udhmrn6f180.apps.googleusercontent.com")

# Configuración de hash de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Obtener hash de contraseña"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crear token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verificar token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
    """Verificar token de Google OAuth"""
    try:
        # Verificar el token con Google
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Verificar que el token sea válido
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        return {
            'email': idinfo.get('email'),
            'name': idinfo.get('name'),
            'picture': idinfo.get('picture'),
            'google_id': idinfo.get('sub')
        }
    except ValueError as e:
        print(f"Error verificando token de Google: {e}")
        return None

def create_or_get_user_from_google(google_data: Dict[str, Any]) -> Dict[str, Any]:
    """Crear o obtener usuario desde datos de Google"""
    db = next(get_db())
    try:
        email = google_data['email']
        
        # Buscar usuario existente
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            # Usuario existe, actualizar datos
            user.name = google_data['name']
            user.picture = google_data['picture']
            user.google_id = google_data['google_id']
            user.last_login = datetime.utcnow()
            user.login_method = 'google'
            db.commit()
            db.refresh(user)
        else:
            # Crear nuevo usuario
            user = User(
                email=email,
                name=google_data['name'],
                picture=google_data['picture'],
                google_id=google_data['google_id'],
                login_method='google',
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        return user.to_dict()
    finally:
        db.close()

def create_user(email: str, password: str, name: Optional[str] = None) -> Dict[str, Any]:
    """Crear usuario tradicional"""
    db = next(get_db())
    try:
        # Verificar si el usuario ya existe
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise ValueError("El usuario ya existe")
        
        hashed_password = get_password_hash(password)
        user = User(
            email=email,
            name=name or email.split('@')[0],
            password_hash=hashed_password,
            login_method='email',
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user.to_dict()
    finally:
        db.close()

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Autenticar usuario tradicional"""
    db = next(get_db())
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        if not user.password_hash:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        # Actualizar último login
        user.last_login = datetime.utcnow()
        db.commit()
        
        return user.to_dict()
    finally:
        db.close()

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Obtener usuario por email"""
    db = next(get_db())
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            return user.to_dict()
        return None
    finally:
        db.close()
