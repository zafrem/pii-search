import React, { useState, useCallback } from 'react';
import { SearchStage, DeepSearchResponse } from '../types';
import { labelingService, LabelingData } from '../services/labelingService';

interface DetectionItem {
  id: string;
  text: string;
  classification: 'pii' | 'non_pii';
  position: {
    start: number;
    end: number;
  };
  probability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  context?: string;
  sources: string[];
  type?: string; // For sentence or potential_pii
}

// Use the DeepSearchResponse type from types file

interface DetectionResultsProps {
  stage: SearchStage;
  data: DeepSearchResponse | undefined;
  originalText: string;
  isLoading: boolean;
}

interface SegmentResult {
  text: string;
  start: number;
  end: number;
  classification: 'pii' | 'non_pii' | 'unknown';
  probability: number;
  isSelected: boolean;
  source: 'ml_engine' | 'sentence_split';
}

const DetectionResults: React.FC<DetectionResultsProps> = ({
  stage,
  data,
  originalText,
  isLoading
}) => {
  const [segmentResults, setSegmentResults] = useState<SegmentResult[]>([]);
  const [isProcessingLabeling, setIsProcessingLabeling] = useState(false);

  // Process the detection data into sentence-based segments
  React.useEffect(() => {
    if (data && originalText && stage === 2) {
      const processedSegments = processDetectionResults(data, originalText);
      setSegmentResults(processedSegments);
    }
  }, [data, originalText, stage]);

  const processDetectionResults = (detectionData: DeepSearchResponse, text: string): SegmentResult[] => {
    const segments: SegmentResult[] = [];
    
    // First, segment the text into sentences
    const sentences = segmentTextIntoSentences(text);
    
    // For each sentence, determine if it contains PII based on ML results
    sentences.forEach((sentence) => {
      let hasMLClassification = false;
      let maxProbability = 0;
      let classification: 'pii' | 'non_pii' | 'unknown' = 'unknown';
      
      // Check if any ML detection items overlap with this sentence
      for (const item of detectionData.items) {
        const overlapStart = Math.max(sentence.start, item.position.start);
        const overlapEnd = Math.min(sentence.end, item.position.end);
        const overlapLength = Math.max(0, overlapEnd - overlapStart);
        const sentenceLength = sentence.end - sentence.start;
        
        // If there's significant overlap (>10% of sentence), use ML classification
        if (overlapLength > sentenceLength * 0.1) {
          hasMLClassification = true;
          if (item.probability > maxProbability) {
            maxProbability = item.probability;
            classification = item.classification;
          }
        }
      }
      
      // If no ML classification found, classify as non-PII but with low confidence
      if (!hasMLClassification) {
        classification = 'non_pii';
        maxProbability = 0.3; // Low confidence for non-ML classified sentences
      }
      
      segments.push({
        text: sentence.text,
        start: sentence.start,
        end: sentence.end,
        classification,
        probability: maxProbability,
        isSelected: false,
        source: hasMLClassification ? 'ml_engine' : 'sentence_split'
      });
    });
    
    return segments;
  };

  const segmentTextIntoSentences = (text: string): Array<{text: string, start: number, end: number}> => {
    // Simple sentence segmentation (can be enhanced with NLTK-like logic)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const segments = [];
    let currentPos = 0;
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      const startPos = text.indexOf(trimmedSentence, currentPos);
      if (startPos !== -1) {
        segments.push({
          text: trimmedSentence,
          start: startPos,
          end: startPos + trimmedSentence.length
        });
        currentPos = startPos + trimmedSentence.length;
      }
    }
    
    return segments;
  };

  const toggleSegmentSelection = useCallback((index: number) => {
    setSegmentResults(prev => 
      prev.map((segment, i) => 
        i === index ? { ...segment, isSelected: !segment.isSelected } : segment
      )
    );
  }, []);

  const selectAllPII = useCallback(() => {
    setSegmentResults(prev => 
      prev.map(segment => ({
        ...segment,
        isSelected: segment.classification === 'pii'
      }))
    );
  }, []);

  const selectAllNonPII = useCallback(() => {
    setSegmentResults(prev => 
      prev.map(segment => ({
        ...segment,
        isSelected: segment.classification === 'non_pii'
      }))
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSegmentResults(prev => 
      prev.map(segment => ({ ...segment, isSelected: false }))
    );
  }, []);

  const handleSendToLabeling = useCallback(async () => {
    const selectedSegments = segmentResults.filter(segment => segment.isSelected);
    
    if (selectedSegments.length === 0) {
      alert('Please select at least one segment to send to the labeling system.');
      return;
    }

    setIsProcessingLabeling(true);
    
    try {
      const labelingData: LabelingData = {
        text: originalText,
        segments: selectedSegments.map(segment => ({
          text: segment.text,
          start: segment.start,
          end: segment.end,
          classification: segment.classification === 'unknown' ? 'non_pii' : segment.classification,
          confidence: segment.probability
        }))
      };

      await labelingService.openLabelingSystem(labelingData);
      
      // Show success message
      alert(`Successfully sent ${selectedSegments.length} segments to the labeling system!`);
      
    } catch (error) {
      console.error('Failed to send to labeling system:', error);
      alert('Failed to open labeling system. Please try again.');
    } finally {
      setIsProcessingLabeling(false);
    }
  }, [segmentResults, originalText]);

  const getConfidenceColor = (probability: number) => {
    if (probability >= 0.8) return 'text-green-600';
    if (probability >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'pii': return 'bg-red-100 text-red-800 border-red-200';
      case 'non_pii': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (stage !== 2) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Processing Deep Search...</h3>
            <p className="text-sm text-gray-600">Running ML Classification on your text</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Results - Stage 2 (Deep Search)</h3>
        <p className="text-gray-600">No detection results available.</p>
      </div>
    );
  }

  const selectedCount = segmentResults.filter(s => s.isSelected).length;
  const piiCount = segmentResults.filter(s => s.classification === 'pii').length;
  const nonPiiCount = segmentResults.filter(s => s.classification === 'non_pii').length;
  
  // Calculate summary stats from segmentResults
  const totalConfidenceItems = segmentResults.filter(s => s.probability >= 0.8).length;
  const avgConfidence = segmentResults.length > 0 
    ? segmentResults.reduce((sum, s) => sum + s.probability, 0) / segmentResults.length 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border-l-4 border-l-green-500 border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Detection Results - Stage 2 (Deep Search)</h3>
            <p className="text-sm text-gray-600 mt-1">
              ML Classification Results • {segmentResults.length} segments analyzed
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>PII: {piiCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Non-PII: {nonPiiCount}</span>
            </div>
            <div className="text-gray-600">
              Processing Time: {data.processingTime?.toFixed(2)}s
            </div>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={selectAllPII}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Select All PII ({piiCount})
            </button>
            <button
              onClick={selectAllNonPII}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              Select All Non-PII ({nonPiiCount})
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Clear Selection
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedCount} selected
            </span>
            <button
              onClick={handleSendToLabeling}
              disabled={selectedCount === 0 || isProcessingLabeling}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                selectedCount === 0 || isProcessingLabeling
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md'
              }`}
            >
              {isProcessingLabeling && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>📝</span>
              <span>Send to Labeling</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segment Results */}
      <div className="p-6">
        <div className="space-y-3">
          {segmentResults.map((segment, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                segment.isSelected
                  ? 'border-purple-300 bg-purple-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleSegmentSelection(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={segment.isSelected}
                        onChange={() => toggleSegmentSelection(index)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getClassificationColor(segment.classification)}`}
                      >
                        {segment.classification.toUpperCase().replace('_', '-')}
                      </span>
                      <span className={`text-xs font-medium ${getConfidenceColor(segment.probability)}`}>
                        {(segment.probability * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Segment {index + 1}
                    </div>
                  </div>
                  <p className="text-gray-900 leading-relaxed">
                    "{segment.text}"
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Position: {segment.start}-{segment.end}</span>
                    <span>Source: {segment.source === 'ml_engine' ? 'ML Engine' : 'Sentence Split'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {segmentResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No segments detected for classification.</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {data.summary && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Total Segments:</span>
              <span className="ml-2 text-gray-900">{segmentResults.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Avg Confidence:</span>
              <span className="ml-2 text-gray-900">
                {avgConfidence ? (avgConfidence * 100).toFixed(0) + '%' : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">High Confidence:</span>
              <span className="ml-2 text-gray-900">{totalConfidenceItems}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Model:</span>
              <span className="ml-2 text-gray-900">
                {data.method?.replace('_', ' ') || 'ML Classification'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionResults;