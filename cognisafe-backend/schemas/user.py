from pydantic import BaseModel
from typing import Optional, List

class UserProfile(BaseModel):
    id:                     int
    name:                   str
    email:                  str
    dob:                    Optional[str]
    streak:                 int
    cognitive_age:          Optional[int]
    sessions_total:         int
    sessions_this_month:    int
    last_session_hours_ago: Optional[float]

class WeeklyInsight(BaseModel):
    color: str
    text:  str

class WeeklyReport(BaseModel):
    narrative:              str
    insights:               List[WeeklyInsight]
    avg_semantic_coherence: Optional[float]
    avg_speech_rate:        Optional[float]
    avg_pause_frequency:    Optional[float]
    sessions_this_week:     int
    risk_tier:              str

class TrajectoryPoint(BaseModel):
    month:         str
    score:         float
    session_count: int