import { 
  BasicSearchItem, 
  BasicSearchResponse, 
  Language, 
  PIIType,
  ResultSummary,
  SearchRequest
} from '../../backend/src/types';
import { getPatternsByLanguages } from '../patterns';
import { generateId } from '../utils/helpers';

export class RuleBasedEngine {
  private static instance: RuleBasedEngine;
  
  public static getInstance(): RuleBasedEngine {
    if (!RuleBasedEngine.instance) {
      RuleBasedEngine.instance = new RuleBasedEngine();
    }
    return RuleBasedEngine.instance;
  }

  public async search(request: SearchRequest): Promise<BasicSearchResponse> {
    const startTime = Date.now();
    
    try {
      const { text, languages } = request;
      
      if (!text || text.trim().length === 0) {
        throw new Error('Text input is required');
      }

      if (!languages || languages.length === 0) {
        throw new Error('At least one language must be selected');
      }

      const maxLength = request.maxCharacters || 10000;
      if (text.length > maxLength) {
        throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
      }

      const patterns = getPatternsByLanguages(languages);
      const items: BasicSearchItem[] = [];

      for (const languagePattern of patterns) {
        const languageItems = this.searchWithLanguagePatterns(
          text, 
          languagePattern.language, 
          languagePattern.patterns
        );
        items.push(...languageItems);
      }

      const deduplicatedItems = this.deduplicateItems(items);
      const summary = this.generateSummary(deduplicatedItems);
      const processingTime = Date.now() - startTime;

      return {
        stage: 1,
        method: 'rule_based',
        items: deduplicatedItems,
        summary,
        processingTime
      };

    } catch (error) {
      throw new Error(`Rule-based search failed: ${(error as Error).message}`);
    }
  }

  private searchWithLanguagePatterns(
    text: string, 
    language: Language, 
    patterns: any[]
  ): BasicSearchItem[] {
    const items: BasicSearchItem[] = [];

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.pattern, pattern.flags || 'g');
        let match;

        while ((match = regex.exec(text)) !== null) {
          const matchedText = match[0];
          const originalPosition = {
            start: match.index,
            end: match.index + matchedText.length
          };

          const isDetected = this.validateMatch(matchedText, pattern.type);

          const item: BasicSearchItem = {
            id: generateId(),
            text: matchedText,
            type: pattern.type,
            language,
            position: originalPosition,
            isDetected,
            source: `regex_pattern`
          };

          items.push(item);

          if (regex.global === false) break;
        }
      } catch (error) {
        console.warn(`Pattern matching failed for ${pattern.type} in ${language}:`, (error as Error).message);
      }
    }

    return items;
  }


  private validateMatch(text: string, type: PIIType): boolean {
    try {
      switch (type) {
        case 'phone':
          return this.validatePhone(text);
        case 'email':
          return this.validateEmail(text);
        case 'credit_card':
          return this.validateCreditCard(text);
        case 'ssn':
          return this.validateSSN(text);
        default:
          // Basic validation for other types
          return text.trim().length > 0;
      }
    } catch (error) {
      return false;
    }
  }

  private validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    return this.luhnCheck(cleaned);
  }

  private validateSSN(ssn: string): boolean {
    const cleaned = ssn.replace(/\D/g, '');
    
    if (cleaned.length !== 9) {
      return false;
    }

    const area = cleaned.substring(0, 3);
    const group = cleaned.substring(3, 5);
    const serial = cleaned.substring(5, 9);

    if (area === '000' || area === '666' || parseInt(area) >= 900) {
      return false;
    }

    if (group === '00' || serial === '0000') {
      return false;
    }

    return true;
  }

  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let alternate = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let n = parseInt(cardNumber.charAt(i), 10);

      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }

      sum += n;
      alternate = !alternate;
    }

    return (sum % 10) === 0;
  }

  private deduplicateItems(items: BasicSearchItem[]): BasicSearchItem[] {
    const uniqueItems = new Map<string, BasicSearchItem>();

    for (const item of items) {
      const key = `${item.text}_${item.position.start}_${item.position.end}_${item.type}`;
      
      if (!uniqueItems.has(key)) {
        uniqueItems.set(key, item);
      } else {
        const existing = uniqueItems.get(key)!;
        if (item.isDetected && !existing.isDetected) {
          uniqueItems.set(key, item);
        }
      }
    }

    return Array.from(uniqueItems.values()).sort((a, b) => a.position.start - b.position.start);
  }

  private generateSummary(items: BasicSearchItem[]): ResultSummary {
    const detectedItems = items.filter(item => item.isDetected);
    const languageBreakdown: Record<string, number> = {};
    const typeBreakdown: Partial<Record<PIIType, number>> = {};

    for (const item of detectedItems) {
      languageBreakdown[item.language] = (languageBreakdown[item.language] || 0) + 1;
      typeBreakdown[item.type] = (typeBreakdown[item.type] || 0) + 1;
    }

    return {
      totalItems: items.length,
      detectedItems: detectedItems.length,
      detectionRate: items.length > 0 ? (detectedItems.length / items.length) * 100 : 0,
      languageBreakdown,
      typeBreakdown
    };
  }
}