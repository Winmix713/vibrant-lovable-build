
interface CICDTemplate {
  platform: 'vercel' | 'netlify' | 'github' | 'gitlab' | 'azure' | 'aws';
  config: string;
  filename: string;
  description: string;
}

/**
 * Vercel konfigurációs sablon generálása
 */
export const generateVercelConfig = (): CICDTemplate => ({
  platform: 'vercel',
  filename: 'vercel.json',
  description: 'Vercel Platform konfigurációja Vite projekthez',
  config: JSON.stringify({
    "buildCommand": "vite build",
    "devCommand": "vite",
    "framework": null,
    "installCommand": "npm install",
    "outputDirectory": "dist",
    "routes": [
      { 
        "src": "/(.*\\.[a-z0-9]+$)",
        "dest": "/$1"
      },
      {
        "src": "/(.*)", 
        "dest": "/index.html" 
      }
    ],
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" }
        ]
      },
      {
        "source": "/assets/(.*)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      }
    ]
  }, null, 2)
});

/**
 * Netlify konfigurációs sablon generálása
 */
export const generateNetlifyConfig = (): CICDTemplate => ({
  platform: 'netlify',
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
  NODE_VERSION = "18"
`
});

/**
 * GitHub Actions munkafolyamat generálása teszteléssel és deploy lépésekkel
 */
export const generateGithubWorkflow = (): CICDTemplate => ({
  platform: 'github',
  filename: '.github/workflows/deploy.yml',
  description: 'GitHub Actions munkafolyamat Vite alkalmazás teszteléshez és deploy-hoz',
  config: `name: Build, Test and Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Type check
      run: npm run typecheck || echo "No typecheck script found"
      
    - name: Lint
      run: npm run lint || echo "No lint script found"
      
    - name: Run tests
      run: npm test || echo "No test script found"
      
    - name: Build
      run: npm run build
      
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-output
        path: dist/

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: build-and-test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-output
        path: dist/
        
    - name: Deploy to Netlify (Preview)
      uses: nwtgck/actions-netlify@v2
      with:
        publish-dir: './dist'
        production-branch: main
        github-token: \${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions (PR #\${{ github.event.number }})"
        enable-pull-request-comment: true
        enable-commit-comment: false
      env:
        NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}

  deploy-production:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: build-and-test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-output
        path: dist/
        
    - name: Deploy to Netlify (Production)
      uses: netlify/actions/cli@master
      with:
        args: deploy --prod --dir=dist
      env:
        NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
`
});

/**
 * GitLab CI/CD konfiguráció generálása
 */
export const generateGitlabCI = (): CICDTemplate => ({
  platform: 'gitlab',
  filename: '.gitlab-ci.yml',
  description: 'GitLab CI/CD konfiguráció Vite alkalmazáshoz',
  config: `image: node:18-alpine

stages:
  - setup
  - test
  - build
  - deploy

variables:
  NPM_CONFIG_CACHE: "$CI_PROJECT_DIR/.npm"

cache:
  key: ${process.env.CI_COMMIT_REF_SLUG}
  paths:
    - .npm/
    - node_modules/

setup:
  stage: setup
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/

lint:
  stage: test
  script:
    - npm run lint || echo "No lint script found"

typecheck:
  stage: test
  script:
    - npm run typecheck || echo "No typecheck script found"

test:
  stage: test
  script:
    - npm test || echo "No test script found"

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/

pages:
  stage: deploy
  script:
    - mv dist public
  artifacts:
    paths:
      - public
  only:
    - main

deploy-staging:
  stage: deploy
  script:
    - npm install -g netlify-cli
    - netlify deploy --dir=dist --site=$NETLIFY_SITE_ID --auth=$NETLIFY_AUTH_TOKEN
  environment:
    name: staging
  only:
    - develop

deploy-production:
  stage: deploy
  script:
    - npm install -g netlify-cli
    - netlify deploy --dir=dist --prod --site=$NETLIFY_SITE_ID --auth=$NETLIFY_AUTH_TOKEN
  environment:
    name: production
  only:
    - main
`
});

/**
 * Azure DevOps Pipeline konfiguráció generálása
 */
export const generateAzurePipeline = (): CICDTemplate => ({
  platform: 'azure',
  filename: 'azure-pipelines.yml',
  description: 'Azure DevOps pipeline konfiguráció Vite alkalmazáshoz',
  config: `trigger:
  branches:
    include:
    - main
    - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  npm_config_cache: $(Pipeline.Workspace)/.npm

stages:
- stage: Build
  jobs:
  - job: BuildAndTest
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
      displayName: 'Install Node.js'
    
    - task: Cache@2
      inputs:
        key: 'npm | "$(Agent.OS)" | package-lock.json'
        restoreKeys: |
          npm | "$(Agent.OS)"
        path: $(npm_config_cache)
      displayName: Cache npm
    
    - script: npm ci
      displayName: 'Install dependencies'
    
    - script: npm run lint || echo "No lint script found"
      displayName: 'Lint'
    
    - script: npm run typecheck || echo "No typecheck script found"
      displayName: 'Type check'
    
    - script: npm test || echo "No test script found"
      displayName: 'Run tests'
    
    - script: npm run build
      displayName: 'Build'
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: 'dist'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/dist.zip'
      displayName: 'Archive build output'
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)/dist.zip'
        ArtifactName: 'drop'
      displayName: 'Publish artifacts'

- stage: DeployStaging
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
  jobs:
  - deployment: DeployStaging
    environment: 'staging'
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: drop
          - task: AzureWebApp@1
            inputs:
              azureSubscription: '$(AZURE_SUBSCRIPTION)'
              appType: 'webApp'
              appName: '$(AZURE_APP_NAME_STAGING)'
              package: '$(Pipeline.Workspace)/drop/dist.zip'
              deploymentMethod: 'auto'

- stage: DeployProduction
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployProduction
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: drop
          - task: AzureWebApp@1
            inputs:
              azureSubscription: '$(AZURE_SUBSCRIPTION)'
              appType: 'webApp'
              appName: '$(AZURE_APP_NAME_PROD)'
              package: '$(Pipeline.Workspace)/drop/dist.zip'
              deploymentMethod: 'auto'
`
});

/**
 * AWS CloudFormation template generálása Amazon S3 + CloudFront használatához
 */
export const generateAwsConfig = (): CICDTemplate => ({
  platform: 'aws',
  filename: 'aws-cloudformation.yml',
  description: 'AWS CloudFormation sablon az alkalmazás S3 + CloudFront telepítéshez',
  config: `AWSTemplateFormatVersion: '2010-09-09'
Description: 'React Vite App Deployment to S3 with CloudFront'

Parameters:
  DomainName:
    Type: String
    Description: The domain name for the website
    Default: example.com
  
  CertificateArn:
    Type: String
    Description: ARN of the SSL certificate in AWS Certificate Manager
    Default: ''

Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref DomainName
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: index.html
      AccessControl: Private
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
  
  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Action: 's3:GetObject'
            Effect: Allow
            Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
            Principal:
              CanonicalUser: !GetAtt CloudFrontOriginAccessIdentity.S3CanonicalUserId
  
  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${DomainName}'
  
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt S3Bucket.RegionalDomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}'
        Enabled: true
        DefaultRootObject: index.html
        CustomErrorResponses:
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
        DefaultCacheBehavior:
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          TargetOriginId: S3Origin
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
          ViewerProtocolPolicy: redirect-to-https
          Compress: true
          DefaultTTL: 86400
        PriceClass: PriceClass_100
        ViewerCertificate:
          AcmCertificateArn: !Ref CertificateArn
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        HttpVersion: http2
        Aliases:
          - !Ref DomainName
        Origins:
          - DomainName: !GetAtt S3Bucket.RegionalDomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}'

