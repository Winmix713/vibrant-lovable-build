import { ComponentStatus } from "@/types/componentStatus";

// Az osztályok és interfészek definíciói
interface ProjectFile {
  name: string;
  content: string;
}

interface ProjectStructure {
  files: ProjectFile[];
  dependencies: string[];
  routes: string[];
  components: string[];
}

interface OptimizationResult {
  componentStatuses: ComponentStatus[];
  dependencyStatuses: ComponentStatus[];
  routeStatuses: ComponentStatus[];
  overallStatus: 'ok' | 'warning' | 'error';
}

/**
 * SystemOptimizerAnalyzer osztály
 *
 * Ez az osztály felelős a projekt szerkezetének elemzéséért és optimalizálásáért.
 * Képes azonosítani a problémás területeket, mint például a komplex komponensek,
 * a felesleges függőségek és a nem optimális útvonalak.
 */
export class SystemOptimizerAnalyzer {
  private projectStructure: ProjectStructure;
  private componentThreshold: number;
  private dependencyThreshold: number;
  private routeThreshold: number;

  /**
   * SystemOptimizerAnalyzer konstruktora
   *
   * @param projectStructure - A projekt szerkezete, beleértve a fájlokat, függőségeket és útvonalakat.
   * @param componentThreshold - A komponens komplexitási küszöbértéke.
   * @param dependencyThreshold - A függőségek számának küszöbértéke.
   * @param routeThreshold - Az útvonalak komplexitási küszöbértéke.
   */
  constructor(projectStructure: ProjectStructure, componentThreshold: number = 100, dependencyThreshold: number = 20, routeThreshold: number = 10) {
    this.projectStructure = projectStructure;
    this.componentThreshold = componentThreshold;
    this.dependencyThreshold = dependencyThreshold;
    this.routeThreshold = routeThreshold;
  }

