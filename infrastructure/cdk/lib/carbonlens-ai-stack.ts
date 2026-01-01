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
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

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
  public readonly api: apigateway.RestApi;
  public readonly lambdaFunctions: { [key: string]: lambda.Function } = {};

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

    // Common Lambda function configuration
    const lambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      role: lambdaRole,
      environment: {
        TABLE_NAME: this.appTable.tableName,
        DOCUMENTS_BUCKET: this.documentsBucket.bucketName,
        STAGE: environment,
        USER_POOL_ID: this.userPool.userPoolId,
        USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    };

    // Lambda Functions
    this.lambdaFunctions.processDocument = new lambda.Function(this, 'ProcessDocumentFunction', {
      ...lambdaProps,
      functionName: `${projectName}-processDocument-${environment}`,
      handler: 'src/handlers/documentProcessor.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend')),
      description: 'Process documents and extract carbon footprint data',
    });

    this.lambdaFunctions.calculateCarbon = new lambda.Function(this, 'CalculateCarbonFunction', {
      ...lambdaProps,
      functionName: `${projectName}-calculateCarbon-${environment}`,
      handler: 'src/handlers/carbonCalculator.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend')),
      description: 'Calculate carbon footprint from logistics data',
    });

    this.lambdaFunctions.getOptimizations = new lambda.Function(this, 'GetOptimizationsFunction', {
      ...lambdaProps,
      functionName: `${projectName}-getOptimizations-${environment}`,
      handler: 'src/handlers/optimizationEngine.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend')),
      description: 'Generate AI-powered optimization recommendations',
    });

    this.lambdaFunctions.generateCertificate = new lambda.Function(this, 'GenerateCertificateFunction', {
      ...lambdaProps,
      functionName: `${projectName}-generateCertificate-${environment}`,
      handler: 'src/handlers/certificateGenerator.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend')),
      description: 'Generate carbon certificates with QR codes',
    });

    this.lambdaFunctions.getDashboardData = new lambda.Function(this, 'GetDashboardDataFunction', {
      ...lambdaProps,
      functionName: `${projectName}-getDashboardData-${environment}`,
      handler: 'src/handlers/dashboardData.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend')),
      description: 'Retrieve dashboard analytics data',
    });

    this.lambdaFunctions.seedTestData = new lambda.Function(this, 'SeedTestDataFunction', {
      ...lambdaProps,
      functionName: `${projectName}-seedTestData-${environment}`,
      handler: 'src/handlers/seedTestData.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend')),
      description: 'Seed database with test data',
    });

    this.lambdaFunctions.migrateUserData = new lambda.Function(this, 'MigrateUserDataFunction', {
      ...lambdaProps,
      functionName: `${projectName}-migrateUserData-${environment}`,
      handler: 'src/handlers/migrateUserData.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend')),
      description: 'Migrate user data between versions',
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, 'CarbonLensAPI', {
      restApiName: `${projectName}-api-${environment}`,
      description: 'CarbonLens AI REST API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'x-user-email',
        ],
        allowCredentials: false,
      },
      deployOptions: {
        stageName: environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // API Gateway Integrations
    const processDocumentIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.processDocument);
    const calculateCarbonIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.calculateCarbon);
    const getOptimizationsIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.getOptimizations);
    const generateCertificateIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.generateCertificate);
    const getDashboardDataIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.getDashboardData);
    const seedTestDataIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.seedTestData);
    const migrateUserDataIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.migrateUserData);

    // API Routes
    this.api.root.addResource('process-document').addMethod('POST', processDocumentIntegration);
    this.api.root.addResource('calculate-carbon').addMethod('POST', calculateCarbonIntegration);
    this.api.root.addResource('optimizations').addMethod('GET', getOptimizationsIntegration);
    this.api.root.addResource('dashboard').addMethod('GET', getDashboardDataIntegration);
    this.api.root.addResource('seed-test-data').addMethod('POST', seedTestDataIntegration);
    this.api.root.addResource('migrate-user-data').addMethod('POST', migrateUserDataIntegration);

    // Certificate routes (both POST and GET with path parameter)
    const certificateResource = this.api.root.addResource('certificate');
    certificateResource.addMethod('POST', generateCertificateIntegration);
    certificateResource.addResource('{id}').addMethod('GET', generateCertificateIntegration);

    // Origin Access Control for CloudFront (using L1 construct)
    const originAccessControl = new cloudfront.CfnOriginAccessControl(this, 'OriginAccessControl', {
      originAccessControlConfig: {
        name: `${projectName}-oac-${environment}`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // CloudFront Distribution Configuration
    const distributionConfig: cloudfront.DistributionProps = {
      defaultBehavior: {
        origin: new origins.S3Origin(this.frontendBucket, {
          originAccessControlId: originAccessControl.attrId,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.RestApiOrigin(this.api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
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
      distributionConfig.domainNames = [domainName];
      distributionConfig.certificate = certificate;
    }

    // Create CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', distributionConfig);

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

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: `${id}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
      exportName: `${id}-ApiId`,
    });

    // Output Lambda function ARNs for reference
    Object.entries(this.lambdaFunctions).forEach(([name, func]) => {
      new cdk.CfnOutput(this, `${name}FunctionArn`, {
        value: func.functionArn,
        description: `${name} Lambda Function ARN`,
        exportName: `${id}-${name}Arn`,
      });
    });
  }
}