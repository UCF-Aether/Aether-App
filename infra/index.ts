import * as sst from "@serverless-stack/resources";
import { InfraConfig, StageConfig } from "./util/InfraConfig";
import { WebappStack } from "./stacks/Webapp";
import { ApiStack } from "./stacks/Api";

import * as _config from "./infra.config.json";
const config = _config as InfraConfig;

export default function main(app: sst.App) {
  app.setDefaultFunctionProps({
    runtime: "nodejs14.x",
  });

  const stageConfig: StageConfig | undefined = config.stages[app.stage];
  const siteDomain = stageConfig?.domain || undefined;
  const apiDomain = siteDomain ? `api.${siteDomain}` : undefined;

  new WebappStack(app, "Webapp", {
    domain: siteDomain,
    certificateArn: stageConfig ? config.dnsCertificates[stageConfig.domain] : undefined,
  });

  // new ApiStack(app, "Api", {});
}
