import { TServiceParams } from "@digital-alchemy/core";
import { isStateUnavailable } from "../utils/isStateUnavailable";

/**
 * Turn on kitchen light in the morning
 */
export function KitchenMorning(service: TServiceParams) {
  const { hass, config, context, lifecycle, logger } = service;

  lifecycle.onReady(() => {
    hass.refBy.id("binary_sensor.main_floor_motion").onUpdate((newState, oldState) => {
      if (isStateUnavailable(newState, oldState)) {
        return;
      }

      if (hass.refBy.id("binary_sensor.morning").state === "off") {
        return;
      }

      if (hass.refBy.id("light.kitchen_main_lights").state === "on") {
        return;
      }

      hass.refBy.id("light.kitchen_main_lights").turn_on({
        brightness_pct: 35,
      });
    });
  });
}
