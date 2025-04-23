
import { ComponentTransformOptions, ComponentTransformResult } from './types';

/**
 * Transforms Next.js dynamic imports to React.lazy
 */
export function transformDynamicImport(code: string, options: ComponentTransformOptions = {}): ComponentTransformResult {
  const result: ComponentTransformResult = {
    code: code,
    imports: ["import { lazy, Suspense } from 'react';"],
    warnings: []
  };
  
  // Replace imports
  result.code = result.code.replace(
    /import\s+dynamic\s+from\s+['"]next\/dynamic['"]/g,
    "import { lazy, Suspense } from 'react'"
  );
  
  // Replace dynamic with lazy
  result.code = result.code.replace(
    /const\s+(\w+)\s*=\s*dynamic\(\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)(?:,\s*({[^}]*}))?\)/g,
    (match, componentName, importPath, options) => {
      let result = `const ${componentName} = lazy(() => import('${importPath}'))`;
      
      // Handle dynamic options
      if (options) {
        result += "\n// Converted dynamic options to Suspense fallback";
        
        if (options.includes('loading') && options.wrapInSuspense !== false) {
          result += "\n// You need to wrap this component in a Suspense component with fallback";
        }
      }
      
      return result;
    }
  );
  
  // Check if we need to add Suspense wrapper
  if (options.wrapInSuspense) {
    // This is a simplified approach - in a real implementation we would need to 
    // actually parse the code and insert Suspense at the right locations
    result.warnings.push('Components using lazy() need to be wrapped in <Suspense fallback={...}>');
  }
  
  return result;
}
