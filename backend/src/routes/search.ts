import { Router, Request, Response } from 'express';
import { RuleBasedEngine } from '../../../engines/stage1/ruleBasedEngine';
import { asyncHandler, createAPIError } from '../middleware/errorHandler';
import { SearchRequest, Language } from '../types';
import { sanitizeInput } from '../../../engines/utils/helpers';

const router = Router();
const ruleBasedEngine = RuleBasedEngine.getInstance();

// Mock Deep Search implementation when engine is not available
const generateMockDeepSearchResult = (text: string, stage1Weights: any[] = []) => {
  // Simple sentence segmentation - split by sentence endings not in email addresses
  const sentences = text.split(/\.(?!\w+@|\w+\.\w+@)(?=\s|$)|[!?]+/).filter(s => s.trim().length > 0);
  const items = [];
  let currentPos = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    
    const startPos = text.indexOf(sentence, currentPos);
    
    if (startPos !== -1) {
      // Enhanced PII detection based on patterns and Stage 1 weights
      const containsPII = /\b(name|email|phone|address|ssn|card|@[\w.-]+\.\w+|\d{3}-\d{2}-\d{4}|\d{3}-\d{3}-\d{4}|[A-Za-z]+\s+[A-Za-z]+(?=\s+(and|or|is|was)))\b/i.test(sentence);
      
      // Check if this sentence overlaps with any Stage 1 weights
      let hasStage1Weight = false;
      for (const weight of stage1Weights) {
        if (sentence.toLowerCase().includes(weight.text.toLowerCase())) {
          hasStage1Weight = true;
          break;
        }
      }
      
      let probability = containsPII ? 0.75 + Math.random() * 0.2 : 0.15 + Math.random() * 0.3;
      if (hasStage1Weight) {
        probability = Math.min(0.95, probability + 0.25); // Boost probability for Stage 1 weighted items
      }
      
      items.push({
        id: `mock_seg_${i}`,
        text: sentence,
        classification: containsPII ? 'pii' : 'non_pii',
        language: 'english',
        position: {
          start: startPos,
          end: startPos + sentence.length
        },
        probability: Math.round(probability * 100) / 100,
        confidenceLevel: probability > 0.8 ? 'high' : probability > 0.6 ? 'medium' : 'low',
        sources: ['mock_ml_engine'],
        context: sentence
      });
      
      currentPos = startPos + sentence.length;
    }
  }
  
  const piiItems = items.filter(item => item.classification === 'pii');
  const nonPiiItems = items.filter(item => item.classification === 'non_pii');
  
  return {
    stage: 2,
    method: `ml_classification_mock`,
    items,
    summary: {
      totalItems: items.length,
      detectedItems: piiItems.length,
      highConfidenceItems: items.filter(item => item.confidenceLevel === 'high').length,
      mediumConfidenceItems: items.filter(item => item.confidenceLevel === 'medium').length,
      lowConfidenceItems: items.filter(item => item.confidenceLevel === 'low').length,
      averageProbability: items.length > 0 ? items.reduce((sum, item) => sum + item.probability, 0) / items.length : 0,
      languageBreakdown: { english: items.length },
      classificationBreakdown: { 
        pii: piiItems.length, 
        non_pii: nonPiiItems.length 
      }
    },
    processingTime: 200 + Math.random() * 300, // Mock processing time
    modelInfo: {
      name: 'Mock Simple Learning Engine',
      version: '1.0.0',
      type: 'mock'
    }
  };
};

const validateSearchRequest = (body: any): SearchRequest => {
  const { text, languages, maxCharacters } = body;

  if (!text || typeof text !== 'string') {
    throw createAPIError('Text is required and must be a string', 400);
  }

  if (!languages || !Array.isArray(languages) || languages.length === 0) {
    throw createAPIError('Languages array is required and must contain at least one language', 400);
  }

  const validLanguages: Language[] = ['korean', 'english', 'chinese', 'japanese', 'spanish', 'french'];
  const invalidLanguages = languages.filter(lang => !validLanguages.includes(lang));
  
  if (invalidLanguages.length > 0) {
    throw createAPIError(
      `Invalid languages: ${invalidLanguages.join(', ')}. Supported languages: ${validLanguages.join(', ')}`,
      400
    );
  }

  const sanitizedText = sanitizeInput(text, maxCharacters);

  return {
    text: sanitizedText,
    languages: languages as Language[],
    maxCharacters
  };
};

