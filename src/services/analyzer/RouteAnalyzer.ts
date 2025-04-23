
import { ComponentStatus } from "@/types/componentStatus";
import { ProjectStructure } from "./types";

export class RouteAnalyzer {
  private projectStructure: ProjectStructure;
  private routeThreshold: number;

  constructor(projectStructure: ProjectStructure, routeThreshold: number = 10) {
    this.projectStructure = projectStructure;
    this.routeThreshold = routeThreshold;
  }

  /**
   * Elemzi a projekt útvonalait és javaslatokat ad a nem optimális útvonalak javítására.
   */
  public analyzeRoutes(): ComponentStatus[] {
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
   * Kiszámítja az útvonal komplexitási pontszámát.
   */
  private calculateRouteComplexity(route: string): number {
    let complexityScore = 0;

    // Számoljuk a paraméterek számát
    complexityScore += (route.match(/\[.*?\]/g) || []).length;

    // Számoljuk a szegmensek számát
    complexityScore += route.split('/').length;

    return complexityScore;
  }
}
