from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta
from typing import List
from database import get_db
from models import User, Session
from schemas import WeeklyReport, WeeklyInsight, TrajectoryPoint
from dependencies import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])

def score_session(s) -> float:
    coherence = (s.semantic_coherence or 0.75) * 40
    speech    = min((s.speech_rate    or 110)  / 150 * 20, 20)
    pause     = max(0, 20 - (s.pause_frequency or 3) * 3)
    hnr       = min((s.hnr            or 15)   / 25  * 20, 20)
    return round(coherence + speech + pause + hnr, 1)

@router.get("/weekly", response_model=WeeklyReport)
def get_weekly(
    db:   DBSession = Depends(get_db),
    user: User      = Depends(get_current_user)
):
    week_start = datetime.utcnow() - timedelta(days=7)
    sessions   = (
        db.query(Session)
        .filter(Session.user_id == user.id, Session.recorded_at >= week_start)
        .order_by(Session.recorded_at)
        .all()
    )

    if not sessions:
        return WeeklyReport(
            narrative="No sessions this week. Start recording to begin tracking!",
            insights=[],
            avg_semantic_coherence=None,
            avg_speech_rate=None,
            avg_pause_frequency=None,
            sessions_this_week=0,
            risk_tier="Green",
        )

    avg_coherence = round(sum(s.semantic_coherence or 0 for s in sessions) / len(sessions), 2)
    avg_speech    = round(sum(s.speech_rate    or 0 for s in sessions) / len(sessions), 1)
    avg_pause     = round(sum(s.pause_frequency or 0 for s in sessions) / len(sessions), 2)

    risk_counts = {"Green": 0, "Yellow": 0, "Red": 0}
    for s in sessions:
        risk_counts[s.risk_tier] = risk_counts.get(s.risk_tier, 0) + 1
    overall_risk = max(risk_counts, key=risk_counts.get)

    narrative = (
        f"This week you completed {len(sessions)} session{'s' if len(sessions) > 1 else ''}. "
        f"Your semantic coherence averaged {avg_coherence}, "
        f"{'above' if avg_coherence >= 0.75 else 'slightly below'} your baseline. "
        f"Overall cognitive health is {overall_risk.lower()}."
    )

    insights = []
    if avg_coherence >= 0.76:
        insights.append(WeeklyInsight(color="success",
            text=f"Semantic coherence averaged {avg_coherence} — above your personal baseline of 0.76."))
    else:
        insights.append(WeeklyInsight(color="warn",
            text=f"Semantic coherence averaged {avg_coherence} — slightly below baseline."))

    if avg_pause > 4.0:
        insights.append(WeeklyInsight(color="warn",
            text=f"Pause frequency was elevated at {avg_pause}/min — may correlate with fatigue."))
    else:
        insights.append(WeeklyInsight(color="success",
            text=f"Pause frequency {avg_pause}/min is within your healthy range."))

    insights.append(WeeklyInsight(color="indigo",
        text=f"You recorded {len(sessions)} out of 7 days. Consistency improves baseline accuracy."))

    return WeeklyReport(
        narrative=narrative,
        insights=insights,
        avg_semantic_coherence=avg_coherence,
        avg_speech_rate=avg_speech,
        avg_pause_frequency=avg_pause,
        sessions_this_week=len(sessions),
        risk_tier=overall_risk,
    )

@router.get("/trajectory", response_model=List[TrajectoryPoint])
def get_trajectory(
    months: int      = 6,
    db:     DBSession = Depends(get_db),
    user:   User     = Depends(get_current_user)
):
    since    = datetime.utcnow() - timedelta(days=30 * months)
    sessions = (
        db.query(Session)
        .filter(Session.user_id == user.id, Session.recorded_at >= since)
        .order_by(Session.recorded_at)
        .all()
    )

    monthly: dict = {}
    for s in sessions:
        key = s.recorded_at.strftime("%b")
        monthly.setdefault(key, []).append(score_session(s))

    return [
        TrajectoryPoint(
            month=month,
            score=round(sum(scores) / len(scores), 1),
            session_count=len(scores),
        )
        for month, scores in monthly.items()
    ]