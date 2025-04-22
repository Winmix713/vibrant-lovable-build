
import { transformCode } from './codeTransformer';

export interface DataFetchingTransformOptions {
  useReactQuery?: boolean;
  useSWR?: boolean;
  generateHooks?: boolean;
  preserveComments?: boolean;
}

export interface DataFetchingTransformResult {
  code: string;
  imports: string[];
  hooks: string[];
  warnings: string[];
}

/**
 * Transforms Next.js getServerSideProps to client-side fetching
 */
export function transformGetServerSideProps(code: string, options: DataFetchingTransformOptions = {}): DataFetchingTransformResult {
  const result: DataFetchingTransformResult = {
    code: code,
    imports: [],
    hooks: [],
    warnings: []
  };
  
  // Add required imports based on selected option
  if (options.useReactQuery) {
    result.imports.push("import { useQuery } from '@tanstack/react-query';");
  } else if (options.useSWR) {
    result.imports.push("import useSWR from 'swr';");
  } else {
    result.imports.push("import { useState, useEffect } from 'react';");
  }
  
  // Extract and transform getServerSideProps
  const getServerSidePropsRegex = /export\s+const\s+getServerSideProps\s*=\s*async\s*\(\s*(?:context)?\s*\)\s*=>\s*{([\s\S]*?)return\s*{([\s\S]*?)}\s*;?\s*\}/g;
  
  let match;
  while ((match = getServerSidePropsRegex.exec(code)) !== null) {
    const functionBody = match[1];
    const returnStatement = match[2];
    
    let hookName = 'usePageData';
    let queryKey = "'pageData'";
    
    // Extract props to determine query key
    if (returnStatement.includes('props:')) {
      const propsMatch = /props:\s*{([\s\S]*?)}/g.exec(returnStatement);
      if (propsMatch) {
        const propsContent = propsMatch[1];
        // Try to extract the first prop key as the query key
        const firstPropMatch = /(\w+):/g.exec(propsContent);
        if (firstPropMatch) {
          hookName = `use${firstPropMatch[1].charAt(0).toUpperCase() + firstPropMatch[1].slice(1)}`;
          queryKey = `'${firstPropMatch[1]}'`;
        }
      }
    }
    
    // Generate the appropriate hook based on options
    if (options.useReactQuery) {
      const reactQueryHook = `export function ${hookName}(params = {}) {
  return useQuery({
    queryKey: [${queryKey}, params],
    queryFn: async () => {
      // Converted from getServerSideProps
      ${functionBody.replace(/context/g, 'params')}
      // Extract props from the original return statement
      const data = ${returnStatement.includes('props:') ? 'props' : '{}'};
      return data;
    }
  });
}`;
      result.hooks.push(reactQueryHook);
      
    } else if (options.useSWR) {
      const swrHook = `export function ${hookName}(params = {}) {
  return useSWR(
    [${queryKey}, params],
    async () => {
      // Converted from getServerSideProps
      ${functionBody.replace(/context/g, 'params')}
      // Extract props from the original return statement
      const data = ${returnStatement.includes('props:') ? 'props' : '{}'};
      return data;
    }
  );
}`;
      result.hooks.push(swrHook);
      
    } else {
      const useEffectHook = `export function ${hookName}(params = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Converted from getServerSideProps
        ${functionBody.replace(/context/g, 'params')}
        // Extract props from the original return statement
        const result = ${returnStatement.includes('props:') ? 'props' : '{}'};
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [${options.generateHooks ? 'JSON.stringify(params)' : ''}]);

  return { data, isLoading, error };
}`;
      result.hooks.push(useEffectHook);
    }
    
    // Replace the original getServerSideProps with a comment
    result.code = result.code.replace(match[0], `// getServerSideProps converted to client-side data fetching
// Use the ${hookName} function instead`);
  }
  
  // Add warnings about context usage
  if (result.code.includes('context.req') || result.code.includes('context.res')) {
    result.warnings.push('Server-only objects like req and res are not available in client-side fetching');
  }
  
  return result;
}

