import {Stack, StackProps} from 'aws-cdk-lib';
import {ShellStep} from 'aws-cdk-lib/pipelines';
import {AwsCredentials, GitHubWorkflow} from 'cdk-pipelines-github';
import {Construct} from 'constructs';
import {MyAppStage} from './MyAppStage';
import * as versions from '../ci/versions';
import {
    frontendCheckoutStep,
    GH_SUPPORT_DEPLOY_ROLE_NAME,
    PRIMARY_REGION,
    PROD_ACCOUNT, setNodeJSv22,
    STAGE_ACCOUNT,
} from '../constants';
import {MyAppVersions} from '../interfaces';

export const myAppVersions: MyAppVersions = {
    myApp: {
        frontend: {
            version: versions.OnPrettyFrontend["on-pretty-web"],
            commitId: versions.OnPrettyFrontendDynamic.commitId
        },
    },
};

const domainSettings = {
    subDomain: 'be-on',
    loginSubDomain: 'login',
};

export class GitHubPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps = {}) {
        super(scope, id, props);

        // STAGE
        const stagePipeline = new GitHubWorkflow(this, 'stagePipeline', {
            synth: new ShellStep('Build', {
                commands: [
                    'yarn install',
                    'yarn build',
                ],
            }),
            awsCreds: AwsCredentials.fromOpenIdConnect({
                gitHubActionRoleArn: `arn:aws:iam::${STAGE_ACCOUNT}:role/${GH_SUPPORT_DEPLOY_ROLE_NAME}`,
            }),
            preBuildSteps: [setNodeJSv22, frontendCheckoutStep],
        });
        const stage = new MyAppStage(this, 'on-pretty-stage', {
            env: {
                account: STAGE_ACCOUNT,
                region: PRIMARY_REGION,
                domainName: 'stage.prettysolution.com',
                multiTenant: {
                    domainName: 'on.stage.prettysolution.com',
                    distributionId: 'E18GDWUAFG5IU8',
                    distributionEndpoint: 'd1fu2it2pa9bwt.cloudfront.net'
                },
                ...domainSettings,
                frontend: {
                    VITE_COGNITO_AUTHORITY: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_h2ixgDZEz',
                    VITE_COGNITO_CLIENT_ID: '6j4nc3kkioj2pvln7r7o8un6nf',
                },
            },
            versions: myAppVersions,
        });
        stagePipeline.addStageWithGitHubOptions(stage);

        // PROD
        const prodPipeline = new GitHubWorkflow(this, 'prodPipeline', {
            synth: new ShellStep('Build', {
                commands: [
                    'yarn install',
                    'yarn build',
                ],
            }),
            awsCreds: AwsCredentials.fromOpenIdConnect({
                gitHubActionRoleArn: `arn:aws:iam::${PROD_ACCOUNT}:role/${GH_SUPPORT_DEPLOY_ROLE_NAME}`,
            }),
            workflowPath: '.github/workflows/deploy-prod.yml',
            workflowName: 'deploy-prod',
            workflowTriggers: {push: {branches: ['prod']}},
            preBuildSteps: [setNodeJSv22, frontendCheckoutStep],
        });
        const prod = new MyAppStage(this, 'on-pretty-prod', {
            env: {
                account: PROD_ACCOUNT,
                region: PRIMARY_REGION,
                domainName: 'prettysolution.com',
                multiTenant: {
                    domainName: 'on.prettysolution.com',
                    distributionId: '',
                    distributionEndpoint: ''
                },
                ...domainSettings,
                frontend: {
                    VITE_COGNITO_AUTHORITY: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_JKLmC0DZe',
                    VITE_COGNITO_CLIENT_ID: '6lmvsi2sncou70huiqt893hndq',
                },
            },
            versions: myAppVersions,
        });
        prodPipeline.addStageWithGitHubOptions(prod);
    }
}