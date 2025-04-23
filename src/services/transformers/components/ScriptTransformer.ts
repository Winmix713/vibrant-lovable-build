
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';

export function transformScriptComponent(path: NodePath<t.JSXElement>, result: TransformResult) {
  const openingElement = path.node.openingElement;
  
  if (t.isJSXIdentifier(openingElement.name) && openingElement.name.name === 'Script') {
    openingElement.name.name = 'script';
    
    // Transform strategy attributes to standard script attributes
    openingElement.attributes = openingElement.attributes.map(attr => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        if (attr.name.name === 'strategy') {
          if (attr.value && t.isStringLiteral(attr.value)) {
            switch (attr.value.value) {
              case 'lazyOnload':
                return t.jsxAttribute(t.jsxIdentifier('defer'), null);
              case 'beforeInteractive':
              case 'afterInteractive':
              case 'worker':
                return null;
            }
          }
        }
      }
      return attr;
    }).filter(Boolean) as t.JSXAttribute[];
    
    result.changes.push('Next.js Script component transformed to standard script tag');
  }
}

