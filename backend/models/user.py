from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(Enum("user", "analyst", "admin", name="user_role"), default="user")
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # New fields for enhanced security
    avatar_url = Column(String(512), nullable=True) # Profile avatar URL
    last_login = Column(DateTime, nullable=True)    # Last login timestamp

    # Relationships
    face = relationship("UserFace", back_populates="user", uselist=False, cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")

    @property
    def face_data(self):
        return self.face.face_data if self.face else None

    @face_data.setter
    def face_data(self, value):
        from models.user_face import UserFace
        if value is None:
            self.face = None
        else:
            if self.face:
                self.face.face_data = value
            else:
                self.face = UserFace(face_data=value)
