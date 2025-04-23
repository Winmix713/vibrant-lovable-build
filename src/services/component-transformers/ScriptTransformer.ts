
import { ComponentTransformResult } from './types';

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
