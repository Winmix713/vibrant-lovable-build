
import { ComponentStatus } from "@/types/componentStatus";
import { ProjectStructure, OptimizationResult, AnalyzerThresholds } from "./types";
import { ComponentAnalyzer } from "./ComponentAnalyzer";
import { DependencyAnalyzer } from "./DependencyAnalyzer";
import { RouteAnalyzer } from "./RouteAnalyzer";

/**
 * SystemOptimizerAnalyzer osztály
 *
 * Ez az osztály felelős a projekt szerkezetének elemzéséért és optimalizálásáért.
 * Képes azonosítani a problémás területeket, mint például a komplex komponensek,
 * a felesleges függőségek és a nem optimális útvonalak.
 */
export class SystemOptimizerAnalyzer {
  private projectStructure: ProjectStructure;
  private thresholds: AnalyzerThresholds;
  private componentAnalyzer: ComponentAnalyzer;
  private dependencyAnalyzer: DependencyAnalyzer;
  private routeAnalyzer: RouteAnalyzer;

  /**
   * SystemOptimizerAnalyzer konstruktora
   *
   * @param projectStructure - A projekt szerkezete, beleértve a fájlokat, függőségeket és útvonalakat.
   * @param thresholds - Küszöbértékek beállítása a különböző elemzésekhez
   */
  constructor(
    projectStructure: ProjectStructure, 
    thresholds: AnalyzerThresholds = {
      componentThreshold: 100, 
      dependencyThreshold: 20, 
      routeThreshold: 10
    }
  ) {
    this.projectStructure = projectStructure;
    this.thresholds = thresholds;
    
    this.componentAnalyzer = new ComponentAnalyzer(
      projectStructure, 
      thresholds.componentThreshold
    );
    
    this.dependencyAnalyzer = new DependencyAnalyzer(
      projectStructure, 
      thresholds.dependencyThreshold
    );
    
    this.routeAnalyzer = new RouteAnalyzer(
      projectStructure, 
      thresholds.routeThreshold
    );
  }

  /**
   * analyzeProject metódus
   *
   * Ez a metódus elemzi a projekt szerkezetét és optimalizálási javaslatokat ad.
   * @returns OptimizationResult - Az optimalizálási eredmények.
   */
  public analyzeProject(): OptimizationResult {
    const componentStatuses = this.componentAnalyzer.analyzeComponents();
    const dependencyStatuses = this.dependencyAnalyzer.analyzeDependencies();
    const routeStatuses = this.routeAnalyzer.analyzeRoutes();

    let overallStatus: 'ok' | 'warning' | 'error' = 'ok';

    if (componentStatuses.some(s => s.status === 'error') ||
      dependencyStatuses.some(s => s.status === 'error') ||
      routeStatuses.some(s => s.status === 'error')) {
      overallStatus = 'error';
    } else if (componentStatuses.some(s => s.status === 'warning') ||
      dependencyStatuses.some(s => s.status === 'warning') ||
      routeStatuses.some(s => s.status === 'warning')) {
      overallStatus = 'warning';
    }

    return {
      componentStatuses,
      dependencyStatuses,
      routeStatuses,
      overallStatus
    };
  }
}

/**
 * Frissíti egy komponens státuszát
 */
export const updateComponentStatus = (status: ComponentStatus, errorMessage: string): ComponentStatus => {
  return {
    name: status.name,
    status: 'error',
    message: errorMessage
  };
};
