import { Router, Request, Response } from 'express';
import { asyncHandler, createAPIError } from '../middleware/errorHandler';
import { getPatternsByLanguage, allPatterns } from '../../../engines/patterns';
import { Language } from '../types';

const router = Router();

router.get('/:language', asyncHandler(async (req: Request, res: Response) => {
  const { language } = req.params;
  
  if (!language) {
    throw createAPIError('Language parameter is required', 400);
  }

  const validLanguages: Language[] = ['korean', 'english', 'chinese', 'japanese', 'spanish', 'french'];
  
  if (!validLanguages.includes(language as Language)) {
    throw createAPIError(
      `Invalid language: ${language}. Supported languages: ${validLanguages.join(', ')}`,
      400
    );
  }

  try {
    const patterns = getPatternsByLanguage(language as Language);
    
    res.json({
      success: true,
      data: {
        language: patterns.language,
        patterns: patterns.patterns.map((pattern: any) => ({
          type: pattern.type,
          description: pattern.description,
          examples: pattern.examples,
          flags: pattern.flags
        })),
        contextRules: patterns.contextRules || []
      },
      metadata: {
        timestamp: new Date().toISOString(),
        patternCount: patterns.patterns.length,
        contextRuleCount: patterns.contextRules?.length || 0
      }
    });

  } catch (error) {
    throw createAPIError(`Failed to retrieve patterns for ${language}: ${(error as Error).message}`, 500);
  }
}));

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const allLanguagePatterns = Object.entries(allPatterns).map(([language, patterns]) => ({
      language,
      patternCount: patterns.patterns.length,
      contextRuleCount: patterns.contextRules?.length || 0,
      supportedTypes: [...new Set(patterns.patterns.map(p => p.type))]
    }));

    res.json({
      success: true,
      data: {
        languages: allLanguagePatterns,
        summary: {
          totalLanguages: allLanguagePatterns.length,
          totalPatterns: allLanguagePatterns.reduce((sum, lang) => sum + lang.patternCount, 0),
          totalContextRules: allLanguagePatterns.reduce((sum, lang) => sum + lang.contextRuleCount, 0),
          supportedTypes: [
            'phone', 'email', 'ssn', 'credit_card', 'name', 
            'address', 'organization', 'date', 'id_number', 'postal_code'
          ]
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0'
      }
    });

  } catch (error) {
    throw createAPIError(`Failed to retrieve pattern summary: ${(error as Error).message}`, 500);
  }
}));

router.put('/:language', asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Pattern update functionality not yet implemented',
      feature: 'pattern_update',
      timestamp: new Date().toISOString()
    }
  });
}));

export default router;