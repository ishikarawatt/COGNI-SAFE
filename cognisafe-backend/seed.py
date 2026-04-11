"""
Run once to create demo account + 6 months of sessions:
  python seed.py
"""
from database import SessionLocal, engine, Base
from models import User, Session
from auth import hash_password
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clean existing demo user
existing = db.query(User).filter(User.email == "demo@cognisafe.app").first()
if existing:
    db.query(Session).filter(Session.user_id == existing.id).delete()
    db.delete(existing)
    db.commit()

# Create demo user
user = User(
    name="Arjun Sharma",
    email="demo@cognisafe.app",
    password_hash=hash_password("demo1234"),
    dob="1968-05-14",
)
db.add(user)
db.commit()
db.refresh(user)
print(f"✓ Demo user created: {user.email} / demo1234")

# Seed 6 months of sessions
start   = datetime.utcnow() - timedelta(days=180)
current = start
count   = 0

random.seed(42)

while current < datetime.utcnow():
    if random.random() > 0.78:
        current += timedelta(days=1)
        continue

    progress      = (current - start).days / 180
    base_coherence = 0.68 + progress * 0.14

    coherence = round(base_coherence + random.uniform(-0.05, 0.05), 3)
    speech    = round(random.uniform(108, 128), 1)
    pause     = round(random.uniform(2.5, 5.2), 2)
    pitch     = round(random.uniform(172, 198), 1)
    hnr_val   = round(random.uniform(14, 22), 2)

    if coherence >= 0.76 and pause <= 4.0:
        risk = "Green"
    elif coherence >= 0.65 or pause <= 5.0:
        risk = "Yellow"
    else:
        risk = "Red"

    session = Session(
        user_id=user.id,
        risk_tier=risk,
        recorded_at=current.replace(
            hour=9, minute=random.randint(0, 59), second=0, microsecond=0
        ),
        semantic_coherence   = coherence,
        lexical_diversity    = round(random.uniform(0.65, 0.85), 3),
        idea_density         = round(random.uniform(0.55, 0.72), 3),
        speech_rate          = speech,
        pause_frequency      = pause,
        pause_duration       = round(random.uniform(0.3, 0.6), 3),
        pitch_mean           = pitch,
        pitch_range          = round(random.uniform(50, 80), 1),
        jitter               = round(random.uniform(0.008, 0.018), 4),
        shimmer              = round(random.uniform(0.06, 0.12), 3),
        hnr                  = hnr_val,
        syntactic_complexity = round(random.uniform(0.60, 0.80), 3),
        articulation_rate    = round(random.uniform(4.2, 5.5), 2),
        emotional_entropy    = round(random.uniform(0.55, 0.75), 3),
        has_anomaly          = risk != "Green",
    )
    db.add(session)
    count   += 1
    current += timedelta(days=1)

db.commit()
db.close()
print(f"✓ Seeded {count} sessions over 6 months")
print(f"\n🎯 Login: demo@cognisafe.app / demo1234")
print(f"🚀 Start server: uvicorn main:app --reload --port 8000")