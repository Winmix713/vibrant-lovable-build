import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { ErrorCollector } from '../errors/ErrorCollector';

/**
 * Transformer that uses AST to convert Next.js Image components
 * to @unpic/react Image components with advanced props handling
 */
export class AstImageTransformer {
  private errorCollector: ErrorCollector;
  
  constructor(errorCollector: ErrorCollector) {
    this.errorCollector = errorCollector;
  }
  
  /**
   * Transform Next.js Image to @unpic/react Image using AST
   */
  transformImageComponent(code: string, filePath: string): {
    code: string;
    imports: string[];
    warnings: string[];
  } {
    const result = {
      code,
      imports: ["import { Image } from '@unpic/react';"],
      warnings: [] as string[]
    };
    
    try {
      // Parse code to AST
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      // Track if we found and modified any Image components
      let imageComponentFound = false;
      let nextImageImportFound = false;
      
      // Find and replace Next.js Image imports
      traverse(ast, {
        ImportDeclaration(path) {
          const importSource = path.node.source.value;
          
          if (importSource === 'next/image') {
            nextImageImportFound = true;
            
            // Replace the import with @unpic/react
            path.node.source.value = '@unpic/react';
            
            // Check if it's a default import and adjust if needed
            const defaultImport = path.node.specifiers.find(
              spec => t.isImportDefaultSpecifier(spec)
            );
            
            if (defaultImport) {
              imageComponentFound = true;
            }
          }
        }
      });
      
      // Return early if no Next.js Image import was found
      if (!nextImageImportFound) {
        return result;
      }
      
      // Transform JSX elements
      traverse(ast, {
        JSXElement(path) {
          const openingElement = path.node.openingElement;
          
          // Check if this is an Image component
          if (t.isJSXIdentifier(openingElement.name) && 
              openingElement.name.name === 'Image') {
            
            imageComponentFound = true;
            
            // Convert Next.js Image props to @unpic/react Image props
            this.transformImageProps(openingElement.attributes);
          }
        }
      });
      
      // Generate code from the modified AST
      if (imageComponentFound) {
        const output = generate(ast);
        result.code = output.code;
        
        // Add warnings about potentially unsupported features
        if (code.includes('placeholder="blur"') || code.includes('blurDataURL')) {
          result.warnings.push('Next.js Image blur placeholder requires additional setup with @unpic/react');
          this.errorCollector.addError({
            code: 'IMAGE_BLUR_UNSUPPORTED',
            severity: 'warning',
            message: 'Image blur placeholder requires additional setup with @unpic/react',
            file: filePath,
            suggestion: 'Consider using CSS blur filters or implement a custom blur solution'
          });
        }
      }
      
      return result;
    } catch (error) {
      // Add error to collector
      this.errorCollector.addError({
        code: 'AST_IMAGE_TRANSFORM_ERROR',
        severity: 'warning',
        message: `Error transforming Image component: ${error instanceof Error ? error.message : String(error)}`,
        file: filePath
      });
      
      // Return original code if transformation fails
      return result;
    }
  }
  
  /**
   * Transform Next.js Image props to @unpic/react Image props
   */
  private transformImageProps(attributes: t.JSXAttribute[]): void {
    // Track if required props are present
    let hasSizes = false;
    let hasWidth = false;
    let hasHeight = false;
    
    // Process all attributes
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      
      if (!t.isJSXAttribute(attr)) continue;
      
      const name = attr.name.name.toString();
      
      switch (name) {
        case 'layout':
          // Remove layout prop as it's not needed in @unpic/react
          attributes.splice(i, 1);
          i--;
          break;
        
        case 'objectFit':
          // Rename to style prop with objectFit
          attr.name.name = 'style';
          const value = attr.value;
          
          if (t.isStringLiteral(value)) {
            // Create object expression for style
            attr.value = t.jsxExpressionContainer(
              t.objectExpression([
                t.objectProperty(
                  t.identifier('objectFit'),
                  t.stringLiteral(value.value)
                )
              ])
            );
          }
          break;
        
        case 'priority':
          // Convert priority to loading="eager"
          attr.name.name = 'loading';
          attr.value = t.stringLiteral('eager');
          break;
        
        case 'placeholder':
          // Handle placeholder - we'll keep it for now but add a warning
          if (attr.value && t.isStringLiteral(attr.value) && attr.value.value === 'blur') {
            // Keep as is, warning added elsewhere
          }
          break;
          
        case 'sizes':
          hasSizes = true;
          break;
          
        case 'width':
          hasWidth = true;
          break;
          
        case 'height':
          hasHeight = true;
          break;
      }
    }
    
    // Add loading="lazy" if no priority/loading is specified
    const hasLoading = attributes.some(attr => 
      t.isJSXAttribute(attr) && attr.name.name.toString() === 'loading'
    );
    
    if (!hasLoading) {
      attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier('loading'),
          t.stringLiteral('lazy')
        )
      );
    }
    
    // Add responsive handling if needed
    if (!hasSizes && hasWidth && hasHeight) {
      // Add sizes attribute for responsive images
      attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier('sizes'),
          t.stringLiteral('(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
        )
      );
    }
  }
}
