import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from "constructs";
import { RemovalPolicy, CfnOutput, Stack } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

export interface StaticSiteProps {
  domainName: string;
  buildPath: string;
  dnsCertificateArn: string;
}

export class StaticSite extends Construct {
  constructor(scope: Stack, id: string, props: StaticSiteProps) {
    super(scope, id);

    const siteDomain = props.domainName;
    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI', {
      comment: `OAI for ${id}`
    });

    // Content bucket
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: siteDomain,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
       */
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code

      /**
       * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
       * setting will enable full cleanup of the demo.
       */
      autoDeleteObjects: true, // NOT recommended for production code
    });

    // Grant access to cloudfront
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }));
    new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // TLS certificate
    const dnsCertificate = Certificate.fromCertificateArn(this, 'Certificate', props.dnsCertificateArn);
    new CfnOutput(this, 'CertificateARN', { value: dnsCertificate.certificateArn });
    
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: { 
        origin: new S3Origin(siteBucket, { originAccessIdentity: cloudfrontOAI }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      domainNames: [siteDomain],
      certificate: dnsCertificate,
    });

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset(props.buildPath)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

  }
}
