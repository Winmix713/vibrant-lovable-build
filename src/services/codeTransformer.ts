
interface TransformationRule {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  category: 'component' | 'routing' | 'data-fetching' | 'api' | 'config' | 'general';
}

export const nextToViteTransformations: TransformationRule[] = [
  // Alap Next.js SSR átalakítások
  {
    pattern: /import\s+{\s*GetServerSideProps\s*(?:,\s*[^}]+)?\s*}\s+from\s+'next'/g,
    replacement: "// Vite equivalent not needed - use React Query or similar",
    description: "Remove Next.js SSR imports",
    complexity: 'simple',
    category: 'data-fetching'
  },
  {
    pattern: /export\s+const\s+getServerSideProps\s*=\s*async\s*\(\s*(?:context)?\s*\)\s*=>\s*{([^}]*)}/gs,
    replacement: (match, funcBody) => {
      return `// Converted to React Query fetch function
export const fetchData = async () => {
  // Original getServerSideProps logic:
  ${funcBody}
}`;
    },
    description: "Convert SSR getServerSideProps to client-side fetching",
    complexity: 'medium',
    category: 'data-fetching'
  },
  {
    pattern: /export\s+const\s+getStaticProps\s*=\s*async\s*\(\s*(?:context)?\s*\)\s*=>\s*{([^}]*)}/gs,
    replacement: (match, funcBody) => {
      return `// Converted to React Query fetch function
export const fetchStaticData = async () => {
  // Original getStaticProps logic:
  ${funcBody}
}`;
    },
    description: "Convert SSR getStaticProps to client-side fetching",
    complexity: 'medium',
    category: 'data-fetching'
  },
  {
    pattern: /export\s+const\s+getStaticPaths\s*=\s*async\s*\(\s*\)\s*=>\s*{([^}]*)}/gs,
    replacement: (match, funcBody) => {
      return `// Converted to React Router compatible function
export const getAvailablePaths = async () => {
  // Original getStaticPaths logic:
  ${funcBody}
}`;
    },
    description: "Convert SSR getStaticPaths",
    complexity: 'medium',
    category: 'data-fetching'
  },

  // Next.js router átalakítások
  {
    pattern: /import\s+{\s*useRouter\s*(?:,\s*[^}]+)?\s*}\s+from\s+'next\/router'/g,
    replacement: "import { useNavigate, useParams, useLocation } from 'react-router-dom'",
    description: "Replace Next.js router with React Router",
    complexity: 'simple',
    category: 'routing'
  },
  {
    pattern: /const\s+router\s*=\s*useRouter\(\)/g,
    replacement: "const navigate = useNavigate()\nconst params = useParams()\nconst location = useLocation()",
    description: "Update router usage",
    complexity: 'simple',
    category: 'routing'
  },
  {
    pattern: /router\.push\((['"`])([^'"`]+)(['"`])\)/g,
    replacement: "navigate($1$2$3)",
    description: "Convert router.push to navigate",
    complexity: 'simple',
    category: 'routing'
  },
  {
    pattern: /router\.replace\((['"`])([^'"`]+)(['"`])\)/g,
    replacement: "navigate($1$2$3, { replace: true })",
    description: "Convert router.replace to navigate with replace",
    complexity: 'simple',
    category: 'routing'
  },
  {
    pattern: /router\.query\.(\w+)/g,
    replacement: "params.$1",
    description: "Convert router.query to useParams",
    complexity: 'simple',
    category: 'routing'
  },
  {
    pattern: /router\.asPath/g,
    replacement: "location.pathname",
    description: "Convert router.asPath to location.pathname",
    complexity: 'simple',
    category: 'routing'
  },
  {
    pattern: /router\.pathname/g,
    replacement: "location.pathname",
    description: "Convert router.pathname to location.pathname",
    complexity: 'simple',
    category: 'routing'
  },
  {
    pattern: /router\.back\(\)/g,
    replacement: "navigate(-1)",
    description: "Convert router.back to navigate(-1)",
    complexity: 'simple',
    category: 'routing'
  },

  // Next.js Image komponens átalakítás
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

  // Next.js Head komponens helyettesítése
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
  },

  // Next.js Dynamic import átalakítás
  {
    pattern: /import\s+dynamic\s+from\s+['"]next\/dynamic['"]/g,
    replacement: "import { lazy, Suspense } from 'react'",
    description: "Replace Next.js dynamic with React.lazy",
    complexity: 'simple',
    category: 'component'
  },
  {
    pattern: /const\s+(\w+)\s*=\s*dynamic\(\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)\)/g,
    replacement: "const $1 = lazy(() => import('$2'))",
    description: "Convert dynamic import syntax",
    complexity: 'medium',
    category: 'component'
  },
  {
    pattern: /import\s+{\s*useRouter\s*}\s+from\s+['"]next\/router['"]/g,
    replacement: "import { useNavigate, useParams, useLocation } from 'react-router-dom'",
    description: "Replace Next.js router with React Router",
    complexity: 'simple',
    category: 'routing'
  },

  // API Routes átalakítás
  {
    pattern: /export\s+default\s+function\s+handler\s*\(req,\s*res\)\s*{([^}]*)}/gs,
    replacement: (match, funcBody) => {
      return `// API route converted to Vite-compatible endpoint
// Consider using backend services like Supabase, Firebase, or Express
// Example with Express:
// app.post('/api/your-endpoint', (req, res) => {
${funcBody}
// });`;
    },
    description: "Convert Next.js API routes to alternative backend options",
    complexity: 'complex',
    category: 'api'
  },

  // Config átalakítások
  {
    pattern: /next\.config\.js/g,
    replacement: "vite.config.js",
    description: "Replace Next.js config references to Vite config",
    complexity: 'simple',
    category: 'config'
  },
  
  // i18n kezelés
  {
    pattern: /import\s+{\s*useTranslation\s*}\s+from\s+['"]next-i18next['"]/g,
    replacement: "import { useTranslation } from 'react-i18next'",
    description: "Replace next-i18next with react-i18next",
    complexity: 'simple',
    category: 'general'
  },
  
  // Next.js Script komponens átalakítása
  {
    pattern: /import\s+Script\s+from\s+['"]next\/script['"]/g,
    replacement: "// Using standard script tag instead of Next.js Script",
    description: "Replace Next.js Script with standard script tag",
    complexity: 'simple',
    category: 'component'
  },
  {
    pattern: /<Script\s+([^>]*)>([\s\S]*?)<\/Script>/g,
    replacement: "<script $1>$2</script>",
    description: "Convert Script component to standard script tag",
    complexity: 'medium',
    category: 'component'
  },
  
  // Next.js Link komponens átalakítása
  {
    pattern: /import\s+Link\s+from\s+['"]next\/link['"]/g,
    replacement: "import { Link } from 'react-router-dom'",
    description: "Replace Next.js Link with React Router Link",
    complexity: 'simple',
    category: 'routing'
  },
  {
    pattern: /<Link\s+([^>]*)href=(['"]{1})([^'"]+)(['"]{1})([^>]*)>/g,
    replacement: "<Link $1to=$2$3$4$5>",
    description: "Convert Link href prop to to prop",
    complexity: 'medium',
    category: 'routing'
  },
  
  // Next.js getInitialProps átalakítása
  {
    pattern: /(\w+)\.getInitialProps\s*=\s*async\s*\(\s*(?:context)?\s*\)\s*=>\s*{([^}]*)}/gs,
    replacement: (match, componentName, funcBody) => {
      return `// Converted getInitialProps to React Query
export const use${componentName}Data = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['${componentName.toLowerCase()}-data'],
    queryFn: async () => {
      // Original getInitialProps logic:
      ${funcBody}
    }
  });
}`;
    },
    description: "Convert getInitialProps to React Query hook",
    complexity: 'complex',
    category: 'data-fetching'
  }
];

// A végső transzformációs függvény
export function transformCode(sourceCode: string): {
  transformedCode: string;
  appliedTransformations: string[];
} {
  const appliedTransformations: string[] = [];
  let transformedCode = sourceCode;

  for (const rule of nextToViteTransformations) {
    if (rule.pattern.test(transformedCode)) {
      if (typeof rule.replacement === 'string') {
        transformedCode = transformedCode.replace(rule.pattern, rule.replacement);
      } else if (typeof rule.replacement === 'function') {
        transformedCode = transformedCode.replace(rule.pattern, rule.replacement as any);
      }
      appliedTransformations.push(rule.description);
    }
  }

  return {
    transformedCode,
    appliedTransformations
  };
}

// Új API funkciók a transzformációs modul kibővítéséhez

// Prioritások vagy kategóriák alapján rendezett transzformációs szabályok
export function getTransformationsByComplexity(complexity: 'simple' | 'medium' | 'complex' | 'all' = 'all'): TransformationRule[] {
  if (complexity === 'all') {
    return nextToViteTransformations;
  }
  
  return nextToViteTransformations.filter(rule => rule.complexity === complexity);
}

export function getTransformationsByCategory(category: string): TransformationRule[] {
  return nextToViteTransformations.filter(rule => rule.category === category);
}

interface TransformationStats {
  totalRules: number;
  appliedRules: number;
  modificationRate: number;
  complexity: {
    simple: number;
    medium: number;
    complex: number;
  };
  categories: Record<string, number>;
}

// Statisztika generálás a transzformációkról
export function getTransformationStats(sourceCode: string): TransformationStats {
  let simple = 0;
  let medium = 0;
  let complex = 0;
  const categories: Record<string, number> = {};
  
  const appliedRules = nextToViteTransformations.filter(rule => {
    const applied = rule.pattern.test(sourceCode);
    if (applied) {
      if (rule.complexity === 'simple') simple++;
      if (rule.complexity === 'medium') medium++;
      if (rule.complexity === 'complex') complex++;
      
      categories[rule.category] = (categories[rule.category] || 0) + 1;
    }
    return applied;
  });
  
  return {
    totalRules: nextToViteTransformations.length,
    appliedRules: appliedRules.length,
    modificationRate: appliedRules.length / nextToViteTransformations.length,
    complexity: {
      simple,
      medium,
      complex
    },
    categories
  };
}

// Component conversion utility functions
export function generateReactImportStatements(componentTypes: string[]): string {
  const imports = new Set<string>();
  
  componentTypes.forEach(type => {
    switch(type) {
      case 'image':
        imports.add("import { Image } from '@unpic/react';");
        break;
      case 'link':
        imports.add("import { Link } from 'react-router-dom';");
        break;
      case 'head':
        imports.add("import { Helmet } from 'react-helmet-async';");
        break;
      case 'dynamic':
        imports.add("import { lazy, Suspense } from 'react';");
        break;
    }
  });
  
  return Array.from(imports).join('\n');
}

// Advanced transformation for component usage
export function transformComponentUsage(code: string, componentType: string): string {
  switch(componentType) {
    case 'image':
      return transformCode(code).transformedCode;
    case 'link':
      return transformCode(code).transformedCode;
    case 'head':
      return transformCode(code).transformedCode;
    case 'dynamic':
      return transformCode(code).transformedCode;
    default:
      return code;
  }
}
