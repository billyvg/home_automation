import dayjs from "dayjs";

import { TServiceParams } from "@digital-alchemy/core";
import { notifyMe } from "../utils/notify.mts";
import { isStateUnavailable } from "../utils/isStateUnavailable";

const FIVE_MINUTES = 1000 * 60 * 5;

/**
 * Toggle door lock when using fingerprint reader
 */
export function DoorOpened(service: TServiceParams) {
  const { hass, config, context, lifecycle, logger, synapse } = service;

  let openTimeout;

  lifecycle.onReady(() => {
    const frontDoor = hass.refBy.id("lock.front_door");
    // const frontDoorOpenedSwitch = synapse.switch({
    //   // required variables
    //   context,
    //   name: "Front Door Opened",
    //   locals: {
    //     openedFor: 0,
    //   },
    // });

    // frontDoorOpenedSwitch.onTurnOff(data => {
    //   logger.info("synthetic switch turned off", data);
    // });

    // TODO: Check initial state of lock and reset states if necessary
    // Should only be needed if the app crashes while door is still unlocked

    const handleUnlock = async (newState, oldState) => {
      if (isStateUnavailable(newState, oldState)) {
        logger.info("invalid state");
        return;
      }

      if (newState.state === oldState.state) {
        logger.info("state didn't change");
        return;
      }

      if (newState.state !== "unlocked") {
        return;
      }

      const doorUnlockedTimestamp = Date.now();

      logger.info("door unlocked");
      // set interval that updates state of a synapse switch (if lock is unlocked, otherwise cancel interval)
      // create state handler for switch that notifies that door is opened

      function handleOpenedTooLong() {
        const elapsed = Math.abs(frontDoor.last_changed.diff(new Date(), "minutes"));

        logger.info("handleOpenedTooLong", elapsed);

        if (frontDoor.state === "locked") {
          return;
        }

        if (elapsed < 5) {
          openTimeout = setTimeout(handleOpenedTooLong, FIVE_MINUTES);
          return;
        }

        // Check for motion
        const motionDetectors = [
          service.hass.refBy.id("binary_sensor.apollo_msr_2_6b6f70_radar_target"),
          service.hass.refBy.id("binary_sensor.main_floor_motion"),
          service.hass.refBy.id("binary_sensor.upstairs_motion"),
        ];

        const motionNames = motionDetectors
          .filter(sensor => sensor.state === "on")
          .map(({ attributes }) => attributes.friendly_name);

        const motionString = motionNames.length
          ? `. Motion detected by: ${motionNames.join(", ")}`
          : "";

        notifyMe(
          service,
          "Front Door Open",
          `Front door has been opened for ${elapsed} minutes${motionString}`,
        );
        openTimeout = setTimeout(handleOpenedTooLong, FIVE_MINUTES);
      }

      openTimeout = setTimeout(handleOpenedTooLong, FIVE_MINUTES);

      // Wait for lock
      await frontDoor.waitForState("locked");

      if (openTimeout) {
        clearTimeout(openTimeout);
      }

      const elapsed = Math.abs(dayjs(doorUnlockedTimestamp).diff(new Date(), "minutes"));
      logger.info("turn turned to lock", frontDoor.state, elapsed);

      if (frontDoor.state === "locked" && elapsed >= 5) {
        notifyMe(service, "Front Door Closed", `Front door was closed after ${elapsed} minutes`);
      }
    };

    frontDoor.onUpdate(handleUnlock);
  });
}
