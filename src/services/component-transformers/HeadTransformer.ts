
import { ComponentTransformResult } from './types';

/**
 * Transforms Next.js Head component to react-helmet-async
 */
export function transformHeadComponent(code: string): ComponentTransformResult {
  const result: ComponentTransformResult = {
    code: code,
    imports: ["import { Helmet } from 'react-helmet-async';"],
    warnings: []
  };
  
  // Replace imports
  result.code = result.code.replace(
    /import\s+Head\s+from\s+['"]next\/head['"]/g,
    "import { Helmet } from 'react-helmet-async'"
  );
  
  // Replace component usage
  result.code = result.code.replace(
    /<Head>([\s\S]*?)<\/Head>/g,
    "<Helmet>$1</Helmet>"
  );
  
  return result;
}
