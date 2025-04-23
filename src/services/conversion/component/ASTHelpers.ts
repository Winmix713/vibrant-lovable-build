
import * as t from '@babel/types';
import { AnalyzedComponent } from './ComponentTypes';
import { 
  safeExpressionHandler, 
  safePatternHandler, 
  handleBabelVersionConflict, 
  isSafeObjectPattern,
  isSafeArrayPattern
} from '../../astTransformerFix';

/**
 * Extract props from a parameter
 * This is a helper method that safely extracts props from function parameters
 */
export function extractPropsFromParam(param: any, result: AnalyzedComponent): void {
  if (!param) return;

  // Safe handling of different parameter types
  try {
    if (t.isIdentifier(param)) {
      // Simple props like function Component(props)
      result.props.push(param.name);
    } else if (isSafeObjectPattern(param)) {
      // Destructured props like function Component({ prop1, prop2 })
      const objPattern = safePatternHandler(param);
      
      if (objPattern.properties && Array.isArray(objPattern.properties)) {
        for (const prop of objPattern.properties) {
          const safeProp = handleBabelVersionConflict(prop);
          
          if (t.isObjectProperty(safeProp) && t.isIdentifier(safeExpressionHandler(safeProp.key))) {
            result.props.push(safeExpressionHandler(safeProp.key).name);
          } else if (t.isRestElement(safeProp) && t.isIdentifier(safeProp.argument)) {
            result.props.push(`...${safeProp.argument.name}`);
          }
        }
      }
    } else if (isSafeArrayPattern(param)) {
      // Handle array destructuring if present
      const arrayPattern = safePatternHandler(param);
      
      if (arrayPattern.elements && Array.isArray(arrayPattern.elements)) {
        for (let i = 0; i < arrayPattern.elements.length; i++) {
          const element = arrayPattern.elements[i];
          if (element && t.isIdentifier(element)) {
            result.props.push(`${element.name}[${i}]`);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting props from parameter:', error);
  }
}

/**
 * Safe check if a node has a specific property type
 */
export function hasComponentSuperClass(superClass: any): boolean {
  if (!superClass) return false;
  
  const expr = safeExpressionHandler(superClass);
  
  return (
    (t.isIdentifier(expr) && expr.name === 'Component') ||
    (t.isMemberExpression(expr) && 
     t.isIdentifier(safeExpressionHandler(expr.object)) && 
     safeExpressionHandler(expr.object).name === 'React' &&
     t.isIdentifier(safeExpressionHandler(expr.property)) && 
     safeExpressionHandler(expr.property).name === 'Component')
  );
}
