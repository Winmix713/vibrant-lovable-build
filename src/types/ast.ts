
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
  imports: string[];
}

export interface BabelCompatNode {
  type: string;
  [key: string]: any;
}

export type SafeNodePath = NodePath<t.Node>;
export type SafeBabelTypes = typeof t;

export interface ReactRouterRoute {
  path: string;
  element?: React.ReactNode;
  children?: ReactRouterRoute[];
  index?: boolean;
}
