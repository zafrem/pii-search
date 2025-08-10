import React from 'react';
import { SearchStage } from '../types';

interface SearchControlsProps {
  currentStage: SearchStage;
  isLoading: boolean;
  canProceedToNext: boolean;
  onStartSearch: () => void;
  onNextStage: () => void;
  onReset: () => void;
  onOpenLabeling?: () => void;
  disabled?: boolean;
  hasStage2Results?: boolean;
}

const SearchControls: React.FC<SearchControlsProps> = ({
  currentStage,
  isLoading,
  canProceedToNext,
  onStartSearch,
  onNextStage,
  onReset,
  onOpenLabeling,
  disabled = false,
  hasStage2Results = false
}) => {
  const getButtonText = (): string => {
    if (isLoading) {
      switch (currentStage) {
        case 1: return 'Running Basic Search...';
        case 2: return 'Running Deep Search...';
        case 3: return 'Running Context Search...';
        default: return 'Processing...';
      }
    }

    switch (currentStage) {
      case 1: return 'Start Basic Search';
      case 2: return 'Continue to Deep Search';
      case 3: return 'Continue to Context Search';
      default: return 'Start Search';
    }
  };

  const getButtonAction = () => {
    if (currentStage === 1) {
      return onStartSearch;
    } else {
      return onNextStage;
    }
  };

  const isButtonDisabled = disabled || isLoading || (currentStage > 1 && !canProceedToNext);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex gap-3">
        <button
          onClick={getButtonAction()}
          disabled={isButtonDisabled}
          className={`
            px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
            ${isButtonDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : currentStage === 1
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                : 'bg-secondary-600 text-white hover:bg-secondary-700 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span>{getButtonText()}</span>
          {!isLoading && currentStage < 3 && (
            <span>→</span>
          )}
        </button>

        {currentStage > 1 && (
          <button
            onClick={onReset}
            disabled={isLoading}
            className={`
              px-4 py-3 rounded-lg font-medium border transition-all duration-200
              ${isLoading
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            Reset Search
          </button>
        )}
        
        {/* Labeling Button - Show only after Deep Search (stage 2) is completed */}
        {hasStage2Results && !isLoading && onOpenLabeling && (
          <button
            onClick={onOpenLabeling}
            className="px-4 py-3 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 flex items-center space-x-2"
          >
            <span>📝</span>
            <span>Open Labeling</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-600">
        {currentStage > 1 && !isLoading && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span>Stage {currentStage - 1} completed</span>
          </div>
        )}
        
        {hasStage2Results && !isLoading && (
          <div className="flex items-center space-x-2 text-purple-600">
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <span>Labeling available</span>
          </div>
        )}
        
        {!canProceedToNext && currentStage > 1 && !isLoading && (
          <div className="flex items-center space-x-2 text-warning">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            <span>Complete current stage to proceed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchControls;