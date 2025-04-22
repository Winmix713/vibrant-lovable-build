
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ConversionOptions } from '@/types/conversion';

// Define the state type
interface ConversionState {
  isConverting: boolean;
  progress: number;
  currentStep: number;
  conversionOptions: ConversionOptions;
  logs: Array<{ message: string; type: 'info' | 'success' | 'error' | 'warning' }>;
  result: {
    success: boolean;
    downloadUrl?: string;
    errors: string[];
    warnings: string[];
    stats?: any;
  };
}

// Define the action types
type ConversionAction =
  | { type: 'START_CONVERSION'; options: ConversionOptions }
  | { type: 'SET_PROGRESS'; progress: number }
  | { type: 'SET_STEP'; step: number }
  | { type: 'ADD_LOG'; log: { message: string; type: 'info' | 'success' | 'error' | 'warning' } }
  | { type: 'SET_RESULT'; result: Partial<ConversionState['result']> }
  | { type: 'RESET' };

// Define the initial state
const initialConversionState: ConversionState = {
  isConverting: false,
  progress: 0,
  currentStep: 1,
  conversionOptions: {
    useReactRouter: true,
    convertApiRoutes: true,
    transformDataFetching: true,
    replaceComponents: true,
    updateDependencies: true,
    preserveTypeScript: true,
    handleMiddleware: true
  },
  logs: [],
  result: {
    success: false,
    errors: [],
    warnings: []
  }
};

// Create the context
const ConversionContext = createContext<{
  state: ConversionState;
  dispatch: React.Dispatch<ConversionAction>;
}>({
  state: initialConversionState,
  dispatch: () => null
});

// Reducer function
const conversionReducer = (state: ConversionState, action: ConversionAction): ConversionState => {
  switch (action.type) {
    case 'START_CONVERSION':
      return {
        ...state,
        isConverting: true,
        progress: 0,
        conversionOptions: action.options,
        logs: [{ message: 'Starting conversion...', type: 'info' }],
        result: { success: false, errors: [], warnings: [] }
      };
    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.progress
      };
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.step
      };
    case 'ADD_LOG':
      return {
        ...state,
        logs: [...state.logs, action.log]
      };
    case 'SET_RESULT':
      return {
        ...state,
        isConverting: false,
        result: { ...state.result, ...action.result }
      };
    case 'RESET':
      return initialConversionState;
    default:
      return state;
  }
};

// Provider component
export const ConversionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(conversionReducer, initialConversionState);

  return (
    <ConversionContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversionContext.Provider>
  );
};

// Hook for using the context
export const useConversion = () => {
  const context = useContext(ConversionContext);
  if (!context) {
    throw new Error('useConversion must be used within a ConversionProvider');
  }
  return context;
};
