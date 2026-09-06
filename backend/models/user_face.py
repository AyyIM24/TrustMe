from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class UserFace(Base):
    __tablename__ = "user_faces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    face_data = Column(Text, nullable=False)

    user = relationship("User", back_populates="face")
