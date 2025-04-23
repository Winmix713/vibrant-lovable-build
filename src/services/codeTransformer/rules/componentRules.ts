
import { TransformationRule } from '../types';

export const componentTransformRules: TransformationRule[] = [
  {
    pattern: /import\s+Image\s+from\s+['"]next\/image['"]/g,
    replacement: "// Using standard <img> tag instead of Next.js Image\nimport { Image } from '@unpic/react'",
    description: "Replace Next.js Image with @unpic/react",
    complexity: 'medium',
    category: 'component'
  },
  {
    pattern: /<Image\s+([^>]*)\s*src=(['"]{1})([^'"]+)(['"]{1})\s+([^>]*)>/g,
    replacement: "<Image $1 src={$2$3$4} layout=\"responsive\" $5>",
    description: "Convert Next.js Image to @unpic/react Image",
    complexity: 'complex',
    category: 'component'
  },
  {
    pattern: /import\s+Head\s+from\s+['"]next\/head['"]/g,
    replacement: "import { Helmet } from 'react-helmet-async'",
    description: "Replace Next.js Head with react-helmet-async",
    complexity: 'simple',
    category: 'component'
  },
  {
    pattern: /<Head>([\s\S]*?)<\/Head>/g,
    replacement: "<Helmet>$1</Helmet>",
    description: "Convert Head component to Helmet component",
    complexity: 'medium',
    category: 'component'
  }
];
