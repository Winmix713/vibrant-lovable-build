
import { analyze } from "./systemAnalyzer";
import { ComponentStatus } from "@/types/componentStatus";

interface CodeStructure {
  imports: string[];
  exports: string[];
  components: string[];
  hooks: string[];
  hasNextImports: boolean;
  hasApiRoutes: boolean;
}

// Function to analyze code structure
function analyzeCodeStructure(code: string): CodeStructure {
  const result: CodeStructure = {
    imports: [],
    exports: [],
    components: [],
    hooks: [],
    hasNextImports: false,
    hasApiRoutes: false
  };
  
  // Extract imports
  const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+([^;\n]+)|([^;\n]+))\s+from\s+['"]([^'"]+)['"]/g;
  let importMatch;
  
  while ((importMatch = importRegex.exec(code)) !== null) {
    const source = importMatch[4];
    result.imports.push(source);
    
    if (source.startsWith('next/')) {
      result.hasNextImports = true;
    }
  }
  
  // Extract exports
  const exportRegex = /export\s+(?:default\s+)?(?:const|class|function|let|var)\s+(\w+)/g;
  let exportMatch;
  
  while ((exportMatch = exportRegex.exec(code)) !== null) {
    const exportName = exportMatch[1];
    result.exports.push(exportName);
    
    // Detect if this is a component (starts with uppercase)
    if (exportName[0] === exportName[0].toUpperCase()) {
      result.components.push(exportName);
    }
    
    // Detect if this is a hook (starts with use)
    if (exportName.startsWith('use')) {
      result.hooks.push(exportName);
    }
  }
  
  // Detect API routes
  if (code.includes('export default function handler') ||
      code.includes('export const config') ||
      (code.includes('NextApiRequest') && code.includes('NextApiResponse'))) {
    result.hasApiRoutes = true;
  }
  
  return result;
}

/**
 * Performance-focused system optimizer analyzer
 */
export class SystemOptimizerAnalyzer {
  private includedComponents: Set<string> = new Set();
  private analyzedFiles: Map<string, any> = new Map();
  
