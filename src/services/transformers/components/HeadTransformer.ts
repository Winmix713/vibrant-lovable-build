
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';

export function transformHeadComponent(path: NodePath<t.JSXElement>, result: TransformResult) {
  const openingElement = path.node.openingElement;
  const closingElement = path.node.closingElement;
  
  if (t.isJSXIdentifier(openingElement.name) && openingElement.name.name === 'Head') {
    openingElement.name.name = 'Helmet';
    if (closingElement?.name && t.isJSXIdentifier(closingElement.name)) {
      closingElement.name.name = 'Helmet';
    }
    result.changes.push('Next.js Head component transformed to Helmet');
  }
}

