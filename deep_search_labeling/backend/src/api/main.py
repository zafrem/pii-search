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
from ..data_generator import PIIDataGenerator

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

# Data Generation Endpoints

@app.get("/data-generator/types")
async def get_supported_pii_types():
    """Get list of supported PII types for data generation."""
    return {
        "success": True,
        "data": {
            "supported_types": list(PIIDataGenerator.PII_TYPES.keys()),
            "supported_locales": PIIDataGenerator.LOCALES
        }
    }

@app.post("/data-generator/generate")
async def generate_pii_data(request: Dict[str, Any]):
    """
    Generate PII data using various methods.
    
    Request body can contain:
    - type: PII type to generate
    - regex: Regular expression pattern 
    - template: Template with placeholders
    - mixed_samples: Boolean for mixed text samples
    - count: Number of records (default: 10)
    - locale: Locale for generation (default: en_US)
    - format_template: Custom format template
    """
    try:
        # Parse request parameters
        pii_type = request.get('type')
        regex_pattern = request.get('regex')
        template = request.get('template')
        mixed_samples = request.get('mixed_samples', False)
        count = request.get('count', 10)
        locale = request.get('locale', 'en_US')
        format_template = request.get('format_template')
        
        # Validate parameters
        if not any([pii_type, regex_pattern, template, mixed_samples]):
            raise HTTPException(
                status_code=400, 
                detail="Must specify one of: type, regex, template, or mixed_samples"
            )
        
        if count <= 0 or count > 1000:
            raise HTTPException(
                status_code=400,
                detail="Count must be between 1 and 1000"
            )
        
        # Initialize generator
        generator = PIIDataGenerator(locale)
        
        # Generate data based on method
        if pii_type:
            if pii_type not in PIIDataGenerator.PII_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported PII type: {pii_type}"
                )
            data = generator.generate_by_type(pii_type, count, format_template)
            method = f"type_{pii_type}"
            
        elif regex_pattern:
            data = generator.generate_by_regex(regex_pattern, count)
            method = f"regex_{regex_pattern[:20]}..."
            
        elif template:
            data = generator.generate_by_template(template, count)
            method = f"template_{template[:30]}..."
            
        elif mixed_samples:
            data = generator.generate_mixed_text_samples(count)
            method = "mixed_samples"
        
        return {
            "success": True,
            "data": {
                "method": method,
                "count": len(data),
                "locale": locale,
                "records": data
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/data-generator/bulk-import")
async def bulk_import_generated_data(
    request: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate PII data and bulk import as text samples into a project.
    
    Request body:
    - project_id: Target project ID
    - generation_config: Data generation configuration
    - auto_annotate: Whether to create pre-annotations (default: True)
    """
    try:
        project_id = request.get('project_id')
        generation_config = request.get('generation_config', {})
        auto_annotate = request.get('auto_annotate', True)
        
        if not project_id:
            raise HTTPException(status_code=400, detail="project_id is required")
        
        # Check if project exists and user has access
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Generate data
        pii_type = generation_config.get('type')
        regex_pattern = generation_config.get('regex')
        template = generation_config.get('template')
        mixed_samples = generation_config.get('mixed_samples', False)
        count = generation_config.get('count', 10)
        locale = generation_config.get('locale', 'en_US')
        
        generator = PIIDataGenerator(locale)
        
        if pii_type:
            generated_data = generator.generate_by_type(pii_type, count)
        elif regex_pattern:
            generated_data = generator.generate_by_regex(regex_pattern, count)
        elif template:
            generated_data = generator.generate_by_template(template, count)
        elif mixed_samples:
            generated_data = generator.generate_mixed_text_samples(count)
        else:
            raise HTTPException(
                status_code=400,
                detail="Must specify generation method in generation_config"
            )
        
        # Import as text samples
        imported_samples = []
        
        for record in generated_data:
            # Create text sample
            if 'text' in record and 'annotations' in record:
                # Mixed sample with annotations
                text_content = record['text']
                sample_annotations = record['annotations']
            else:
                # Simple value - create descriptive text
                text_content = f"Generated {record.get('type', 'data')}: {record['value']}"
                sample_annotations = [{
                    'start': text_content.find(str(record['value'])),
                    'end': text_content.find(str(record['value'])) + len(str(record['value'])),
                    'text': str(record['value']),
                    'type': record.get('type', 'unknown'),
                    'classification': 'pii',
                    'confidence': 1.0
                }]
            
            # Create TextSample
            text_sample = TextSample(
                text=text_content,
                project_id=project_id,
                language=record.get('language', 'english'),
                filename=f"generated_{record['id'][:8]}.txt",
                status=SampleStatusEnum.PENDING
            )
            
            db.add(text_sample)
            db.flush()  # Get the ID
            
            # Create pre-annotations if requested
            if auto_annotate:
                for annotation in sample_annotations:
                    pii_classification = PIIClassification(
                        sample_id=text_sample.id,
                        annotator_id=current_user['id'],
                        start=annotation['start'],
                        end=annotation['end'],
                        text=annotation['text'],
                        classification=PIIClassificationEnum.PII,
                        confidence=annotation.get('confidence', 1.0),
                        notes=f"Auto-generated from {record.get('type', 'unknown')} pattern"
                    )
                    db.add(pii_classification)
            
            imported_samples.append({
                'sample_id': text_sample.id,
                'text': text_content,
                'annotations_count': len(sample_annotations)
            })
        
        db.commit()
        
        # Update project sample counts
        project.total_samples = db.query(TextSample).filter(
            TextSample.project_id == project_id
        ).count()
        db.commit()
        
        return {
            "success": True,
            "data": {
                "project_id": project_id,
                "imported_count": len(imported_samples),
                "method": "bulk_import",
                "auto_annotate": auto_annotate,
                "samples": imported_samples
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk import failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/data-generator/export")
async def export_generated_data(request: Dict[str, Any]):
    """
    Generate and export PII data in various formats.
    
    Request body:
    - generation_config: Data generation configuration
    - export_format: Export format (json, csv, labeling)
    - filename: Optional custom filename
    """
    try:
        generation_config = request.get('generation_config', {})
        export_format = request.get('export_format', 'json')
        filename = request.get('filename')
        
        # Generate data
        pii_type = generation_config.get('type')
        regex_pattern = generation_config.get('regex')
        template = generation_config.get('template')
        mixed_samples = generation_config.get('mixed_samples', False)
        count = generation_config.get('count', 10)
        locale = generation_config.get('locale', 'en_US')
        
        generator = PIIDataGenerator(locale)
        
        if pii_type:
            data = generator.generate_by_type(pii_type, count)
            base_filename = f"generated_{pii_type}"
        elif regex_pattern:
            data = generator.generate_by_regex(regex_pattern, count)
            base_filename = "generated_regex"
        elif template:
            data = generator.generate_by_template(template, count)
            base_filename = "generated_template"
        elif mixed_samples:
            data = generator.generate_mixed_text_samples(count)
            base_filename = "generated_mixed"
        else:
            raise HTTPException(
                status_code=400,
                detail="Must specify generation method in generation_config"
            )
        
        # Generate filename if not provided
        if not filename:
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            if export_format == 'json':
                filename = f"{base_filename}_{timestamp}.json"
            elif export_format == 'csv':
                filename = f"{base_filename}_{timestamp}.csv"
            elif export_format == 'labeling':
                filename = f"{base_filename}_labeling_{timestamp}.json"
        
        # Export data
        if export_format == 'json':
            filepath = generator.export_to_json(data, f"exports/{filename}")
        elif export_format == 'csv':
            filepath = generator.export_to_csv(data, f"exports/{filename}")
        elif export_format == 'labeling':
            project_name = generation_config.get('project_name', 'Generated PII Data')
            filepath = generator.export_for_labeling_system(
                data, f"exports/{filename}", project_name
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported export format. Use: json, csv, or labeling"
            )
        
        return {
            "success": True,
            "data": {
                "filepath": filepath,
                "format": export_format,
                "record_count": len(data),
                "download_url": f"/downloads/{filename}"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8002,
        reload=True,
        log_level="info"
    )