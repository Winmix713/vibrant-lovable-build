import { CICDTemplate, CICDPlatform } from '@/types/conversion';

const vercel: CICDPlatform = 'vercel';
const netlify: CICDPlatform = 'netlify';
const github: CICDPlatform = 'github';
const gitlab: CICDPlatform = 'gitlab';
const azure: CICDPlatform = 'azure';
const aws: CICDPlatform = 'aws';
const docker: CICDPlatform = 'docker';

/**
 * Vercel konfigurációs sablon generálása
 */
export const generateVercelConfig = (): CICDTemplate => ({
  platform: vercel,
  filename: 'vercel.json',
  description: 'Vercel Platform konfigurációja Vite projekthez',
  config: JSON.stringify({
    buildCommand: "vite build",
    devCommand: "vite",
    framework: null,
    installCommand: "npm install",
    outputDirectory: "dist",
    routes: [
      { src: "/(.*\\.[a-z0-9]+$)", dest: "/$1" },
      { src: "/(.*)", dest: "/index.html" }
    ],
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" }
        ]
      },
      {
        source: "/assets/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      }
    ]
  }, null, 2)
});

/**
 * Netlify konfigurációs sablon generálása
 */
export const generateNetlifyConfig = (): CICDTemplate => ({
  platform: netlify,
  filename: 'netlify.toml',
  description: 'Netlify konfigurációs fájl Vite projekthez',
  config: `[build]
  command = "vite build"
  publish = "dist"
  
[dev]
  command = "vite"
  framework = "#custom"
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[functions]
  directory = "netlify/functions"
  
[build.environment]
  NODE_VERSION = "18"`
});

/**
 * További platformgenerátorok (github, gitlab, azure, aws, docker)
 * ezek ugyanúgy legyenek implementálva, mint a fentiek, a `platform` mező típusát a megfelelő konstansra állítva:
 * - `platform: github`
 * - `platform: gitlab`
 * - `platform: azure`
 * - `platform: aws`
 * - `platform: docker` 
 * (ezeket a fájlod már jól tartalmazta, csak a platform típusát kellett szigorúan egyeztetni)
 */

/**
 * CI/CD sablonok generálása az összes támogatott platformra
 */
export const generateCICDTemplates = () => {
  const templates: Record<string, CICDTemplate | CICDTemplate[]> = {
    [vercel]: generateVercelConfig(),
    [netlify]: generateNetlifyConfig(),
    [github]: generateGithubWorkflow(),
    [gitlab]: generateGitlabCI(),
    [azure]: generateAzurePipeline(),
    [aws]: generateAwsConfig(),
    [docker]: generateDockerConfig()
  };
  return templates;
};

/**
 * CI/CD környezet változók generálása a platform alapján
 */
export const generateEnvironmentVariables = (platform: CICDPlatform): Record<string, string> => {
  const commonVars = {
    NODE_ENV: 'production',
    VITE_APP_VERSION: '1.0.0',
  };

  switch (platform) {
    case vercel:
      return {
        ...commonVars,
        VERCEL_PROJECT_ID: 'your-vercel-project-id',
        VERCEL_ORG_ID: 'your-vercel-org-id'
      };
    case netlify:
      return {
        ...commonVars,
        NETLIFY_AUTH_TOKEN: 'your-netlify-auth-token',
        NETLIFY_SITE_ID: 'your-netlify-site-id'
      };
    case github:
      return {
        ...commonVars,
        GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
      };
    case aws:
      return {
        ...commonVars,
        AWS_ACCESS_KEY_ID: 'your-aws-access-key',
        AWS_SECRET_ACCESS_KEY: 'your-aws-secret-key',
        AWS_REGION: 'us-east-1'
      };
    default:
      return commonVars;
  }
};
