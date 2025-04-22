
/**
 * AWS CloudFormation Resource Types
 * These types are needed for cicdGenerator.ts
 */

/**
 * S3 Bucket resource type
 */
export interface S3Bucket {
  Type: 'AWS::S3::Bucket';
  Properties: {
    BucketName: string;
    AccessControl?: 'Private' | 'PublicRead' | 'PublicReadWrite' | 'AuthenticatedRead' | 'LogDeliveryWrite' | 'BucketOwnerRead' | 'BucketOwnerFullControl';
    WebsiteConfiguration?: {
      IndexDocument: string;
      ErrorDocument?: string;
    };
    VersioningConfiguration?: {
      Status: 'Enabled' | 'Suspended';
    };
    CorsConfiguration?: {
      CorsRules: {
        AllowedHeaders?: string[];
        AllowedMethods: string[];
        AllowedOrigins: string[];
        ExposedHeaders?: string[];
        MaxAge?: number;
      }[];
    };
  };
}

/**
 * CloudFront Distribution resource type
 */
export interface CloudFrontDistribution {
  Type: 'AWS::CloudFront::Distribution';
  Properties: {
    DistributionConfig: {
      Origins: {
        DomainName: string;
        Id: string;
        S3OriginConfig?: {
        OriginAccessIdentity: string;
        };
        CustomOriginConfig?: {
          HTTPPort: number;
          HTTPSPort: number;
          OriginProtocolPolicy: 'http-only' | 'match-viewer' | 'https-only';
        };
      }[];
      Enabled: boolean;
      DefaultRootObject?: string;
      Aliases?: string[];
      DefaultCacheBehavior: {
        TargetOriginId: string;
        ViewerProtocolPolicy: 'redirect-to-https' | 'allow-all' | 'https-only';
        AllowedMethods?: string[];
        CachedMethods?: string[];
        ForwardedValues: {
          QueryString: boolean;
          Cookies?: {
            Forward: 'none' | 'whitelist' | 'all';
            WhitelistedNames?: string[];
          };
          Headers?: string[];
        };
        MinTTL?: number;
        DefaultTTL?: number;
        MaxTTL?: number;
        Compress?: boolean;
      };
    };
  };
}

/**
 * CloudFront Origin Access Identity resource type
 */
export interface CloudFrontOriginAccessIdentity {
  Type: 'AWS::CloudFront::CloudFrontOriginAccessIdentity';
  Properties: {
    CloudFrontOriginAccessIdentityConfig: {
      Comment: string;
    };
  };
}

/**
 * Route53 record set resource type
 */
export interface Route53RecordSet {
  Type: 'AWS::Route53::RecordSet';
  Properties: {
    HostedZoneId: string;
    Name: string;
    Type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'PTR' | 'SOA' | 'SPF' | 'SRV' | 'TXT';
    AliasTarget?: {
      DNSName: string;
      HostedZoneId: string;
      EvaluateTargetHealth: boolean;
    };
    TTL?: string;
    ResourceRecords?: string[];
  };
}

/**
 * Domain Name resource type (used in API Gateway)
 */
export interface DomainName {
  Type: 'AWS::ApiGateway::DomainName';
  Properties: {
    DomainName: string;
    CertificateArn: string;
    EndpointConfiguration?: {
      Types: ('REGIONAL' | 'EDGE' | 'PRIVATE')[];
    };
    RegionalCertificateArn?: string;
    SecurityPolicy?: 'TLS_1_0' | 'TLS_1_2';
  };
}
