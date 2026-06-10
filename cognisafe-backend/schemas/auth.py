from pydantic import BaseModel
from typing import Optional

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    dob: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str