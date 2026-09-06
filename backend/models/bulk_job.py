from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class BulkJob(Base):
    __tablename__ = "bulk_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum("queued", "processing", "done", "failed", name="bulk_job_status"),
        default="queued"
    )
    total_items = Column(Integer, nullable=True)
    processed = Column(Integer, default=0)
    result_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
