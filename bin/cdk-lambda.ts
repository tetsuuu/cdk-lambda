#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkLambdaStack } from '../lib/cdk-lambda-stack';

const app = new cdk.App();
new CdkLambdaStack(app, 'CdkLambdaStack');
