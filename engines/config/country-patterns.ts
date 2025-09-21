import { SensitivityLevel } from '../../backend/src/types';

export interface PatternConfig {
  regex?: string;
  normalize?: string;
  validators?: string[];
  sensitivity: SensitivityLevel;
  honorifics?: string[];
  heuristics?: string[];
  non_personal_prefixes?: string[];
  joiners?: string[];
  suffixes?: string[];
  blocked_exchange?: string[];
}

export interface CountryConfig {
  [key: string]: { // PIIType
    [key: string]: PatternConfig; // pattern name or main config
  };
}

export const countryPatterns: Record<string, CountryConfig> = {
  KR: {
    phone: {
      main: {
        regex: "(?:\\+82\\s?1?0|0?10)[-\\s.]?\\d{3,4}[-\\s.]?\\d{4}",
        normalize: "to_e164",
        validators: ["libphonenumber", "carrier_range"],
        sensitivity: "Moderate",
        non_personal_prefixes: ["15", "16", "18"]
      }
    },
    name: {
      main: {
        sensitivity: "Moderate",
        honorifics: ["님", "씨", "과장", "부장", "대표", "선생님"],
        heuristics: ["^[가-힣]{2,4}$", "^[가-힣]{1}\\s?[가-힣]{2}$"]
      }
    },
    national_id: {
      main: {
        regex: "\\b\\d{6}-\\d{7}\\b",
        validators: ["format_only"],
        sensitivity: "High"
      }
    }
  },

  JP: {
    phone: {
      main: {
        regex: "(?:\\+81|0)(?:70|80|90)[-\\s.]?\\d{4}[-\\s.]?\\d{4}",
        normalize: "to_e164",
        validators: ["libphonenumber"],
        sensitivity: "Moderate"
      }
    },
    name: {
      main: {
        sensitivity: "Moderate",
        honorifics: ["さん", "様", "君"],
        joiners: ["\\s", "・", "-", ""]
      }
    },
    national_id: {
      main: {
        regex: "\\b\\d{12}\\b",
        sensitivity: "High"
      }
    }
  },

  US: {
    phone: {
      main: {
        regex: "(?:\\+1\\s?)?\\(?[2-9]\\d{2}\\)?[-\\s.]?[2-9]\\d{2}[-\\s.]?\\d{4}(?:\\s?(?:x|ext)\\s?\\d{1,5})?",
        validators: ["libphonenumber", "blocked_exchange:55501"],
        sensitivity: "Moderate"
      }
    },
    name: {
      main: {
        sensitivity: "Moderate",
        honorifics: ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."],
        suffixes: ["Jr", "Sr", "II", "III", "IV"]
      }
    },
    ssn: {
      main: {
        regex: "\\b\\d{3}-\\d{2}-\\d{4}\\b",
        sensitivity: "High"
      }
    }
  }
};

export const getCountryConfig = (countryCode: string): CountryConfig | undefined => {
  return countryPatterns[countryCode.toUpperCase()];
};

export const getPatternConfig = (countryCode: string, piiType: string): PatternConfig | undefined => {
  const config = getCountryConfig(countryCode);
  return config?.[piiType]?.main;
};