import React from 'react';
import { SearchStage } from '../types';

interface SearchControlsProps {
  currentStage: SearchStage;
  isLoading: boolean;
  canProceedToNext: boolean;
  onStartSearch: () => void;
  onNextStage: () => void;
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
  onOpenLabeling,
  disabled = false,
  hasStage2Results = false
}) => {
  // Debug logging for button state
  console.log('SearchControls render:', {
    currentStage,
    disabled,
    isLoading,
    canProceedToNext
  });

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex gap-3">
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