from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    credential: str

class UserResponse(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    created_at: str
    last_login: str
    login_method: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserResponse] = None
    token: Optional[str] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
