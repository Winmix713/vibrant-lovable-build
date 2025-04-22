
// Core types for the conversion system

export type ConversionType = "nextjs-to-react" | "react-to-nextjs" | "angular-to-react" | "vue-to-react";

export interface ConversionOptions {
  sourceFramework: string;
  targetFramework: string;
  preserveComments: boolean;
  includeTests: boolean;
  useTypeScript: boolean;
  prettier: boolean;
  eslint: boolean;
}

export interface ConversionResult {
  success: boolean;
  files: ConvertedFile[];
  error?: string;
}

export interface ConvertedFile {
  path: string;
  content: string;
  originalPath?: string;
}

export interface CICDTemplate {
  platform: "azure" | "vercel" | "netlify" | "github" | "gitlab" | "aws" | "docker";
  filename: string;
  content: string;
}

// AST Transformer types
export interface TransformerOptions {
  preserveComments: boolean;
  typescript: boolean;
}

export interface AnalysisResult {
  name: string;
  status: "ok" | "warning" | "error";
  message?: string;
}
