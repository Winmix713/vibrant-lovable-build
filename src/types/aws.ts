
/**
 * AWS specific types for CI/CD generation
 */

export interface S3Bucket {
  name: string;
  region: string;
}

export interface DomainName {
  name: string;
  zone: string;
}

export interface CloudFrontOriginAccessIdentity {
  id: string;
  name: string;
}

// Add CloudFrontDistribution type for AWS CloudFormation
export interface CloudFrontDistribution {
  Type: string;
  Properties: {
    DistributionConfig: {
      Origins: Array<{
        DomainName: string;
        Id: string;
        S3OriginConfig: {
          OriginAccessIdentity: string;
        };
      }>;
      Enabled: boolean;
      DefaultRootObject: string;
      DefaultCacheBehavior: {
        TargetOriginId: string;
        ForwardedValues: {
          QueryString: boolean;
          Cookies: {
            Forward: string;
          };
        };
        ViewerProtocolPolicy: string;
        MinTTL: number;
        DefaultTTL: number;
        MaxTTL: number;
      };
    };
  };
}

// CloudFormation resource types
export interface CloudFormationResource {
  Type: string;
  Properties: Record<string, any>;
}

// Extended AWS types for CloudFormation
export type AWSCloudFormationS3Bucket = CloudFormationResource;
export type AWSCloudFormationCloudFrontDistribution = CloudFormationResource;
export type AWSCloudFormationDomainName = CloudFormationResource;
export type AWSCloudFormationOriginAccessIdentity = CloudFormationResource;
