import { TServiceParams } from "@digital-alchemy/core";
import { notifyMe, notifyOwners } from "../utils/notify.mts";

/**
 * Notify when any water leaks are detected.
 *
 * Requires that the device has label "leak_detector". Generally the devices
 * are the on-site detectors (e.g. IKEA Badring)
 */
export function LeakDetectors(service: TServiceParams) {
  const { hass, config, lifecycle, logger } = service;

  function leakDetectorHandler(newState, oldState) {
    if (
      !newState ||
      !oldState ||
      newState.state === "unavailable" ||
      oldState.state === "unknown"
    ) {
      return;
    }

    if (newState?.state === "on") {
      logger.info("leak detected (old state): ", oldState);
      const title = "Water Leak Detected";
      const message = `Water leak detected by ${newState.attributes.friendly_name}`;
      notifyOwners(service, title, message);
      return;
    }

    if (oldState.state === "on" && newState.state === "off") {
      const title = "Water Leak Undetected";
      const message = `Water leak detection from ${newState.attributes.friendly_name} was turned off`;
      notifyOwners(service, title, message);
    }
  }

  lifecycle.onReady(() => {
    const leakDetectors = hass.refBy.label("leak_detector");
    leakDetectors.map(detector => {
      detector.onUpdate(leakDetectorHandler);
    });
  });
}
