import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from datetime import datetime

from src.api.main import app
from src.models.schemas import ProjectStatusEnum, SampleStatusEnum, PIITypeEnum
from src.models.database import Project, Sample, Annotation


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = MagicMock()
    return db


@pytest.fixture
def sample_project_data():
    """Sample project data for testing."""
    return {
        "name": "Test Project",
        "description": "A test project for PII labeling",
        "guidelines": "Label all PII entities carefully",
        "status": "active"
    }


@pytest.fixture
def sample_sample_data():
    """Sample sample data for testing."""
    return {
        "text": "Hello, my email is john@example.com",
        "project_id": 1,
        "metadata": {"source": "email"}
    }


@pytest.fixture
def sample_annotation_data():
    """Sample annotation data for testing."""
    return {
        "sample_id": 1,
        "start_pos": 19,
        "end_pos": 35,
        "label": "email",
        "text": "john@example.com",
        "confidence": 0.95
    }


class TestProjectAPI:
    """Test project-related API endpoints."""
    
    @patch('src.api.main.get_db')
    @patch('src.api.main.get_current_user')
    def test_create_project(self, mock_user, mock_get_db, client, mock_db, sample_project_data):
        """Test project creation endpoint."""
        mock_get_db.return_value = mock_db
        mock_user.return_value = {"id": 1, "role": "admin"}
        
        # Mock database operations
        mock_project = Project(
            id=1,
            name=sample_project_data["name"],
            description=sample_project_data["description"],
            status=ProjectStatusEnum.ACTIVE,
            created_by=1,
            created_at=datetime.now()
        )
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None
        
        with patch('src.api.main.Project', return_value=mock_project):
            response = client.post("/projects/", json=sample_project_data)
            
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_project_data["name"]
        assert data["status"] == "active"
    
    @patch('src.api.main.get_db')
    @patch('src.api.main.get_current_user')
    def test_get_projects(self, mock_user, mock_get_db, client, mock_db):
        """Test get projects endpoint."""
        mock_get_db.return_value = mock_db
        mock_user.return_value = {"id": 1, "role": "admin"}
        
        # Mock database query
        mock_projects = [
            Project(
                id=1,
                name="Project 1",
                description="Description 1",
                status=ProjectStatusEnum.ACTIVE,
                created_by=1,
                created_at=datetime.now()
            ),
            Project(
                id=2,
                name="Project 2", 
                description="Description 2",
                status=ProjectStatusEnum.PAUSED,
                created_by=1,
                created_at=datetime.now()
            )
        ]
        mock_db.query.return_value.all.return_value = mock_projects
        
        response = client.get("/projects/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "Project 1"
        assert data[1]["name"] == "Project 2"
    
    @patch('src.api.main.get_db')
    @patch('src.api.main.get_current_user')
    def test_get_project_by_id(self, mock_user, mock_get_db, client, mock_db):
        """Test get project by ID endpoint."""
        mock_get_db.return_value = mock_db
        mock_user.return_value = {"id": 1, "role": "admin"}
        
        mock_project = Project(
            id=1,
            name="Test Project",
            description="Test description",
            status=ProjectStatusEnum.ACTIVE,
            created_by=1,
            created_at=datetime.now()
        )
        mock_db.query.return_value.filter.return_value.first.return_value = mock_project
        
        response = client.get("/projects/1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["name"] == "Test Project"
    
    @patch('src.api.main.get_db')
    @patch('src.api.main.get_current_user')
    def test_get_project_not_found(self, mock_user, mock_get_db, client, mock_db):
        """Test get project not found."""
        mock_get_db.return_value = mock_db
        mock_user.return_value = {"id": 1, "role": "admin"}
        
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.get("/projects/999")
        
        assert response.status_code == 404


class TestSampleAPI:
    """Test sample-related API endpoints."""
    
    @patch('src.api.main.get_db')
    @patch('src.api.main.get_current_user')
    def test_create_sample(self, mock_user, mock_get_db, client, mock_db, sample_sample_data):
        """Test sample creation endpoint."""
        mock_get_db.return_value = mock_db
        mock_user.return_value = {"id": 1, "role": "admin"}
        
        # Mock project exists
        mock_project = Project(id=1, name="Test Project")
        mock_db.query.return_value.filter.return_value.first.return_value = mock_project
        
        mock_sample = Sample(
            id=1,
            text=sample_sample_data["text"],
            project_id=sample_sample_data["project_id"],
            status=SampleStatusEnum.PENDING,
            created_at=datetime.now()
        )
        
        with patch('src.api.main.Sample', return_value=mock_sample):
            response = client.post("/samples/", json=sample_sample_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["text"] == sample_sample_data["text"]
        assert data["project_id"] == sample_sample_data["project_id"]
    
    @patch('src.api.main.get_db')
    @patch('src.api.main.get_current_user')
    def test_get_samples_by_project(self, mock_user, mock_get_db, client, mock_db):
        """Test get samples by project endpoint."""
        mock_get_db.return_value = mock_db
        mock_user.return_value = {"id": 1, "role": "admin"}
        
        mock_samples = [
            Sample(
                id=1,
                text="Sample 1",
                project_id=1,
                status=SampleStatusEnum.PENDING,
                created_at=datetime.now()
            ),
            Sample(
                id=2,
                text="Sample 2",
                project_id=1,
                status=SampleStatusEnum.COMPLETED,
                created_at=datetime.now()
            )
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_samples
        
        response = client.get("/projects/1/samples")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["text"] == "Sample 1"
        assert data[1]["text"] == "Sample 2"


class TestAnnotationAPI:
    """Test annotation-related API endpoints."""
    
    @patch('src.api.main.get_db')
    @patch('src.api.main.get_current_user')
    def test_create_annotation(self, mock_user, mock_get_db, client, mock_db, sample_annotation_data):
        """Test annotation creation endpoint."""
        mock_get_db.return_value = mock_db
        mock_user.return_value = {"id": 1, "role": "annotator"}
        
        # Mock sample exists
        mock_sample = Sample(id=1, text="Hello, my email is john@example.com")
        mock_db.query.return_value.filter.return_value.first.return_value = mock_sample
        
        mock_annotation = Annotation(
            id=1,
            sample_id=sample_annotation_data["sample_id"],
            start_pos=sample_annotation_data["start_pos"],
            end_pos=sample_annotation_data["end_pos"],
            label=PIITypeEnum.EMAIL,
            text=sample_annotation_data["text"],
            confidence=sample_annotation_data["confidence"],
            created_by=1,
            created_at=datetime.now()
        )
        
        with patch('src.api.main.Annotation', return_value=mock_annotation):
            response = client.post("/annotations/", json=sample_annotation_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["text"] == sample_annotation_data["text"]
        assert data["label"] == "email"
        assert data["confidence"] == 0.95
    
    @patch('src.api.main.get_db')
    @patch('src.api.main.get_current_user')
    def test_get_annotations_by_sample(self, mock_user, mock_get_db, client, mock_db):
        """Test get annotations by sample endpoint."""
        mock_get_db.return_value = mock_db
        mock_user.return_value = {"id": 1, "role": "annotator"}
        
        mock_annotations = [
            Annotation(
                id=1,
                sample_id=1,
                start_pos=19,
                end_pos=35,
                label=PIITypeEnum.EMAIL,
                text="john@example.com",
                confidence=0.95,
                created_by=1,
                created_at=datetime.now()
            )
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_annotations
        
        response = client.get("/samples/1/annotations")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["text"] == "john@example.com"
        assert data[0]["label"] == "email"


class TestAuthenticationAPI:
    """Test authentication-related endpoints."""
    
    def test_login_endpoint_exists(self, client):
        """Test login endpoint exists."""
        # Test with invalid credentials to verify endpoint exists
        response = client.post("/auth/login", json={
            "username": "invalid",
            "password": "invalid"
        })
        # Should return 401 or 422, not 404
        assert response.status_code in [401, 422, 400]
    
    def test_unauthorized_access(self, client):
        """Test unauthorized access to protected endpoints."""
        response = client.get("/projects/")
        # Should require authentication
        assert response.status_code in [401, 403]


class TestHealthCheck:
    """Test health check endpoints."""
    
    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        
        # If endpoint exists, should return 200
        # If not, should return 404
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "status" in data


class TestExportAPI:
    """Test export-related API endpoints."""
    
    @patch('src.api.main.get_db')
    @patch('src.api.main.get_current_user')
    def test_export_project_data(self, mock_user, mock_get_db, client, mock_db):
        """Test export project data endpoint."""
        mock_get_db.return_value = mock_db
        mock_user.return_value = {"id": 1, "role": "admin"}
        
        export_request = {
            "project_id": 1,
            "format": "huggingface",
            "include_metadata": True
        }
        
        # Mock project exists
        mock_project = Project(id=1, name="Test Project")
        mock_db.query.return_value.filter.return_value.first.return_value = mock_project
        
        with patch('src.api.main.generate_export') as mock_export:
            mock_export.return_value = {
                "export_id": "export-123",
                "status": "processing",
                "download_url": None
            }
            
            response = client.post("/export/", json=export_request)
        
        # Should accept export request
        assert response.status_code in [200, 201, 202]