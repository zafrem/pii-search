import React, { useCallback, useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PII Search</h1>
              <p className="text-gray-600 mt-1">Multi-language PII detection with 3-stage sequential analysis</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowApiDocs(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-colors font-medium flex items-center space-x-2"
                title="View API Documentation"
              >
                <span>📚</span>
                <span>API Docs</span>
              </button>
              <button
                onClick={handleToggleTrainingPanel}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
              >
                🤖 ML Training Panel
              </button>
              <div className="text-sm text-gray-500">
                v0.0.1
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <LanguageSelector
                  selectedLanguages={search.selectedLanguages}
                  onChange={search.updateLanguages}
                  disabled={search.isLoading || search.hasResults}
                  disabledReason={search.isLoading ? 'loading' : search.hasResults ? 'search_active' : 'other'}
                />
              </div>
              <div>
                <TextInput
                  value={search.text}
                  onChange={search.updateText}
                  disabled={search.isLoading || search.hasResults}
                  disabledReason={search.isLoading ? 'loading' : search.hasResults ? 'search_active' : 'other'}
                />
              </div>
            </div>

            {/* Error Display */}
            {search.error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-400 mr-2">⚠️</div>
                  <p className="text-red-700 text-sm">{search.error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <SearchControls
              currentStage={search.stage}
              isLoading={search.isLoading}
              canProceedToNext={search.canProceedToNext}
              onStartSearch={search.startBasicSearch}
              onNextStage={search.proceedToNextStage}
              onReset={search.resetSearch}
              onOpenLabeling={handleOpenLabeling}
              disabled={!search.text.trim() || search.selectedLanguages.length === 0}
              hasStage2Results={!!search.results.stage2}
            />
          </div>

          {/* Progress Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ProgressIndicator
              stages={search.stageProgress}
              currentStage={search.stage}
            />
          </div>

          {/* Training Panel */}
          {showTrainingPanel && (
            <TrainingPanel
              onTrainingComplete={() => {
                // Optionally refresh search results or show notification
                console.log('Training completed');
              }}
              onModelDeployed={(modelVersion) => {
                // Show notification about model deployment
                console.log(`New model ${modelVersion} deployed`);
                // Optionally show a toast notification to user
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
                <button
                  onClick={() => setShowOllamaDebug(true)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center space-x-1"
                  title="View questions asked to Ollama"
                >
                  <span>🤖</span>
                  <span>View Ollama Questions</span>
                </button>
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
                    {search.results.stage3.processingTime}ms
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Detection Results - Stage 1 (Basic Search)
              </h3>
              
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
                    {search.results.stage1.processingTime}ms
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>PII Search - Protecting privacy through intelligent detection</p>
            <p className="mt-1">Supports Korean, English, Chinese, Japanese, Spanish, and French</p>
            
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
