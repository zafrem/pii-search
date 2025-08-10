import React, { useState } from 'react';
import { DeepSearchResponse } from '../types';
import { labelingService, LabelingData } from '../services/labelingService';

interface LabelingWorkflowProps {
  searchResults: DeepSearchResponse | undefined;
  originalText: string;
  onClose: () => void;
}

interface SegmentSelection {
  id: string;
  text: string;
  start: number;
  end: number;
  classification: 'pii' | 'non_pii';
  confidence: number;
  isSelected: boolean;
  userClassification?: 'pii' | 'non_pii';
}

const LabelingWorkflow: React.FC<LabelingWorkflowProps> = ({
  searchResults,
  originalText,
  onClose
}) => {
  const [segments, setSegments] = useState<SegmentSelection[]>(() => {
    if (!searchResults?.items) return [];
    
    return searchResults.items.map(item => ({
      id: item.id,
      text: item.text,
      start: item.position.start,
      end: item.position.end,
      classification: item.classification,
      confidence: item.probability,
      isSelected: false,
      userClassification: undefined
    }));
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'labeling' | 'training'>('labeling');

  const toggleSegmentSelection = (segmentId: string) => {
    setSegments(prev => prev.map(segment => 
      segment.id === segmentId 
        ? { ...segment, isSelected: !segment.isSelected }
        : segment
    ));
  };

  const updateUserClassification = (segmentId: string, classification: 'pii' | 'non_pii') => {
    setSegments(prev => prev.map(segment =>
      segment.id === segmentId
        ? { ...segment, userClassification: classification }
        : segment
    ));
  };

  const selectAll = () => {
    setSegments(prev => prev.map(segment => ({ ...segment, isSelected: true })));
  };

  const deselectAll = () => {
    setSegments(prev => prev.map(segment => ({ ...segment, isSelected: false })));
  };

  const getSelectedSegments = () => {
    return segments.filter(segment => segment.isSelected);
  };

  const handleSubmitToLabeling = async () => {
    const selectedSegments = getSelectedSegments();
    
    if (selectedSegments.length === 0) {
      alert('Please select at least one segment to send to labeling.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const labelingData: LabelingData = {
        text: originalText,
        segments: selectedSegments.map(segment => ({
          text: segment.text,
          start: segment.start,
          end: segment.end,
          classification: segment.userClassification || segment.classification,
          confidence: segment.confidence
        }))
      };

      await labelingService.openLabelingSystem(labelingData);
      
      // Close the workflow after successful submission
      onClose();
      
    } catch (error) {
      console.error('Failed to submit to labeling system:', error);
      alert('Failed to open labeling system. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForTraining = async () => {
    const selectedSegments = getSelectedSegments();
    
    if (selectedSegments.length === 0) {
      alert('Please select at least one segment for training.');
      return;
    }

    // Check that all selected segments have user classifications
    const unclassifiedSegments = selectedSegments.filter(s => !s.userClassification);
    if (unclassifiedSegments.length > 0) {
      alert('Please provide classifications for all selected segments before submitting for training.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const trainingData = selectedSegments.map(segment => ({
        text: segment.text,
        classification: segment.userClassification as 'pii' | 'non_pii'
      }));

      await labelingService.submitTrainingData(trainingData);
      
      alert(`Successfully submitted ${trainingData.length} segments for training!`);
      onClose();
      
    } catch (error) {
      console.error('Failed to submit training data:', error);
      alert('Failed to submit training data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClassificationBadgeColor = (classification: 'pii' | 'non_pii', confidence: number) => {
    if (classification === 'pii') {
      return confidence > 0.7 ? 'bg-red-100 text-red-800' : 'bg-red-50 text-red-600';
    } else {
      return confidence > 0.7 ? 'bg-green-100 text-green-800' : 'bg-green-50 text-green-600';
    }
  };

  const selectedCount = getSelectedSegments().length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Labeling Workflow</h2>
              <p className="opacity-90">Select segments to send to labeling system or direct training</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Submit Mode:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSubmitMode('labeling')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  submitMode === 'labeling'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📝 Send to Labeling System
              </button>
              <button
                onClick={() => setSubmitMode('training')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  submitMode === 'training'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🤖 Direct Training
              </button>
            </div>
          </div>
          
          {submitMode === 'training' && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
              💡 Direct training requires manual classification. Use this for immediate feedback to the ML model.
            </div>
          )}
        </div>

        {/* Selection Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedCount} of {segments.length} segments selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={selectAll}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Total: {segments.length} segments
            </div>
          </div>
        </div>

        {/* Segments List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                segment.isSelected ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={segment.isSelected}
                  onChange={() => toggleSegmentSelection(segment.id)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Segment {index + 1}</span>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getClassificationBadgeColor(segment.classification, segment.confidence)}`}
                      >
                        {segment.classification.toUpperCase()} ({(segment.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-800 bg-white p-2 rounded border">
                    "{segment.text}"
                  </div>
                  
                  {/* User Classification for Training Mode */}
                  {submitMode === 'training' && segment.isSelected && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Your classification:</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => updateUserClassification(segment.id, 'pii')}
                          className={`px-2 py-1 text-xs rounded ${
                            segment.userClassification === 'pii'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          PII
                        </button>
                        <button
                          onClick={() => updateUserClassification(segment.id, 'non_pii')}
                          className={`px-2 py-1 text-xs rounded ${
                            segment.userClassification === 'non_pii'
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Non-PII
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {submitMode === 'labeling' 
                ? 'Selected segments will be sent to the labeling system for detailed annotation.'
                : 'Selected segments will be submitted directly for model training.'
              }
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              
              <button
                onClick={submitMode === 'labeling' ? handleSubmitToLabeling : handleSubmitForTraining}
                disabled={selectedCount === 0 || isSubmitting}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedCount === 0 || isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : submitMode === 'labeling'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting 
                  ? 'Submitting...' 
                  : submitMode === 'labeling'
                    ? `Send ${selectedCount} to Labeling`
                    : `Submit ${selectedCount} for Training`
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelingWorkflow;