import { TServiceParams } from "@digital-alchemy/core";
import { notifyMe } from "../utils/notify.mts";
import { ByIdProxy } from "@digital-alchemy/hass";
import { isStateUnavailable } from "../utils/isStateUnavailable";

// This is the temperature threshold for the anti-freeze smart plugs
const THRESHOLD = 37;

function getTemperatureString(sensor: ByIdProxy<"sensor.frontyard_thermometer_temperature">) {
  return `${sensor.state}${sensor.attributes.unit_of_measurement}`;
}

export function AntiFreeze(service: TServiceParams) {
  const { hass, config, lifecycle, logger } = service;

  lifecycle.onReady(() => {
    console.log('antifreeze')
    const thermometer = hass.refBy.id("sensor.frontyard_thermometer_temperature");
    const smartPlugs = [hass.refBy.id("switch.antifreeze_1"), hass.refBy.id("switch.antifreeze_2")];

    function turnOnPlugs() {
      smartPlugs.forEach(plug => {
        if (plug.state === "on") {
          return;
        }

        notifyMe(
          service,
          "Anti-freeze Plugs",
          `Turning on plugs - current temp: ${getTemperatureString(thermometer)}`,
        );
        plug.turn_on();
      });
    }

    function turnOffPlugs() {
      smartPlugs.forEach(plug => {
        if (plug.state === "off") {
          return;
        }

        notifyMe(
          service,
          "Anti-freeze Plugs",
          `Turning off plugs - current temp: ${getTemperatureString(thermometer)}`,
        );
        plug.turn_off();
      });
    }

    function isAlmostFreezing() {
      if (!thermometer.attributes.unit_of_measurement.endsWith("F")) {
        logger.error("Unexpected unit is not farhenheit");

        // Return true here to err on the side of caution
        return true;
      }

      return thermometer.state <= THRESHOLD;
    }

    function checkTemps() {
      if (isAlmostFreezing()) {
        turnOnPlugs();
      } else {
        turnOffPlugs();
      }
    }

    try {
      logger.info(
        `Current temp is ${getTemperatureString(thermometer)}, should turn plugs on? ${isAlmostFreezing()}`,
      );
      checkTemps();
    } catch (e) {
      logger.error(e);
    }

    thermometer.onUpdate((newState, oldState) => {
      console.log('thermometer updated', newState.state);
      if (isStateUnavailable(newState, oldState)) {
        return;
      }


      checkTemps();
    });
  });
}
