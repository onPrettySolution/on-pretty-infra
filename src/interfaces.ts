import { Environment } from 'aws-cdk-lib';

export interface ThisEnvironment extends Environment {
  domainName: string;
  subDomain: string;
  multiTenant: {
    domainName: string;
    distributionId: string
    distributionEndpoint: string
    googleClientId: string
  }
  loginSubDomain: string;
  frontend: {
    VITE_COGNITO_AUTHORITY: string;
    VITE_COGNITO_CLIENT_ID: string;
  };
}

export interface MyAppVersions {
  myApp: { frontend: { version: string; commitId: string } };
}