/**
 * Transforms Next.js getStaticProps to client-side fetching
 */
export function transformGetStaticProps(code: string, options: DataFetchingTransformOptions = {}): DataFetchingTransformResult {
  const result: DataFetchingTransformResult = {
    code: code,
    imports: [],
    hooks: [],
    warnings: []
  };
  
  // Similar implementation to getServerSideProps, but handling the specific features of getStaticProps
  if (options.useReactQuery) {
    result.imports.push("import { useQuery } from '@tanstack/react-query';");
  } else if (options.useSWR) {
    result.imports.push("import useSWR from 'swr';");
  } else {
    result.imports.push("import { useState, useEffect } from 'react';");
  }
  
  // Extract and transform getStaticProps
  const getStaticPropsRegex = /export\s+const\s+getStaticProps\s*=\s*async\s*\(\s*(?:{[^}]*})?\s*\)\s*=>\s*{([\s\S]*?)return\s*{([\s\S]*?)}\s*;?\s*\}/g;
  
  let match;
  while ((match = getStaticPropsRegex.exec(code)) !== null) {
    const functionBody = match[1];
    const returnStatement = match[2];
    
    let hookName = 'useStaticData';
    let queryKey = "'staticData'";
    
    // Extract props to determine query key
    if (returnStatement.includes('props:')) {
      const propsMatch = /props:\s*{([\s\S]*?)}/g.exec(returnStatement);
      if (propsMatch) {
        const propsContent = propsMatch[1];
        // Try to extract the first prop key as the query key
        const firstPropMatch = /(\w+):/g.exec(propsContent);
        if (firstPropMatch) {
          hookName = `use${firstPropMatch[1].charAt(0).toUpperCase() + firstPropMatch[1].slice(1)}`;
          queryKey = `'${firstPropMatch[1]}'`;
        }
      }
    }
    
    // Check for revalidate
    let revalidateTime = null;
    if (returnStatement.includes('revalidate:')) {
      const revalidateMatch = /revalidate:\s*(\d+)/g.exec(returnStatement);
      if (revalidateMatch) {
        revalidateTime = parseInt(revalidateMatch[1]);
      }
    }
    
    // Generate the appropriate hook based on options
    if (options.useReactQuery) {
      const reactQueryHook = `export function ${hookName}() {
  return useQuery({
    queryKey: [${queryKey}],
    queryFn: async () => {
      // Converted from getStaticProps
      ${functionBody}
      // Extract props from the original return statement
      const data = ${returnStatement.includes('props:') ? 'props' : '{}'};
      return data;
    }${revalidateTime ? `,
    staleTime: ${revalidateTime * 1000}` : ''}
  });
}`;
      result.hooks.push(reactQueryHook);
      
    } else if (options.useSWR) {
      const swrOptions = revalidateTime ? `, { revalidateOnFocus: false, refreshInterval: ${revalidateTime * 1000} }` : '';
      
      const swrHook = `export function ${hookName}() {
  return useSWR(
    ${queryKey},
    async () => {
      // Converted from getStaticProps
      ${functionBody}
      // Extract props from the original return statement
      const data = ${returnStatement.includes('props:') ? 'props' : '{}'};
      return data;
    }${swrOptions}
  );
}`;
      result.hooks.push(swrHook);
      
    } else {
      const useEffectHook = `export function ${hookName}() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Converted from getStaticProps
        ${functionBody}
        // Extract props from the original return statement
        const result = ${returnStatement.includes('props:') ? 'props' : '{}'};
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    ${revalidateTime ? `
    // Set up revalidation based on the original revalidate timing
    const interval = setInterval(fetchData, ${revalidateTime * 1000});
    return () => clearInterval(interval);` : ''}
  }, []);

  return { data, isLoading, error };
}`;
      result.hooks.push(useEffectHook);
    }
    
    // Replace the original getStaticProps with a comment
    result.code = result.code.replace(match[0], `// getStaticProps converted to client-side data fetching
// Use the ${hookName} function instead`);
  }
  
  return result;
}

/**
 * Transforms Next.js getStaticPaths to a utility function
 */
