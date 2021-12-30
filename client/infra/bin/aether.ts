#!/usr/bin/env node
import 'source-map-support/register';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as cdk from 'aws-cdk-lib';
import {mono} from 'infra-common';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CDK_DEFAULT_ACCOUNT: string;
      CDK_DEFAULT_REGION: string;
    }
  }
}

const app = new cdk.App();

new mono.MonoRepoPipeline(app, 'ClientPipeline', {
  // clientCertificateArn: 'arn:aws:acm:us-east-1:831841410317:certificate/59c87649-994b-4808-b6aa-b8939b459223',
  repo: {
    owner: 'UCF-Aether',
    name: 'Aether-App',
    branch: 'mono',
  },
  project: {
    name: 'client',
    path: 'client',
    additionalPaths: [
      'common/infra',
    ],
    cdkDir: 'infra/',
  },
  // domainName: 'aethersensor.network',
  // stackDir: '../',
  selfMutation: false,
  env: { 
    account: '831841410317',
    region: 'us-east-1',
  },
  tags: {
    application: 'Aether-Client',
  },
});

app.synth();
