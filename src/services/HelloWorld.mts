import { TServiceParams } from "@digital-alchemy/core";

export function HelloWorld(service: TServiceParams) {
  const { hass, config, lifecycle, logger } = service;

  lifecycle.onReady(() => {
    // host[:port]
    const { host } = new URL(config.hass.BASE_URL);

    logger.info(`Successfully connected to ${host}!`);
  });
}