export function transformGetStaticPaths(code: string): DataFetchingTransformResult {
  const result: DataFetchingTransformResult = {
    code: code,
    imports: [],
    hooks: [],
    warnings: []
  };
  
  // Extract and transform getStaticPaths
  const getStaticPathsRegex = /export\s+const\s+getStaticPaths\s*=\s*async\s*\(\s*\)\s*=>\s*{([\s\S]*?)return\s*{([\s\S]*?)}\s*;?\s*\}/g;
  
  let match;
  while ((match = getStaticPathsRegex.exec(code)) !== null) {
    const functionBody = match[1];
    const returnStatement = match[2];
    
    // Create a utility function that returns the paths
    const utilityFunction = `export async function getAvailablePaths() {
  // Converted from getStaticPaths
  ${functionBody}
  
  // Extract and return the paths from the original return statement
  return ${returnStatement.includes('paths:') ? 'paths' : '[]'};
}`;
    
    result.hooks.push(utilityFunction);
    
    // Check for fallback mode
    if (returnStatement.includes('fallback:')) {
      const fallbackMatch = /fallback:\s*(true|false|'blocking')/g.exec(returnStatement);
      if (fallbackMatch) {
        const fallbackMode = fallbackMatch[1];
        
        result.warnings.push(`getStaticPaths fallback: ${fallbackMode} has no direct equivalent in React Router`);
        
        // Add a utility function for checking if a path exists
        if (fallbackMode === 'true' || fallbackMode === 'blocking') {
          const pathCheckFunction = `
export function usePathValidation(currentPath) {
  const [isValid, setIsValid] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkPath = async () => {
      try {
        const paths = await getAvailablePaths();
        const pathExists = paths.some(path => 
          // This is a simplified check - you might need to adapt it for your route structure
          path.params && Object.entries(path.params).every(
            ([key, value]) => currentPath[key] === value
          )
        );
        setIsValid(pathExists);
      } catch (err) {
        console.error("Error validating path:", err);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPath();
  }, [currentPath]);
  
  return { isValid, isLoading };
}`;
          
          result.hooks.push(pathCheckFunction);
          result.imports.push("import { useState, useEffect } from 'react';");
        }
      }
    }
    
    // Replace the original getStaticPaths with a comment
    result.code = result.code.replace(match[0], `// getStaticPaths converted to utility function
// Use the getAvailablePaths function instead`);
  }
  
  return result;
}

/**
 * Factory function to transform any Next.js data fetching method based on type
 */
export function transformDataFetching(code: string, method: 'getServerSideProps' | 'getStaticProps' | 'getStaticPaths' | 'all', options: DataFetchingTransformOptions = {}): DataFetchingTransformResult {
  let result: DataFetchingTransformResult = {
    code,
    imports: [],
    hooks: [],
    warnings: []
  };
  
  if (method === 'getServerSideProps' || method === 'all') {
    const ssrResult = transformGetServerSideProps(result.code, options);
    result.code = ssrResult.code;
    result.imports = [...result.imports, ...ssrResult.imports];
    result.hooks = [...result.hooks, ...ssrResult.hooks];
    result.warnings = [...result.warnings, ...ssrResult.warnings];
  }
  
  if (method === 'getStaticProps' || method === 'all') {
    const sspResult = transformGetStaticProps(result.code, options);
    result.code = sspResult.code;
    result.imports = [...result.imports, ...sspResult.imports];
    result.hooks = [...result.hooks, ...sspResult.hooks];
    result.warnings = [...result.warnings, ...sspResult.warnings];
  }
  
  if (method === 'getStaticPaths' || method === 'all') {
    const gspResult = transformGetStaticPaths(result.code);
    result.code = gspResult.code;
    result.imports = [...result.imports, ...gspResult.imports];
    result.hooks = [...result.hooks, ...gspResult.hooks];
    result.warnings = [...result.warnings, ...gspResult.warnings];
  }
  
  // Remove duplicate imports
  result.imports = [...new Set(result.imports)];
  
  return result;
}
