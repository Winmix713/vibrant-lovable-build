
import { ComponentStatus } from "@/types/componentStatus";
import { ProjectFile, ProjectStructure } from "./types";

export class DependencyAnalyzer {
  private projectStructure: ProjectStructure;
  private dependencyThreshold: number;

  constructor(projectStructure: ProjectStructure, dependencyThreshold: number = 20) {
    this.projectStructure = projectStructure;
    this.dependencyThreshold = dependencyThreshold;
  }

  /**
   * Elemzi a projekt függőségeit és javaslatokat ad a felesleges függőségek eltávolítására.
   */
  public analyzeDependencies(): ComponentStatus[] {
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
   * Ellenőrzi, hogy egy függőség használatban van-e a projektben.
   */
  private isDependencyUnused(dependency: string): boolean {
    for (const file of this.projectStructure.files) {
      if (file.content.includes(dependency)) {
        return false;
      }
    }
    return true;
  }
}
