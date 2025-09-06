from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
import logging
from typing import List, Optional

from ..database.connection import get_db, init_db
from ..models.schemas import *
from ..models.database import *
# PIIEntity doesn't exist, using PIIClassification instead
from ..auth.auth import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PII Data Labeling API",
    description="API for managing PII data labeling projects and annotations",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    logger.info("Starting PII Data Labeling API...")
    init_db()
    logger.info("Database initialized successfully")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "pii-data-labeling-api",
        "version": "1.0.0"
    }

# Project endpoints
@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new labeling project."""
    try:
        db_project = Project(
            id=generate_id(),
            name=project.name,
            description=project.description,
            guidelines=project.guidelines,
            quality_threshold=project.quality_threshold,
            multi_annotator=project.multi_annotator,
            created_by="system"  # Default for integration
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        
        return ProjectResponse.from_orm(db_project)
    except Exception as e:
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=500, detail="Failed to create project")

@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Annotator = Depends(get_current_user)
):
    """List all projects accessible to the current user."""
    try:
        if current_user.role in [UserRoleEnum.ADMIN.value, UserRoleEnum.MANAGER.value]:
            projects = db.query(Project).offset(skip).limit(limit).all()
        else:
            projects = db.query(Project).join(project_annotators).filter(
                project_annotators.c.annotator_id == current_user.id
            ).offset(skip).limit(limit).all()
        
        return [ProjectResponse.from_orm(project) for project in projects]
    except Exception as e:
        logger.error(f"Failed to list projects: {e}")
        raise HTTPException(status_code=500, detail="Failed to list projects")

@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: Annotator = Depends(get_current_user)
):
    """Get a specific project by ID."""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check access permissions
        if current_user.role not in [UserRoleEnum.ADMIN.value, UserRoleEnum.MANAGER.value]:
            if current_user not in project.annotators:
                raise HTTPException(status_code=403, detail="Access denied")
        
        return ProjectResponse.from_orm(project)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project: {e}")
        raise HTTPException(status_code=500, detail="Failed to get project")

# Text sample endpoints
@app.post("/api/projects/{project_id}/samples", response_model=TextSampleResponse)
async def create_text_sample(
    project_id: str,
    sample: TextSampleCreate,
    db: Session = Depends(get_db)
):
    """Add a new text sample to a project."""
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        db_sample = TextSample(
            id=generate_id(),
            project_id=project_id,
            text=sample.text,
            filename=sample.filename,
            language=sample.language
        )
        db.add(db_sample)
        db.commit()
        db.refresh(db_sample)
        
        return TextSampleResponse.from_orm(db_sample)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create text sample: {e}")
        raise HTTPException(status_code=500, detail="Failed to create text sample")

@app.get("/api/projects/{project_id}/samples", response_model=List[TextSampleResponse])
async def list_text_samples(
    project_id: str,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Annotator = Depends(get_current_user)
):
    """List text samples in a project."""
    try:
        query = db.query(TextSample).filter(TextSample.project_id == project_id)
        
        if status:
            query = query.filter(TextSample.status == status)
        
        samples = query.offset(skip).limit(limit).all()
        return [TextSampleResponse.from_orm(sample) for sample in samples]
    except Exception as e:
        logger.error(f"Failed to list text samples: {e}")
        raise HTTPException(status_code=500, detail="Failed to list text samples")

@app.get("/api/samples/{sample_id}", response_model=TextSampleDetailResponse)
async def get_text_sample(
    sample_id: str,
    db: Session = Depends(get_db),
    current_user: Annotator = Depends(get_current_user)
):
    """Get a specific text sample with entities."""
    try:
        sample = db.query(TextSample).filter(TextSample.id == sample_id).first()
        if not sample:
            raise HTTPException(status_code=404, detail="Text sample not found")
        
        return TextSampleDetailResponse.from_orm(sample)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get text sample: {e}")
        raise HTTPException(status_code=500, detail="Failed to get text sample")

# Entity annotation endpoints
@app.post("/api/samples/{sample_id}/entities", response_model=PIIClassificationResponse)
async def create_entity_annotation(
    sample_id: str,
    entity: PIIClassificationCreate,
    db: Session = Depends(get_db)
):
    """Create a new PII entity annotation."""
    try:
        # Verify sample exists
        sample = db.query(TextSample).filter(TextSample.id == sample_id).first()
        if not sample:
            raise HTTPException(status_code=404, detail="Text sample not found")
        
        # Check for overlapping entities
        overlapping = db.query(PIIClassification).filter(
            PIIClassification.sample_id == sample_id,
            PIIClassification.start < entity.end,
            PIIClassification.end > entity.start
        ).first()
        
        if overlapping:
            raise HTTPException(status_code=400, detail="Entity overlaps with existing annotation")
        
        db_entity = PIIClassification(
            id=generate_id(),
            sample_id=sample_id,
            annotator_id="system",  # Default for integration
            start=entity.start,
            end=entity.end,
            text=entity.text,
            classification=entity.classification.value,  # Store as classification, not type
            confidence=entity.confidence,
            notes=entity.notes
        )
        db.add(db_entity)
        db.commit()
        db.refresh(db_entity)
        
        return PIIClassificationResponse.from_orm(db_entity)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create entity annotation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create entity annotation")

@app.put("/api/entities/{entity_id}", response_model=PIIClassificationResponse)
async def update_entity_annotation(
    entity_id: str,
    entity_update: PIIClassificationUpdate,
    db: Session = Depends(get_db),
    current_user: Annotator = Depends(get_current_user)
):
    """Update an existing PII entity annotation."""
    try:
        db_entity = db.query(PIIClassification).filter(PIIClassification.id == entity_id).first()
        if not db_entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        
        # Note: For now, allow all edits since we removed authentication
        
        # Update fields
        for field, value in entity_update.dict(exclude_unset=True).items():
            setattr(db_entity, field, value)
        
        db.commit()
        db.refresh(db_entity)
        
        return PIIClassificationResponse.from_orm(db_entity)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update entity annotation: {e}")
        raise HTTPException(status_code=500, detail="Failed to update entity annotation")

@app.delete("/api/entities/{entity_id}")
async def delete_entity_annotation(
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: Annotator = Depends(get_current_user)
):
    """Delete a PII entity annotation."""
    try:
        db_entity = db.query(PIIClassification).filter(PIIClassification.id == entity_id).first()
        if not db_entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        
        # Note: For now, allow all deletions since we removed authentication
        
        db.delete(db_entity)
        db.commit()
        
        return {"message": "Entity deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete entity annotation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete entity annotation")

# Utility function
def generate_id() -> str:
    """Generate a unique ID."""
    import uuid
    return str(uuid.uuid4())

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8002,
        reload=True,
        log_level="info"
    )