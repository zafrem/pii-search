import React, { useState, useEffect } from 'react';

interface OllamaPrompt {
  entity_id: string;
  entity_text: string;
  entity_type: string;
  model: string;
  context: string;
  full_prompt: string;
}

interface OllamaResponse {
  entity_id: string;
  entity_text: string;
  response: any;
}

interface DebugInfo {
  last_request_text: string;
  last_request_entities_count: number;
  last_request_entities: any[];
  prompts_sent: OllamaPrompt[];
  responses_received: OllamaResponse[];
}

interface OllamaDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OllamaDebugModal: React.FC<OllamaDebugModalProps> = ({ isOpen, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8001/debug');
      const data = await response.json();
      
      if (data.success) {
        setDebugInfo(data.data);
      } else {
        setError('Failed to fetch debug information');
      }
    } catch (err) {
      setError('Error connecting to Context Search Engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDebugInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            🤖 Ollama Questions & Responses
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading debug information...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {debugInfo && (
            <div className="space-y-6">
              {/* Request Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Request Summary</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Text analyzed:</strong> "{debugInfo.last_request_text.substring(0, 100)}..."</p>
                  <p><strong>Entities processed:</strong> {debugInfo.last_request_entities_count}</p>
                  <p><strong>Questions sent to Ollama:</strong> {debugInfo.prompts_sent.length}</p>
                </div>
              </div>

              {debugInfo.prompts_sent.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No questions were sent to Ollama</p>
                  <p className="text-sm mt-2">This usually means Stage 2 didn't detect any PII entities to validate</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {debugInfo.prompts_sent.map((prompt, index) => {
                    const response = debugInfo.responses_received.find(
                      r => r.entity_id === prompt.entity_id
                    );

                    return (
                      <div key={prompt.entity_id} className="border border-gray-200 rounded-lg">
                        <div className="bg-blue-50 px-4 py-3 rounded-t-lg">
                          <h4 className="font-medium text-blue-900">
                            Question #{index + 1}: "{prompt.entity_text}" ({prompt.entity_type})
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Model: {prompt.model} | Entity ID: {prompt.entity_id}
                          </p>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Context */}
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Context provided:</h5>
                            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                              {prompt.context}
                            </div>
                          </div>

                          {/* Prompt */}
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Question asked to Ollama:</h5>
                            <div className="bg-yellow-50 p-3 rounded text-sm">
                              <pre className="whitespace-pre-wrap">{prompt.full_prompt}</pre>
                            </div>
                          </div>

                          {/* Response */}
                          {response && (
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">Ollama's Response:</h5>
                              <div className="bg-green-50 p-3 rounded">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {JSON.stringify(response.response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Refresh Button */}
              <div className="text-center pt-4">
                <button
                  onClick={fetchDebugInfo}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Refreshing...' : 'Refresh Debug Info'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OllamaDebugModal;