
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ConversionOptions } from '@/types/conversion';

interface ConversionState {
  isConverting: boolean;
  progress: number;
  progressMessage?: string;
  currentStep: number;
  projectData?: any;
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

type ConversionAction =
  | { type: 'START_CONVERSION'; options: ConversionOptions }
  | { type: 'SET_PROGRESS'; progress: number }
  | { type: 'SET_STEP'; step: number }
  | { type: 'ADD_LOG'; log: { message: string; type: 'info' | 'success' | 'error' | 'warning' } }
  | { type: 'SET_RESULT'; result: Partial<ConversionState['result']> }
  | { type: 'RESET' }
  | { type: 'SET_CONVERSION_OPTIONS'; payload: ConversionOptions }
  | { type: 'SET_IS_CONVERTING'; payload: boolean }
  | { type: 'SET_CONVERSION_PROGRESS'; payload: { progress: number; message: string } }
  | { type: 'SET_CONVERSION_RESULT'; payload: { success: boolean; result: any } }
  | { type: 'SET_CONVERSION_ERROR'; payload: string };

const initialConversionState: ConversionState = {
  isConverting: false,
  progress: 0,
  currentStep: 1,
  conversionOptions: {
    syntax: 'typescript',
    useReactRouter: true,
    convertApiRoutes: true,
    transformDataFetching: true,
    replaceComponents: true,
    updateDependencies: true,
    handleMiddleware: true,
    preserveComments: true,
    target: 'react-vite'
  },
  logs: [],
  result: {
    success: false,
    errors: [],
    warnings: []
  }
};

const ConversionContext = createContext<{
  state: ConversionState;
  dispatch: React.Dispatch<ConversionAction>;
}>({
  state: initialConversionState,
  dispatch: () => null
});

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
    case 'SET_CONVERSION_OPTIONS':
      return {
        ...state,
        conversionOptions: action.payload
      };
    case 'SET_IS_CONVERTING':
      return {
        ...state,
        isConverting: action.payload
      };
    case 'SET_CONVERSION_PROGRESS':
      return {
        ...state,
        progress: action.payload.progress,
        progressMessage: action.payload.message
      };
    case 'SET_CONVERSION_RESULT':
      return {
        ...state,
        isConverting: false,
        result: {
          ...state.result,
          success: action.payload.success,
          ...action.payload.result
        }
      };
    case 'SET_CONVERSION_ERROR':
      return {
        ...state,
        isConverting: false,
        result: {
          ...state.result,
          success: false,
          errors: [...state.result.errors, action.payload]
        }
      };
    default:
      return state;
  }
};

export const ConversionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(conversionReducer, initialConversionState);

  return (
    <ConversionContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversionContext.Provider>
  );
};

export const useConversion = () => {
  const context = useContext(ConversionContext);
  if (!context) {
    throw new Error('useConversion must be used within a ConversionProvider');
  }
  return context;
};
