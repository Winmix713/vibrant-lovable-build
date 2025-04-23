
// Ez a fájl már csak átirányításra szolgál, mivel a kódja modulokra lett bontva
import { SystemOptimizerAnalyzer, updateComponentStatus } from './analyzer/SystemOptimizerAnalyzer';
export { SystemOptimizerAnalyzer, updateComponentStatus };

// Exportáljuk az összes szükséges típust
export type { ProjectFile, ProjectStructure, OptimizationResult, AnalyzerThresholds } from './analyzer/types';
