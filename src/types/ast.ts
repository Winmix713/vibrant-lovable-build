
import { Node, NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export interface AstTransformOptions {
  syntax: 'typescript' | 'javascript';
  preserveComments: boolean;
  target: 'react-vite' | 'react-cra';
}

export interface TransformResult {
  code: string;
  warnings: string[];
  changes: string[];
}

export interface CodeStructure {
  imports: string[];
  exports: string[];
  components: string[];
  hooks: string[];
  hasNextImports: boolean;
  hasApiRoutes: boolean;
}

export type BabelTypes = typeof t;
