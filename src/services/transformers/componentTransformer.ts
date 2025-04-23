
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';
import { transformImageComponent } from './components/ImageTransformer';
import { transformLinkComponent } from './components/LinkTransformer';
import { transformHeadComponent } from './components/HeadTransformer';
import { transformScriptComponent } from './components/ScriptTransformer';

export function transformJSXElement(path: NodePath<t.JSXElement>, result: TransformResult) {
  // Apply each component transformer
  transformImageComponent(path, result);
  transformLinkComponent(path, result);
  transformHeadComponent(path, result);
  transformScriptComponent(path, result);
}
