from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Session(Base):
    __tablename__ = "sessions"

    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id"), nullable=False)
    risk_tier            = Column(String, nullable=False)
    recorded_at          = Column(DateTime, default=datetime.utcnow)

    # 14 biomarkers
    semantic_coherence   = Column(Float, nullable=True)
    lexical_diversity    = Column(Float, nullable=True)
    idea_density         = Column(Float, nullable=True)
    speech_rate          = Column(Float, nullable=True)
    pause_frequency      = Column(Float, nullable=True)
    pause_duration       = Column(Float, nullable=True)
    pitch_mean           = Column(Float, nullable=True)
    pitch_range          = Column(Float, nullable=True)
    jitter               = Column(Float, nullable=True)
    shimmer              = Column(Float, nullable=True)
    hnr                  = Column(Float, nullable=True)
    syntactic_complexity = Column(Float, nullable=True)
    articulation_rate    = Column(Float, nullable=True)
    emotional_entropy    = Column(Float, nullable=True)

    has_anomaly          = Column(Boolean, default=False)
    anomaly_flags        = Column(String, nullable=True)

    user = relationship("User", back_populates="sessions")