from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SessionCreate(BaseModel):
    risk_tier:            str
    semantic_coherence:   Optional[float] = None
    lexical_diversity:    Optional[float] = None
    idea_density:         Optional[float] = None
    speech_rate:          Optional[float] = None
    pause_frequency:      Optional[float] = None
    pause_duration:       Optional[float] = None
    pitch_mean:           Optional[float] = None
    pitch_range:          Optional[float] = None
    jitter:               Optional[float] = None
    shimmer:              Optional[float] = None
    hnr:                  Optional[float] = None
    syntactic_complexity: Optional[float] = None
    articulation_rate:    Optional[float] = None
    emotional_entropy:    Optional[float] = None
    has_anomaly:          Optional[bool]  = False
    anomaly_flags:        Optional[str]   = None

class SessionResponse(BaseModel):
    id:                   int
    risk_tier:            str
    recorded_at:          datetime
    semantic_coherence:   Optional[float] = None
    lexical_diversity:    Optional[float] = None
    idea_density:         Optional[float] = None
    speech_rate:          Optional[float] = None
    pause_frequency:      Optional[float] = None
    pause_duration:       Optional[float] = None
    pitch_mean:           Optional[float] = None
    pitch_range:          Optional[float] = None
    jitter:               Optional[float] = None
    shimmer:              Optional[float] = None
    hnr:                  Optional[float] = None
    syntactic_complexity: Optional[float] = None
    articulation_rate:    Optional[float] = None
    emotional_entropy:    Optional[float] = None
    has_anomaly:          Optional[bool]  = None
    anomaly_flags:        Optional[str]   = None

    class Config:
        from_attributes = True

class HistoryItem(BaseModel):
    date:               str
    status:             str
    risk_tier:          str
    session_id:         int
    semantic_coherence: Optional[float] = None
    speech_rate:        Optional[float] = None
    pause_frequency:    Optional[float] = None

class TodayResponse(BaseModel):
    recorded:   bool
    risk_tier:  Optional[str] = None
    session_id: Optional[int] = None