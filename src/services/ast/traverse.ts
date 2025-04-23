
import traverse from '@babel/traverse';
import * as parser from '@babel/parser';
import { AstTransformOptions } from './types';

export function parseCode(code: string, options: AstTransformOptions) {
  return parser.parse(code, {
    sourceType: 'module',
    plugins: [
      options.syntax === 'typescript' ? 'typescript' : null,
      'jsx',
      'decorators-legacy',
      'classProperties'
    ].filter(Boolean) as parser.ParserPlugin[],
    tokens: true
  });
}

export function safeTraverse(ast: any, visitor: any): void {
  try {
    traverse(ast, visitor);
  } catch (error) {
    console.warn('AST traversal error:', error);
  }
}
