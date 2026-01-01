import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface CarbonLensAIStackProps extends cdk.StackProps {
  environment: string;
  projectName: string;
  domainName?: string;
  certificateArn?: string;
  hostedZoneId?: string;
}

export class CarbonLensAIStack extends cdk.Stack {
  public readonly frontendBucket: s3.Bucket;
  public readonly documentsBucket: s3.Bucket;
  public readonly appTable: dynamodb.Table;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CarbonLensAIStackProps) {
    super(scope, id, props);

    const { environment, projectName, domainName, certificateArn, hostedZoneId } = props;

    // S3 Bucket for Frontend
    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `${projectName}-web-${environment}-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 Bucket for Documents
    this.documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `${projectName}-docs-${environment}-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // DynamoDB Table
    this.appTable = new dynamodb.Table(this, 'AppTable', {
      tableName: `${projectName}-data-${environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: environment === 'prod',
    });

    // Add GSI for user-based queries
    this.appTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${projectName}-auth-${environment}`,
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `${projectName}-client-${environment}`,
      generateSecret: false,
      authFlows: {
        userSrp: true,
        adminUserPassword: true,
        userPassword: false,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
      },
    });

    // Origin Access Control for CloudFront
    const originAccessControl = new cloudfront.OriginAccessControl(this, 'OriginAccessControl', {
      description: `OAC for ${projectName}-${environment}`,
    });

    // CloudFront Distribution Configuration
    const distributionProps: cloudfront.DistributionProps = {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.frontendBucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    };

    // Add custom domain if provided
    if (domainName && certificateArn) {
      const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);
      distributionProps.domainNames = [domainName];
      distributionProps.certificate = certificate;
    }

    // Create CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', distributionProps);

    // Grant CloudFront access to S3 bucket
    this.frontendBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [this.frontendBucket.arnForObjects('*')],
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
          },
        },
      })
    );

    // Route 53 DNS Record (if domain and hosted zone provided)
    if (domainName && hostedZoneId) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId,
        zoneName: domainName.split('.').slice(-2).join('.'), // Get root domain
      });

      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
      });
    }

    // IAM Role for Lambda Functions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${projectName}-lambda-${environment}-${this.account}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant Lambda permissions to access resources
    this.appTable.grantReadWriteData(lambdaRole);
    this.documentsBucket.grantReadWrite(lambdaRole);

    // Grant Lambda permissions for AI services
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'textract:DetectDocumentText',
          'textract:AnalyzeDocument',
          'rekognition:DetectText',
          'comprehend:DetectEntities',
          'comprehend:ClassifyDocument',
          'bedrock:InvokeModel',
        ],
        resources: ['*'],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'Frontend S3 Bucket Name',
      exportName: `${id}-FrontendBucket`,
    });

    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: this.documentsBucket.bucketName,
      description: 'Documents S3 Bucket Name',
      exportName: `${id}-DocumentsBucket`,
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${id}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${id}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `${id}-CloudFrontDomain`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `${id}-CloudFrontDistributionId`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: this.appTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `${id}-DynamoDBTable`,
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'Lambda Execution Role ARN',
      exportName: `${id}-LambdaRole`,
    });
  }
}