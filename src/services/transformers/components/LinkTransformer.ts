
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';

export function transformLinkComponent(path: NodePath<t.JSXElement>, result: TransformResult) {
  const openingElement = path.node.openingElement;
  
  if (t.isJSXIdentifier(openingElement.name) && openingElement.name.name === 'Link') {
    // Transform href to to prop
    openingElement.attributes = openingElement.attributes.map(attr => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'href') {
        attr.name.name = 'to';
      }
      return attr;
    });
    
    result.changes.push('Next.js Link component transformed to react-router-dom Link');
  }
}

