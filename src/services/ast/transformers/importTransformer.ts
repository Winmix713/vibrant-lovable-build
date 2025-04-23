
import generate from '@babel/generator';
import { TransformResult } from '../types';
import { safeTraverse } from '../traverse';

export function transformImports(ast: any): TransformResult {
  const changes: string[] = [];
  const warnings: string[] = [];
  const addedImports: string[] = [];

  safeTraverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      
      // Next.js specific imports transformation
      if (source === 'next/image') {
        path.node.source.value = '@unpic/react';
        changes.push('next/image import transformed to @unpic/react');
        addedImports.push('import { Image } from "@unpic/react";');
      } else if (source === 'next/link') {
        path.node.source.value = 'react-router-dom';
        changes.push('next/link import transformed to react-router-dom');
        addedImports.push('import { Link } from "react-router-dom";');
      } else if (source === 'next/head') {
        path.node.source.value = 'react-helmet-async';
        changes.push('next/head import transformed to react-helmet-async');
        addedImports.push('import { Helmet } from "react-helmet-async";');
      }
    }
  });

  return {
    code: generate(ast).code,
    warnings,
    changes,
    imports: addedImports
  };
}
