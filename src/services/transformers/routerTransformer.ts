
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';

export function transformRouterUsage(path: NodePath<t.MemberExpression>, result: TransformResult) {
  if (t.isIdentifier(path.node.object) && path.node.object.name === 'router') {
    if (t.isIdentifier(path.node.property)) {
      switch (path.node.property.name) {
        case 'push':
          // Create a navigate identifier and modify existing node
          const navigateId = t.identifier('navigate');
          path.node.object = navigateId;
          path.node.property = t.identifier('');
          result.changes.push('router.push transformed to navigate');
          break;
        case 'query':
          // Create a params identifier and modify existing node
          const paramsId = t.identifier('params');
          path.node.object = paramsId;
          path.node.property = t.identifier('');
          result.changes.push('router.query transformed to params');
          break;
        case 'asPath':
        case 'pathname':
          // Create location.pathname identifiers and modify existing node
          const locationObj = t.identifier('location');
          const pathnameId = t.identifier('pathname');
          
          // Modify the existing node instead of replacing it
          path.node.object = locationObj;
          path.node.property = pathnameId;
          result.changes.push('router path property transformed');
          break;
      }
    }
  }
}
