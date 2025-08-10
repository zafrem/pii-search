import pytest
from datetime import datetime
from pydantic import ValidationError

from src.models.schemas import (
    PIITypeEnum, SampleStatusEnum, ProjectStatusEnum, 
    UserRoleEnum, ExportFormatEnum,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    SampleCreate, SampleUpdate, SampleResponse,
    AnnotationCreate, AnnotationUpdate, AnnotationResponse,
    UserCreate, UserUpdate, UserResponse,
    ExportRequest, ExportResponse
)


class TestEnums:
    """Test enum values and validity."""
    
    def test_pii_type_enum(self):
        """Test PII type enumeration."""
        assert PIITypeEnum.EMAIL == "email"
        assert PIITypeEnum.NAME == "name"
        assert PIITypeEnum.PHONE == "phone"
        assert PIITypeEnum.CUSTOM == "custom"
    
    def test_sample_status_enum(self):
        """Test sample status enumeration."""
        assert SampleStatusEnum.PENDING == "pending"
        assert SampleStatusEnum.IN_PROGRESS == "in_progress"
        assert SampleStatusEnum.COMPLETED == "completed"
        assert SampleStatusEnum.REVIEWED == "reviewed"
        assert SampleStatusEnum.REJECTED == "rejected"
    
    def test_project_status_enum(self):
        """Test project status enumeration."""
        assert ProjectStatusEnum.ACTIVE == "active"
        assert ProjectStatusEnum.PAUSED == "paused"
        assert ProjectStatusEnum.COMPLETED == "completed"
        assert ProjectStatusEnum.ARCHIVED == "archived"
    
    def test_user_role_enum(self):
        """Test user role enumeration."""
        assert UserRoleEnum.ADMIN == "admin"
        assert UserRoleEnum.MANAGER == "manager"
        assert UserRoleEnum.ANNOTATOR == "annotator"
        assert UserRoleEnum.REVIEWER == "reviewer"
    
    def test_export_format_enum(self):
        """Test export format enumeration."""
        assert ExportFormatEnum.HUGGINGFACE == "huggingface"
        assert ExportFormatEnum.SPACY == "spacy"
        assert ExportFormatEnum.CONLL == "conll"


class TestProjectSchemas:
    """Test project-related schemas."""
    
    def test_project_create_valid(self):
        """Test valid project creation."""
        project = ProjectCreate(
            name="Test Project",
            description="A test project for PII labeling",
            guidelines="Label all PII entities carefully"
        )
        assert project.name == "Test Project"
        assert project.description == "A test project for PII labeling"
        assert project.guidelines == "Label all PII entities carefully"
        assert project.status == ProjectStatusEnum.ACTIVE  # Default value
    
    def test_project_create_with_status(self):
        """Test project creation with custom status."""
        project = ProjectCreate(
            name="Test Project",
            description="Test description",
            status=ProjectStatusEnum.PAUSED
        )
        assert project.status == ProjectStatusEnum.PAUSED
    
    def test_project_create_validation(self):
        """Test project creation validation."""
        with pytest.raises(ValidationError):
            ProjectCreate(
                name="",  # Empty name should fail
                description="Test description"
            )
    
    def test_project_update(self):
        """Test project update schema."""
        update = ProjectUpdate(
            name="Updated Project Name",
            status=ProjectStatusEnum.COMPLETED
        )
        assert update.name == "Updated Project Name"
        assert update.status == ProjectStatusEnum.COMPLETED
    
    def test_project_response(self):
        """Test project response schema."""
        response = ProjectResponse(
            id=1,
            name="Test Project",
            description="Test description",
            status=ProjectStatusEnum.ACTIVE,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            created_by=1,
            total_samples=100,
            completed_samples=50
        )
        assert response.id == 1
        assert response.total_samples == 100
        assert response.completed_samples == 50


class TestSampleSchemas:
    """Test sample-related schemas."""
    
    def test_sample_create_valid(self):
        """Test valid sample creation."""
        sample = SampleCreate(
            text="Hello, my email is john@example.com",
            project_id=1
        )
        assert sample.text == "Hello, my email is john@example.com"
        assert sample.project_id == 1
        assert sample.status == SampleStatusEnum.PENDING  # Default value
    
    def test_sample_create_with_metadata(self):
        """Test sample creation with metadata."""
        sample = SampleCreate(
            text="Test text",
            project_id=1,
            metadata={"source": "email", "priority": "high"}
        )
        assert sample.metadata["source"] == "email"
        assert sample.metadata["priority"] == "high"
    
    def test_sample_update(self):
        """Test sample update schema."""
        update = SampleUpdate(
            status=SampleStatusEnum.COMPLETED,
            assigned_to=2
        )
        assert update.status == SampleStatusEnum.COMPLETED
        assert update.assigned_to == 2
    
    def test_sample_response(self):
        """Test sample response schema."""
        response = SampleResponse(
            id=1,
            text="Test text",
            project_id=1,
            status=SampleStatusEnum.PENDING,
            created_at=datetime.now(),
            annotations_count=0
        )
        assert response.id == 1
        assert response.annotations_count == 0


