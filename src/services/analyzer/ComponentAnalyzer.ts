
import { ComponentStatus } from "@/types/componentStatus";
import { ProjectFile, ProjectStructure } from "./types";

export class ComponentAnalyzer {
  private projectStructure: ProjectStructure;
  private componentThreshold: number;

  constructor(projectStructure: ProjectStructure, componentThreshold: number = 100) {
    this.projectStructure = projectStructure;
    this.componentThreshold = componentThreshold;
  }

  /**
   * Elemzi a projekt komponenseit és javaslatokat ad a komplexitás csökkentésére.
   */
  public analyzeComponents(): ComponentStatus[] {
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
   * Kiszámítja a komponens komplexitási pontszámát.
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
   * Hibaállapot létrehozása.
   */
  private createErrorStatus(name: string, message: string): ComponentStatus {
    return {
      name,
      status: 'error',
      message
    };
  }
}
