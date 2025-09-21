import {
  EnhancedPIIItem,
  EnhancedSearchResponse,
  PIIType,
  SearchRequest,
  SensitivityLevel,
  Locale,
  NormalizedData
} from '../../backend/src/types';
import { countryPatterns, PatternConfig } from '../config/country-patterns';

export interface CountrySearchRequest extends SearchRequest {
  countries?: string[]; // ISO country codes
}

export class CountryBasedEngine {
  private static instance: CountryBasedEngine;

  public static getInstance(): CountryBasedEngine {
    if (!CountryBasedEngine.instance) {
      CountryBasedEngine.instance = new CountryBasedEngine();
    }
    return CountryBasedEngine.instance;
  }

  public async search(request: CountrySearchRequest): Promise<EnhancedSearchResponse> {
    const startTime = Date.now();

    try {
      const { text, countries = ['KR', 'JP', 'US'] } = request;

      if (!text || text.trim().length === 0) {
        throw new Error('Text input is required');
      }

      const items: EnhancedPIIItem[] = [];

      // Search each country's patterns
      for (const countryCode of countries) {
        const countryItems = this.searchWithCountryPatterns(text, countryCode);
        items.push(...countryItems);
      }

      const deduplicatedItems = this.deduplicateItems(items);
      const summary = this.generateSummary(deduplicatedItems);
      const metadata = this.generateMetadata(deduplicatedItems);
      const processingTime = Date.now() - startTime;

      return {
        stage: 1,
        method: 'enhanced_rule_based',
        items: deduplicatedItems,
        summary,
        processingTime,
        metadata
      };

    } catch (error) {
      throw new Error(`Country-based search failed: ${(error as Error).message}`);
    }
  }

  private searchWithCountryPatterns(text: string, countryCode: string): EnhancedPIIItem[] {
    const items: EnhancedPIIItem[] = [];
    const countryConfig = countryPatterns[countryCode];

    if (!countryConfig) return items;

    // Search each PII type for this country
    for (const [piiType, typeConfig] of Object.entries(countryConfig)) {
      const config = typeConfig.main;
      if (!config) continue;

      try {
        if (config.regex) {
          // Regex-based search
          const matches = this.findRegexMatches(text, config.regex, piiType as PIIType, countryCode, config);
          items.push(...matches);
        }

        if (config.heuristics) {
          // Heuristic-based search for names
          const matches = this.findHeuristicMatches(text, config.heuristics, piiType as PIIType, countryCode, config);
          items.push(...matches);
        }

      } catch (error) {
        console.warn(`Pattern matching failed for ${piiType} in ${countryCode}:`, (error as Error).message);
      }
    }

    return items;
  }

  private findRegexMatches(
    text: string,
    pattern: string,
    type: PIIType,
    countryCode: string,
    config: PatternConfig
  ): EnhancedPIIItem[] {
    const items: EnhancedPIIItem[] = [];
    const regex = new RegExp(pattern, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchedText = match[0];
      const confidence = this.calculateConfidence(matchedText, type, config);

      // Apply sensitivity adjustments
      const adjustedSensitivity = this.adjustSensitivity(matchedText, type, config);

      const item = this.createEnhancedItem(
        matchedText,
        type,
        countryCode,
        confidence,
        adjustedSensitivity,
        config
      );

      items.push(item);
    }

    return items;
  }