class TestAnnotationSchemas:
    """Test annotation-related schemas."""
    
    def test_annotation_create_valid(self):
        """Test valid annotation creation."""
        annotation = AnnotationCreate(
            sample_id=1,
            start_pos=10,
            end_pos=25,
            label=PIITypeEnum.EMAIL,
            text="john@example.com"
        )
        assert annotation.sample_id == 1
        assert annotation.start_pos == 10
        assert annotation.end_pos == 25
        assert annotation.label == PIITypeEnum.EMAIL
        assert annotation.text == "john@example.com"
    
    def test_annotation_create_with_confidence(self):
        """Test annotation creation with confidence."""
        annotation = AnnotationCreate(
            sample_id=1,
            start_pos=0,
            end_pos=8,
            label=PIITypeEnum.NAME,
            text="John Doe",
            confidence=0.95
        )
        assert annotation.confidence == 0.95
    
    def test_annotation_position_validation(self):
        """Test annotation position validation."""
        with pytest.raises(ValidationError):
            AnnotationCreate(
                sample_id=1,
                start_pos=25,  # Start after end
                end_pos=10,
                label=PIITypeEnum.EMAIL,
                text="test"
            )
    
    def test_annotation_update(self):
        """Test annotation update schema."""
        update = AnnotationUpdate(
            label=PIITypeEnum.NAME,
            confidence=0.85,
            notes="Updated annotation"
        )
        assert update.label == PIITypeEnum.NAME
        assert update.confidence == 0.85
        assert update.notes == "Updated annotation"
    
    def test_annotation_response(self):
        """Test annotation response schema."""
        response = AnnotationResponse(
            id=1,
            sample_id=1,
            start_pos=10,
            end_pos=25,
            label=PIITypeEnum.EMAIL,
            text="john@example.com",
            created_at=datetime.now(),
            created_by=1
        )
        assert response.id == 1
        assert response.created_by == 1


class TestUserSchemas:
    """Test user-related schemas."""
    
    def test_user_create_valid(self):
        """Test valid user creation."""
        user = UserCreate(
            username="testuser",
            email="test@example.com",
            password="securepassword",
            role=UserRoleEnum.ANNOTATOR
        )
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == UserRoleEnum.ANNOTATOR
    
    def test_user_create_validation(self):
        """Test user creation validation."""
        with pytest.raises(ValidationError):
            UserCreate(
                username="",  # Empty username
                email="invalid-email",  # Invalid email
                password="123",  # Too short password
                role=UserRoleEnum.ANNOTATOR
            )
    
    def test_user_update(self):
        """Test user update schema."""
        update = UserUpdate(
            email="newemail@example.com",
            role=UserRoleEnum.REVIEWER,
            is_active=False
        )
        assert update.email == "newemail@example.com"
        assert update.role == UserRoleEnum.REVIEWER
        assert update.is_active is False
    
    def test_user_response(self):
        """Test user response schema."""
        response = UserResponse(
            id=1,
            username="testuser",
            email="test@example.com",
            role=UserRoleEnum.ANNOTATOR,
            is_active=True,
            created_at=datetime.now()
        )
        assert response.id == 1
        assert response.is_active is True


class TestExportSchemas:
    """Test export-related schemas."""
    
    def test_export_request_valid(self):
        """Test valid export request."""
        request = ExportRequest(
            project_id=1,
            format=ExportFormatEnum.HUGGINGFACE,
            include_metadata=True
        )
        assert request.project_id == 1
        assert request.format == ExportFormatEnum.HUGGINGFACE
        assert request.include_metadata is True
    
    def test_export_request_with_filters(self):
        """Test export request with filters."""
        request = ExportRequest(
            project_id=1,
            format=ExportFormatEnum.SPACY,
            status_filter=[SampleStatusEnum.COMPLETED, SampleStatusEnum.REVIEWED],
            date_from=datetime(2024, 1, 1),
            date_to=datetime(2024, 12, 31)
        )
        assert len(request.status_filter) == 2
        assert request.date_from.year == 2024
        assert request.date_to.year == 2024
    
    def test_export_response(self):
        """Test export response schema."""
        response = ExportResponse(
            export_id="export-123",
            status="completed",
            download_url="https://example.com/download/export-123.zip",
            total_samples=100,
            exported_samples=100
        )
        assert response.export_id == "export-123"
        assert response.status == "completed"
        assert response.total_samples == 100
        assert response.exported_samples == 100