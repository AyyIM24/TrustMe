from sqlalchemy import Column, Integer, String, Float, Text, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    input_text = Column(Text, nullable=False)
    title = Column(String(500), nullable=True)
    source_url = Column(String(1000), nullable=True)
    prediction = Column(Enum("fake", "real", name="prediction_type"), nullable=False)
    confidence = Column(Float, nullable=False)
    credibility_score = Column(Integer, nullable=True)
    model_version = Column(String(20), default="v1")
    word_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="analyses")
    feedbacks = relationship("Feedback", back_populates="analysis")
