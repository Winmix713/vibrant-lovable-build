
import { ComponentTransformOptions, ComponentTransformResult } from './types';

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
