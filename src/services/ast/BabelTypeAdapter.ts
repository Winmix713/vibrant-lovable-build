
import * as t from '@babel/types';
import { Node, NodePath } from '@babel/traverse';

export interface SafeBabelNode extends Node {
  type: string;
  [key: string]: any;
}

export class BabelTypeAdapter {
  static adaptNode(node: any): SafeBabelNode {
    if (!node) return null;
    return {
      ...node,
      type: node.type || 'Unknown'
    };
  }

  static isValidImportSpecifier(node: any): boolean {
    return node && 
           (node.type === 'ImportDefaultSpecifier' || 
            node.type === 'ImportSpecifier' ||
            node.type === 'ImportNamespaceSpecifier');
  }

  static createMemberExpression(object: string, property: string): t.MemberExpression {
    return t.memberExpression(
      t.identifier(object),
      t.identifier(property)
    );
  }
}

