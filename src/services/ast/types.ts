
export interface BabelCompatTypes {
  types: {
    ClassBody: any;
    EnumBooleanBody: any;
    EnumNumberBody: any;
    EnumStringBody: any;
    EnumSymbolBody: any;
    ObjectTypeAnnotation: any;
    TSTypeElement: any[];
  };
}

export interface AstTransformOptions {
  syntax: 'typescript' | 'javascript';
  preserveComments: boolean;
  target: 'react-vite' | 'react-cra';
}

export interface TransformResult {
  code: string;
  warnings: string[];
  changes: string[];
  imports: string[];
}

export interface NodeType {
  type: string;
  [key: string]: any;
}

export interface ImportSpecifier {
  type: string;
  local?: {
    name: string;
  };
  imported?: {
    name: string;
  };
}
