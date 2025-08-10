from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()

# Association table for many-to-many relationship between projects and annotators
project_annotators = Table(
    'project_annotators',
    Base.metadata,
    Column('project_id', String, ForeignKey('projects.id')),
    Column('annotator_id', String, ForeignKey('annotators.id'))
)

class PIIClassificationEnum(enum.Enum):
    PII = "pii"
    NON_PII = "non_pii"

class SampleStatusEnum(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    REJECTED = "rejected"

class ProjectStatusEnum(enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class UserRoleEnum(enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ANNOTATOR = "annotator"
    REVIEWER = "reviewer"

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    guidelines = Column(Text)
    status = Column(String, default=ProjectStatusEnum.ACTIVE.value)
    created_by = Column(String, ForeignKey('annotators.id'))
    quality_threshold = Column(Float, default=0.8)
    multi_annotator = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    samples = relationship("TextSample", back_populates="project")
    annotators = relationship("Annotator", secondary=project_annotators, back_populates="projects")
    created_by_user = relationship("Annotator", foreign_keys=[created_by])

class Annotator(Base):
    __tablename__ = "annotators"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRoleEnum.ANNOTATOR.value)
    is_active = Column(Boolean, default=True)
    total_annotations = Column(Integer, default=0)
    quality_score = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    projects = relationship("Project", secondary=project_annotators, back_populates="annotators")
    classifications = relationship("PIIClassification", back_populates="annotator")
    sessions = relationship("AnnotationSession", back_populates="annotator")

class TextSample(Base):
    __tablename__ = "text_samples"
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey('projects.id'), nullable=False)
    text = Column(Text, nullable=False)
    filename = Column(String)
    language = Column(String, default="english")
    status = Column(String, default=SampleStatusEnum.PENDING.value)
    quality_score = Column(Float)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="samples")
    classifications = relationship("PIIClassification", back_populates="sample")
    sessions = relationship("AnnotationSession", back_populates="sample")

class PIIClassification(Base):
    __tablename__ = "pii_classifications"
    
    id = Column(String, primary_key=True)
    sample_id = Column(String, ForeignKey('text_samples.id'), nullable=False)
    annotator_id = Column(String, ForeignKey('annotators.id'), nullable=False)
    start = Column(Integer, nullable=False)
    end = Column(Integer, nullable=False)
    text = Column(String, nullable=False)
    classification = Column(String, nullable=False)  # PIIClassificationEnum
    confidence = Column(Float, default=0.8)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    sample = relationship("TextSample", back_populates="classifications")
    annotator = relationship("Annotator", back_populates="classifications")

class AnnotationSession(Base):
    __tablename__ = "annotation_sessions"
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey('projects.id'), nullable=False)
    annotator_id = Column(String, ForeignKey('annotators.id'), nullable=False)
    sample_id = Column(String, ForeignKey('text_samples.id'), nullable=False)
    start_time = Column(DateTime, server_default=func.now())
    end_time = Column(DateTime)
    entities_annotated = Column(Integer, default=0)
    keystrokes_count = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    
    # Relationships
    project = relationship("Project")
    annotator = relationship("Annotator", back_populates="sessions")
    sample = relationship("TextSample", back_populates="sessions")

class ExportJob(Base):
    __tablename__ = "export_jobs"
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey('projects.id'), nullable=False)
    created_by = Column(String, ForeignKey('annotators.id'), nullable=False)
    format = Column(String, nullable=False)  # ExportFormat
    status = Column(String, default="pending")  # pending, processing, completed, failed
    file_path = Column(String)
    quality_threshold = Column(Float)
    include_metadata = Column(Boolean, default=True)
    error_message = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)
    
    # Relationships
    project = relationship("Project")
    created_by_user = relationship("Annotator")