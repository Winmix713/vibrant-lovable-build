
import * as t from '@babel/types';

/**
 * Safely check if a node is of a specific type
 */
export function isNodeOfType<T extends t.Node>(
  node: t.Node | null | undefined,
  typeCheck: (n: t.Node) => n is T
): node is T {
  return node != null && typeCheck(node);
}

/**
 * Safe casting of nodes to handle version differences in Babel
 */
export function safeNodeCast(node: any): any {
  return node;
}

/**
 * Safe array operations on AST nodes
 */
export function safeArrayLength(arr: any): number {
  if (Array.isArray(arr)) {
    return arr.length;
  }
  return 0;
}

/**
 * Safe array splice operation on AST nodes
 */
export function safeArraySplice(arr: any, index: number, deleteCount: number): void {
  if (Array.isArray(arr)) {
    arr.splice(index, deleteCount);
  }
}

/**
 * Safe property check
 */
export function hasProperty(obj: any, propName: string): boolean {
  return obj && typeof obj === 'object' && propName in obj;
}

/**
 * Safe node transformation helper for Image components
 */
export function transformNextImageToUnpicProps(attributes: any[]): void {
  if (!Array.isArray(attributes)) return;
  
  // Process attributes safely
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    if (!attr || typeof attr !== 'object' || !attr.name) continue;
    
    const name = attr.name.name ? attr.name.name.toString() : '';
    
    // Transform Next.js Image props to @unpic/react Image props
    switch (name) {
      case 'layout':
        if (Array.isArray(attributes)) {
          attributes.splice(i, 1);
          i--;
        }
        break;
      
      case 'objectFit':
        // Handle objectFit transformation
        break;
      
      case 'priority':
        // Handle priority transformation
        break;
      
      // Add other prop transformations as needed
    }
  }
}
