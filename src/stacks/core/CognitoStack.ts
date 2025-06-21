import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import {Certificate, CertificateValidation} from 'aws-cdk-lib/aws-certificatemanager';
import {UserPool, UserPoolClient,} from 'aws-cdk-lib/aws-cognito';
import {Code, Function, Runtime} from 'aws-cdk-lib/aws-lambda';
import {HostedZone} from 'aws-cdk-lib/aws-route53';
import {StringParameter} from 'aws-cdk-lib/aws-ssm';
import {Construct} from 'constructs';
import {ThisEnvironment} from '../../interfaces';
import {Bucket, HttpMethods} from "aws-cdk-lib/aws-s3";
import {PolicyStatement, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {IdentityPool, UserPoolAuthenticationProvider} from "aws-cdk-lib/aws-cognito-identitypool";


interface CognitoStackProps extends StackProps {
    env: ThisEnvironment;
}

export class CognitoStack extends Stack {

    constructor(scope: Construct, id: string, props: CognitoStackProps) {
        super(scope, id, props);

        const preSignUpLambda01 = new Function(this, 'preSignUpLambda01', {
            runtime: Runtime.PYTHON_3_13,
            handler: 'index.lambda_handler',
            code: Code.fromInline('def lambda_handler(event, context): event["response"]["autoConfirmUser"] = True; return event'),
            deadLetterQueueEnabled: true
        });

        const userPool01 = new UserPool(this, 'userPool01', {
            userPoolName: 'on-pretty-simple-userPool01',
            // signInAliases: {
            //   email: true,
            //   username: true,
            //   preferredUsername: true,
            // },
            // standardAttributes: {
            //   preferredUsername: { mutable: true, required: true },
            //   email: { mutable: true, required: true },
            // },
            lambdaTriggers: {preSignUp: preSignUpLambda01},
            selfSignUpEnabled: true,
            passwordPolicy: {
                minLength: 6,
                requireDigits: false,
                requireLowercase: false,
                requireSymbols: false,
                requireUppercase: false,
            },
        });
        const userPoolClient01 = new UserPoolClient(this, 'userPoolClient01', {
            userPool: userPool01,
            authFlows: {adminUserPassword: true, userSrp: true},
            oAuth: {callbackUrls: [`https://${props.env.subDomain}.${props.env.domainName}/`, 'http://localhost:5173/']},
        });

        // Create on pretty multi tenancy upload bucket
        const onPrettyMTUploadBucket = new Bucket(this, 'OnPrettyMTUploadBucket', {
            cors: [{
                allowedMethods: [HttpMethods.PUT, HttpMethods.POST, HttpMethods.GET, HttpMethods.DELETE, HttpMethods.HEAD],
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                exposedHeaders: ['ETag'],
            }],
        })
        onPrettyMTUploadBucket.addToResourcePolicy(new PolicyStatement({
            actions: ['s3:GetObject'],
            principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
            resources: [onPrettyMTUploadBucket.arnForObjects('*')],
            conditions: {ArnLike: {'AWS:SourceArn': `arn:aws:cloudfront::${props.env.account}:distribution/${props.env.multiTenant.distributionId}`}}
        }))

        // Create identity pool
        const identityPool = new IdentityPool(this, 'UploadIdentityPool', {
            identityPoolName: 'UploadIdentityPool',
            authenticationProviders: {
                userPools: [new UserPoolAuthenticationProvider({
                    userPool: userPool01, userPoolClient: userPoolClient01
                })],
                google: {clientId: props.env.multiTenant.googleClientId}
            },
        });
        identityPool.authenticatedRole.addToPrincipalPolicy(new PolicyStatement({
            actions: ["s3:List*",],
            resources: [onPrettyMTUploadBucket.bucketArn],
            conditions: {"StringLike": {"s3:prefix": ["${cognito-identity.amazonaws.com:sub}/*"]}}

        }))
        identityPool.authenticatedRole.addToPrincipalPolicy(new PolicyStatement({
            actions: [
                "s3:GetObject*",
                "s3:GetBucket*",
                "s3:DeleteObject*",
                "s3:PutObject",
                "s3:PutObjectLegalHold",
                "s3:PutObjectRetention",
                "s3:PutObjectTagging",
                "s3:PutObjectVersionTagging",
                "s3:Abort*"
            ],
            resources: [onPrettyMTUploadBucket.arnForObjects('${cognito-identity.amazonaws.com:sub}/*')],
            // conditions: {"StringLike": {"s3:prefix": ["${cognito-identity.amazonaws.com:sub}/*"]}}
        }))

        // These used in Readme.md
        new StringParameter(this, 'userPoolProviderUrl01', {
            parameterName: '/on-pretty-infra/core/CognitoStack/userPool01/userPoolProviderUrl',
            stringValue: userPool01.userPoolProviderUrl,
        });
        new StringParameter(this, 'userPoolClientId01', {
            parameterName: '/on-pretty-infra/core/CognitoStack/userPoolClient01/userPoolClientId',
            stringValue: userPoolClient01.userPoolClientId,
        });
        new StringParameter(this, 'identityPoolId', {
            parameterName: '/on-pretty-infra/core/CognitoStack/identityPool/identityPoolId',
            stringValue: identityPool.identityPoolId,
        });

        new CfnOutput(this, 'authority', {value: userPool01.userPoolProviderUrl});
        new CfnOutput(this, 'client_id', {value: userPoolClient01.userPoolClientId});
    }
}