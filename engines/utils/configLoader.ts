import * as fs from 'fs';
import * as path from 'path';
import { LanguagePatterns, Language, PatternDefinition, ContextRule } from '../../backend/src/types';

interface PatternConfig {
  version: string;
  description: string;
  lastUpdated: string;
  defaultSettings: {
    caseSensitive: boolean;
    confidenceThreshold: number;
    maxContextDistance: number;
  };
  languages: Record<Language, {
    language: Language;
    patterns: (PatternDefinition & { confidence: number })[];
    contextRules: ContextRule[];
  }>;
  globalSettings: {
    enabledLanguages: Language[];
    enabledPIITypes: string[];
    strictMode: boolean;
    allowOverrides: boolean;
  };
}

class ConfigLoader {
  private static instance: ConfigLoader;
  private config: PatternConfig | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(__dirname, '../../config/patterns.json');
  }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public loadConfig(): PatternConfig {
    if (this.config) {
      return this.config;
    }

    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      return this.config!;
    } catch (error) {
      throw new Error(`Failed to load pattern configuration: ${error}`);
    }
  }

  public getLanguagePatterns(language: Language): LanguagePatterns {
    const config = this.loadConfig();
    const languageConfig = config.languages[language];
    
    if (!languageConfig) {
      throw new Error(`Language '${language}' not found in configuration`);
    }

    return {
      language: languageConfig.language,
      patterns: languageConfig.patterns.map(pattern => ({
        type: pattern.type,
        pattern: pattern.pattern,
        flags: pattern.flags,
        description: pattern.description,
        examples: pattern.examples
      })),
      contextRules: languageConfig.contextRules
    };
  }

  public getAllPatterns(): Record<Language, LanguagePatterns> {
    const config = this.loadConfig();
    const result: Record<Language, LanguagePatterns> = {} as Record<Language, LanguagePatterns>;

    for (const language of config.globalSettings.enabledLanguages) {
      result[language] = this.getLanguagePatterns(language);
    }

    return result;
  }

  public getEnabledLanguages(): Language[] {
    const config = this.loadConfig();
    return config.globalSettings.enabledLanguages;
  }

  public getGlobalSettings() {
    const config = this.loadConfig();
    return config.globalSettings;
  }

  public getDefaultSettings() {
    const config = this.loadConfig();
    return config.defaultSettings;
  }

  public reloadConfig(): void {
    this.config = null;
    this.loadConfig();
  }

  public validateConfig(): boolean {
    try {
      const config = this.loadConfig();
      
      // Basic validation
      if (!config.languages || !config.globalSettings) {
        return false;
      }

      // Validate each language has required fields
      for (const language of config.globalSettings.enabledLanguages) {
        const langConfig = config.languages[language];
        if (!langConfig || !langConfig.patterns || !Array.isArray(langConfig.patterns)) {
          return false;
        }

        // Validate each pattern has required fields
        for (const pattern of langConfig.patterns) {
          if (!pattern.type || !pattern.pattern || !pattern.description) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

export const configLoader = ConfigLoader.getInstance();