Outputs:
  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref S3Bucket
  
  CloudFrontDistributionId:
    Description: ID of the CloudFront distribution
    Value: !Ref CloudFrontDistribution
  
  CloudFrontDomainName:
    Description: Domain name of the CloudFront distribution
    Value: !GetAtt CloudFrontDistribution.DomainName
`
});

/**
 * Docker és Docker Compose konfigurációs fájlok generálása
 */
export const generateDockerConfig = (): CICDTemplate[] => {
  return [
    {
      platform: 'docker',
      filename: 'Dockerfile',
      description: 'Docker konfiguráció Vite alkalmazáshoz',
      config: `FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Második szakasz: statikus fájlok kiszolgálása Nginx-szel
FROM nginx:alpine

# Nginx konfigurálása az SPA (Single Page Application) kiszolgálásához
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx konfiguráció másolása
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`
    },
    {
      platform: 'docker',
      filename: 'nginx.conf',
      description: 'Nginx konfigurációs fájl Single Page Application (SPA) kiszolgáláshoz',
      config: `server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  # Gzip beállítása a teljesítmény javításához
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_proxied expired no-cache no-store private auth;
  gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;

  # Biztonsági fejlécek
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  add_header X-XSS-Protection "1; mode=block";

  # Belső URL-ek átirányítása az index.html-re az SPA routing számára
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Statikus eszközök cache beállítása
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # Favicon beállítása
  location = /favicon.ico {
    log_not_found off;
    access_log off;
  }

  # Robots.txt beállítása
  location = /robots.txt {
    log_not_found off;
    access_log off;
  }

  # Nem létező fájlok esetén 404 helyett index.html szolgáltatása
  error_page 404 =200 /index.html;
}`
    },
    {
      platform: 'docker',
      filename: 'docker-compose.yml',
      description: 'Docker Compose konfiguráció fejlesztői környezethez',
      config: `version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped`
    }
  ];
};

/**
 * CI/CD sablonok generálása az összes támogatott platformra
 */
export const generateCICDTemplates = () => {
  const templates: Record<string, CICDTemplate | CICDTemplate[]> = {
    vercel: generateVercelConfig(),
    netlify: generateNetlifyConfig(),
    github: generateGithubWorkflow(),
    gitlab: generateGitlabCI(),
    azure: generateAzurePipeline(),
    aws: generateAwsConfig(),
    docker: generateDockerConfig()
  };
  
  return templates;
};

/**
 * CI/CD környezet változók generálása a platform alapján
 */
export const generateEnvironmentVariables = (platform: string): Record<string, string> => {
  const commonVars = {
    'NODE_ENV': 'production',
    'VITE_APP_VERSION': '1.0.0',
  };
  
  switch (platform) {
    case 'vercel':
      return {
        ...commonVars,
        'VERCEL_PROJECT_ID': 'your-vercel-project-id',
        'VERCEL_ORG_ID': 'your-vercel-org-id'
      };
    case 'netlify':
      return {
        ...commonVars,
        'NETLIFY_AUTH_TOKEN': 'your-netlify-auth-token',
        'NETLIFY_SITE_ID': 'your-netlify-site-id'
      };
    case 'github':
      return {
        ...commonVars,
        'GITHUB_TOKEN': '${{ secrets.GITHUB_TOKEN }}'
      };
    case 'aws':
      return {
        ...commonVars,
        'AWS_ACCESS_KEY_ID': 'your-aws-access-key',
        'AWS_SECRET_ACCESS_KEY': 'your-aws-secret-key',
        'AWS_REGION': 'us-east-1'
      };
    default:
      return commonVars;
  }
};
