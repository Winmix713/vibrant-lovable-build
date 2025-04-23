
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
