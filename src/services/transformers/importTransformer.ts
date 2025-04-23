
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { TransformResult } from '@/types/ast';

export function transformImports(path: NodePath<t.ImportDeclaration>, result: TransformResult) {
  const source = path.node.source.value;
  
  // Transform Next.js imports
  switch (source) {
    case 'next/image':
      path.node.source.value = '@unpic/react';
      result.changes.push('next/image import transformed to @unpic/react import');
      break;
    case 'next/link':
      path.node.source.value = 'react-router-dom';
      result.changes.push('next/link import transformed to react-router-dom import');
      break;
    case 'next/head':
      path.node.source.value = 'react-helmet-async';
      result.changes.push('next/head import transformed to react-helmet-async import');
      break;
    case 'next/router':
      path.node.source.value = 'react-router-dom';
      result.changes.push('next/router import transformed to react-router-dom import');
      break;
  }
}
