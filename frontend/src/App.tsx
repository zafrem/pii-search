import React, { useCallback, useState } from 'react';
import TextInput from './components/TextInput';
import ProgressIndicator from './components/ProgressIndicator';
import SearchControls from './components/SearchControls';
import DetectionResults from './components/DetectionResults';
import TrainingPanel from './components/TrainingPanel';
import LabelingWorkflow from './components/LabelingWorkflow';
import OllamaDebugModal from './components/OllamaDebugModal';
import ApiDocumentationModal from './components/ApiDocumentationModal';
import { useSearch } from './hooks/useSearch';
import { labelingService, LabelingData } from './services/labelingService';

function App() {
  const search = useSearch();
  const [showLabelingWorkflow, setShowLabelingWorkflow] = useState(false);
  const [showTrainingPanel, setShowTrainingPanel] = useState(false);
  const [showOllamaDebug, setShowOllamaDebug] = useState(false);
  const [showApiDocs, setShowApiDocs] = useState(false);
  
  const handleOpenLabeling = useCallback(() => {
    if (!search.results.stage2 || !search.text) {
      alert('No Deep Search results available for labeling.');
      return;
    }
    
    setShowLabelingWorkflow(true);
  }, [search.results.stage2, search.text]);

  const handleToggleTrainingPanel = useCallback(() => {
    setShowTrainingPanel(prev => !prev);
  }, []);

  const supportedLanguages = [
    'Korean', 'English', 'Chinese', 'Japanese', 'Spanish', 'French'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Simplified */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">PII Search</h1>
              <div className="text-sm text-gray-500">v0.0.1</div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowApiDocs(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
                title="View API Documentation"
              >
                <span>API Docs</span>
              </button>
              <button
                onClick={handleToggleTrainingPanel}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Training
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {!search.hasResults ? (
          /* Google-style centered search interface */
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-4xl text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">PII Search</h2>
              <p className="text-lg text-gray-600 mb-8">Multi-language PII detection with 3-stage sequential analysis</p>
              
              {/* Search Input */}
              <div className="mb-8">
                <TextInput
                  value={search.text}
                  onChange={search.updateText}
                  onSearch={search.startBasicSearch}
                  disabled={search.isLoading}
                  disabledReason={search.isLoading ? 'loading' : 'other'}
                  isLoading={search.isLoading && search.stage === 1}
                  isExpanded={search.text.length > 50}
                />
              </div>

              {/* Error Display */}
              {search.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
                  <div className="flex items-center justify-center">
                    <div className="text-red-400 mr-2">⚠️</div>
                    <p className="text-red-700 text-sm">{search.error}</p>
                  </div>
                </div>
              )}

              {/* Quick actions when no results */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <button
                  onClick={search.resetAll}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  disabled={search.isLoading}
                >
                  Clear
                </button>
                {search.text && (
                  <button
                    onClick={search.startBasicSearch}
                    disabled={search.isLoading || !search.text.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {search.isLoading ? 'Searching...' : 'Start PII Search'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results view */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
              {/* Compact Search Summary */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      Analyzing: <span className="font-medium text-gray-900">{search.text.substring(0, 80)}{search.text.length > 80 ? '...' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={search.resetAll}
                      disabled={search.isLoading}
                      className="px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors text-sm"
                    >
                      New Search
                    </button>
                    {/* Continue to Next Stage Button */}
                    {search.stage > 1 && (
                      <button
                        onClick={search.proceedToNextStage}
                        disabled={search.isLoading || !search.canProceedToNext || !!search.results.stage3}
                        className={`px-3 py-1.5 rounded transition-colors text-sm flex items-center space-x-1 ${
                          search.results.stage3 
                            ? 'bg-blue-600 text-white cursor-not-allowed' 
                            : search.canProceedToNext && !search.isLoading
                              ? 'bg-secondary-600 text-white hover:bg-secondary-700' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <span>
                          {search.stage === 2 ? 'Continue to Deep Search' : 'Continue to Context Search'}
                        </span>
                        {!search.results.stage3 && <span>→</span>}
                        {search.results.stage3 && <span>✓</span>}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <ProgressIndicator
                  stages={search.stageProgress}
                  currentStage={search.stage}
                />
              </div>

              {/* Controls Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <SearchControls
                  currentStage={search.stage}
                  isLoading={search.isLoading}
                  canProceedToNext={search.canProceedToNext}
                  onStartSearch={search.startBasicSearch}
                  onNextStage={search.proceedToNextStage}
                  onOpenLabeling={handleOpenLabeling}
                  disabled={!search.text.trim()}
                  hasStage2Results={!!search.results.stage2}
                />
              </div>

              {/* Training Panel */}
              {showTrainingPanel && (
                <TrainingPanel
                  onTrainingComplete={() => {
                    console.log('Training completed');
                  }}
                  onModelDeployed={(modelVersion) => {
                    console.log(`New model ${modelVersion} deployed`);
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50';
                    notification.innerHTML = `
                      <div class="flex items-center">
                        <span class="mr-2">✅</span>
                        <span>Model ${modelVersion} is now the active engine!</span>
                      </div>
                    `;
                    document.body.appendChild(notification);
                    setTimeout(() => {
                      document.body.removeChild(notification);
                    }, 4000);
                  }}
                />
              )}

              {/* Detection Results - Accumulated in reverse order (Stage 3, 2, 1) */}
              
              {/* Stage 3 Results - Context Search */}
              {search.results.stage3 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Detection Results - Stage 3 (Context Search)
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowOllamaDebug(true)}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center space-x-1"
                        title="View LLM Prompt API requests and responses"
                      >
                        <span>📝</span>
                        <span>View LLM Prompt API</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary-600">
                        {('detectedItems' in search.results.stage3.summary && search.results.stage3.summary.detectedItems !== undefined) 
                          ? search.results.stage3.summary.detectedItems 
                          : search.results.stage3.summary.totalItems}
                      </div>
                      <div className="text-sm text-gray-600">
                        {'detectedItems' in search.results.stage3.summary 
                          ? 'Items Detected' 
                          : 'Total Items'
                        }
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-600">
                        {search.results.stage3.processingTime.toFixed(2)}ms
                      </div>
                      <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-success">
                        {search.results.stage3.summary.averageProbability 
                          ? `${(search.results.stage3.summary.averageProbability * 100).toFixed(1)}%`
                          : `${Object.keys(search.results.stage3.summary.languageBreakdown || {}).length}`
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        {search.results.stage3.summary.averageProbability 
                          ? 'Avg Probability' 
                          : 'Languages'
                        }
                      </div>
                    </div>
                  </div>

                  {search.results.stage3.items.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Detected Items:</h4>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {search.results.stage3.items.map((item) => (
                          <div key={item.id} className="p-3 bg-gray-50 rounded border-l-4 border-purple-500">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-mono text-sm bg-white px-2 py-1 rounded">
                                  {item.text}
                                </span>
                                <div className="text-xs text-gray-600 mt-1">
                                  Type: {item.type} | Language: {item.language} | Probability: {(item.probability * 100).toFixed(1)}% | Confidence: {item.confidenceLevel}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No PII detected in Stage 3.
                    </div>
                  )}
                </div>
              )}

              {/* Stage 2 Results - Deep Search (ML Classification) */}
              {search.results.stage2 && (
                <DetectionResults
                  stage={2}
                  data={search.results.stage2}
                  originalText={search.text}
                  isLoading={search.isLoading && search.stage === 2}
                />
              )}

              {/* Stage 1 Results - Basic Search */}
              {search.results.stage1 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Detection Results - Stage 1 (Basic Search)
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary-600">
                        {('detectedItems' in search.results.stage1.summary && search.results.stage1.summary.detectedItems !== undefined) 
                          ? search.results.stage1.summary.detectedItems 
                          : search.results.stage1.summary.totalItems}
                      </div>
                      <div className="text-sm text-gray-600">
                        {'detectedItems' in search.results.stage1.summary 
                          ? 'Items Detected' 
                          : 'Total Items'
                        }
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-600">
                        {search.results.stage1.processingTime.toFixed(2)}ms
                      </div>
                      <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-success">
                        {`${search.results.stage1.summary.detectionRate.toFixed(1)}%`}
                      </div>
                      <div className="text-sm text-gray-600">
                        Detection Rate
                      </div>
                    </div>
                  </div>

                  {search.results.stage1.items.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Detected Items:</h4>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {search.results.stage1.items.map((item) => (
                          <div key={item.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-mono text-sm bg-white px-2 py-1 rounded">
                                  {item.text}
                                </span>
                                <div className="text-xs text-gray-600 mt-1">
                                  Type: {item.type} | Language: {item.language} | Status: {item.isDetected ? 'Detected' : 'Not Detected'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No PII detected in Stage 1.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer - Always visible with supported languages */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 space-y-4">
            <div>
              <p className="font-medium text-gray-700 mb-2">Supported Languages</p>
              <div className="flex flex-wrap justify-center gap-2">
                {supportedLanguages.map((language) => (
                  <span
                    key={language}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p>PII Search - Protecting privacy through intelligent detection</p>
              
              {/* Feedback/Contact Button */}
              <div className="mt-4 mb-2">
                <a
                  href="mailto:zafrem@gmail.com?subject=PII Search Feedback"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 space-x-2"
                >
                  <span>📧</span>
                  <span>Feedback/Contact</span>
                </a>
              </div>
              
              <p className="mt-1">
                <a 
                  href="https://github.com/zafrem/pii-search" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  https://github.com/zafrem/pii-search
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Labeling Workflow Modal */}
      {showLabelingWorkflow && search.results.stage2 && (
        <LabelingWorkflow
          searchResults={search.results.stage2}
          originalText={search.text}
          onClose={() => setShowLabelingWorkflow(false)}
        />
      )}

      {/* Ollama Debug Modal */}
      <OllamaDebugModal
        isOpen={showOllamaDebug}
        onClose={() => setShowOllamaDebug(false)}
      />

      {/* API Documentation Modal */}
      <ApiDocumentationModal
        isOpen={showApiDocs}
        onClose={() => setShowApiDocs(false)}
      />
    </div>
  );
}

export default App;