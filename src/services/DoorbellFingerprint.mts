import { TServiceParams } from "@digital-alchemy/core";

/**
 * Toggle door lock when using fingerprint reader
 */
export function DoorbellFingerprint(service: TServiceParams) {
  const { hass, config, lifecycle, logger } = service;

  const doorbell = hass.refBy.id("event.doorbell_fingerprint");
  let _lastRun;

  lifecycle.onReady(() => {
    doorbell.onUpdate((newState, oldState) => {
      // The doorbell event will handle the identification so we don't need to check `ulp_id ourselves
      // unless we want this automation to only work for specific people.

      // some precautions to verify the user + fingerprint
      if (
        oldState.state === "unavailable" ||
        !newState ||
        newState.attributes.event_type !== "identified" ||
        newState.attributes.ulp_id === "" ||
        newState.attributes.user_status !== "ACTIVE"
      ) {
        return;
      }

      // Check for a small cooldown period since the reader is a bit finicky and
      // can fire multiple times rapidly
      const current = new Date(newState.state).getTime();
      if (_lastRun && current - _lastRun <= 1000) {
        return;
      }

      const lock = hass.refBy.id("lock.front_door");
      if (lock.state === "unlocked") {
        logger.info("locking front door");
        hass.call.lock.lock({ entity_id: "lock.front_door" });
      } else if (lock.state === "locked") {
        logger.info("unlocking front door");
        hass.call.lock.unlock({ entity_id: "lock.front_door" });
      }

      _lastRun = current;
    });
  });
}
