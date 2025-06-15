import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ThisEnvironment} from "../../interfaces";
import {HostedZone} from "aws-cdk-lib/aws-route53";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {Distribution, CfnDistribution} from "aws-cdk-lib/aws-cloudfront";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {StringParameter} from "aws-cdk-lib/aws-ssm";


interface MultiTenantDistributionStackProps extends StackProps {
    env: ThisEnvironment;
}

export class MultiTenantDistributionStack extends Stack {
    constructor(scope: Construct, id: string, props: MultiTenantDistributionStackProps) {
        super(scope, id, props);

        const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
            domainName: props.env.multiTenant.domainName,
        });

        const cert = new Certificate(this, 'Certificate', {
            validation: CertificateValidation.fromDns(hostedZone),
            domainName: hostedZone.zoneName,
            subjectAlternativeNames: [`*.${hostedZone.zoneName}`],
        });

        new StringParameter(this, 'DomainName', {
            parameterName: '/on-pretty-infra/core/MultiTenantDistributionStack/OnDistribution/domainName',
            stringValue: props.env.multiTenant.domainName,
        });
        new StringParameter(this, 'DistributionId', {
            parameterName: '/on-pretty-infra/core/MultiTenantDistributionStack/OnDistribution/distributionId',
            stringValue: props.env.multiTenant.distributionId,
        });
        new StringParameter(this, 'DistributionEndpoint', {
            parameterName: '/on-pretty-infra/core/MultiTenantDistributionStack/OnDistribution/distributionEndpoint',
            stringValue: props.env.multiTenant.distributionEndpoint,
        });
    }
}