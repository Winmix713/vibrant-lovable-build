
import { CICDTemplate } from '@/types';

export class CICDGenerator {
  generateAwsCloudFormation(projectName: string, bucketName: string, domainName?: string): CICDTemplate {
    // Create basic CloudFormation template for AWS deployment
    const cloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: `CloudFormation template for ${projectName}`,
      Resources: {
        S3Bucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: bucketName,
            AccessControl: 'Private',
            WebsiteConfiguration: {
              IndexDocument: 'index.html',
              ErrorDocument: 'index.html'
            }
          }
        },
        BucketPolicy: {
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            Bucket: { Ref: 'S3Bucket' },
            PolicyDocument: {
              Statement: [
                {
                  Action: 's3:GetObject',
                  Effect: 'Allow',
                  Resource: { 'Fn::Join': ['', [`arn:aws:s3:::${bucketName}`, '/*']] },
                  Principal: {
                    CanonicalUser: {
                      'Fn::GetAtt': ['CloudFrontOriginAccessIdentity', 'S3CanonicalUserId']
                    }
                  }
                }
              ]
            }
          }
        }
      }
    };

    // Add CloudFront distribution if domain is provided
    if (domainName) {
      const cloudFrontResources = {
        CloudFrontOriginAccessIdentity: {
          Type: 'AWS::CloudFront::CloudFrontOriginAccessIdentity',
          Properties: {
            CloudFrontOriginAccessIdentityConfig: {
              Comment: `OAI for ${projectName}`
            }
          }
        },
        CloudFrontDistribution: {
          Type: 'AWS::CloudFront::Distribution',
          Properties: {
            DistributionConfig: {
              Origins: [
                {
                  DomainName: { 'Fn::GetAtt': ['S3Bucket', 'DomainName'] },
                  Id: 'S3Origin',
                  S3OriginConfig: {
                    OriginAccessIdentity: {
                      'Fn::Join': ['', ['origin-access-identity/cloudfront/', { Ref: 'CloudFrontOriginAccessIdentity' }]]
                    }
                  }
                }
              ],
              Enabled: true,
              DefaultRootObject: 'index.html',
              Aliases: [domainName],
              DefaultCacheBehavior: {
                AllowedMethods: ['GET', 'HEAD'],
                TargetOriginId: 'S3Origin',
                ForwardedValues: {
                  QueryString: false,
                  Cookies: { Forward: 'none' }
                },
                ViewerProtocolPolicy: 'redirect-to-https'
              },
              ViewerCertificate: {
                AcmCertificateArn: { 'Fn::ImportValue': 'CertificateARN' },
                SslSupportMethod: 'sni-only'
              },
              CustomErrorResponses: [
                {
                  ErrorCode: 403,
                  ResponseCode: 200,
                  ResponsePagePath: '/index.html'
                },
                {
                  ErrorCode: 404,
                  ResponseCode: 200,
                  ResponsePagePath: '/index.html'
                }
              ]
            }
          }
        }
      };

      // Merge CloudFront resources into the template
      Object.assign(cloudFormationTemplate.Resources, cloudFrontResources);
    }

    return {
      platform: 'aws',
      filename: 'cloudformation.yml',
      content: JSON.stringify(cloudFormationTemplate, null, 2)
    };
  }

  generateDockerfile(): CICDTemplate {
    const dockerfileContent = `FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.23-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

    const nginxConfig = `server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}`;

    return {
      platform: "aws", // We're using "aws" as a placeholder since "docker" is not in the allowed types
      filename: 'Dockerfile',
      content: dockerfileContent
    };
  }

  generateGithubActions(projectName: string): CICDTemplate {
    const workflowContent = `name: ${projectName} CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
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

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist`;

    return {
      platform: "aws", // We're using "aws" as a placeholder since "docker" is not in the allowed types
      filename: '.github/workflows/ci-cd.yml',
      content: workflowContent
    };
  }

  generateVercelConfig(): CICDTemplate {
    const vercelConfigContent = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "regions": ["iad1"],
  "images": {
    "sizes": [640, 750, 828, 1080, 1200, 1920],
    "domains": [],
    "remotePatterns": []
  }
}`;

    return {
      platform: "aws", // We're using "aws" as a placeholder since "docker" is not in the allowed types
      filename: 'vercel.json',
      content: vercelConfigContent
    };
  }

  generateAllCICDTemplates(projectName: string, bucketName?: string, domainName?: string): CICDTemplate[] {
    const templates: CICDTemplate[] = [];

    // Add AWS CloudFormation template
    if (bucketName) {
      templates.push(this.generateAwsCloudFormation(projectName, bucketName, domainName));
    }

    // Add GitHub Actions workflow
    templates.push(this.generateGithubActions(projectName));

    // Add Dockerfile
    templates.push(this.generateDockerfile());

    // Add Vercel config
    templates.push(this.generateVercelConfig());

    return templates;
  }
}

export default CICDGenerator;
