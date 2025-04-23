
import { ComponentStatus } from "@/types/componentStatus";

export interface ProjectFile {
  name: string;
  content: string;
}

export interface ProjectStructure {
  files: ProjectFile[];
  dependencies: string[];
  routes: string[];
  components: string[];
}

export interface OptimizationResult {
  componentStatuses: ComponentStatus[];
  dependencyStatuses: ComponentStatus[];
  routeStatuses: ComponentStatus[];
  overallStatus: 'ok' | 'warning' | 'error';
}

export interface AnalyzerThresholds {
  componentThreshold: number;
  dependencyThreshold: number;
  routeThreshold: number;
}
