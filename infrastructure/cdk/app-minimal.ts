#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CarbonLensAIStack } from './lib/carbonlens-ai-stack-minimal';

const app = new cdk.App();

// Get environment variables
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev';
const domainName = app.node.tryGetContext('domainName') || process.env.DOMAIN_NAME;
const certificateArn = app.node.tryGetContext('certificateArn') || process.env.CERTIFICATE_ARN;
const hostedZoneId = app.node.tryGetContext('hostedZoneId') || process.env.HOSTED_ZONE_ID;

// Stack configuration
const stackName = `carbonlens-ai-${environment}`;
const projectName = 'carbonlens-ai';

new CarbonLensAIStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  environment,
  projectName,
  domainName,
  certificateArn,
  hostedZoneId,
  tags: {
    Project: 'CarbonLens AI',
    Environment: environment,
    ManagedBy: 'AWS CDK',
  },
});