  /**
   * analyzeProject metódus
   *
   * Ez a metódus elemzi a projekt szerkezetét és optimalizálási javaslatokat ad.
   * @returns OptimizationResult - Az optimalizálási eredmények.
   */
  public analyzeProject(): OptimizationResult {
    const componentStatuses = this.analyzeComponents();
    const dependencyStatuses = this.analyzeDependencies();
    const routeStatuses = this.analyzeRoutes();

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

  /**
   * analyzeComponents metódus
   *
   * Ez a metódus elemzi a projekt komponenseit és javaslatokat ad a komplexitás csökkentésére.
   * @returns ComponentStatus[] - A komponensek státuszai.
   */
  private analyzeComponents(): ComponentStatus[] {
    const componentStatuses: ComponentStatus[] = [];

    for (const component of this.projectStructure.components) {
      const file = this.projectStructure.files.find(f => f.name === component);
      if (!file) {
        componentStatuses.push(this.createErrorStatus(component, "Component file not found."));
        continue;
      }

      const complexityScore = this.calculateComponentComplexity(file.content);

      if (complexityScore > this.componentThreshold) {
        componentStatuses.push({
          name: component,
          status: 'warning',
          message: `Component complexity score is ${complexityScore}, which exceeds the threshold of ${this.componentThreshold}. Consider refactoring.`
        });
      } else {
        componentStatuses.push({
          name: component,
          status: 'ok',
          message: `Component complexity score is ${complexityScore}.`
        });
      }
    }

    return componentStatuses;
  }

  /**
   * analyzeDependencies metódus
   *
   * Ez a metódus elemzi a projekt függőségeit és javaslatokat ad a felesleges függőségek eltávolítására.
   * @returns DependencyStatus[] - A függőségek státuszai.
   */
  private analyzeDependencies(): ComponentStatus[] {
    const dependencyStatuses: ComponentStatus[] = [];

    if (this.projectStructure.dependencies.length > this.dependencyThreshold) {
      dependencyStatuses.push({
        name: "Dependencies",
        status: 'warning',
        message: `The project has ${this.projectStructure.dependencies.length} dependencies, which exceeds the threshold of ${this.dependencyThreshold}. Consider removing unused dependencies.`
      });

      for (const dependency of this.projectStructure.dependencies) {
        if (this.isDependencyUnused(dependency)) {
          dependencyStatuses.push({
            name: dependency,
            status: 'warning',
            message: `Dependency "${dependency}" might be unused. Consider removing it.`
          });
        } else {
          dependencyStatuses.push({
            name: dependency,
            status: 'ok',
            message: `Dependency "${dependency}" is used.`
          });
        }
      }
    } else {
      dependencyStatuses.push({
        name: "Dependencies",
        status: 'ok',
        message: `The project has ${this.projectStructure.dependencies.length} dependencies.`
      });
    }

    return dependencyStatuses;
  }

  /**
   * analyzeRoutes metódus
   *
   * Ez a metódus elemzi a projekt útvonalait és javaslatokat ad a nem optimális útvonalak javítására.
   * @returns RouteStatus[] - Az útvonalak státuszai.
   */
  private analyzeRoutes(): ComponentStatus[] {
    const routeStatuses: ComponentStatus[] = [];

    for (const route of this.projectStructure.routes) {
      const complexityScore = this.calculateRouteComplexity(route);

      if (complexityScore > this.routeThreshold) {
        routeStatuses.push({
          name: route,
          status: 'warning',
          message: `Route "${route}" complexity score is ${complexityScore}, which exceeds the threshold of ${this.routeThreshold}. Consider simplifying.`
        });
      } else {
        routeStatuses.push({
          name: route,
          status: 'ok',
          message: `Route "${route}" complexity score is ${complexityScore}.`
        });
      }
    }

    return routeStatuses;
  }

  /**
   * calculateComponentComplexity metódus
   *
   * Ez a metódus kiszámítja a komponens komplexitási pontszámát.
   * @param componentContent - A komponens tartalma.
   * @returns number - A komponens komplexitási pontszáma.
   */
  private calculateComponentComplexity(componentContent: string): number {
    let complexityScore = 0;

    // Számoljuk a sorok számát
    complexityScore += componentContent.split('\n').length;

    // Számoljuk a függvények számát
    complexityScore += (componentContent.match(/function/g) || []).length;

    // Számoljuk a ciklusok számát
    complexityScore += (componentContent.match(/(for|while|forEach)/g) || []).length;

    // Számoljuk az elágazások számát
    complexityScore += (componentContent.match(/(if|switch)/g) || []).length;

    return complexityScore;
  }

  /**
   * calculateRouteComplexity metódus
   *
   * Ez a metódus kiszámítja az útvonal komplexitási pontszámát.
   * @param route - Az útvonal.
   * @returns number - Az útvonal komplexitási pontszáma.
   */
  private calculateRouteComplexity(route: string): number {
    let complexityScore = 0;

    // Számoljuk a paraméterek számát
    complexityScore += (route.match(/\[.*?\]/g) || []).length;

    // Számoljuk a szegmensek számát
    complexityScore += route.split('/').length;

    return complexityScore;
  }

  /**
   * isDependencyUnused metódus
   *
   * Ez a metódus ellenőrzi, hogy egy függőség használatban van-e a projektben.
   * @param dependency - A függőség neve.
   * @returns boolean - Igaz, ha a függőség nincs használatban, egyébként hamis.
   */
  private isDependencyUnused(dependency: string): boolean {
    for (const file of this.projectStructure.files) {
      if (file.content.includes(dependency)) {
        return false;
      }
    }
    return true;
  }

  /**
   * createErrorStatus metódus
   *
   * Ez a metódus létrehoz egy hibastátuszt.
   * @param name - Az entitás neve.
   * @param message - A hibaüzenet.
   * @returns ComponentStatus - A hibastátusz.
   */
  private createErrorStatus(name: string, message: string): ComponentStatus {
    return {
      name,
      status: 'error',
      message
    };
  }
}

// Importáljuk a javított ComponentStatus interfészt

// A status beállításoknál használjuk a helyes típusokat
const createErrorStatus = (name: string, message: string): ComponentStatus => {
  return {
    name,
    status: 'error' as const,
    message
  };
};

// Javítsuk a hibás státusz beállításokat
// 593, 594, 601, 602, 609, 610, 617, 618 soroknál lévő hibákat
// Az eredeti kódban valami ilyesmi lehetett:
/*
status.status = "error";
status.message = "Some error message";
*/
// Helyette készítsünk új komponens státuszt:

const updateComponentStatus = (status: ComponentStatus, errorMessage: string): ComponentStatus => {
  return {
    name: status.name,
    status: 'error' as const,
    message: errorMessage
  };
};
