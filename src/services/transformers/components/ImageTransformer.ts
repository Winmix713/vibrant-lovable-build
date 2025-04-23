
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';

export function transformImageComponent(path: NodePath<t.JSXElement>, result: TransformResult) {
  const openingElement = path.node.openingElement;
  
  if (t.isJSXIdentifier(openingElement.name) && openingElement.name.name === 'Image') {
    // Transform Image component attributes
    const newAttributes = openingElement.attributes.filter(attr => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        return !['priority', 'placeholder'].includes(attr.name.name);
      }
      return true;
    });
    
    openingElement.attributes = newAttributes;
    result.changes.push('Next.js Image component transformed');
  }
}

