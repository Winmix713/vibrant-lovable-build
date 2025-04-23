
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';

export function transformRouterUsage(path: NodePath<t.MemberExpression>, result: TransformResult) {
  if (t.isIdentifier(path.node.object) && path.node.object.name === 'router') {
    if (t.isIdentifier(path.node.property)) {
      switch (path.node.property.name) {
        case 'push':
          // Módosítjuk a node tulajdonságait
          path.replaceWith(t.identifier('navigate'));
          result.changes.push('router.push transformed to navigate');
          break;
        case 'query':
          // Módosítjuk a node tulajdonságait
          path.replaceWith(t.identifier('params'));
          result.changes.push('router.query transformed to params');
          break;
        case 'asPath':
        case 'pathname':
          // Létrehozunk egy member expression-t
          const locationPathname = t.memberExpression(
            t.identifier('location'), 
            t.identifier('pathname')
          );
          // Lecseréljük a path-t a létrehozott kifejezéssel
          path.replaceWith(locationPathname);
          result.changes.push('router path property transformed');
          break;
      }
    }
  }
}
