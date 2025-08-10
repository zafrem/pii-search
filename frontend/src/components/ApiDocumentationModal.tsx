import React from 'react';

interface ApiDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiDocumentationModal: React.FC<ApiDocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">API Documentation</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto">
            <div
              dangerouslySetInnerHTML={{
                __html: `
                  <style>
                    .api-docs {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      line-height: 1.6;
                      color: #333;
                    }

                    .api-docs .header {
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 30px;
                      margin-bottom: 30px;
                      border-radius: 10px;
                      text-align: center;
                    }

                    .api-docs .header h1 {
                      font-size: 2.5rem;
                      margin-bottom: 10px;
                      margin-top: 0;
                    }

                    .api-docs .header p {
                      font-size: 1.2rem;
                      opacity: 0.9;
                    }

                    .api-docs .nav {
                      background: #f8f9fa;
                      padding: 20px;
                      border-radius: 10px;
                      margin-bottom: 30px;
                    }

                    .api-docs .nav ul {
                      list-style: none;
                      display: flex;
                      flex-wrap: wrap;
                      gap: 20px;
                      margin: 0;
                      padding: 0;
                    }

                    .api-docs .nav a {
                      color: #667eea;
                      text-decoration: none;
                      padding: 8px 16px;
                      border-radius: 5px;
                      transition: all 0.3s ease;
                    }

                    .api-docs .nav a:hover {
                      background-color: #667eea;
                      color: white;
                    }

                    .api-docs .section {
                      margin-bottom: 30px;
                      padding: 30px;
                      border-radius: 10px;
                      border: 1px solid #e2e8f0;
                    }

                    .api-docs .section h2 {
                      color: #667eea;
                      border-bottom: 3px solid #667eea;
                      padding-bottom: 10px;
                      margin-bottom: 25px;
                      margin-top: 0;
                      font-size: 2rem;
                    }

                    .api-docs .section h3 {
                      color: #764ba2;
                      margin: 25px 0 15px 0;
                      font-size: 1.5rem;
                    }

                    .api-docs .section h4 {
                      color: #333;
                      margin: 20px 0 10px 0;
                      font-size: 1.1rem;
                    }

                    .api-docs .endpoint {
                      background-color: #f8f9fa;
                      border-left: 4px solid #667eea;
                      padding: 20px;
                      margin: 20px 0;
                      border-radius: 5px;
                    }

                    .api-docs .method {
                      display: inline-block;
                      padding: 4px 12px;
                      border-radius: 4px;
                      font-weight: bold;
                      font-size: 0.9rem;
                      margin-right: 10px;
                      text-transform: uppercase;
                    }

                    .api-docs .method.get { background-color: #28a745; color: white; }
                    .api-docs .method.post { background-color: #007bff; color: white; }
                    .api-docs .method.put { background-color: #ffc107; color: black; }
                    .api-docs .method.delete { background-color: #dc3545; color: white; }

                    .api-docs .code-block {
                      background-color: #2d3748;
                      color: #e2e8f0;
                      padding: 20px;
                      border-radius: 8px;
                      overflow-x: auto;
                      margin: 15px 0;
                      font-family: 'Courier New', monospace;
                      font-size: 0.9rem;
                      line-height: 1.4;
                    }

                    .api-docs .json-key { color: #68d391; }
                    .api-docs .json-string { color: #fbb6ce; }
                    .api-docs .json-number { color: #90cdf4; }
                    .api-docs .json-boolean { color: #f6ad55; }

                    .api-docs .parameter-table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 20px 0;
                      background: white;
                    }

                    .api-docs .parameter-table th,
                    .api-docs .parameter-table td {
                      padding: 12px;
                      text-align: left;
                      border-bottom: 1px solid #e2e8f0;
                    }

                    .api-docs .parameter-table th {
                      background-color: #667eea;
                      color: white;
                      font-weight: 600;
                    }

                    .api-docs .parameter-table tr:hover {
                      background-color: #f7fafc;
                    }

                    .api-docs .required {
                      color: #e53e3e;
                      font-weight: bold;
                    }

                    .api-docs .optional {
                      color: #38a169;
                    }

                    .api-docs .badge {
                      display: inline-block;
                      padding: 3px 8px;
                      font-size: 0.75rem;
                      font-weight: bold;
                      border-radius: 12px;
                    }

                    .api-docs .badge.stage-1 { background-color: #bee3f8; color: #2b6cb0; }
                    .api-docs .badge.stage-2 { background-color: #c6f6d5; color: #276749; }
                    .api-docs .badge.stage-3 { background-color: #fed7d7; color: #c53030; }

                    .api-docs .response-example {
                      margin-top: 20px;
                    }

                    .api-docs p {
                      margin-bottom: 16px;
                    }

                    .api-docs ul {
                      margin-left: 20px;
                      margin-bottom: 16px;
                    }

                    .api-docs code {
                      background-color: #f1f5f9;
                      padding: 2px 6px;
                      border-radius: 3px;
                      font-family: 'Courier New', monospace;
                      font-size: 0.9em;
                    }
                  </style>

                  <div class="api-docs">
                    <div class="header">
                      <h1>🔍 PII Search API Documentation</h1>
                      <p>Comprehensive API reference for the PII Search backend services</p>
                    </div>

                    <nav class="nav">
                      <ul>
                        <li><a href="#overview">Overview</a></li>
                        <li><a href="#authentication">Authentication</a></li>
                        <li><a href="#main-api">Main Backend API</a></li>
                        <li><a href="#deep-search">Deep Search Engine</a></li>
                        <li><a href="#context-search">Context Search Engine</a></li>
                        <li><a href="#examples">Examples</a></li>
                        <li><a href="#error-handling">Error Handling</a></li>
                      </ul>
                    </nav>

                    <section class="section" id="overview">
                      <h2>🎯 Overview</h2>
                      <p>The PII Search consists of three main API services working together to provide comprehensive personally identifiable information (PII) detection:</p>
                      
                      <div style="margin: 20px 0;">
                        <h3>🏗️ Architecture</h3>
                        <ul style="margin-left: 20px;">
                          <li><strong>Main Backend (Port 3001):</strong> <span class="badge stage-1">Stage 1</span> Rule-based pattern matching and API orchestration</li>
                          <li><strong>Deep Search Engine (Port 8000):</strong> <span class="badge stage-2">Stage 2</span> Machine learning classification for PII/non-PII detection</li>
                          <li><strong>Context Search Engine (Port 8001):</strong> <span class="badge stage-3">Stage 3</span> LLM-powered context analysis and false positive filtering</li>
                        </ul>
                      </div>

                      <div style="margin: 20px 0;">
                        <h3>🌍 Supported Languages</h3>
                        <p>The system supports the following languages: <code>korean</code>, <code>english</code>, <code>chinese</code>, <code>japanese</code>, <code>spanish</code>, <code>french</code></p>
                      </div>
                    </section>

                    <section class="section" id="authentication">
                      <h2>🔐 Authentication</h2>
                      <p>Currently, the APIs are designed for development and internal use. No authentication is required, but all endpoints include CORS protection and rate limiting.</p>
                    </section>

                    <section class="section" id="main-api">
                      <h2>🚀 Main Backend API (Port 3001)</h2>
                      <p>The primary API service that coordinates PII detection across multiple engines.</p>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/api/health</strong>
                        </div>
                        <p>Health check endpoint for the main backend service.</p>
                        <div class="response-example">
                          <h4>Response:</h4>
                          <div class="code-block">
{
  <span class="json-key">"status"</span>: <span class="json-string">"healthy"</span>,
  <span class="json-key">"timestamp"</span>: <span class="json-string">"2024-01-15T10:30:00.000Z"</span>,
  <span class="json-key">"version"</span>: <span class="json-string">"1.0.0"</span>,
  <span class="json-key">"uptime"</span>: <span class="json-number">3600</span>
}
                          </div>
                        </div>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/api/search/basic</strong>
                          <span class="badge stage-1">Stage 1</span>
                        </div>
                        <p>Perform basic rule-based PII detection using regex patterns.</p>
                        
                        <h4>Request Body:</h4>
                        <table class="parameter-table">
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Type</th>
                              <th>Required</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><code>text</code></td>
                              <td>string</td>
                              <td class="required">Required</td>
                              <td>Text to analyze for PII</td>
                            </tr>
                            <tr>
                              <td><code>languages</code></td>
                              <td>array</td>
                              <td class="required">Required</td>
                              <td>Array of language codes to use for detection</td>
                            </tr>
                            <tr>
                              <td><code>maxCharacters</code></td>
                              <td>number</td>
                              <td class="optional">Optional</td>
                              <td>Maximum characters to process (default: 10000)</td>
                            </tr>
                          </tbody>
                        </table>

                        <div class="response-example">
                          <h4>Example Request:</h4>
                          <div class="code-block">
{
  <span class="json-key">"text"</span>: <span class="json-string">"My name is John Doe and my email is john@example.com"</span>,
  <span class="json-key">"languages"</span>: [<span class="json-string">"english"</span>],
  <span class="json-key">"maxCharacters"</span>: <span class="json-number">10000</span>
}
                          </div>
                        </div>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/api/search/deep</strong>
                          <span class="badge stage-2">Stage 2</span>
                        </div>
                        <p>Perform advanced ML-based PII classification. Falls back to mock implementation if Deep Search Engine is unavailable.</p>
                        
                        <h4>Request Body:</h4>
                        <p>Same parameters as <code>/api/search/basic</code></p>
                        
                        <div class="response-example">
                          <h4>Response includes:</h4>
                          <ul style="margin-left: 20px;">
                            <li><strong>Binary classification:</strong> Each text segment classified as PII or non-PII</li>
                            <li><strong>Probability scores:</strong> Confidence level for each classification</li>
                            <li><strong>Model information:</strong> Details about the ML model used</li>
                          </ul>
                        </div>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/api/search/context</strong>
                          <span class="badge stage-3">Stage 3</span>
                        </div>
                        <p>Perform context-aware analysis to validate PII detections and filter false positives.</p>
                        
                        <h4>Request Body:</h4>
                        <table class="parameter-table">
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Type</th>
                              <th>Required</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><code>text</code></td>
                              <td>string</td>
                              <td class="required">Required</td>
                              <td>Original text being analyzed</td>
                            </tr>
                            <tr>
                              <td><code>languages</code></td>
                              <td>array</td>
                              <td class="required">Required</td>
                              <td>Language codes</td>
                            </tr>
                            <tr>
                              <td><code>previousDetections</code></td>
                              <td>array</td>
                              <td class="required">Required</td>
                              <td>PII detections from previous stages</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/api/search/status</strong>
                        </div>
                        <p>Get the status of all search engines and their capabilities.</p>
                      </div>

                      <h3>📋 Pattern Management</h3>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/api/patterns</strong>
                        </div>
                        <p>Get summary of all available PII detection patterns across all languages.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/api/patterns/{language}</strong>
                        </div>
                        <p>Get detailed PII patterns for a specific language.</p>
                        
                        <h4>Path Parameters:</h4>
                        <table class="parameter-table">
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Type</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><code>language</code></td>
                              <td>string</td>
                              <td>Language code (korean, english, chinese, japanese, spanish, french)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section class="section" id="deep-search">
                      <h2>🧠 Deep Search Engine API (Port 8000)</h2>
                      <p>Machine learning-powered engine for binary PII classification with training capabilities.</p>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/health</strong>
                        </div>
                        <p>Health check for Deep Search Engine.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/search</strong>
                        </div>
                        <p>Perform deep PII search using ML classification.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/models</strong>
                        </div>
                        <p>List available ML models and their status.</p>
                      </div>

                      <h3>🎓 Training & Model Management</h3>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/train</strong>
                        </div>
                        <p>Initiate model training (background task).</p>
                        
                        <h4>Request Body:</h4>
                        <table class="parameter-table">
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Type</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><code>model_name</code></td>
                              <td>string</td>
                              <td>Name for the new model</td>
                            </tr>
                            <tr>
                              <td><code>languages</code></td>
                              <td>array</td>
                              <td>Languages to train on</td>
                            </tr>
                            <tr>
                              <td><code>epochs</code></td>
                              <td>number</td>
                              <td>Training epochs</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/training/data</strong>
                        </div>
                        <p>Add training data from the labeling system.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/training/status</strong>
                        </div>
                        <p>Get current training status and progress.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/model/deploy</strong>
                        </div>
                        <p>Deploy a specific model version.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/model/backup</strong>
                        </div>
                        <p>Create a backup of the current model.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/model/rollback</strong>
                        </div>
                        <p>Rollback to a previous model backup.</p>
                      </div>
                    </section>

                    <section class="section" id="context-search">
                      <h2>🤖 Context Search Engine API (Port 8001)</h2>
                      <p>LLM-powered engine for context analysis and false positive filtering using Ollama.</p>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/health</strong>
                        </div>
                        <p>Health check including Ollama connectivity status.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/search</strong>
                        </div>
                        <p>Perform context-aware PII analysis and validation.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/models</strong>
                        </div>
                        <p>List available Ollama models.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/validate</strong>
                        </div>
                        <p>Validate a single PII entity using context analysis.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method post">POST</span>
                          <strong>/analyze/false-positives</strong>
                        </div>
                        <p>Check if detected entities are false positives.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/stats</strong>
                        </div>
                        <p>Get engine performance statistics.</p>
                      </div>

                      <div class="endpoint">
                        <div>
                          <span class="method get">GET</span>
                          <strong>/debug</strong>
                        </div>
                        <p>Get debug information about recent context search requests.</p>
                      </div>
                    </section>

                    <section class="section" id="examples">
                      <h2>📝 Usage Examples</h2>
                      
                      <h3>Complete PII Detection Workflow</h3>
                      <div class="code-block">
// Step 1: Basic rule-based detection
const basicResponse = await fetch('http://localhost:3001/api/search/basic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Hello, I'm John Doe. Contact me at john@example.com or 555-123-4567",
    languages: ["english"]
  })
});

// Step 2: Deep ML classification
const deepResponse = await fetch('http://localhost:3001/api/search/deep', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Hello, I'm John Doe. Contact me at john@example.com or 555-123-4567",
    languages: ["english"]
  })
});

// Step 3: Context validation (using results from step 2)
const contextResponse = await fetch('http://localhost:3001/api/search/context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Hello, I'm John Doe. Contact me at john@example.com or 555-123-4567",
    languages: ["english"],
    previousDetections: deepResponse.data.items
  })
});
                      </div>

                      <h3>Health Check All Services</h3>
                      <div class="code-block">
// Check all services
const healthChecks = await Promise.all([
  fetch('http://localhost:3001/api/health'),
  fetch('http://localhost:8000/health'),
  fetch('http://localhost:8001/health')
]);

const statuses = await Promise.all(
  healthChecks.map(response => response.json())
);

console.log('Service statuses:', statuses);
                      </div>
                    </section>

                    <section class="section" id="error-handling">
                      <h2>⚠️ Error Handling</h2>
                      <p>All APIs return consistent error responses with the following structure:</p>
                      
                      <div class="code-block">
{
  <span class="json-key">"success"</span>: <span class="json-boolean">false</span>,
  <span class="json-key">"error"</span>: {
    <span class="json-key">"message"</span>: <span class="json-string">"Error description"</span>,
    <span class="json-key">"code"</span>: <span class="json-string">"ERROR_CODE"</span>,
    <span class="json-key">"timestamp"</span>: <span class="json-string">"2024-01-15T10:30:00.000Z"</span>
  }
}
                      </div>

                      <h3>Common HTTP Status Codes</h3>
                      <table class="parameter-table">
                        <thead>
                          <tr>
                            <th>Status Code</th>
                            <th>Description</th>
                            <th>Common Causes</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><code>400</code></td>
                            <td>Bad Request</td>
                            <td>Invalid request parameters, missing required fields</td>
                          </tr>
                          <tr>
                            <td><code>429</code></td>
                            <td>Too Many Requests</td>
                            <td>Rate limiting exceeded</td>
                          </tr>
                          <tr>
                            <td><code>500</code></td>
                            <td>Internal Server Error</td>
                            <td>Service unavailable, processing error</td>
                          </tr>
                          <tr>
                            <td><code>503</code></td>
                            <td>Service Unavailable</td>
                            <td>Downstream service (ML engines) not available</td>
                          </tr>
                        </tbody>
                      </table>

                      <h3>Fallback Behavior</h3>
                      <p>When ML engines are unavailable, the system provides graceful degradation:</p>
                      <ul style="margin-left: 20px;">
                        <li><strong>Deep Search:</strong> Falls back to mock ML classification</li>
                        <li><strong>Context Search:</strong> Returns conservative classification without validation</li>
                        <li>All responses include metadata indicating fallback mode</li>
                      </ul>
                    </section>
                  </div>
                `
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentationModal;