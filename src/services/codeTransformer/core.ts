
import { TransformationResult } from './types';
import { componentTransformRules } from './rules/componentRules';
import { routingTransformRules } from './rules/routingRules';

export function transformCode(sourceCode: string): TransformationResult {
  const appliedTransformations: string[] = [];
  let transformedCode = sourceCode;

  const allRules = [...componentTransformRules, ...routingTransformRules];

  for (const rule of allRules) {
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
