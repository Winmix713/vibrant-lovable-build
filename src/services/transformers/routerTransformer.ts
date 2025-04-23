
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';

export function transformRouterUsage(path: NodePath<t.MemberExpression>, result: TransformResult) {
  if (t.isIdentifier(path.node.object) && path.node.object.name === 'router') {
    if (t.isIdentifier(path.node.property)) {
      switch (path.node.property.name) {
        case 'push':
          // Fix: Create a NodePath using path.scope.buildUndeclaredIdentifier
          const navigateId = t.identifier('navigate');
          path.replaceWith(navigateId);
          result.changes.push('router.push transformed to navigate');
          break;
        case 'query':
          // Fix: Create a NodePath using path.scope.buildUndeclaredIdentifier
          const paramsId = t.identifier('params');
          path.replaceWith(paramsId);
          result.changes.push('router.query transformed to params');
          break;
        case 'asPath':
        case 'pathname':
          // Fix: Create a proper MemberExpression node
          const locationPathname = t.memberExpression(
            t.identifier('location'), 
            t.identifier('pathname')
          );
          // Use path.replaceWithSourceString for complex expressions
          path.replaceWith(locationPathname);
          result.changes.push('router path property transformed');
          break;
      }
    }
  }
}
