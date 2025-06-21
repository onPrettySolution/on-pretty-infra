import {execSync} from 'node:child_process';
import {awscdk, JsonFile} from 'projen';
import {GithubCredentials} from 'projen/lib/github';
import {frontendCheckoutStep} from './src/constants';


const project = new awscdk.AwsCdkTypeScriptApp({
    cdkVersion: '2.201.0',
    minNodeVersion: '22',
    defaultReleaseBranch: 'main',
    name: 'on-pretty-infra',
    projenrcTs: true,
    gitignore: ['.idea', 'on-pretty-web'],
    githubOptions: {projenCredentials: GithubCredentials.fromApp()},
    release: false,
    tsconfig: {
        compilerOptions: {
            noUnusedLocals: false,
            noUnusedParameters: false,
        },
    },
    deps: [
        'cdk-pipelines-github',
        'aws-cdk-github-oidc',
        '@types/aws-lambda',
        '@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb',
        // 'uuid',
        'nanoid',
        '@aws-sdk/util-dynamodb',
        'express',
        'serverless-http',
        '@aws-sdk/client-cloudfront',
        '@aws-sdk/client-cognito-identity',
        '@aws-sdk/client-sns',
        '@aws-sdk/client-s3',
        'zod',
    ],
    devDeps: ['cdk-dia', '@types/express'],

    workflowBootstrapSteps: [frontendCheckoutStep],
    autoApproveOptions: {allowedUsernames: ['prettysolution[bot]', 'vasylherman'], secret: 'PR_AUTO_APPROVE'},
    autoApproveUpgrades: true,
});

const onPrettyFrontCommitId = execSync('git -C on-pretty-web rev-parse --short HEAD').toString().trim();
new JsonFile(project, 'src/ci/on-pretty-web-dynamic.json', {obj: {commitId: onPrettyFrontCommitId}});

const devPipeline: string =
    'cdk -a "npx ts-node -P tsconfig.json --prefer-ts-exts';

project.addTask('cdk:dev', {
    requiredEnv: ['CDK_DOMAIN_NAME'],
    exec: `${devPipeline} src/pipelines/DevPipelineApp.ts"`,
    receiveArgs: true,
    condition: 'aws sts get-caller-identity --query "Account" --output text | grep -Eq \'^(stage277707141071|268591637005)$\' && exit 1 || exit 0',
});

project.addTask('express:run', {
    requiredEnv: ['AWS_PROFILE_REGION', 'BASE_TABLE_NAME'],
    exec: 'npx nodemon src/stacks/api-gateway/api-lambda/server.ts',
    receiveArgs: true,
});

project.synth();
