import React from 'react';
import { Language, LanguageOption } from '../types';

interface LanguageSelectorProps {
  selectedLanguages: Language[];
  onChange: (languages: Language[]) => void;
  disabled?: boolean;
  disabledReason?: 'loading' | 'search_active' | 'other';
}

const languageOptions: LanguageOption[] = [
  { value: 'korean', label: '한국어 (Korean)', flag: '🇰🇷' },
  { value: 'english', label: 'English', flag: '🇺🇸' },
  { value: 'chinese', label: '中文 (Chinese)', flag: '🇨🇳' },
  { value: 'japanese', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { value: 'spanish', label: 'Español (Spanish)', flag: '🇪🇸' },
  { value: 'french', label: 'Français (French)', flag: '🇫🇷' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguages,
  onChange,
  disabled = false,
  disabledReason = 'other'
}) => {
  const handleLanguageToggle = (language: Language) => {
    if (disabled) return;

    const isSelected = selectedLanguages.includes(language);
    if (isSelected) {
      onChange(selectedLanguages.filter(lang => lang !== language));
    } else {
      onChange([...selectedLanguages, language]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange(languageOptions.map(option => option.value));
  };

  const handleSelectNone = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Select Languages for Detection
        </label>
        <div className="space-x-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-xs text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={handleSelectNone}
            disabled={disabled}
            className="text-xs text-gray-600 hover:text-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Select None
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {languageOptions.map((option) => {
          const isSelected = selectedLanguages.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleLanguageToggle(option.value)}
              disabled={disabled}
              className={`
                relative flex items-center p-3 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }
                ${disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-sm'
                }
              `}
            >
              <span className="text-lg mr-2">{option.flag}</span>
              <span className="text-sm font-medium flex-1 text-left">
                {option.label}
              </span>
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {disabled && disabledReason === 'search_active' && (
        <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">i</span>
          </div>
          <p>
            Language selection is locked during search analysis. Click "Reset Search" to modify languages.
          </p>
        </div>
      )}
      
      {!disabled && selectedLanguages.length > 0 && (
        <div className="text-xs text-gray-600">
          Selected: {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;