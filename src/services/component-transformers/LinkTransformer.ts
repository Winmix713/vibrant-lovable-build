
import { ComponentTransformResult } from './types';

/**
 * Transforms Next.js Link components to react-router-dom Link
 */
export function transformLinkComponent(code: string): ComponentTransformResult {
  const result: ComponentTransformResult = {
    code: code,
    imports: ["import { Link } from 'react-router-dom';"],
    warnings: []
  };
  
  // Replace imports
  result.code = result.code.replace(
    /import\s+Link\s+from\s+['"]next\/link['"]/g,
    "import { Link } from 'react-router-dom'"
  );
  
  // Replace href with to
  result.code = result.code.replace(
    /<Link\s+([^>]*)href=(['"]{1})([^'"]+)(['"]{1})([^>]*)>/g,
    "<Link $1to=$2$3$4$5>"
  );
  
  // Check and warn about passHref or legacyBehavior props
  if (result.code.includes('passHref') || result.code.includes('legacyBehavior')) {
    result.warnings.push('Next.js Link passHref and legacyBehavior props are not needed in react-router-dom');
    
    // Remove these props
    result.code = result.code.replace(/\s+passHref/g, '');
    result.code = result.code.replace(/\s+legacyBehavior/g, '');
  }
  
  return result;
}
