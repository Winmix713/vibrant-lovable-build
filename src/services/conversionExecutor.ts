
import AstTransformer from './astTransformer';
import CICDGenerator from './cicdGenerator';
import type { ConversionOptions, ConversionResult, ConvertedFile } from '@/types';

export class ConversionExecutor {
  private astTransformer: AstTransformer;
  private cicdGenerator: CICDGenerator;

  constructor() {
    this.astTransformer = new AstTransformer();
    this.cicdGenerator = new CICDGenerator();
  }

  async executeConversion(
    options: ConversionOptions,
    files: { path: string; content: string }[]
  ): Promise<ConversionResult> {
    try {
      const convertedFiles: ConvertedFile[] = [];

      // Process each file
      for (const file of files) {
        const convertedFile = await this.processFile(file.path, file.content, options);
        if (convertedFile) {
          convertedFiles.push(convertedFile);
        }
      }

      // Generate CI/CD templates if needed
      if (options.sourceFramework === 'nextjs' && options.targetFramework === 'react') {
        const cicdTemplates = this.cicdGenerator.generateAllCICDTemplates(
          'converted-project',
          'converted-project-bucket'
        );

        // Add each template to the converted files
        for (const template of cicdTemplates) {
          convertedFiles.push({
            path: template.filename,
            content: template.content,
          });
        }
      }

      return {
        success: true,
        files: convertedFiles
      };
    } catch (error) {
      console.error('Conversion error:', error);
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async processFile(
    path: string,
    content: string,
    options: ConversionOptions
  ): Promise<ConvertedFile | null> {
    // Skip node_modules and non-JS/TS files
    if (
      path.includes('node_modules') ||
      (!path.endsWith('.js') &&
       !path.endsWith('.jsx') &&
       !path.endsWith('.ts') &&
       !path.endsWith('.tsx'))
    ) {
      return null;
    }

    let convertedContent = content;
    let newPath = path;

    // Apply conversions based on source and target frameworks
    if (options.sourceFramework === 'nextjs' && options.targetFramework === 'react') {
      // Convert Next.js to React
      if (path.includes('pages/')) {
        // Process Next.js page
        convertedContent = this.astTransformer.transformNextPageToReactComponent(content, path);
        
        // Change path from pages structure to components structure
        const fileName = path.split('/').pop() || '';
        const pageName = fileName.replace(/\.(jsx|tsx|js|ts)$/, '');
        
        if (pageName === 'index') {
          newPath = 'src/pages/Home.tsx';
        } else {
          const capitalizedName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
          newPath = `src/pages/${capitalizedName}.tsx`;
        }
      } else if (path.includes('_app') || path.includes('_document')) {
        // Create App wrapper from _app.js
        convertedContent = this.convertNextAppToReactApp(content);
        newPath = 'src/App.tsx';
      }
    } else if (options.sourceFramework === 'react' && options.targetFramework === 'nextjs') {
      // Convert React to Next.js
      if (path.includes('src/pages/')) {
        convertedContent = this.astTransformer.transformReactToNextJs(content, path);
        
        // Change path from components/pages structure to Next.js pages structure
        const fileName = path.split('/').pop() || '';
        const pageName = fileName.replace(/\.(jsx|tsx|js|ts)$/, '').toLowerCase();
        
        if (pageName === 'home') {
          newPath = 'pages/index.tsx';
        } else {
          newPath = `pages/${pageName}.tsx`;
        }
      }
    }

    return {
      path: newPath,
      content: convertedContent,
      originalPath: path
    };
  }

  private convertNextAppToReactApp(content: string): string {
    // Basic conversion of _app.js to App.tsx
    // This is a simplified implementation
    return `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// Converted from Next.js _app.js
// You'll need to manually set up routes for all your pages

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Add more routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;`;
  }
}

export default ConversionExecutor;
