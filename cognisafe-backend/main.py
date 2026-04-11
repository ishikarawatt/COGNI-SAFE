from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import User, Session  # noqa
from routes import auth_router, sessions_router, users_router, reports_router
from routes.ml import ml_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CogniSafe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}

@app.on_event("startup")
def seed_demo_user():
    from database import SessionLocal
    from auth import hash_password
    db = SessionLocal()
    existing = db.query(User).filter(User.email == "demo@cognisafe.app").first()
    if existing and not existing.dob:
        db.delete(existing)
        db.commit()
        existing = None
        
    if not existing:
        user = User(
            name="Arjun Sharma",
            email="demo@cognisafe.app",
            password_hash=hash_password("demo1234"),
            dob="1968-05-14",
        )
        db.add(user)
        db.commit()
    db.close()

app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(users_router)
app.include_router(reports_router)
app.include_router(ml_router)

@app.get("/")
def root():
    return {"status": "CogniSafe API running", "version": "1.0.0"}