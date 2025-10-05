from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está configurada en las variables de entorno")

# Crear engine
engine = create_engine(DATABASE_URL, echo=True)

# Crear sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Modelo de Usuario
class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=True)  # NULL para usuarios de Google
    picture = Column(Text, nullable=True)  # URL de la foto de perfil
    google_id = Column(String(255), nullable=True, unique=True)
    login_method = Column(String(50), nullable=False, default="email")  # "email" o "google"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        """Convertir usuario a diccionario"""
        return {
            'email': self.email,
            'name': self.name,
            'picture': self.picture,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'login_method': self.login_method
        }

# Función para obtener sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para crear todas las tablas
def create_tables():
    Base.metadata.create_all(bind=engine)

# Función para verificar conexión a la base de datos
def test_connection():
    try:
        db = SessionLocal()
        # Intentar hacer una consulta simple
        db.execute("SELECT 1")
        db.close()
        print("✅ Conexión a la base de datos exitosa")
        return True
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return False
