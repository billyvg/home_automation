import { TServiceParams } from "@digital-alchemy/core";

export function notifyOwners(service: TServiceParams, title: string, message: string) {
  const targets = [
    service.hass.call.notify.mobile_app_billy_s_iphone,
    service.hass.call.notify.mobile_app_raiders_mum,
  ];

  service.logger.info(`[notify-owners]: ${title} - ${message}`);

  if (process.env.NODE_ENV === "development") {
    return;
  }

  return targets.map(target => target({ title: `${title} (DA)`, message }));
}

export function notifyMe(service: TServiceParams, title: string, message: string) {
  service.logger.info(`[notify-me]: ${title} - ${message}`);

  if (process.env.NODE_ENV === "development") {
    return;
  }

  return service.hass.call.notify.mobile_app_billy_s_iphone({ title: `${title} (DA)`, message });
}
