import cdk = require('@aws-cdk/core');
import { Function, InlineCode, Code, AssetCode, Runtime } from '@aws-cdk/aws-lambda';
import { Role, ServicePrincipal, ManagedPolicy } from '@aws-cdk/aws-iam';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { StringParameter } from '@aws-cdk/aws-ssm';

export class CdkLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // IAM Role for Lambda with SSM policy.
    const executionLambdaRole = new Role(this, 'secureLambdaRole', {
      roleName: 'lambdaSecureExecutionRole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
      ]
    });

    // Call Slack channel by plain text.
    const slackChannel = StringParameter.fromStringParameterAttributes(this, 'slackChannel', {
      parameterName: '/Lambda/production/slack-channel',
    });

    // Configure for Lambda function.
    const adventarNotifyFunction = new Function(this, 'SlackAdventar', {
      functionName: 'slack-adventar-notify',
      runtime: Runtime.NODEJS_10_X,
      code: AssetCode.fromAsset('src'),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(300),
      role: executionLambdaRole,
      environment: {
        TZ: "Asia/Tokyo",
        SLACK_CHANNEL: slackChannel.stringValue,
      }
    });

    // Cloudwatch event for run notification at 1PM JST in Advent Calendar term.
    const rule = new Rule(this, 'Rule', {
      schedule: Schedule.expression('cron(0 4 1-25 12 ? 2019)')
    });

    rule.addTarget(new LambdaFunction(adventarNotifyFunction));
  }
}

const app = new cdk.App();
new CdkLambdaStack(app, 'adventarNotification');
app.synth();