  /**
   * Analyze components for potential performance optimizations
   */
  async analyzeComponents(files: File[]): Promise<ComponentStatus[]> {
    const result: ComponentStatus[] = [];
    
    for (const file of files) {
      if (!this.shouldAnalyzeFile(file.name)) continue;
      
      try {
        const content = await this.readFileContent(file);
        const analysis = analyzeCodeStructure(content);
        this.analyzedFiles.set(file.name, analysis);
        
        // Track the component
        if (analysis.components.length > 0) {
          analysis.components.forEach(comp => this.includedComponents.add(comp));
        }
        
        // Check for potential performance issues in React components
        if (analysis.components.length > 0) {
          // Perform component-specific checks
          const status = this.analyzeComponentCode(content, file.name);
          result.push(status);
        }
      } catch (error) {
        result.push({
          name: file.name,
          status: 'error',
          message: `Error analyzing component: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    
    return result;
  }
  
  /**
   * Analyze a single component for performance issues
   */
  private analyzeComponentCode(code: string, fileName: string): ComponentStatus {
    const warnings: string[] = [];
    
    // Check for expensive operations in render
    if (this.hasExpensiveOperationsInRender(code)) {
      warnings.push('Contains potentially expensive operations in render method');
    }
    
    // Check for missing dependencies in useEffect
    if (this.hasMissingEffectDependencies(code)) {
      warnings.push('Potential missing dependencies in useEffect dependency array');
    }
    
    // Check for large component (too many responsibilities)
    if (this.isComponentTooLarge(code)) {
      warnings.push('Component may be too large, consider breaking it down');
    }
    
    // Check for useState vs useReducer decisions
    if (this.hasMultipleRelatedStateVariables(code)) {
      warnings.push('Multiple related state variables detected, consider using useReducer');
    }
    
    // Check for proper memo usage
    if (this.mightNeedMemoization(code)) {
      warnings.push('Component renders frequently, consider using React.memo or useMemo');
    }
    
    // Overall status
    return {
      name: this.extractComponentName(fileName),
      status: warnings.length > 0 ? 'error' : 'ok',
      message: warnings.length > 0 ? warnings.join('. ') : undefined
    };
  }
  
  /**
   * Extract component name from file name
   */
  private extractComponentName(fileName: string): string {
    const base = fileName.split('/').pop() || fileName;
    return base.replace(/\.(jsx|tsx|js|ts)$/, '');
  }
  
  /**
   * Check if file should be analyzed
   */
  private shouldAnalyzeFile(fileName: string): boolean {
    if (fileName.includes('node_modules')) return false;
    if (!fileName.match(/\.(jsx|tsx|js|ts)$/)) return false;
    return true;
  }
  
  /**
   * Read file content
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  /**
   * Check for expensive operations in render
   */
  private hasExpensiveOperationsInRender(code: string): boolean {
    // Check for filters, maps, sorts, and heavy operations inside component body
    const hasHeavyArrayOperations = /return[\s\S]*?\{[\s\S]*?\.(map|filter|sort|reduce|forEach)/.test(code);
    const hasNestedLoops = /(for\s*\([^)]*\)\s*\{[\s\S]*?for\s*\([^)]*\))/i.test(code);
    const hasComplexCalculations = /Math\.(pow|sqrt|log|sin|cos|exp)/.test(code);
    
    return hasHeavyArrayOperations || hasNestedLoops || hasComplexCalculations;
  }
  
  /**
   * Check for missing dependencies in useEffect
   */
  private hasMissingEffectDependencies(code: string): boolean {
    // Simple check for variables used in useEffect but not in deps array
    const effectBlocks = code.match(/useEffect\(\(\)\s*=>\s*{[\s\S]*?}, \[(.*?)\]\)/g) || [];
    
    for (const block of effectBlocks) {
      const blockBody = block.match(/useEffect\(\(\)\s*=>\s*{([\s\S]*?)}, \[(.*?)\]\)/) || [];
      if (blockBody.length >= 3) {
        const effectBody = blockBody[1];
        const depsArray = blockBody[2];
        
        // Extract variable usage from effect body
        const varsInEffect = new Set<string>();
        const varRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
        let varMatch;
        
        while ((varMatch = varRegex.exec(effectBody)) !== null) {
          const varName = varMatch[1];
          // Exclude common keywords and built-ins
          if (!['if', 'else', 'return', 'const', 'let', 'var', 'function', 
                'true', 'false', 'null', 'undefined', 'console', 'window', 
                'document', 'Math', 'JSON', 'parseInt', 'parseFloat'].includes(varName)) {
            varsInEffect.add(varName);
          }
        }
        
        // Extract dependencies
        const depsInArray = new Set<string>();
        depsArray.split(',').forEach(dep => {
          const trimmedDep = dep.trim();
          if (trimmedDep && trimmedDep !== '') {
            depsInArray.add(trimmedDep);
          }
        });
        
        // Check if any vars used are missing in deps
        for (const usedVar of varsInEffect) {
          if (!depsInArray.has(usedVar)) {
            return true; // Missing dependency found
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if component is too large and should be broken down
   */
  private isComponentTooLarge(code: string): boolean {
    // Simple line count check - over 300 lines is large
    const lineCount = code.split('\n').length;
    if (lineCount > 300) return true;
    
    // Too many JSX elements
    const jsxElements = (code.match(/<[A-Z][^>]*>/g) || []).length;
    if (jsxElements > 30) return true;
    
    // Too many useState calls suggests complex state management
    const useStateCount = (code.match(/useState/g) || []).length;
    if (useStateCount > 8) return true;
    
    return false;
  }
  
  /**
   * Check if component has multiple related state variables
   */
  private hasMultipleRelatedStateVariables(code: string): boolean {
    // Look for patterns where several useState hooks modify related data
    const stateGroupPattern = /(const\s+\[\w+,\s*set\w+\]\s*=\s*useState[^;]+;\s*){4,}/g;
    return stateGroupPattern.test(code);
  }
  
  /**
   * Check if component might benefit from memoization
   */
  private mightNeedMemoization(code: string): boolean {
    // Heavy render method without memoization
    const hasExpensiveRender = this.hasExpensiveOperationsInRender(code);
    const usesProps = code.includes('props.');
    const lacksMemo = !code.includes('React.memo') && !code.includes('useMemo');
    
    return hasExpensiveRender && usesProps && lacksMemo;
  }
  
  /**
   * Analyze system performance
   */
  async analyzeSystemPerformance(files: File[]): Promise<{
    optimizationTargets: string[];
    bottlenecks: string[];
    recommendations: string[];
  }> {
    const result = {
      optimizationTargets: [] as string[],
      bottlenecks: [] as string[],
      recommendations: [] as string[]
    };
    
    try {
      // Analyze file structure
      const fileCount = files.length;
      const jsxCount = files.filter(f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx')).length;
      
      // Check if the system has too many components
      if (jsxCount > 100) {
        result.bottlenecks.push('Large number of components may impact performance');
        result.recommendations.push('Consider code-splitting and lazy loading');
      }
      
      // Analyze specific components
      await this.analyzeComponents(files);
      
      // Make optimization recommendations based on analyzed files
      const topLevelComponents = this.identifyTopLevelComponents();
      
      if (topLevelComponents.length > 0) {
        result.optimizationTargets.push(...topLevelComponents);
        result.recommendations.push('Consider memoizing top-level components');
      }
      
      // Check for common performance patterns
      const pathsWithIndexingIssues = this.detectIndexingIssues();
      if (pathsWithIndexingIssues.length > 0) {
        result.bottlenecks.push('Potential indexing issues in component files');
        result.recommendations.push('Consider restructuring component exports');
      }
      
      return result;
    } catch (error) {
      return {
        optimizationTargets: [],
        bottlenecks: [`Error analyzing system: ${error instanceof Error ? error.message : String(error)}`],
        recommendations: ['Run a targeted analysis on specific components']
      };
    }
  }
  
  /**
   * Identify top-level components for optimization
   */
  private identifyTopLevelComponents(): string[] {
    const topLevel: string[] = [];
    
    this.analyzedFiles.forEach((analysis, fileName) => {
      // Check if this is a page or layout component
      if (fileName.includes('/pages/') || fileName.includes('/layouts/')) {
        analysis.components.forEach((component: string) => {
          topLevel.push(`${fileName} (${component})`);
        });
      }
    });
    
    return topLevel;
  }
  
  /**
   * Detect potential indexing issues in component organization
   */
  private detectIndexingIssues(): string[] {
    const pathsWithIssues: string[] = [];
    
    // Look for folders with index.js/ts that might cause circular imports
    const folderPaths = new Set<string>();
    
    this.analyzedFiles.forEach((_, fileName) => {
      const pathParts = fileName.split('/');
      if (pathParts.length > 2) {
        const folderPath = pathParts.slice(0, -1).join('/');
        folderPaths.add(folderPath);
      }
    });
    
    folderPaths.forEach(folder => {
      const hasIndex = this.analyzedFiles.has(`${folder}/index.js`) || 
                       this.analyzedFiles.has(`${folder}/index.ts`) ||
                       this.analyzedFiles.has(`${folder}/index.jsx`) ||
                       this.analyzedFiles.has(`${folder}/index.tsx`);
      
      const filesInFolder = Array.from(this.analyzedFiles.keys())
        .filter(file => file.startsWith(folder) && !file.endsWith('index.js') && 
                !file.endsWith('index.ts') && !file.endsWith('index.jsx') && 
                !file.endsWith('index.tsx'));
      
      if (hasIndex && filesInFolder.length > 3) {
        pathsWithIssues.push(folder);
      }
    });
    
    return pathsWithIssues;
  }
  
  /**
   * Check component error boundary usage
   */
  analyzeErrorBoundaryUsage(files: File[]): Promise<{
    hasErrorBoundaries: boolean;
    recommendations: string[];
  }> {
    return new Promise(async (resolve) => {
      let hasErrorBoundaries = false;
      const recommendations: string[] = [];
      
      for (const file of files) {
        try {
          if (!file.name.endsWith('.jsx') && !file.name.endsWith('.tsx') &&
              !file.name.endsWith('.js') && !file.name.endsWith('.ts')) {
            continue;
          }
          
          const content = await this.readFileContent(file);
          
          // Check for error boundary patterns
          if (content.includes('componentDidCatch') || 
              content.includes('getDerivedStateFromError') ||
              content.includes('ErrorBoundary')) {
            hasErrorBoundaries = true;
          }
        } catch (error) {
          // Skip files with errors
        }
      }
      
      if (!hasErrorBoundaries) {
        recommendations.push('Add error boundaries around critical components');
        recommendations.push('Consider creating a reusable ErrorBoundary component');
      }
      
      resolve({ hasErrorBoundaries, recommendations });
    });
  }
  
  /**
   * Check for component memoization usage
   */
  analyzeMemoizationUsage(): {
    components: ComponentStatus[];
  } {
    const result: ComponentStatus[] = [];
    
    try {
      this.analyzedFiles.forEach((analysis, fileName) => {
        // Skip non-component files
        if (!fileName.endsWith('.jsx') && !fileName.endsWith('.tsx')) {
          return;
        }
        
        const componentName = this.extractComponentName(fileName);
        let status: ComponentStatus = { 
          name: componentName, 
          status: 'ok' 
        };
        
        // Check if the component is using memo when it should
        if (this.mightNeedMemoization(JSON.stringify(analysis))) {
          status = { 
            name: componentName,
            status: 'error',
            message: 'Component could benefit from memoization'
          };
        }
        
        result.push(status);
      });
    } catch (error) {
      result.push({ 
        name: 'MemoizationAnalysis',
        status: 'error',
        message: `Analysis error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
    
    return { components: result };
  }
}
