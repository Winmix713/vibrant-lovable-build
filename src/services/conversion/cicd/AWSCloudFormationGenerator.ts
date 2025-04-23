
import { 
  S3Bucket, 
  CloudFrontDistribution, 
  CloudFrontOriginAccessIdentity, 
  DomainName, 
  AWSCloudFormationS3Bucket,
  AWSCloudFormationOriginAccessIdentity,
  AWSCloudFormationDomainName
} from "@/types/aws";

/**
 * Generates AWS CloudFormation templates for the converted project
 */
export class AWSCloudFormationGenerator {
  /**
   * Generate a CloudFormation template for static site hosting with S3 and CloudFront
   */
  generateStaticSiteTemplate(projectName: string, domainName?: string): string {
    const resources: Record<string, any> = {};
    
    // Create S3 bucket for hosting
    const bucketName = domainName || `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-static-site`;
    
    // Creating the S3 bucket resource
    const websiteBucket: AWSCloudFormationS3Bucket = {
      Type: 'AWS::S3::Bucket',
      Properties: {
        BucketName: bucketName,
        AccessControl: 'Private',
        WebsiteConfiguration: {
          IndexDocument: 'index.html',
          ErrorDocument: 'index.html'
        },
        CorsConfiguration: {
          CorsRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET'],
              AllowedOrigins: ['*'],
              MaxAge: 3000
            }
          ]
        }
      }
    };
    
    resources.WebsiteBucket = websiteBucket;
    
    // Create CloudFront origin access identity
    const originAccessIdentity: AWSCloudFormationOriginAccessIdentity = {
      Type: 'AWS::CloudFront::CloudFrontOriginAccessIdentity',
      Properties: {
        CloudFrontOriginAccessIdentityConfig: {
          Comment: `OAI for ${projectName} website`
        }
      }
    };
    
    resources.OriginAccessIdentity = originAccessIdentity;
    
    // Create CloudFront distribution
    const distribution: CloudFrontDistribution = {
      Type: 'AWS::CloudFront::Distribution',
      Properties: {
        DistributionConfig: {
          Origins: [
            {
              DomainName: `${bucketName}.s3.amazonaws.com`,
              Id: 'S3Origin',
              S3OriginConfig: {
                OriginAccessIdentity: `origin-access-identity/cloudfront/\${!Ref OriginAccessIdentity}`
              }
            }
          ],
          Enabled: true,
          DefaultRootObject: 'index.html',
          DefaultCacheBehavior: {
            TargetOriginId: 'S3Origin',
            ForwardedValues: {
              QueryString: false,
              Cookies: {
                Forward: 'none'
              }
            },
            ViewerProtocolPolicy: 'redirect-to-https',
            MinTTL: 0,
            DefaultTTL: 3600,
            MaxTTL: 86400
          }
        }
      }
    };
    
    resources.CloudFrontDistribution = distribution;
    
    // Add domain if provided
    if (domainName) {
      const domain: AWSCloudFormationDomainName = {
        Type: 'AWS::ApiGateway::DomainName',
        Properties: {
          DomainName: domainName,
          CertificateArn: '${CertificateArn}', // Placeholder, would be replaced
          EndpointConfiguration: {
            Types: ['REGIONAL']
          }
        }
      };
      
      resources.ApiDomain = domain;
    }
    
    // Generate the complete template
    const template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: `CloudFormation template for ${projectName} static website`,
      Parameters: {
        ProjectName: {
          Type: 'String',
          Default: projectName,
          Description: 'Name of the project'
        }
      },
      Resources: resources,
      Outputs: {
        WebsiteURL: {
          Value: { 'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'] },
          Description: 'URL for the CloudFront distribution'
        }
      }
    };
    
    return JSON.stringify(template, null, 2);
  }
}
