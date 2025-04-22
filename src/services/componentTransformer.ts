
import { transformCode } from './codeTransformer';

export interface ComponentTransformOptions {
  preserveProps?: boolean;
  wrapInSuspense?: boolean;
  generateFallback?: boolean;
}

export interface ComponentTransformResult {
  code: string;
  imports: string[];
  warnings: string[];
}

/**
 * Transforms Next.js Image components to standard img or @unpic/react Image
 */
export function transformImageComponent(code: string, options: ComponentTransformOptions = {}): ComponentTransformResult {
  const result: ComponentTransformResult = {
    code: code,
    imports: ["import { Image } from '@unpic/react';"],
    warnings: []
  };
  
  // Replace imports
  result.code = result.code.replace(
    /import\s+Image\s+from\s+['"]next\/image['"]/g,
    "// Using @unpic/react Image component instead of Next.js Image"
  );
  
  // Replace usage with prop transformation
  result.code = result.code.replace(
    /<Image\s+([^>]*)\s*src=(['"]{1})([^'"]+)(['"]{1})\s+([^>]*)>/g,
    (match, beforeSrc, quote, src, endQuote, afterSrc) => {
      // Check for Next.js-specific props and convert them
      let props = beforeSrc + afterSrc;
      
      // Convert width/height/layout props
      if (!props.includes('layout=') && options.preserveProps) {
        props += ' layout="responsive"';
      }
      
      // Handle priority prop
      if (props.includes('priority')) {
        props = props.replace(/priority/g, 'loading="eager"');
      } else if (!props.includes('loading=')) {
        props += ' loading="lazy"';
      }
      
      return `<Image ${props} src=${quote}${src}${endQuote}>`;
    }
  );
  
  // Check for potential issues
  if (result.code.includes('placeholder=') || result.code.includes('blurDataURL')) {
    result.warnings.push('Next.js Image placeholder/blur features require additional setup with @unpic/react');
  }
  
  return result;
}

/**
 * Transforms Next.js Link components to react-router-dom Link
 */
export function transformLinkComponent(code: string): ComponentTransformResult {
  const result: ComponentTransformResult = {
    code: code,
    imports: ["import { Link } from 'react-router-dom';"],
    warnings: []
  };
  
  // Replace imports
  result.code = result.code.replace(
    /import\s+Link\s+from\s+['"]next\/link['"]/g,
    "import { Link } from 'react-router-dom'"
  );
  
  // Replace href with to
  result.code = result.code.replace(
    /<Link\s+([^>]*)href=(['"]{1})([^'"]+)(['"]{1})([^>]*)>/g,
    "<Link $1to=$2$3$4$5>"
  );
  
  // Check and warn about passHref or legacyBehavior props
  if (result.code.includes('passHref') || result.code.includes('legacyBehavior')) {
    result.warnings.push('Next.js Link passHref and legacyBehavior props are not needed in react-router-dom');
    
    // Remove these props
    result.code = result.code.replace(/\s+passHref/g, '');
    result.code = result.code.replace(/\s+legacyBehavior/g, '');
  }
  
  return result;
}

/**
 * Transforms Next.js Head component to react-helmet-async
 */
export function transformHeadComponent(code: string): ComponentTransformResult {
  const result: ComponentTransformResult = {
    code: code,
    imports: ["import { Helmet } from 'react-helmet-async';"],
    warnings: []
  };
  
  // Replace imports
  result.code = result.code.replace(
    /import\s+Head\s+from\s+['"]next\/head['"]/g,
    "import { Helmet } from 'react-helmet-async'"
  );
  
  // Replace component usage
  result.code = result.code.replace(
    /<Head>([\s\S]*?)<\/Head>/g,
    "<Helmet>$1</Helmet>"
  );
  
  return result;
}

/**
 * Transforms Next.js dynamic imports to React.lazy
 */
export function transformDynamicImport(code: string, options: ComponentTransformOptions = {}): ComponentTransformResult {
  const result: ComponentTransformResult = {
    code: code,
    imports: ["import { lazy, Suspense } from 'react';"],
    warnings: []
  };
  
  // Replace imports
  result.code = result.code.replace(
    /import\s+dynamic\s+from\s+['"]next\/dynamic['"]/g,
    "import { lazy, Suspense } from 'react'"
  );
  
  // Replace dynamic with lazy
  result.code = result.code.replace(
    /const\s+(\w+)\s*=\s*dynamic\(\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)(?:,\s*({[^}]*}))?\)/g,
    (match, componentName, importPath, options) => {
      let result = `const ${componentName} = lazy(() => import('${importPath}'))`;
      
      // Handle dynamic options
      if (options) {
        result += "\n// Converted dynamic options to Suspense fallback";
        
        if (options.includes('loading') && options.wrapInSuspense !== false) {
          result += "\n// You need to wrap this component in a Suspense component with fallback";
        }
      }
      
      return result;
    }
  );
  
  // Check if we need to add Suspense wrapper
  if (options.wrapInSuspense) {
    // This is a simplified approach - in a real implementation we would need to 
    // actually parse the code and insert Suspense at the right locations
    result.warnings.push('Components using lazy() need to be wrapped in <Suspense fallback={...}>');
  }
  
  return result;
}

/**
 * Transforms Next.js Script component to standard script tag
 */
export function transformScriptComponent(code: string): ComponentTransformResult {
  const result: ComponentTransformResult = {
    code: code,
    imports: [],
    warnings: []
  };
  
  // Replace imports
  result.code = result.code.replace(
    /import\s+Script\s+from\s+['"]next\/script['"]/g,
    "// Next.js Script component replaced with standard script element"
  );
  
  // Replace component usage but handle strategy attributes
  result.code = result.code.replace(
    /<Script\s+([^>]*)>([\s\S]*?)<\/Script>/g,
    (match, attrs, content) => {
      // Handle Next.js script strategies
      if (attrs.includes('strategy="lazyOnload"')) {
        attrs = attrs.replace(/strategy="lazyOnload"/, 'defer');
        result.warnings.push('Replaced Next.js Script strategy="lazyOnload" with defer attribute');
      } else if (attrs.includes('strategy="afterInteractive"')) {
        attrs = attrs.replace(/strategy="afterInteractive"/, '');
        result.warnings.push('Removed Next.js Script strategy="afterInteractive" (default browser behavior)');
      } else if (attrs.includes('strategy="beforeInteractive"')) {
        result.warnings.push('Next.js Script strategy="beforeInteractive" requires manual placement in the HTML head');
      } else if (attrs.includes('strategy="worker"')) {
        result.warnings.push('Next.js Script strategy="worker" has no direct equivalent - script included normally');
      }
      
      return `<script ${attrs.replace(/strategy="[^"]*"/, '')}>
        ${content}
      </script>`;
    }
  );
  
  return result;
}

/**
 * Factory function to transform any Next.js component based on type
 */
export function transformComponent(code: string, componentType: string, options: ComponentTransformOptions = {}): ComponentTransformResult {
  switch(componentType.toLowerCase()) {
    case 'image':
      return transformImageComponent(code, options);
    case 'link':
      return transformLinkComponent(code);
    case 'head':
      return transformHeadComponent(code);
    case 'dynamic':
      return transformDynamicImport(code, options);
    case 'script':
      return transformScriptComponent(code);
    default:
      return {
        code,
        imports: [],
        warnings: [`Unknown component type: ${componentType}`]
      };
  }
}