router.post('/basic', asyncHandler(async (req: Request, res: Response) => {

  try {
    const searchRequest = validateSearchRequest(req.body);
    
    const result = await ruleBasedEngine.search(searchRequest);

    res.json({
      success: true,
      data: result,
      metadata: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0'
      }
    });

  } catch (error) {
    
    if ((error as any).statusCode) {
      throw error;
    } else {
      throw createAPIError(`Basic search failed: ${(error as Error).message}`, 500);
    }
  }
}));

// Test enhanced format endpoint
router.post('/test-enhanced', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { text, language = 'english' } = req.body;

    if (!text || typeof text !== 'string') {
      throw createAPIError('Text is required and must be a string', 400);
    }

    // Use the actual rule-based engine to find patterns
    const searchResult = ruleBasedEngine.search(text, [language as Language]);

    // Transform basic results to enhanced format
    const enhancedItems = searchResult.items.map(item => {
      return ruleBasedEngine.createEnhancedPIIItem(
        item.text,
        item.type,
        item.language,
        0.90, // Standard confidence for rule-based matches
        `file:test#enhanced`
      );
    });

    const result = {
      stage: 1,
      method: 'enhanced_rule_based',
      items: enhancedItems,
      summary: {
        totalItems: enhancedItems.length,
        detectedItems: enhancedItems.length,
        detectionRate: 100
      },
      processingTime: 5,
      metadata: {
        total_sensitivity_breakdown: enhancedItems.reduce((acc, item) => {
          acc[item.sensitivity] = (acc[item.sensitivity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        validator_usage: enhancedItems.reduce((acc, item) => {
          item.validators.forEach(v => {
            acc[v] = (acc[v] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        locale_breakdown: enhancedItems.reduce((acc, item) => {
          const key = `${item.locale.country}-${item.locale.language}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    res.json({
      success: true,
      data: result,
      metadata: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0',
        note: 'Enhanced format test endpoint'
      }
    });

  } catch (error) {
    if ((error as any).statusCode) {
      throw error;
    } else {
      throw createAPIError(`Enhanced test failed: ${(error as Error).message}`, 500);
    }
  }
}));

// Configuration reload endpoint - triggers pattern reload
router.post('/reload-config', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Import configLoader and trigger reload
    const { configLoader } = await import('../../../engines/utils/configLoader');
    configLoader.reloadConfig();

    // Get updated pattern counts using configLoader
    const patternData = configLoader.getAllPatterns();

    res.json({
      success: true,
      data: {
        message: 'Patterns configuration reloaded successfully',
        languages: Object.keys(patternData).map(lang => {
          const language = lang as Language;
          const data = patternData[language];
          return {
            language: language,
            patternCount: data.patterns.length,
            contextRuleCount: data.contextRules?.length || 0
          };
        })
      },
      metadata: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0'
      }
    });

  } catch (error) {
    throw createAPIError(`Configuration reload failed: ${(error as Error).message}`, 500);
  }
}));

router.post('/deep', asyncHandler(async (req: Request, res: Response) => {
  try {
    const searchRequest = validateSearchRequest(req.body);
    const { stage1Results } = req.body; // Accept Stage 1 results as weights
    
    // Prepare stage 1 weights if available
    let stage1Weights = [];
    if (stage1Results && stage1Results.items) {
      stage1Weights = stage1Results.items
        .filter((item: any) => item.isDetected) // Only use detected items as weights
        .map((item: any) => ({
          text: item.text,
          type: item.type,
          position: item.position,
          weight: 1.0, // Base weight for rule-based detections
          source: 'stage1_rule_based'
        }));
    }
    
    // Call Deep Search Engine API with stage 1 weights
    const deepSearchResponse = await fetch('http://localhost:8000/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: searchRequest.text,
        languages: searchRequest.languages,
        confidence_threshold: 0.3,
        max_characters: searchRequest.maxCharacters,
        stage1_weights: stage1Weights // Pass stage 1 results as weights
      })
    });

    if (!deepSearchResponse.ok) {
      throw new Error(`Deep Search Engine responded with status: ${deepSearchResponse.status}`);
    }

    const deepSearchData = await deepSearchResponse.json() as any;

    // Transform the response to match our API format
    const result = {
      stage: 2,
      method: 'ml_classification',
      items: deepSearchData.data?.items || [],
      summary: deepSearchData.data?.summary || {},
      processingTime: deepSearchData.data?.processingTime || 0,
      modelInfo: deepSearchData.data?.modelInfo || {}
    };

    res.json({
      success: true,
      data: result,
      metadata: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0'
      }
    });

  } catch (error) {
    // If Deep Search engine is not available, use mock implementation
    if ((error as Error).message.includes('fetch failed') || (error as Error).message.includes('ECONNREFUSED')) {
      console.warn('Deep Search engine not available, using mock implementation');
      
      try {
        const searchRequest = validateSearchRequest(req.body);
        console.log('Mock deep search - validated request:', { textLength: searchRequest.text.length, languages: searchRequest.languages });
        
        const { stage1Results } = req.body;
        const stage1Weights = stage1Results?.items?.filter((item: any) => item.isDetected) || [];
        console.log('Mock deep search - stage1 weights:', stage1Weights.length, 'items');
        
        const mockResult = generateMockDeepSearchResult(searchRequest.text, stage1Weights);
        console.log('Mock deep search - generated result with', mockResult.items.length, 'items');
        
        res.json({
          success: true,
          data: mockResult,
          metadata: {
            requestId: req.headers['x-request-id'] || 'unknown',
            timestamp: new Date().toISOString(),
            apiVersion: '1.0.0',
            note: 'Mock implementation - Deep Search engine not running'
          }
        });
        console.log('Mock deep search - response sent successfully');
        return;
      } catch (mockError) {
        console.error('Error in mock deep search implementation:', mockError);
        throw createAPIError(`Mock deep search failed: ${(mockError as Error).message}`, 500);
      }
    }
    
    if ((error as any).statusCode) {
      throw error;
    } else {
      throw createAPIError(`Deep search failed: ${(error as Error).message}`, 500);
    }
  }
}));

router.post('/context', asyncHandler(async (req: Request, res: Response) => {
  try {
    const searchRequest = validateSearchRequest(req.body);
    const { previousDetections } = req.body;
    
    // Enhanced debug logging
    console.log('Context search request:', {
      textLength: searchRequest.text.length,
      textPreview: searchRequest.text.substring(0, 100) + '...',
      languages: searchRequest.languages,
      previousDetectionsCount: previousDetections?.length || 0,
      previousDetections: previousDetections?.map((d: any) => ({
        text: d.text,
        type: d.type,
        position: d.position
      }))
    });
    
    if (!previousDetections || !Array.isArray(previousDetections)) {
      throw createAPIError('Previous detections are required for context search', 400);
    }
    
    // Helper function to infer PII type from text content
    const inferPiiType = (text: string): string => {
      // Clean the text by removing punctuation for better pattern matching
      const cleanText = text.replace(/[,.\s]+$/, ''); // Remove trailing punctuation and spaces
      
      // Phone number patterns - check clean text first
      if (/^\d{3}-\d{3,4}-\d{4}$/.test(cleanText) || /^\d{10,11}$/.test(cleanText.replace(/[\s-]/g, ''))) {
        return 'phone';
      }
      
      // Email pattern
      if (/@[\w.-]+\.\w+/.test(cleanText)) {
        return 'email';
      }
      
      // Credit card patterns
      if (/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(cleanText)) {
        return 'credit_card';
      }
      
      // SSN patterns
      if (/^\d{3}-\d{2}-\d{4}$/.test(cleanText)) {
        return 'ssn';
      }
      
      // Address patterns (basic)
      if (/\d+\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane)/i.test(text)) {
        return 'address';
      }
      
      // Date patterns
      if (/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) {
        return 'date';
      }
      
      // Organization patterns (ends with Corp, Inc, LLC, etc.)
      if (/(corp|corporation|inc|incorporated|llc|ltd|limited|company|co\.)$/i.test(text)) {
        return 'organization';
      }
      
      // Postal code patterns
      if (/^\d{5}(-\d{4})?$/.test(text) || /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(text)) {
        return 'postal_code';
      }
      
      // ID number patterns (generic)
      if (/^[A-Z0-9]{5,20}$/.test(text.replace(/[\s-]/g, ''))) {
        return 'id_number';
      }
      
      // Default to name if no specific pattern matches
      return 'name';
    };

    // Transform previous detections to match Context Search Engine format
    const transformedDetections = previousDetections.map((detection: any, index: number) => ({
      id: detection.id || `ctx_det_${index}`,
      text: detection.text || '',
      type: inferPiiType(detection.text || ''),
      language: detection.language === 'universal' ? 'english' : (detection.language || 'english'),
      position: {
        start: detection.position?.start || 0,
        end: detection.position?.end || detection.text?.length || 0
      },
      probability: detection.probability || 0.5,
      confidence_level: detection.confidenceLevel || 'medium',
      sources: detection.sources || ['previous_stage'],
      context: detection.context || detection.text
    }));

    // Call Context Search Engine API
    const contextSearchResponse = await fetch('http://localhost:8001/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: searchRequest.text,
        languages: searchRequest.languages,
        previous_detections: transformedDetections,
        analysis_mode: 'standard',
        confidence_threshold: 0.7,
        max_characters: searchRequest.maxCharacters
      })
    });

    if (!contextSearchResponse.ok) {
      throw new Error(`Context Search Engine responded with status: ${contextSearchResponse.status}`);
    }

    const contextSearchData = await contextSearchResponse.json() as any;

    // Transform the response to match our API format
    const result = {
      stage: 3,
      method: 'context_analysis',
      items: contextSearchData.data?.items || [],
      summary: contextSearchData.data?.summary || {},
      processingTime: contextSearchData.data?.processingTime || 0,
      modelInfo: contextSearchData.data?.modelInfo || {},
      analysisMetadata: contextSearchData.data?.analysisMetadata || {}
    };

    res.json({
      success: true,
      data: result,
      metadata: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0'
      }
    });

  } catch (error) {
    // If Context Search engine is not available, return a graceful degradation
    if ((error as Error).message.includes('fetch failed') || (error as Error).message.includes('ECONNREFUSED')) {
      console.warn('Context Search engine not available, providing basic filtering');
      
      validateSearchRequest(req.body);
      const { previousDetections } = req.body;
      
      // Simple fallback: return the previous detections with minimal processing
      const fallbackResult = {
        stage: 3,
        method: 'context_analysis_fallback',
        items: (previousDetections || []).map((detection: any, index: number) => ({
          id: detection.id || `fallback_${index}`,
          text: detection.text || '',
          type: detection.type || 'name',
          language: detection.language || 'english',
          position: detection.position || { start: 0, end: 0 },
          probability: Math.max(0.1, (detection.probability || 0.5) * 0.9), // Slightly reduce confidence
          confidenceLevel: detection.confidenceLevel || 'medium',
          sources: [...(detection.sources || []), 'context_fallback'],
          context: detection.context || detection.text,
          analysis: {
            isGenuinePII: true, // Conservative approach
            confidence: 0.7,
            reason: 'Context analysis unavailable - conservative classification',
            riskLevel: 'medium',
            culturalContext: '',
            falsePositiveIndicators: [],
            privacyImplications: 'Context validation not performed'
          },
          originalProbability: detection.probability || 0.5,
          isValidated: false
        })),
        summary: {
          totalItems: (previousDetections || []).length,
          validatedItems: 0,
          falsePositives: 0,
          highRiskItems: 0,
          mediumRiskItems: (previousDetections || []).length,
          lowRiskItems: 0,
          averageConfidence: 0.7
        },
        processingTime: 50,
        modelInfo: {
          name: 'Context Analysis Fallback',
          version: '1.0.0',
          type: 'fallback'
        }
      };
      
      res.json({
        success: true,
        data: fallbackResult,
        metadata: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date().toISOString(),
          apiVersion: '1.0.0',
          note: 'Fallback implementation - Context Search engine not running'
        }
      });
      return;
    }
    
    if ((error as any).statusCode) {
      throw error;
    } else {
      throw createAPIError(`Context search failed: ${(error as Error).message}`, 500);
    }
  }
}));

router.get('/status', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      stage1: {
        name: 'Rule-based Search',
        status: 'active',
        description: 'Regex pattern matching for basic PII detection'
      },
      stage2: {
        name: 'Deep Search',
        status: 'active',
        description: 'Binary ML Classification (PII/non-PII) for advanced detection'
      },
      stage3: {
        name: 'Context Search',
        status: 'active',
        description: 'LLM-powered context validation and false positive filtering'
      }
    },
    metadata: {
      timestamp: new Date().toISOString(),
      supportedLanguages: ['korean', 'english', 'chinese', 'japanese', 'spanish', 'french'],
      maxTextLength: 10000
    }
  });
}));

export default router;