  private findHeuristicMatches(
    text: string,
    heuristics: string[],
    type: PIIType,
    countryCode: string,
    config: PatternConfig
  ): EnhancedPIIItem[] {
    const items: EnhancedPIIItem[] = [];

    for (const heuristic of heuristics) {
      const regex = new RegExp(heuristic, 'g');
      let match;

      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];

        // Check for honorifics context
        const hasHonorificContext = this.checkHonorificContext(text, match.index, config.honorifics || []);
        const confidence = hasHonorificContext ? 0.9 : 0.6;

        const item = this.createEnhancedItem(
          matchedText,
          type,
          countryCode,
          confidence,
          config.sensitivity,
          config
        );

        items.push(item);
      }
    }

    return items;
  }

  private checkHonorificContext(text: string, position: number, honorifics: string[]): boolean {
    const contextWindow = 50;
    const start = Math.max(0, position - contextWindow);
    const end = Math.min(text.length, position + contextWindow);
    const context = text.substring(start, end);

    return honorifics.some(honorific => context.includes(honorific));
  }

  private adjustSensitivity(text: string, type: PIIType, config: PatternConfig): SensitivityLevel {
    if (type === 'phone' && config.non_personal_prefixes) {
      const cleaned = text.replace(/\D/g, '');
      const hasNonPersonalPrefix = config.non_personal_prefixes.some(prefix =>
        cleaned.startsWith(prefix)
      );
      if (hasNonPersonalPrefix) return 'Low';
    }

    return config.sensitivity;
  }

  private calculateConfidence(_text: string, _type: PIIType, config: PatternConfig): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on validators
    if (config.validators) {
      if (config.validators.includes('libphonenumber')) confidence += 0.15;
      if (config.validators.includes('format_only')) confidence += 0.05;
      if (config.validators.includes('carrier_range')) confidence += 0.1;
    }

    return Math.min(confidence, 0.99);
  }

  private createEnhancedItem(
    text: string,
    type: PIIType,
    countryCode: string,
    confidence: number,
    sensitivity: SensitivityLevel,
    config: PatternConfig
  ): EnhancedPIIItem {
    const now = new Date().toISOString();
    const locale = this.getLocaleFromCountry(countryCode);
    const normalized = this.normalizeValue(text, type, config);
    const validators = config.validators || ['format'];
    const dedupe_key = this.generateDedupeKey(text, type, normalized);

    return {
      value: text,
      pii_type: type,
      locale,
      normalized,
      sensitivity,
      confidence,
      context: undefined,
      validators,
      dedupe_key,
      source: `country_pattern:${countryCode}`,
      first_seen: now,
      last_seen: now,
      redaction_status: 'raw',
      retention_policy: 'P1Y',
      legal_basis: 'legal_obligation',
      owner_team: 'sec',
      access_policy_id: sensitivity === 'High' ? 'pii-high' : 'pii-standard'
    };
  }

  private getLocaleFromCountry(countryCode: string): Locale {
    const localeMap: Record<string, Locale> = {
      KR: { country: 'KR', language: 'ko', script: 'Kore' },
      JP: { country: 'JP', language: 'ja', script: 'Jpan' },
      US: { country: 'US', language: 'en', script: 'Latn' },
      DE: { country: 'DE', language: 'de', script: 'Latn' },
      FR: { country: 'FR', language: 'fr', script: 'Latn' }
    };
    return localeMap[countryCode] || { country: countryCode, language: 'en', script: 'Latn' };
  }

  private normalizeValue(text: string, type: PIIType, config: PatternConfig): NormalizedData | undefined {
    if (config.normalize === 'to_e164' && type === 'phone') {
      return this.normalizeToE164(text, config);
    }

    switch (type) {
      case 'email':
        return { canonical: text.toLowerCase() };
      case 'iban':
        return { formatted: text.replace(/\s/g, '').toUpperCase() };
      default:
        return undefined;
    }
  }

  private normalizeToE164(phone: string, _config: PatternConfig): NormalizedData {
    const cleaned = phone.replace(/\D/g, '');

    // Korean mobile numbers
    if (cleaned.startsWith('010') && cleaned.length === 11) {
      return { e164: `+82${cleaned.substring(1)}` };
    }

    // Japanese mobile numbers
    if (cleaned.startsWith('0') && (cleaned.startsWith('070') || cleaned.startsWith('080') || cleaned.startsWith('090'))) {
      return { e164: `+81${cleaned.substring(1)}` };
    }

    // US numbers
    if (cleaned.length === 10) {
      return { e164: `+1${cleaned}` };
    }

    return { formatted: cleaned };
  }

  private generateDedupeKey(text: string, type: PIIType, normalized?: NormalizedData): string {
    const key = normalized?.e164 || normalized?.canonical || normalized?.formatted || text;
    return `${type}:${key}`;
  }

  private deduplicateItems(items: EnhancedPIIItem[]): EnhancedPIIItem[] {
    const uniqueItems = new Map<string, EnhancedPIIItem>();

    for (const item of items) {
      const key = item.dedupe_key;

      if (!uniqueItems.has(key)) {
        uniqueItems.set(key, item);
      } else {
        const existing = uniqueItems.get(key)!;
        // Keep item with higher confidence
        if (item.confidence > existing.confidence) {
          uniqueItems.set(key, item);
        }
      }
    }

    return Array.from(uniqueItems.values());
  }

  private generateSummary(items: EnhancedPIIItem[]) {
    const typeBreakdown: Partial<Record<PIIType, number>> = {};
    const languageBreakdown: Record<string, number> = {};

    for (const item of items) {
      typeBreakdown[item.pii_type] = (typeBreakdown[item.pii_type] || 0) + 1;
      languageBreakdown[item.locale.country] = (languageBreakdown[item.locale.country] || 0) + 1;
    }

    return {
      totalItems: items.length,
      detectedItems: items.length,
      detectionRate: 100,
      languageBreakdown,
      typeBreakdown
    };
  }

  private generateMetadata(items: EnhancedPIIItem[]) {
    const total_sensitivity_breakdown: Record<SensitivityLevel, number> = { High: 0, Moderate: 0, Low: 0 };
    const validator_usage: Record<string, number> = {};
    const locale_breakdown: Record<string, number> = {};

    for (const item of items) {
      total_sensitivity_breakdown[item.sensitivity]++;

      for (const validator of item.validators) {
        validator_usage[validator] = (validator_usage[validator] || 0) + 1;
      }

      const localeKey = `${item.locale.country}-${item.locale.language}`;
      locale_breakdown[localeKey] = (locale_breakdown[localeKey] || 0) + 1;
    }

    return {
      total_sensitivity_breakdown,
      validator_usage,
      locale_breakdown
    };
  }
}