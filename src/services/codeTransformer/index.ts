
import { TransformationResult } from './types';
import { nextToViteTransformations } from './transformRules';
export * from './types';
export * from './transformRules';
export * from './transformUtils';

/**
 * Main transformation function to convert Next.js code to Vite-compatible code
 */
export function transformCode(sourceCode: string): TransformationResult {
  const appliedTransformations: string[] = [];
  let transformedCode = sourceCode;

  for (const rule of nextToViteTransformations) {
    if (rule.pattern.test(transformedCode)) {
      if (typeof rule.replacement === 'string') {
        transformedCode = transformedCode.replace(rule.pattern, rule.replacement);
      } else if (typeof rule.replacement === 'function') {
        transformedCode = transformedCode.replace(rule.pattern, rule.replacement as any);
      }
      appliedTransformations.push(rule.description);
    }
  }

  return {
    transformedCode,
    appliedTransformations
  };
}
