from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, TokenResponse
from auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: DBSession = Depends(get_db)):
    # Normalize email to lowercase and trim spaces
    email_norm = req.email.strip().lower()
    
    if db.query(User).filter(User.email == email_norm).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=email_norm,
        password_hash=hash_password(req.password),
        dob=req.dob,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        email=user.email,
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: DBSession = Depends(get_db)):
    # Normalize email to lowercase and trim spaces
    email_norm = req.email.strip().lower()
    
    user = db.query(User).filter(User.email == email_norm).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        email=user.email,
    )
