from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta
from database import get_db
from models import User, Session
from schemas import UserProfile
from dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

def calc_streak(sessions) -> int:
    if not sessions: return 0
    dates  = sorted(set(s.recorded_at.date() for s in sessions), reverse=True)
    streak = 0
    today  = datetime.utcnow().date()
    for i, d in enumerate(dates):
        if d == today - timedelta(days=i):
            streak += 1
        else:
            break
    return streak

def calc_cognitive_age(sessions, bio_age: int = 40) -> int:
    if not sessions: return bio_age
    recent        = sessions[-10:]
    avg_coherence = sum(s.semantic_coherence or 0.75 for s in recent) / len(recent)
    offset        = int((avg_coherence - 0.75) * 40)
    return max(18, bio_age - offset)

@router.get("/me", response_model=UserProfile)
def get_profile(
    db:   DBSession = Depends(get_db),
    user: User      = Depends(get_current_user)
):
    all_sessions   = db.query(Session).filter(
        Session.user_id == user.id
    ).order_by(Session.recorded_at).all()

    now            = datetime.utcnow()
    month_start    = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    sessions_month = [s for s in all_sessions if s.recorded_at >= month_start]

    last_hours = None
    if all_sessions:
        diff       = now - all_sessions[-1].recorded_at
        last_hours = round(diff.total_seconds() / 3600, 1)

    bio_age = 40
    if user.dob:
        try:
            dob     = datetime.strptime(user.dob, "%Y-%m-%d")
            bio_age = (now - dob).days // 365
        except:
            pass

    return UserProfile(
        id=user.id,
        name=user.name,
        email=user.email,
        dob=user.dob,
        streak=calc_streak(all_sessions),
        cognitive_age=calc_cognitive_age(all_sessions, bio_age),
        sessions_total=len(all_sessions),
        sessions_this_month=len(sessions_month),
        last_session_hours_ago=last_hours,
    )
