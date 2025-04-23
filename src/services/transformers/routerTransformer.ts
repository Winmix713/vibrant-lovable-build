
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';

export function transformRouterUsage(path: NodePath<t.MemberExpression>, result: TransformResult) {
  if (t.isIdentifier(path.node.object) && path.node.object.name === 'router') {
    if (t.isIdentifier(path.node.property)) {
      switch (path.node.property.name) {
        case 'push':
          // Instead of directly replacing, update the node properties
          path.node.object = t.identifier('navigate');
          result.changes.push('router.push transformed to navigate');
          break;
        case 'query':
          // Instead of directly replacing, update the node properties
          path.node.object = t.identifier('params');
          result.changes.push('router.query transformed to params');
          break;
        case 'asPath':
        case 'pathname':
          // Create a member expression instead of directly replacing
          const locationPathname = t.memberExpression(
            t.identifier('location'), 
            t.identifier('pathname')
          );
          // Use path.replaceWith with the created expression
          if (path.node) {
            path.replaceWith(locationPathname);
            result.changes.push('router path property transformed');
          }
          break;
      }
    }
  }
}
