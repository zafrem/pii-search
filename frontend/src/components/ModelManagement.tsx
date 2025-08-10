import React, { useState, useEffect } from 'react';
import { labelingService } from '../services/labelingService';

interface ModelInfo {
  id: string;
  version: string;
  name: string;
  accuracy: number;
  trainedDate: string;
  sampleCount: number;
  isActive: boolean;
  size: string;
  type: 'simple' | 'advanced';
}

interface ModelManagementProps {
  onModelDeployed?: (modelVersion: string) => void;
}

const ModelManagement: React.FC<ModelManagementProps> = ({ onModelDeployed }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deployingModel, setDeployingModel] = useState<string | null>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [showConfirmDeploy, setShowConfirmDeploy] = useState<string | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<Array<{
    modelVersion: string;
    deployedAt: string;
    backupId?: string;
  }>>([]);

  // Load available models
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const modelData = await labelingService.getAvailableModels();
      setModels(modelData);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployModel = async (modelVersion: string) => {
    setDeployingModel(modelVersion);
    setShowConfirmDeploy(null);

    try {
      // First, backup the current model
      setBackupInProgress(true);
      const backupId = await labelingService.backupCurrentModel();
      setBackupInProgress(false);

      // Deploy the new model
      await labelingService.deployTrainedModel(modelVersion);

      // Update deployment history
      setDeploymentHistory(prev => [{
        modelVersion,
        deployedAt: new Date().toISOString(),
        backupId
      }, ...prev.slice(0, 4)]); // Keep last 5 entries

      // Update model states
      setModels(prev => prev.map(model => ({
        ...model,
        isActive: model.version === modelVersion
      })));

      // Notify parent component
      onModelDeployed?.(modelVersion);

      alert(`Model ${modelVersion} has been successfully deployed as the active engine!`);

    } catch (error) {
      console.error('Failed to deploy model:', error);
      alert('Failed to deploy model. Please try again.');
    } finally {
      setDeployingModel(null);
      setBackupInProgress(false);
    }
  };

  const handleRollback = async (backupId: string) => {
    try {
      setIsLoading(true);
      await labelingService.rollbackModel(backupId);
      await loadModels(); // Refresh model list
      alert('Model rollback completed successfully!');
    } catch (error) {
      console.error('Failed to rollback model:', error);
      alert('Failed to rollback model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getModelTypeColor = (type: string) => {
    return type === 'advanced' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">🔄</span>
          Model Management & Deployment
        </h3>
        <button
          onClick={loadModels}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Backup Status */}
      {backupInProgress && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full mr-3"></div>
            <span className="text-yellow-800 text-sm">Creating backup of current model...</span>
          </div>
        </div>
      )}

      {/* Available Models */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-800">Available Models</h4>
        
        {models.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <p>No trained models available yet.</p>
            <p className="text-sm">Complete some labeling projects to train new models.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                className={`p-4 border rounded-lg transition-colors ${
                  model.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{model.name}</span>
                        <span className="text-sm text-gray-500">v{model.version}</span>
                        {model.isActive && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Active Engine
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getModelTypeColor(model.type)}`}>
                        {model.type.charAt(0).toUpperCase() + model.type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Accuracy:</span>
                        <span className={`ml-1 font-medium ${getAccuracyColor(model.accuracy)}`}>
                          {(model.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Samples:</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {model.sampleCount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="ml-1 font-medium text-gray-700">{model.size}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Trained:</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {formatDate(model.trainedDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!model.isActive && (
                      <button
                        onClick={() => setShowConfirmDeploy(model.version)}
                        disabled={deployingModel !== null}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deployingModel === model.version ? 'Deploying...' : 'Deploy'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deployment History */}
      {deploymentHistory.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 mb-3">Deployment History</h4>
          <div className="space-y-2">
            {deploymentHistory.map((deployment, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="text-sm">
                  <span className="font-medium">v{deployment.modelVersion}</span>
                  <span className="text-gray-500 ml-2">
                    deployed {formatDate(deployment.deployedAt)}
                  </span>
                </div>
                {deployment.backupId && (
                  <button
                    onClick={() => handleRollback(deployment.backupId!)}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Rollback
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDeploy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Model Deployment</h3>
            <div className="text-sm text-gray-600 mb-6">
              <p className="mb-2">
                Are you sure you want to deploy model <strong>v{showConfirmDeploy}</strong> as the active engine?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-yellow-800">
                  ⚠️ This will:
                </p>
                <ul className="list-disc list-inside text-yellow-700 text-xs mt-1 space-y-1">
                  <li>Create a backup of the current model</li>
                  <li>Replace the active engine with the new model</li>
                  <li>All future Deep Search operations will use the new model</li>
                  <li>You can rollback if needed</li>
                </ul>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDeploy(null)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeployModel(showConfirmDeploy)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Deploy Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelManagement;