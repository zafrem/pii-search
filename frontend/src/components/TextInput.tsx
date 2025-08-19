import React, { useState, useRef, useEffect } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  disabled?: boolean;
  disabledReason?: 'loading' | 'search_active' | 'other';
  isLoading?: boolean;
  isExpanded?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onSearch,
  disabled = false,
  disabledReason = 'other',
  isLoading = false,
  isExpanded = false
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!expanded) {
        // Don't prevent default - allow the newline to be created
        setExpanded(true);
        // Focus the textarea after expansion
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
      // If already expanded, allow normal Enter behavior for new lines
    }
  };

  const handleSearch = () => {
    if (!disabled && value.trim()) {
      onSearch();
    }
  };

  const getDisabledMessage = (): string => {
    switch (disabledReason) {
      case 'loading':
        return 'Text input is disabled while search is in progress';
      case 'search_active':
        return 'Text input is disabled during active search session. Reset to enable editing.';
      default:
        return 'Text input is currently disabled';
    }
  };

  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);

  const characterCount = value.length;
  const isNearLimit = characterCount > 9000;
  const isOverLimit = characterCount > 10000;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <textarea
          ref={textareaRef}
          rows={expanded ? 6 : 1}
          className={`
            w-full pr-16 px-4 py-3 border-2 rounded-full shadow-lg resize-none transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${expanded ? 'rounded-2xl' : 'rounded-full'}
            ${disabled 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' 
              : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400'
            }
            ${isOverLimit ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          `}
          placeholder="Search for PII in your text..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          maxLength={10000}
          style={{
            fontSize: expanded ? '14px' : '16px',
            lineHeight: expanded ? '1.5' : '1.2'
          }}
        />
        
        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={disabled || !value.trim() || isOverLimit}
          className={`
            absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-200
            ${disabled || !value.trim() || isOverLimit
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            }
          `}
          title="Search for PII"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>

        {/* Character Count */}
        {expanded && (
          <div className={`absolute bottom-2 right-16 text-xs ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-400'}`}>
            {characterCount.toLocaleString()}/10,000
          </div>
        )}

        {/* Disabled Overlay */}
        {disabled && (
          <div className={`absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center ${expanded ? 'rounded-2xl' : 'rounded-full'}`}>
            <div className="bg-white px-3 py-2 rounded-lg shadow-lg border max-w-xs text-center">
              <p className="text-sm text-gray-600">
                {getDisabledMessage()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hint text */}
      {!expanded && !disabled && !value && (
        <div className="text-center mt-2 text-sm text-gray-500">
          Press Enter to expand or start typing to begin your PII search
        </div>
      )}

      {/* Character limit warning */}
      {expanded && isOverLimit && (
        <div className="text-center mt-2 text-sm text-red-600">
          Text exceeds maximum length. Please reduce by {(characterCount - 10000).toLocaleString()} characters.
        </div>
      )}

      {/* Disabled info for search active */}
      {disabled && disabledReason === 'search_active' && (
        <div className="text-center mt-2 text-sm text-blue-600">
          Text is locked during search analysis. Reset to modify.
        </div>
      )}
    </div>
  );
};

export default TextInput;