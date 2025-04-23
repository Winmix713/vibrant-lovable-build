
import { TransformationRule, TransformationStats } from './types';
import { nextToViteTransformations } from './transformRules';

/**
 * Get transformation rules filtered by complexity
 */
export function getTransformationsByComplexity(
  complexity: 'simple' | 'medium' | 'complex' | 'all' = 'all'
): TransformationRule[] {
  if (complexity === 'all') {
    return nextToViteTransformations;
  }
  
  return nextToViteTransformations.filter(rule => rule.complexity === complexity);
}

/**
 * Get transformation rules filtered by category
 */
export function getTransformationsByCategory(category: string): TransformationRule[] {
  return nextToViteTransformations.filter(rule => rule.category === category);
}

/**
 * Generate statistics for transformations on a given source code
 */
export function getTransformationStats(sourceCode: string): TransformationStats {
  let simple = 0;
  let medium = 0;
  let complex = 0;
  const categories: Record<string, number> = {};
  
  const appliedRules = nextToViteTransformations.filter(rule => {
    const applied = rule.pattern.test(sourceCode);
    if (applied) {
      if (rule.complexity === 'simple') simple++;
      if (rule.complexity === 'medium') medium++;
      if (rule.complexity === 'complex') complex++;
      
      categories[rule.category] = (categories[rule.category] || 0) + 1;
    }
    return applied;
  });
  
  return {
    totalRules: nextToViteTransformations.length,
    appliedRules: appliedRules.length,
    modificationRate: appliedRules.length / nextToViteTransformations.length,
    complexity: {
      simple,
      medium,
      complex
    },
    categories
  };
}

/**
 * Generate React import statements for component types
 */
export function generateReactImportStatements(componentTypes: string[]): string {
  const imports = new Set<string>();
  
  componentTypes.forEach(type => {
    switch(type) {
      case 'image':
        imports.add("import { Image } from '@unpic/react';");
        break;
      case 'link':
        imports.add("import { Link } from 'react-router-dom';");
        break;
      case 'head':
        imports.add("import { Helmet } from 'react-helmet-async';");
        break;
      case 'dynamic':
        imports.add("import { lazy, Suspense } from 'react';");
        break;
    }
  });
  
  return Array.from(imports).join('\n');
}

/**
 * Transform component usage based on component type
 */
export function transformComponentUsage(code: string, componentType: string): string {
  // Use the base transformer for different component types
  switch(componentType) {
    case 'image':
    case 'link':
    case 'head':
    case 'dynamic':
      // Implementation will be in each component's transformer
      return code;
    default:
      return code;
  }
}
