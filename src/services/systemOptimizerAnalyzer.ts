
// Ez a fájl már csak átirányításra szolgál, mivel a kódja modulokra lett bontva
import { SystemOptimizerAnalyzer, updateComponentStatus } from './analyzer/SystemOptimizerAnalyzer';
import { ProjectFile, ProjectStructure, OptimizationResult, AnalyzerThresholds } from './analyzer/types';

// Exportáljuk az összes szükséges komponenst és függvényt
export {
  SystemOptimizerAnalyzer,
  updateComponentStatus,
  ProjectFile,
  ProjectStructure,
  OptimizationResult,
  AnalyzerThresholds
};
