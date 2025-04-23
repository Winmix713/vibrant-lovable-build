
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
