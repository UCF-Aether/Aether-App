import * as sst from "@serverless-stack/resources";
import { InfraConfig, StageConfig } from "./infra/util/InfraConfig";
import { WebappStack } from "./infra/stacks/Webapp";
import { ApiStack } from "./infra/stacks/Api";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { SecretValue } from "aws-cdk-lib";

import * as _config from "./infra.config.json";
import { DatabaseStack } from "./infra/stacks/Database";
import { IotStack } from "./infra/stacks/Iot";
import { VpcStack } from "./infra/stacks/Vpc";
import { FunctionProps } from "@serverless-stack/resources";
const config = _config as InfraConfig;

export default function main(app: sst.App) {
  const stageConfig: StageConfig | undefined = config.stages[app.stage];
  const siteDomain = stageConfig?.domain || undefined;
  const apiDomain = siteDomain ? `api.${siteDomain}` : undefined;

  if (siteDomain) {
    console.log(`Using domain: ${siteDomain}`);
  } else {
    console.log("Using cloudfront domain");
  }

  if (apiDomain) {
    console.log(`Using api domain: ${apiDomain}`);
  } else {
    console.log("Using cloudfront api domain");
  }

  const vpcStack = new VpcStack(app, "Vpc");

  app.setDefaultFunctionProps((stack) => {
    const appVpc = vpcStack.vpc;
    // Secret values suck, and I'm losing my mind over this. Using process env (provided by user or github actions).
    // console.log(SecretValue.secretsManager("SupabaseSecrets"));

    return {
      runtime: Runtime.NODEJS_14_X,
      vpc: appVpc,
      vpcSubnets: { subnets: appVpc.privateSubnets },
      securityGroups: [vpcStack.sgs.lambda],
      environment: {
        PGUSER: process.env.PGUSER!,
        PGHOST: process.env.PGHOST!,
        PGDATABASE: process.env.PGDATABASE!,
        PGPASSWORD: process.env.PGPASSWORD!,
        PGPORT: process.env.PGPORT!,
      },
      bundle: {
        externalModules: ["pg-native"],
      },
    };
  });

  new WebappStack(app, "Webapp", {
    domain: siteDomain,
    certificateArn: stageConfig
      ? config.dnsCertificates[siteDomain!]
      : undefined,
  });

  new ApiStack(app, "Api", {
    domain: apiDomain,
    certificateArn: stageConfig
      ? config.dnsCertificates[apiDomain!]
      : undefined,
  });

  // Using supabase - plugin other postgres rds // new DatabaseStack(app, "Database");

  new IotStack(app, "IoT", {});
}
