import { TServiceParams } from "@digital-alchemy/core";
import { isStateUnavailable } from "../../utils/isStateUnavailable";

// Raider sitting on ottoman by himself is ~7
// Billy on couch near ottoman (w/ raider) is 26-50
const LIVING_ROOM_THRESHOLD = 10;

/**
 * Manages scenes from entities
 *
 * If you want to use Apple/Siri to trigger scenes, make sure to do so in the
 * Scene settings in the Home app. (Have the scene trigger the switch).
 */
export function BedTime(service: TServiceParams) {
  const { hass, config, context, lifecycle, logger, synapse } = service;

  lifecycle.onReady(() => {
    const livingRoomMotion = hass.refBy.id("binary_sensor.apollo_msr_2_6b6f70_radar_moving_target");
    const livingRoomOccupancy = hass.refBy.id(
      "binary_sensor.apollo_msr_2_6b6f70_radar_still_target",
    );
    logger.info(`motion: ${livingRoomMotion.state}`);
    logger.info(`occ: ${livingRoomOccupancy.state}`);

    const bedTimeSwitch = synapse.button({
      context,
      icon: "mdi:bed",
      name: "Bed Time Scene Button",
    });
    const bedTimeScene = synapse.scene({
      context,
      icon: "mdi:bed",
      name: "Bed Time Hass Scene",
    });

    bedTimeSwitch.onUpdate((newState, oldState) => {
      if (isStateUnavailable(newState, oldState)) {
        return;
      }

      bedTimeScene.getEntity().turn_on();
    });

    bedTimeScene.onUpdate((newState, oldState) => {
      if (isStateUnavailable(newState, oldState) || newState.state === oldState.state) {
        return;
      }

      // Turn off apple tv
      hass.call.media_player.turn_off({ entity_id: "media_player.living_room_atv" });

      // Lock the front door
      if (hass.refBy.id("lock.front_door").state === "unlocked") {
        hass.call.lock.lock({ entity_id: "lock.front_door" });
      }

      // Turn on living room lights (in case of movie time)
      hass.refBy.id("light.living_room_main_lights").turn_on({
        brightness_pct: 25,
      });

      // Turn on kitchen lights
      hass.refBy.id("light.kitchen_main_lights").turn_on({
        brightness_pct: 35,
      });

      // Upstairs hallway
      hass.refBy.id("light.upstairs_hallway_main_lights").turn_on({
        brightness_pct: 55,
      });

      // Vera bedroom light
      hass.refBy.id("light.vera_bedroom_light").turn_on({
        brightness_pct: 75,
      });

      // Lights are all done, let's do checks for turning them off

      const upstairsMotion = hass.refBy.id("binary_sensor.upstairs_motion");
      const livingRoomMotion = hass.refBy.id(
        "binary_sensor.apollo_msr_2_6b6f70_radar_moving_target",
      );
      const livingRoomOccupancy = hass.refBy.id("sensor.apollo_msr_2_6b6f70_radar_still_energy");

      if (
        upstairsMotion.state === "on" &&
        livingRoomMotion.state === "off" &&
        hass.refBy.id("sensor.apollo_msr_2_6b6f70_radar_still_energy").state <=
          LIVING_ROOM_THRESHOLD
      ) {
        logger.info("Turning off everything");
        // Turn off downstairs lights
        hass.call.light.turn_off({
          area_id: ["living_room", "kitchen", "upstairs_hallway"],
        });
        return;
      }

      function handleUpstairsMotion() {
        return new Promise<void>(resolve => {
          if (upstairsMotion.last_changed > newState.last_changed) {
            // Upstairs motion happens after living room is empty, can turn off hall

            logger.info("upstairs motion detected after downtairs is empty, turning off hallway");
            hass.call.light.turn_off({
              area_id: ["upstairs_hallway"],
            });
            resolve();
            return;
          }

          // There was someone downstairs and upstairs, wait a reasonable amount
          // of time before turning off
          setTimeout(() => {
            logger.info("split upstairs/downstairs, waiting before turning off hallway");
            hass.call.light.turn_off({
              area_id: ["upstairs_hallway"],
            });
            resolve();
          }, 15000);
        });
      }

      livingRoomOccupancy.onUpdate(async (newState, oldState, remover) => {
        if (newState.state <= LIVING_ROOM_THRESHOLD && oldState.state <= LIVING_ROOM_THRESHOLD) {
          // no one detected
          logger.info("living room occupancy is low", newState.state, oldState.state);
          hass.call.light.turn_off({
            area_id: ["living_room", "kitchen"],
          });

          // Wait until there is motion in bedroom before turning off hall light
          if (
            upstairsMotion.state === "on" ||
            hass.refBy.id("binary_sensor.upstairs_occupancy").state === "on"
          ) {
            await handleUpstairsMotion();
            remover();
            return;
          }

          // No one detected upstairs yet, set listener
          upstairsMotion.onUpdate(async (upstairsNewState, upstairsOldState, upstairsRemover) => {
            if (
              !upstairsOldState ||
              upstairsNewState.state !== "on" ||
              upstairsNewState.state === upstairsOldState.state
            ) {
              return;
            }

            await handleUpstairsMotion();
            upstairsRemover();
            remover();
          });
        }
      });
    });
  });
}
