
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { AstTransformOptions, TransformResult } from '@/types/ast';
import { isNodeOfType, safeNodeCast } from './astTransformerHelper';
import { transformImports } from './transformers/importTransformer';
import { transformJSXElement } from './transformers/componentTransformer';
import { transformRouterUsage } from './transformers/routerTransformer';

export function transformWithAst(
  sourceCode: string,
  options: Partial<AstTransformOptions> = {}
): TransformResult {
  const result: TransformResult = {
    code: sourceCode,
    warnings: [],
    changes: []
  };

  try {
    const ast = parser.parse(sourceCode, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    // Using a type-safe approach with the transformer functions
    traverse(ast, {
      ImportDeclaration(path: any) {
        transformImports(safeNodeCast(path), result);
      },
      JSXElement(path: any) {
        transformJSXElement(safeNodeCast(path), result);
      },
      MemberExpression(path: any) {
        transformRouterUsage(safeNodeCast(path), result);
      }
    });

    const output = generate(ast, {
      comments: options.preserveComments !== false,
      compact: false
    });

    return { ...result, code: output.code };
  } catch (error) {
    result.warnings.push(`AST transformation error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}
