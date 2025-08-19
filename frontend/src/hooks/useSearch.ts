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
  selectedLanguages: ['korean', 'english', 'chinese', 'japanese', 'spanish', 'french'], // Always use all languages
  results: {},
  error: undefined
};

export const useSearch = () => {
  const [state, setState] = useState<SearchState>(initialState);

  const updateText = useCallback((text: string) => {
    setState(prev => ({ ...prev, text, error: undefined }));
  }, []);

  // Language selection removed - always use all supported languages


  const validateSearchInput = (): boolean => {
    if (!state.text.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter text to analyze' }));
      return false;
    }

    // Language validation removed - always use all supported languages

    if (state.text.length > 10000) {
      setState(prev => ({ ...prev, error: 'Text exceeds maximum length of 10,000 characters' }));
      return false;
    }

    return true;
  };

  const executeSearch = useCallback(async (stage: SearchStage, currentState?: SearchState) => {
    console.log(`executeSearch called for stage ${stage}`);
    
    // Use provided currentState or fallback to state (for backwards compatibility)
    const workingState = currentState || state;
    
    const request: SearchRequest = {
      text: workingState.text,
      languages: workingState.selectedLanguages,
      maxCharacters: 10000
    };
    
    if (!workingState.text.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter text to analyze' }));
      return;
    }

    if (workingState.text.length > 10000) {
      setState(prev => ({ ...prev, error: 'Text exceeds maximum length of 10,000 characters' }));
      return;
    }
    
    console.log('Setting loading state to true');
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      console.log(`About to enter switch statement for stage ${stage}`);
      switch (stage) {
        case 1: {
          // Clear all previous results to ensure isolation
          setState(prev => ({
            ...prev,
            results: {} // Clear all previous results
          }));
          
          const result: BasicSearchResponse = await searchAPI.basic(request);
          setState(prev => ({
            ...prev,
            results: { stage1: result }, // Only set stage1 result
            stage: 2,
            isLoading: false
          }));
          break;
        }
        
        case 2: {
          // Only proceed if stage1 is completed, pass stage1 results as weights
          console.log('Checking stage1 results:', !!workingState.results.stage1);
          console.log('Current workingState.results:', workingState.results);
          if (!workingState.results.stage1) {
            console.error('Stage 1 results not found when trying to proceed to stage 2');
            throw new Error('Stage 1 must be completed before proceeding to Stage 2');
          }
          
          console.log('Stage 2: About to call deep search API');
          console.log('Stage 1 results to pass:', workingState.results.stage1);
          
          // Enhance request with Stage 1 results for weighting
          const enhancedRequest = {
            ...request,
            stage1Results: workingState.results.stage1 // Pass stage1 results for weight calculation
          };
          
          console.log('Enhanced request for deep search:', enhancedRequest);
          
          try {
            console.log('About to call searchAPI.deep()');
            const result: DeepSearchResponse = await searchAPI.deep(enhancedRequest);
            console.log('Deep search API response received:', result);
            setState(prev => ({
              ...prev,
              results: { ...prev.results, stage2: result },
              stage: 3,
              isLoading: false
            }));
            console.log('Stage 2 completed successfully, stage set to 3');
          } catch (deepSearchError) {
            console.error('Deep search API call failed:', deepSearchError);
            setState(prev => ({ ...prev, isLoading: false }));
            throw deepSearchError;
          }
          break;
        }
        
        case 3: {
          // Only proceed if stage2 is completed
          if (!workingState.results.stage2) {
            throw new Error('Stage 2 must be completed before proceeding to Stage 3');
          }
          
          // For context search, we need to pass previous detections from stage 2
          // But ensure we're using the current session's stage2 results only
          const previousDetections = workingState.results.stage2?.items || [];
          
          // Debug logging
          console.log('Context search debug:', {
            stage2Results: workingState.results.stage2,
            previousDetectionsCount: previousDetections.length,
            currentText: workingState.text
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
      console.error('Search failed:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
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
    // Always start fresh - clear any existing results
    setState(prev => ({
      ...prev,
      results: {},
      stage: 1,
      error: undefined
    }));
    executeSearch(1);
  }, [executeSearch]);

  const proceedToNextStage = useCallback(() => {
    // Execute the next stage based on current stage
    console.log('proceedToNextStage called with state.stage:', state.stage);
    console.log('state.results:', state.results);
    
    if (state.stage === 2) {
      console.log('Executing deep search (stage 2)');
      executeSearch(2, state); // Pass current state to avoid closure issue
    } else if (state.stage === 3) {
      console.log('Executing context search (stage 3)');
      executeSearch(3, state); // Pass current state to avoid closure issue
    } else {
      console.log('No action for current stage:', state.stage);
    }
  }, [state.stage, executeSearch, state.results]);

  const resetSearch = useCallback(() => {
    // Reset to initial state but preserve text
    setState(prev => ({
      ...initialState,
      text: prev.text
    }));
  }, []);

  const resetAll = useCallback(() => {
    // Complete reset including text
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
      case 1: return false; // Cannot proceed from stage 1 (basic search is entry point)
      case 2: return !!state.results.stage1 && !state.isLoading; // Can proceed to deep search if stage 1 is complete
      case 3: return !!state.results.stage2 && !state.isLoading; // Can proceed to context search if stage 2 is complete
      default: return false;
    }
  }, [state.stage, state.results, state.isLoading]);

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
    startBasicSearch,
    proceedToNextStage,
    resetSearch,
    resetAll
  };
};