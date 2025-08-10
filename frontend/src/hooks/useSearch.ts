import { useState, useCallback } from 'react';
import { 
  SearchState, 
  SearchRequest, 
  ContextSearchRequest,
  Language, 
  SearchStage, 
  StageProgress,
  BasicSearchResponse,
  ProbabilitySearchResponse,
  DeepSearchResponse
} from '../types';
import { searchAPI, APIError } from '../services/api';

const initialState: SearchState = {
  stage: 1,
  isLoading: false,
  text: '',
  selectedLanguages: ['korean', 'english', 'chinese', 'japanese', 'spanish', 'french'],
  results: {},
  error: undefined
};

export const useSearch = () => {
  const [state, setState] = useState<SearchState>(initialState);

  const updateText = useCallback((text: string) => {
    setState(prev => ({ ...prev, text, error: undefined }));
  }, []);

  const updateLanguages = useCallback((languages: Language[]) => {
    setState(prev => ({ ...prev, selectedLanguages: languages, error: undefined }));
  }, []);

  const validateSearchInput = (): boolean => {
    if (!state.text.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter text to analyze' }));
      return false;
    }

    if (state.selectedLanguages.length === 0) {
      setState(prev => ({ ...prev, error: 'Please select at least one language' }));
      return false;
    }

    if (state.text.length > 10000) {
      setState(prev => ({ ...prev, error: 'Text exceeds maximum length of 10,000 characters' }));
      return false;
    }

    return true;
  };

  const executeSearch = useCallback(async (stage: SearchStage) => {
    if (!validateSearchInput()) return;

    const request: SearchRequest = {
      text: state.text,
      languages: state.selectedLanguages,
      maxCharacters: 10000
    };

    setState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      switch (stage) {
        case 1: {
          const result: BasicSearchResponse = await searchAPI.basic(request);
          setState(prev => ({
            ...prev,
            results: { ...prev.results, stage1: result },
            stage: 2,
            isLoading: false
          }));
          break;
        }
        
        case 2: {
          const result: DeepSearchResponse = await searchAPI.deep(request);
          setState(prev => ({
            ...prev,
            results: { ...prev.results, stage2: result },
            stage: 3,
            isLoading: false
          }));
          break;
        }
        
        case 3: {
          // For context search, we need to pass previous detections from stage 2
          const previousDetections = state.results.stage2?.items || [];
          
          // Debug logging
          console.log('Context search debug:', {
            stage2Results: state.results.stage2,
            previousDetectionsCount: previousDetections.length,
            previousDetections: JSON.stringify(previousDetections, null, 2)
          });
          
          const contextRequest = {
            ...request,
            previousDetections
          };
          const result: ProbabilitySearchResponse = await searchAPI.context(contextRequest);
          setState(prev => ({
            ...prev,
            results: { ...prev.results, stage3: result },
            isLoading: false
          }));
          break;
        }
      }
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof APIError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [state.text, state.selectedLanguages]);

  const startBasicSearch = useCallback(() => {
    executeSearch(1);
  }, [executeSearch]);

  const proceedToNextStage = useCallback(() => {
    // Execute the current stage that the user wants to proceed to
    if (state.stage === 2) {
      executeSearch(2); // Deep Search
    } else if (state.stage === 3) {
      executeSearch(3); // Context Search
    }
  }, [state.stage, executeSearch]);

  const resetSearch = useCallback(() => {
    setState(initialState);
  }, []);

  const getStageProgress = useCallback((): StageProgress[] => {
    return [
      {
        stage: 1,
        isCompleted: !!state.results.stage1,
        isActive: state.stage === 1 && state.isLoading,
        isEnabled: true
      },
      {
        stage: 2,
        isCompleted: !!state.results.stage2,
        isActive: state.stage === 2 && state.isLoading,
        isEnabled: !!state.results.stage1
      },
      {
        stage: 3,
        isCompleted: !!state.results.stage3,
        isActive: state.stage === 3 && state.isLoading,
        isEnabled: !!state.results.stage2
      }
    ];
  }, [state.results, state.stage, state.isLoading]);

  const canProceedToNext = useCallback((): boolean => {
    switch (state.stage) {
      case 1: return false; // Always start with basic search
      case 2: return !!state.results.stage1;
      case 3: return !!state.results.stage2;
      default: return false;
    }
  }, [state.stage, state.results]);

  const hasResults = (): boolean => {
    return !!(state.results.stage1 || state.results.stage2 || state.results.stage3);
  };

  const getCurrentResults = () => {
    if (state.results.stage3) return state.results.stage3;
    if (state.results.stage2) return state.results.stage2;
    if (state.results.stage1) return state.results.stage1;
    return null;
  };

  return {
    // State
    ...state,
    
    // Computed values
    stageProgress: getStageProgress(),
    canProceedToNext: canProceedToNext(),
    hasResults: hasResults(),
    currentResults: getCurrentResults(),
    
    // Actions
    updateText,
    updateLanguages,
    startBasicSearch,
    proceedToNextStage,
    resetSearch
  };
};