
import { TransformationRule } from '../types';

export const routingTransformRules: TransformationRule[] = [
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
  }
];
