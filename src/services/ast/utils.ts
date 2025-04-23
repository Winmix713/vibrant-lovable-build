
import * as t from '@babel/types';

export function safeNodeCast(node: any): any {
  return node;
}

export function isNodeOfType(node: any, type: string): boolean {
  return node && node.type === type;
}

export function createSafeBabelTypes(babelTypes: any): any {
  return {
    ...babelTypes,
    isIdentifier: (node: any) => node && node.type === 'Identifier',
    isArrayPattern: (node: any) => node && node.type === 'ArrayPattern',
    isObjectPattern: (node: any) => node && node.type === 'ObjectPattern',
    isStringLiteral: (node: any) => node && node.type === 'StringLiteral',
    isMemberExpression: (node: any) => node && node.type === 'MemberExpression',
  };
}
