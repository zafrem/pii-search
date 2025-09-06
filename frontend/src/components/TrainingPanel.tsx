import React, { useState, useEffect } from 'react';
import { labelingService } from '../services/labelingService';
import ModelManagement from './ModelManagement';

interface TrainingStatus {
  isTraining: boolean;
  progress: number;
  modelVersion: string;
  lastTrainingDate: Date | null;
  totalSamples: number;
  accuracy: number | null;
  message: string;
}

interface TrainingPanelProps {
  onTrainingComplete?: () => void;
  onModelDeployed?: (modelVersion: string) => void;
}

const TrainingPanel: React.FC<TrainingPanelProps> = ({ onTrainingComplete, onModelDeployed }) => {
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
    isTraining: false,
    progress: 0,
    modelVersion: '1.0.0',
    lastTrainingDate: null,
    totalSamples: 0,
    accuracy: null,
    message: 'Ready for training'
  });
  const [useSimpleEngine, setUseSimpleEngine] = useState(true);
  const [isUpdatingEngine, setIsUpdatingEngine] = useState(false);
  const [showModelManagement, setShowModelManagement] = useState(false);

  // Poll training status
  useEffect(() => {
    const pollTrainingStatus = async () => {
      try {
        const status = await labelingService.getTrainingStatus();
        setTrainingStatus(prev => ({
          ...prev,
          ...status,
          lastTrainingDate: status.lastTrainingDate ? new Date(status.lastTrainingDate) : null
        }));
      } catch (error) {
        console.error('Failed to get training status:', error);
      }
    };

    // Initial check
    pollTrainingStatus();

    // Poll every 10 seconds when training, every 30 seconds otherwise
    const interval = setInterval(
      pollTrainingStatus,
      trainingStatus.isTraining ? 10000 : 30000
    );

    return () => clearInterval(interval);
  }, [trainingStatus.isTraining]);

  const handleEngineToggle = async () => {
    setIsUpdatingEngine(true);
    try {
      await labelingService.setEngineMode(!useSimpleEngine);
      setUseSimpleEngine(!useSimpleEngine);
    } catch (error) {
      console.error('Failed to update engine mode:', error);
      alert('Failed to update engine mode. Please try again.');
    } finally {
      setIsUpdatingEngine(false);
    }
  };

  const triggerManualTraining = async () => {
    try {
      // This would trigger immediate processing of completed labeling projects
      await labelingService.processCompletedProjects();
      setTrainingStatus(prev => ({ ...prev, message: 'Training triggered manually' }));
    } catch (error) {
      console.error('Failed to trigger training:', error);
      alert('Failed to trigger training. Please try again.');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleString();
  };

  const getStatusColor = () => {
    if (trainingStatus.isTraining) return 'text-blue-600';
    if (trainingStatus.accuracy && trainingStatus.accuracy > 0.8) return 'text-green-600';
    if (trainingStatus.accuracy && trainingStatus.accuracy > 0.6) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">🤖</span>
          ML Engine Training Status
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Engine:</span>
          <button
            onClick={handleEngineToggle}
            disabled={isUpdatingEngine || trainingStatus.isTraining}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              useSimpleEngine 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            } ${
              isUpdatingEngine || trainingStatus.isTraining 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:opacity-80 cursor-pointer'
            }`}
          >
            {isUpdatingEngine ? 'Updating...' : (useSimpleEngine ? 'Simple' : 'Advanced')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getStatusColor()}`}>
            {trainingStatus.isTraining ? `${trainingStatus.progress}%` : trainingStatus.modelVersion}
          </div>
          <div className="text-sm text-gray-500">
            {trainingStatus.isTraining ? 'Progress' : 'Model Version'}
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            {trainingStatus.totalSamples.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Training Samples</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            {trainingStatus.accuracy ? `${(trainingStatus.accuracy * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Accuracy</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            {formatDate(trainingStatus.lastTrainingDate).split(',')[0]}
          </div>
          <div className="text-sm text-gray-500">Last Training</div>
        </div>
      </div>

      {/* Progress Bar */}
      {trainingStatus.isTraining && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Training Progress</span>
            <span className="text-sm text-gray-500">{trainingStatus.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${trainingStatus.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-3 ${
            trainingStatus.isTraining ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
          }`}></div>
          <span className="text-sm text-gray-700">{trainingStatus.message}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={triggerManualTraining}
          disabled={trainingStatus.isTraining}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            trainingStatus.isTraining
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {trainingStatus.isTraining ? 'Training in Progress...' : 'Process Labeling Data'}
        </button>

        <button
          onClick={() => window.open('http://localhost:8002', '_blank')}
          className="px-4 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Open Labeling System
        </button>

        <button
          onClick={() => setShowModelManagement(!showModelManagement)}
          className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 transition-colors"
        >
          {showModelManagement ? 'Hide' : 'Show'} Model Management
        </button>
      </div>

      {/* Training Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• The system automatically processes completed labeling projects every 5 minutes</p>
        <p>• Use "Process Labeling Data" to trigger immediate processing</p>
        <p>• Simple Engine: Fast, basic ML classification | Advanced Engine: Deep learning with transformers</p>
        <p>• Use "Model Management" to deploy newly trained models as the active engine</p>
      </div>

      {/* Model Management Section */}
      {showModelManagement && (
        <div className="mt-6 border-t pt-6">
          <ModelManagement 
            onModelDeployed={(modelVersion) => {
              console.log(`Model ${modelVersion} deployed`);
              onModelDeployed?.(modelVersion);
              setTrainingStatus(prev => ({
                ...prev,
                modelVersion,
                message: `Model ${modelVersion} deployed successfully`
              }));
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TrainingPanel;