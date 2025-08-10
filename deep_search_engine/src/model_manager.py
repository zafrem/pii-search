"""
Model Management System for Deep Search Engine

Handles model deployment, backup, and rollback operations.
"""

import os
import shutil
import json
import pickle
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages ML model versions, deployment, and rollback operations."""
    
    def __init__(self, models_dir: str = "models"):
        self.models_dir = Path(models_dir)
        self.active_model_path = self.models_dir / "active"
        self.backup_dir = self.models_dir / "backups"
        self.versions_dir = self.models_dir / "versions"
        
        # Create necessary directories
        self.models_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        self.versions_dir.mkdir(exist_ok=True)
        
        # Active model info file
        self.active_info_file = self.models_dir / "active_model.json"
    
    def get_active_model_info(self) -> Dict[str, Any]:
        """Get information about the currently active model."""
        if not self.active_info_file.exists():
            return {
                "version": "1.0.0",
                "name": "Default Simple Classifier",
                "type": "simple",
                "deployed_at": datetime.now().isoformat(),
                "accuracy": 0.75,
                "sample_count": 100
            }
        
        try:
            with open(self.active_info_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to read active model info: {e}")
            return {}
    
    def set_active_model_info(self, model_info: Dict[str, Any]) -> None:
        """Set information about the currently active model."""
        try:
            with open(self.active_info_file, 'w') as f:
                json.dump(model_info, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to write active model info: {e}")
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of all available trained models."""
        models = []
        active_info = self.get_active_model_info()
        active_version = active_info.get("version", "1.0.0")
        
        # Add current active model
        models.append({
            "id": f"model_{active_version}",
            "version": active_version,
            "name": active_info.get("name", "Active Model"),
            "accuracy": active_info.get("accuracy", 0.75),
            "trainedDate": active_info.get("deployed_at", datetime.now().isoformat()),
            "sampleCount": active_info.get("sample_count", 100),
            "isActive": True,
            "size": self._calculate_model_size(self.active_model_path),
            "type": active_info.get("type", "simple")
        })
        
        # Add version models
        if self.versions_dir.exists():
            for version_dir in self.versions_dir.iterdir():
                if version_dir.is_dir():
                    version_info_file = version_dir / "model_info.json"
                    if version_info_file.exists():
                        try:
                            with open(version_info_file, 'r') as f:
                                version_info = json.load(f)
                            
                            models.append({
                                "id": f"model_{version_info['version']}",
                                "version": version_info["version"],
                                "name": version_info.get("name", f"Model v{version_info['version']}"),
                                "accuracy": version_info.get("accuracy", 0.0),
                                "trainedDate": version_info.get("trained_at", datetime.now().isoformat()),
                                "sampleCount": version_info.get("sample_count", 0),
                                "isActive": version_info["version"] == active_version,
                                "size": self._calculate_model_size(version_dir),
                                "type": version_info.get("type", "simple")
                            })
                        except Exception as e:
                            logger.error(f"Failed to read version info for {version_dir}: {e}")
        
        return models
    
    def create_backup(self) -> str:
        """Create a backup of the current active model."""
        backup_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        backup_path = self.backup_dir / backup_id
        
        try:
            # Create backup directory
            backup_path.mkdir(exist_ok=True)
            
            # Copy active model files
            if self.active_model_path.exists():
                shutil.copytree(self.active_model_path, backup_path / "model", dirs_exist_ok=True)
            
            # Copy active model info
            if self.active_info_file.exists():
                shutil.copy2(self.active_info_file, backup_path / "model_info.json")
            
            # Create backup metadata
            backup_metadata = {
                "backup_id": backup_id,
                "created_at": datetime.now().isoformat(),
                "original_version": self.get_active_model_info().get("version", "unknown")
            }
            
            with open(backup_path / "backup_metadata.json", 'w') as f:
                json.dump(backup_metadata, f, indent=2)
            
            logger.info(f"Created backup: {backup_id}")
            return backup_id
            
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            raise
    
    def deploy_model(self, model_version: str, replace_current: bool = True) -> None:
        """Deploy a specific model version as the active model."""
        version_path = self.versions_dir / model_version
        
        if not version_path.exists():
            raise ValueError(f"Model version {model_version} not found")
        
        try:
            # Create backup if replacing current model
            if replace_current and self.active_model_path.exists():
                backup_id = self.create_backup()
                logger.info(f"Created backup {backup_id} before deployment")
            
            # Remove current active model
            if self.active_model_path.exists():
                shutil.rmtree(self.active_model_path)
            
            # Copy new model to active location
            shutil.copytree(version_path, self.active_model_path)
            
            # Update active model info
            version_info_file = version_path / "model_info.json"
            if version_info_file.exists():
                with open(version_info_file, 'r') as f:
                    version_info = json.load(f)
                
                active_info = {
                    **version_info,
                    "deployed_at": datetime.now().isoformat()
                }
                self.set_active_model_info(active_info)
            
            logger.info(f"Successfully deployed model version {model_version}")
            
        except Exception as e:
            logger.error(f"Failed to deploy model {model_version}: {e}")
            raise
    
    def rollback_model(self, backup_id: str) -> None:
        """Rollback to a previous model backup."""
        backup_path = self.backup_dir / backup_id
        
        if not backup_path.exists():
            raise ValueError(f"Backup {backup_id} not found")
        
        try:
            # Remove current active model
            if self.active_model_path.exists():
                shutil.rmtree(self.active_model_path)
            
            # Restore from backup
            backup_model_path = backup_path / "model"
            if backup_model_path.exists():
                shutil.copytree(backup_model_path, self.active_model_path)
            
            # Restore model info
            backup_info_file = backup_path / "model_info.json"
            if backup_info_file.exists():
                shutil.copy2(backup_info_file, self.active_info_file)
            
            logger.info(f"Successfully rolled back to backup {backup_id}")
            
        except Exception as e:
            logger.error(f"Failed to rollback to backup {backup_id}: {e}")
            raise
    
    def save_trained_model(self, model_data: Any, model_info: Dict[str, Any]) -> str:
        """Save a newly trained model as a version."""
        version = model_info.get("version", f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        version_path = self.versions_dir / version
        
        try:
            # Create version directory
            version_path.mkdir(exist_ok=True)
            
            # Save model data
            if hasattr(model_data, 'save'):
                # For sklearn models or similar
                model_file = version_path / "model.pkl"
                with open(model_file, 'wb') as f:
                    pickle.dump(model_data, f)
            else:
                # For other model types, implement specific saving logic
                model_file = version_path / "model.pkl"
                with open(model_file, 'wb') as f:
                    pickle.dump(model_data, f)
            
            # Save model info
            model_info["saved_at"] = datetime.now().isoformat()
            model_info["version"] = version
            
            with open(version_path / "model_info.json", 'w') as f:
                json.dump(model_info, f, indent=2)
            
            logger.info(f"Saved trained model as version {version}")
            return version
            
        except Exception as e:
            logger.error(f"Failed to save trained model: {e}")
            raise
    
    def _calculate_model_size(self, model_path: Path) -> str:
        """Calculate the size of a model directory."""
        if not model_path.exists():
            return "0 MB"
        
        try:
            total_size = 0
            for file_path in model_path.rglob('*'):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
            
            # Convert to human readable format
            if total_size < 1024 * 1024:
                return f"{total_size / 1024:.1f} KB"
            elif total_size < 1024 * 1024 * 1024:
                return f"{total_size / (1024 * 1024):.1f} MB"
            else:
                return f"{total_size / (1024 * 1024 * 1024):.1f} GB"
                
        except Exception as e:
            logger.error(f"Failed to calculate model size: {e}")
            return "Unknown"
    
    def cleanup_old_backups(self, keep_count: int = 10) -> None:
        """Clean up old backups, keeping only the most recent ones."""
        try:
            backups = []
            for backup_dir in self.backup_dir.iterdir():
                if backup_dir.is_dir() and backup_dir.name.startswith("backup_"):
                    backups.append(backup_dir)
            
            # Sort by creation time (newest first)
            backups.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # Remove old backups
            for backup_to_remove in backups[keep_count:]:
                shutil.rmtree(backup_to_remove)
                logger.info(f"Removed old backup: {backup_to_remove.name}")
                
        except Exception as e:
            logger.error(f"Failed to cleanup old backups: {e}")